"use client";

import { useEffect, useState, useRef, use } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

interface PersonaInfo {
  id: string;
  name: string;
  emoji: string;
  color: string;
}

interface Message {
  persona: "a" | "b";
  round: number;
  phase: string;
  content: string;
  done: boolean;
}

export default function DebatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [personaA, setPersonaA] = useState<PersonaInfo | null>(null);
  const [personaB, setPersonaB] = useState<PersonaInfo | null>(null);
  const [topic, setTopic] = useState("");
  const [totalRounds, setTotalRounds] = useState(3);
  const [currentRound, setCurrentRound] = useState(1);
  const [messages, setMessages] = useState<Message[]>([]);
  const [typing, setTyping] = useState<"a" | "b" | null>(null);
  const [finished, setFinished] = useState(false);
  const [started, setStarted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch debate info then start stream
    const debateStore = sessionStorage.getItem(`debate-${id}`);
    let d: { topic: string; personas: { a: PersonaInfo; b: PersonaInfo }; rounds: number } | null = null;
    if (debateStore) {
      d = JSON.parse(debateStore);
      setPersonaA(d!.personas.a);
      setPersonaB(d!.personas.b);
      setTopic(d!.topic);
      setTotalRounds(d!.rounds);
    }

    const streamParams = new URLSearchParams({
      topic: d?.topic || "",
      persona_a: d?.personas?.a?.id || "",
      persona_b: d?.personas?.b?.id || "",
      rounds: String(d?.rounds || 3),
    });
    const es = new EventSource(`/api/debate/${id}/stream?${streamParams}`);
    setStarted(true);

    es.addEventListener("message", (e) => {
      const data = JSON.parse(e.data);

      if (data.typing) {
        setTyping(data.persona);
        return;
      }

      if (data.done) {
        setTyping(null);
        setMessages((prev) => {
          // Mark last message for this persona as done
          const updated = [...prev];
          for (let i = updated.length - 1; i >= 0; i--) {
            if (
              updated[i].persona === data.persona &&
              updated[i].round === data.round
            ) {
              updated[i] = { ...updated[i], done: true };
              break;
            }
          }
          return updated;
        });
        return;
      }

      setTyping(null);
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (
          last &&
          last.persona === data.persona &&
          last.round === data.round &&
          last.phase === data.phase &&
          !last.done
        ) {
          const updated = [...prev];
          updated[updated.length - 1] = {
            ...last,
            content: last.content + data.content,
          };
          return updated;
        }
        return [
          ...prev,
          {
            persona: data.persona,
            round: data.round,
            phase: data.phase,
            content: data.content,
            done: false,
          },
        ];
      });
    });

    es.addEventListener("round_end", (e) => {
      const data = JSON.parse(e.data);
      setCurrentRound(data.round + 1);
    });

    es.addEventListener("debate_end", () => {
      setFinished(true);
      es.close();
    });

    es.addEventListener("error", () => {
      es.close();
    });

    return () => es.close();
  }, [id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, typing]);

  if (!started) return null;

  const aMessages = messages.filter((m) => m.persona === "a");
  const bMessages = messages.filter((m) => m.persona === "b");

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-neutral-800 px-6 py-4">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <button
            onClick={() => router.push("/")}
            className="text-neutral-500 hover:text-white transition cursor-pointer"
          >
            ← Back
          </button>
          <div className="text-center">
            <h2 className="text-lg font-bold text-white">{topic || "Loading..."}</h2>
            <div className="flex gap-2 justify-center mt-1">
              {Array.from({ length: totalRounds }, (_, i) => (
                <div
                  key={i}
                  className="w-3 h-3 rounded-full transition-all"
                  style={{
                    background:
                      i + 1 < currentRound
                        ? "#8b5cf6"
                        : i + 1 === currentRound
                          ? "#ef4444"
                          : "#333",
                  }}
                />
              ))}
            </div>
          </div>
          <div className="w-16" />
        </div>
      </div>

      {/* Split View */}
      <div className="flex-1 flex overflow-hidden" ref={scrollRef}>
        {/* Side A */}
        <SidePanel
          persona={personaA}
          messages={aMessages}
          typing={typing === "a"}
          side="left"
        />

        {/* Divider */}
        <div className="w-px bg-neutral-800 flex-shrink-0" />

        {/* Side B */}
        <SidePanel
          persona={personaB}
          messages={bMessages}
          typing={typing === "b"}
          side="right"
        />
      </div>

      {/* Footer */}
      <AnimatePresence>
        {finished && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-shrink-0 border-t border-neutral-800 px-6 py-4 flex justify-center"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push("/")}
              className="px-8 py-3 rounded-xl font-bold text-white cursor-pointer"
              style={{
                background: "linear-gradient(135deg, #ef4444, #8b5cf6)",
              }}
            >
              ⚔️ New Debate
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SidePanel({
  persona,
  messages,
  typing,
  side,
}: {
  persona: PersonaInfo | null;
  messages: Message[];
  typing: boolean;
  side: "left" | "right";
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, typing]);

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Persona Header */}
      <div
        className="flex-shrink-0 px-6 py-3 flex items-center gap-3"
        style={{
          borderBottom: `2px solid ${persona?.color || "#333"}`,
          background: `${persona?.color || "#333"}10`,
        }}
      >
        <span className="text-3xl">{persona?.emoji || "?"}</span>
        <span className="font-bold text-lg" style={{ color: persona?.color }}>
          {persona?.name || "Loading..."}
        </span>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-6 py-4 space-y-4"
      >
        {messages.map((msg, i) => (
          <motion.div
            key={`${msg.round}-${msg.phase}-${i}`}
            initial={{ opacity: 0, x: side === "left" ? -10 : 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="text-xs text-neutral-600 uppercase tracking-wider mb-1">
              Round {msg.round} · {msg.phase}
            </div>
            <div className="text-neutral-200 leading-relaxed whitespace-pre-wrap">
              {msg.content}
            </div>
          </motion.div>
        ))}

        {typing && (
          <div className="flex gap-1.5 py-2">
            <span
              className="w-2.5 h-2.5 rounded-full typing-dot"
              style={{ background: persona?.color }}
            />
            <span
              className="w-2.5 h-2.5 rounded-full typing-dot"
              style={{ background: persona?.color }}
            />
            <span
              className="w-2.5 h-2.5 rounded-full typing-dot"
              style={{ background: persona?.color }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
