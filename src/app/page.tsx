"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

const PERSONAS = [
  { id: "devil", name: "Devil's Advocate", emoji: "😈", color: "#ef4444" },
  { id: "saint", name: "The Saint", emoji: "😇", color: "#3b82f6" },
  { id: "boomer", name: "The Boomer", emoji: "🧓", color: "#f59e0b" },
  { id: "zoomer", name: "Gen Z", emoji: "💅", color: "#ec4899" },
  { id: "academic", name: "The Professor", emoji: "🎓", color: "#8b5cf6" },
  { id: "chaos", name: "Chaos Agent", emoji: "🔥", color: "#f97316" },
  { id: "logic", name: "Pure Logic", emoji: "🤖", color: "#06b6d4" },
  { id: "vibes", name: "Pure Vibes", emoji: "🎨", color: "#10b981" },
];

const EXAMPLES = [
  "AI vs Humans",
  "Pineapple on Pizza",
  "Remote Work vs Office",
  "Cats vs Dogs",
  "Is Math Invented or Discovered?",
  "Social Media: Net Positive or Negative?",
];

export default function Home() {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [personaA, setPersonaA] = useState("devil");
  const [personaB, setPersonaB] = useState("saint");
  const [loading, setLoading] = useState(false);

  const startDebate = async (t?: string) => {
    const finalTopic = t || topic;
    if (!finalTopic.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/debate/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: finalTopic,
          persona_a: personaA,
          persona_b: personaB,
          rounds: 3,
        }),
      });
      const data = await res.json();
      sessionStorage.setItem(`debate-${data.debate_id}`, JSON.stringify(data));
      router.push(`/debate/${data.debate_id}`);
    } catch {
      setLoading(false);
    }
  };

  const pA = PERSONAS.find((p) => p.id === personaA)!;
  const pB = PERSONAS.find((p) => p.id === personaB)!;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        <h1
          className="text-8xl font-black tracking-tighter"
          style={{
            background: "linear-gradient(135deg, #ef4444, #8b5cf6, #3b82f6)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          CLASH
        </h1>
        <p className="text-xl mt-3 text-neutral-400">
          Watch AI Personalities Debate Anything
        </p>
      </motion.div>

      {/* Topic Input */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="w-full max-w-2xl mb-8"
      >
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && startDebate()}
          placeholder="Enter a debate topic..."
          className="w-full text-xl px-6 py-4 rounded-xl bg-neutral-900 border border-neutral-700 text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
        />
      </motion.div>

      {/* Persona Selectors */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="flex gap-6 mb-8 w-full max-w-2xl"
      >
        <div className="flex-1">
          <label className="text-sm text-neutral-500 mb-2 block uppercase tracking-wider">
            Fighter 1
          </label>
          <select
            value={personaA}
            onChange={(e) => setPersonaA(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-neutral-900 text-white text-lg border-2 transition-all cursor-pointer focus:outline-none"
            style={{ borderColor: pA.color }}
          >
            {PERSONAS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.emoji} {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end pb-3">
          <span className="text-3xl font-black text-neutral-600">VS</span>
        </div>

        <div className="flex-1">
          <label className="text-sm text-neutral-500 mb-2 block uppercase tracking-wider">
            Fighter 2
          </label>
          <select
            value={personaB}
            onChange={(e) => setPersonaB(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-neutral-900 text-white text-lg border-2 transition-all cursor-pointer focus:outline-none"
            style={{ borderColor: pB.color }}
          >
            {PERSONAS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.emoji} {p.name}
              </option>
            ))}
          </select>
        </div>
      </motion.div>

      {/* Start Button */}
      <motion.button
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4, duration: 0.4 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => startDebate()}
        disabled={loading || !topic.trim()}
        className="px-10 py-4 text-xl font-bold rounded-xl text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        style={{
          background: loading
            ? "#333"
            : "linear-gradient(135deg, #ef4444, #8b5cf6)",
        }}
      >
        {loading ? "LOADING..." : "⚔️ START CLASH"}
      </motion.button>

      {/* Example Topics */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="mt-16 text-center"
      >
        <p className="text-sm text-neutral-600 mb-4 uppercase tracking-wider">
          Or try one of these
        </p>
        <div className="flex flex-wrap gap-3 justify-center max-w-2xl">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              onClick={() => {
                setTopic(ex);
                startDebate(ex);
              }}
              className="px-4 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 text-sm hover:border-purple-500 hover:text-white transition-all cursor-pointer"
            >
              {ex}
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
