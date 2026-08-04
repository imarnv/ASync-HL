# F-Secure Support Dashboard

A dedicated, single-tenant dashboard for the F-Secure support agent. The agent is exposed
through three channels — chat, a mic-triggered voice agent, and live calls — all resolving
against one shared agent core so answers cannot drift between them.

There is deliberately no admin / customer / `subscribedAgents` entitlement layer: this is one
customer with one agent, not a multi-agent marketplace

## Running it

```bash
npm install
npm run dev        # http://localhost:3000
npm run typecheck  # tsc --noEmit
```

Requires Node 20+. Built on Next.js 16 (App Router) and React 19.

Copy `.env.example` to `.env.local` when the backend endpoint is ready.

## Architecture

```
Dashboard  ──  session settings (language + voice toggle)
                        │
                 F-Secure agent core          lib/agent.ts
                 system prompt · KB retrieval · tool calls
                 ┌──────────┼──────────┐
               Chat      Voice        Live calls
             in-page    in-page mic   telephony, off-browser
```

Chat and the voice agent are in-page sessions, so the dashboard owns them directly and they
share a single transcript. A live call happens on the phone network, so that panel is a
control-and-observe surface — request a callback, watch call state, review recent calls.

Channels differ only in transport and how the reply is presented: voice turns are trimmed to
the first paragraph, since long prose does not work read aloud.

## Design tokens

Defined once in `app/globals.css` as custom properties on `:root`.

| Token                | Value     | Use                        |
| -------------------- | --------- | -------------------------- |
| `--color-primary`    | `#50381F` | Brand brown, primary CTAs  |
| `--color-bg`         | `#F7F4EF` | Page background            |
| `--color-surface`    | `#ECE6D9` | Insets, active call block  |
| `--color-text`       | `#1E1A16` | Body text                  |
| `--color-text-muted` | `#6B645B` | Secondary text, hints      |
| `--color-border`     | `#E7DFC8` | Panel and control borders  |
| `--color-success`    | `#4CAF50` | Online, resolved calls     |
| `--color-warning`    | `#F4B400` | Escalated calls            |
| `--color-error`      | `#D9534F` | Recording, missed, end call |

Hover, tint and card values are derived from the primary brown so no state falls out of palette.

## Layout

```
app/
  api/chat/route.ts     HTTP boundary: validate → resolve → respond
  layout.tsx page.tsx globals.css icon.png
components/             Header, ChatPanel, VoiceAgentPanel, LiveCallPanel, Dashboard, Icons
lib/
  agent/
    greeting.ts         client-safe opening line
    core.ts             the stub agent (server-side only)
    service.ts          THE INTEGRATION SEAM — real backend or stub
  api/
    contracts.ts        request/response types + validation
    client.ts           the browser's only call into the agent
  config.ts             server-side env
  kb.ts languages.ts suggestions.ts types.ts
```

The browser never imports the agent or the KB. It calls `requestChatTurn` in `lib/api/client.ts`,
which posts to `/api/chat`, which calls `resolveAgentTurn` in `lib/agent/service.ts`. Keeping that
one path means credentials stay server-side and the KB stays out of the client bundle.

## Wiring in the backend

Everything routes through `lib/agent/service.ts`. Set `AGENT_API_URL` (and `AGENT_API_KEY`) and it
proxies to the real agent instead of the stub — no component or client change. It currently posts
`{ message, language, channel }` and expects `{ text, sources, toolCall }` back. **If the backend
team's shape differs, map it inside that one function and nowhere else.**

## What is stubbed

The UI is complete; the intelligence behind it is a stand-in. To go live:

1. **Agent** — `lib/agent/core.ts` does keyword matching locally. Replaced by setting the env var
   above. The tool-call contract is still unknown: KB article retrieval, a breach lookup by email,
   or both.
2. **KB content** — `lib/kb.ts` carries one real article, the Cyber Help piece on undisclosed
   breach sources, split into six retrievable passages along its own headings. Every passage is
   attributed to that article, so no source chip points at a link that does not exist. Further
   articles get added the same way once the KB is exported.
3. **Live calls** — the panel simulates dialing on a timer. Needs the telephony stack, and a
   decision on inbound number vs. outbound dialer vs. both.
4. **Translations** — the dropdown sets `lang` for speech recognition and synthesis, but the KB
   content itself is English only. Real multilingual support needs translated articles.
5. **Auth** — there is none. Add it if this is more than a demo link.

## Notes

- Responsive from 320px up; verified with no horizontal overflow at 320, 360, 390, 414, 768, 1024,
  1280 and 1440.
- No ESLint yet. `next lint` was removed in Next 16, so linting now means adding `eslint` plus
  `eslint-config-next` directly.
