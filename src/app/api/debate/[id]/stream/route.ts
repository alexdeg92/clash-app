import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getPersona } from "@/lib/personas";

const client = new Anthropic();

function encode(event: string, data: object): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const url = new URL(req.url);
  const topic = url.searchParams.get("topic");
  const personaAId = url.searchParams.get("persona_a");
  const personaBId = url.searchParams.get("persona_b");
  const rounds = parseInt(url.searchParams.get("rounds") || "3", 10);

  if (!topic || !personaAId || !personaBId) {
    return new Response("Missing required query params: topic, persona_a, persona_b", { status: 400 });
  }

  const personaA = getPersona(personaAId);
  const personaB = getPersona(personaBId);

  if (!personaA || !personaB) {
    return new Response("Invalid persona id", { status: 400 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const history: { role: "a" | "b"; content: string }[] = [];

      try {
        for (let round = 1; round <= rounds; round++) {
          const isFirst = round === 1;
          const isLast = round === debate.rounds;
          const phases = isFirst
            ? ["opening"]
            : isLast
              ? ["argument", "rebuttal", "closing"]
              : ["argument", "rebuttal"];

          for (const phase of phases) {
            // Persona A speaks
            const aText = await streamPersona(
              controller,
              personaA,
              topic,
              history,
              "a",
              round,
              phase
            );
            history.push({ role: "a", content: aText });

            // Persona B speaks
            const bText = await streamPersona(
              controller,
              personaB,
              topic,
              history,
              "b",
              round,
              phase
            );
            history.push({ role: "b", content: bText });
          }

          controller.enqueue(
            new TextEncoder().encode(encode("round_end", { round }))
          );
        }

        controller.enqueue(
          new TextEncoder().encode(
            encode("debate_end", {
              debate_id: id,
              rounds_completed: rounds,
            })
          )
        );
      } catch (e) {
        console.error("Stream error:", e);
        controller.enqueue(
          new TextEncoder().encode(
            encode("error", { message: "Stream error" })
          )
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

async function streamPersona(
  controller: ReadableStreamDefaultController,
  persona: ReturnType<typeof getPersona> & {},
  topic: string,
  history: { role: "a" | "b"; content: string }[],
  side: "a" | "b",
  round: number,
  phase: string
): Promise<string> {
  const opponentMessages = history
    .filter((h) => h.role !== side)
    .slice(-2)
    .map((h) => h.content)
    .join("\n\n");

  const userPrompt = `Topic: "${topic}"
Round ${round}, Phase: ${phase}
${opponentMessages ? `Your opponent just said:\n${opponentMessages}\n\n` : ""}
Give your ${phase} argument. Be concise and in-character.`;

  // Send typing indicator
  controller.enqueue(
    new TextEncoder().encode(
      encode("message", {
        persona: side,
        round,
        phase,
        content: "",
        typing: true,
        done: false,
      })
    )
  );

  let fullText = "";

  const stream = await client.messages.stream({
    model: "claude-sonnet-4-20250514",
    max_tokens: 400,
    system: persona.systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  for await (const event of stream) {
    if (
      event.type === "content_block_delta" &&
      event.delta.type === "text_delta"
    ) {
      const chunk = event.delta.text;
      fullText += chunk;
      controller.enqueue(
        new TextEncoder().encode(
          encode("message", {
            persona: side,
            round,
            phase,
            content: chunk,
            done: false,
          })
        )
      );
    }
  }

  // Done signal
  controller.enqueue(
    new TextEncoder().encode(
      encode("message", {
        persona: side,
        round,
        phase,
        content: "",
        done: true,
      })
    )
  );

  return fullText;
}
