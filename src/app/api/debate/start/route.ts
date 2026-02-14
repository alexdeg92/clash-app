import { NextRequest, NextResponse } from "next/server";
import { getPersona } from "@/lib/personas";
import { randomBytes } from "crypto";

// In-memory debate store
const debates = globalThis as unknown as {
  __debates?: Map<string, DebateState>;
};
if (!debates.__debates) debates.__debates = new Map();

export interface DebateState {
  id: string;
  topic: string;
  personaA: { id: string; name: string; emoji: string; color: string };
  personaB: { id: string; name: string; emoji: string; color: string };
  rounds: number;
  status: "ready" | "streaming" | "done";
}

export function getDebateStore() {
  return debates.__debates!;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { topic, persona_a, persona_b, rounds = 3 } = body;

  const a = getPersona(persona_a);
  const b = getPersona(persona_b);
  if (!a || !b) {
    return NextResponse.json({ error: "Invalid persona" }, { status: 400 });
  }

  const id = randomBytes(6).toString("hex");
  const state: DebateState = {
    id,
    topic,
    personaA: { id: a.id, name: a.name, emoji: a.emoji, color: a.color },
    personaB: { id: b.id, name: b.name, emoji: b.emoji, color: b.color },
    rounds,
    status: "ready",
  };
  getDebateStore().set(id, state);

  return NextResponse.json({
    debate_id: id,
    topic,
    personas: { a: state.personaA, b: state.personaB },
    rounds,
    status: "ready",
  });
}
