# Clash API Specification

## Base URL
`https://nyx-api.example.com` (Nyx's server, FastAPI on port 8000)

## Endpoints

### POST /api/debate/start
Start a new debate session.

**Request:**
```json
{
  "topic": "AI will replace programmers within 10 years",
  "persona_a": "devil",    // preset ID or custom
  "persona_b": "saint",    // preset ID or custom
  "rounds": 3              // optional, default 3
}
```

**Response:**
```json
{
  "debate_id": "abc123",
  "topic": "AI will replace programmers within 10 years",
  "personas": {
    "a": { "id": "devil", "name": "Devil's Advocate", "emoji": "😈", "color": "#ef4444" },
    "b": { "id": "saint", "name": "The Saint", "emoji": "😇", "color": "#3b82f6" }
  },
  "rounds": 3,
  "status": "ready"
}
```

### GET /api/debate/{debate_id}/stream
SSE stream of the debate. Each event is one message chunk.

**Event format:**
```
event: message
data: {"persona": "a", "round": 1, "phase": "opening", "content": "chunk of text...", "done": false}

event: message  
data: {"persona": "a", "round": 1, "phase": "opening", "content": "", "done": true}

event: message
data: {"persona": "b", "round": 1, "phase": "opening", "content": "chunk...", "done": false}

event: round_end
data: {"round": 1}

event: debate_end
data: {"debate_id": "abc123", "rounds_completed": 3}
```

**Phases per round:** `opening` (round 1 only), `argument`, `rebuttal`, `closing` (last round only)

### GET /api/personas
List available preset personas.

**Response:**
```json
{
  "personas": [
    {
      "id": "devil",
      "name": "Devil's Advocate",
      "emoji": "😈",
      "description": "Disagrees on principle. Loves semantics and logical traps.",
      "color": "#ef4444"
    },
    {
      "id": "saint",
      "name": "The Saint", 
      "emoji": "😇",
      "description": "Sees the good in everything. Uncomfortably wholesome.",
      "color": "#3b82f6"
    }
    // ... more presets
  ]
}
```

## Preset Personas (MVP)
| ID | Name | Emoji | Vibe |
|----|------|-------|------|
| devil | Devil's Advocate | 😈 | Contrarian, provocative, sharp |
| saint | The Saint | 😇 | Wholesome, kind, sees the best |
| boomer | The Boomer | 🧓 | "Back in my day...", skeptical of tech |
| zoomer | Gen Z | 💅 | "No cap", irony-poisoned, emoji-heavy |
| academic | The Professor | 🎓 | Citations, nuance, pedantic |
| chaos | Chaos Agent | 🔥 | Wild takes, derails, unpredictable |
| logic | Pure Logic | 🤖 | Facts only, no emotions, data-driven |
| vibes | Pure Vibes | 🎨 | Feelings, aesthetics, "the energy" |

## Notes for Nyx
- Use Anthropic API (claude-sonnet-4-20250514) for persona responses — fast + cheap
- Each persona gets a detailed system prompt with speech patterns, vocabulary, emoji usage
- Inject opponent's last message into the prompt so they can respond directly
- Stream responses via SSE for live typing effect
- Keep debate state in memory (no DB needed for MVP)
- CORS: allow `*` for MVP
