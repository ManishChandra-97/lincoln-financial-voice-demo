# Lincoln Financial chat → call demonstration

A presentation demo with a Lincoln-inspired local page, deterministic chat verification, context-preserving OpenAI Realtime WebRTC voice, and a direct voice FAQ route. This is not an official Lincoln servicing website or production financial system.

## Setup

From this `demo/` directory:

```sh
npm install
cp .env.example .env.local
# Add an API Platform key to OPENAI_API_KEY in .env.local
npm run dev
```

Open the localhost URL printed by the server (normally http://localhost:3000). The Sites scaffold uses Vinext, a Next.js App Router-compatible React/TypeScript framework on Vite and Cloudflare Workers, with Tailwind and the supplied accessible Base UI primitives. No database or real authentication service is used.

A ChatGPT Plus subscription does not itself provide API usage. Use an OpenAI API Platform key with API billing enabled. Never put the key in a client variable or commit `.env.local`. For Sites hosting, set the key as a **secret runtime environment variable**, then redeploy. For local Workers runtime, `.env.local` is loaded by the Vite development server; production `npm start` may require `.dev.vars` or platform environment bindings instead.

| Variable | Default | Purpose |
| --- | --- | --- |
| `OPENAI_API_KEY` | empty | Server-only API credential; required for live voice |
| `OPENAI_REALTIME_MODEL` | `gpt-realtime` | Realtime model |
| `OPENAI_REALTIME_VOICE` | `alloy` | Supported voice |
| `DEMO_RELAXED_AUTH` | `false` | If true, accept any five-digit demo OTP |
| `DEMO_VOICE_FALLBACK` | `false` | Offer an explicitly labeled scripted transcript on voice failure |

## Demo paths

- `/`: chat → voice handoff.
- `/phone-demo`: direct voice FAQ, without authentication.
- `/?demoControls=1`: unobtrusive reset button. Shift+R also resets when not typing.

Voice availability is checked before microphone permission is requested. If no API key is configured, the call shows a clear setup message and offers the scripted rehearsal when enabled.

Microphone access starts only after pressing the headset or Start voice conversation. It does not start on page load.

## Seeded demo values and happy paths

1. Open chat or select “Let’s talk.”
2. Type “Things are tight and I need to withdraw some money” or select the quick reply.
3. Enter demo last four SSN **6513**. A pasted longer numeric string, such as `9053 6513`, is accepted in demo mode and represented only as `••••`.
4. Enter demo OTP **48197**. No SMS is sent. Other codes fail unless relaxed mode is enabled.
5. Scenario A: select **Family emergency**, or type “I’m having a family emergency. Can I speak to an agent?”
6. Scenario B: select **Personal loan / new car**, or type “I’m looking for a personal loan. Can I speak to an agent?”
7. Wait for the explicit acknowledgment, then use **Continue by voice** in the top-right of chat. If chat is closed, the headset appears at the top-right of the page.
8. Allow microphone access. In A, volunteer lack of insurance and ask for the walkthrough; the assistant should wait between steps. In B, mention a new car and frustration; the assistant should explain only the demo restriction and offer a specialist.
9. Mute/unmute, interrupt naturally, or end the call. Return to chat retains context; reset clears it.

For rehearsals without API access, set `DEMO_VOICE_FALLBACK=true`, restart, open voice, and choose **Continue with scripted transcript** after an error. The transcript is a click-through demonstration, never represented as connected realtime audio. It also supports simulated specialist transfer.

## Architecture and privacy

- `lib/chat/chatMachine.ts`: pure finite-state transitions; verification, scenario selection and handoff readiness never use an LLM. `TRANSFER_ACKNOWLEDGED` becomes `VOICE_READY` only when the final acknowledgment is displayed.
- `components/chat/ChatPanel.tsx`: chat UI, seeded verification, quick replies, reset, and cancellation of delayed replies.
- `lib/realtime/createRealtimeConnection.ts`: native media/WebRTC lifecycle, track mute, data-channel events, sanitized transcripts, disconnect handling and idempotent cleanup. Late permission grants after close stop their tracks immediately.
- `app/api/realtime/session/route.ts`: bounded request body and context validation; server builds instructions and sends multipart SDP/session to `POST https://api.openai.com/v1/realtime/calls`. Browser receives only SDP. Audio travels directly over WebRTC.
- `lib/realtime/buildVoiceInstructions.ts`: server-owned prompt and tool schemas. Curated Markdown is imported into the Worker bundle at build time. Client-provided plan facts cannot override the server plan. Handoff content is explicitly untrusted data.
- `components/voice/VoiceAgentModal.tsx`: listening/speaking/muted/error/ended UI, transcript, playback recovery, scripted fallback and simulated transfer summary.
- `knowledge/`: grounded FAQ material and source availability limitations.

The handoff includes verification **status**, a fully masked identifier, initial/post-auth intent, scenario, explicit agent request, volunteered facts, sanitized chat transcript and server-owned demo plan facts. Raw SSN and OTP never enter chat history, prompts or logs. OTP is submitted only to the local demo verification route and is not persisted. The application does not record audio or send transcripts to analytics. Live voice and handoff context are processed by OpenAI when configured. Use synthetic information only.

`request_human_transfer` displays a summary and marks a **simulated** handoff ready. It never places a phone call. A future telephony integration can replace that seam. `end_call` closes after the spoken closing finishes. Server VAD supports interruptions and WebRTC manages playout truncation; microphone input remains enabled while the assistant speaks.

This intentionally demo-only verification is not an authorization boundary. Before public, multi-user production deployment, add real authentication/authorization, abuse prevention, rate limits, retention policy and approved financial content. Current intended hosting is owner-private.

## Validation

```sh
npm test
npm run typecheck
npm run lint
npm run build
```

Tests cover both complete deterministic chat paths, acknowledgment ordering, invalid verification, sensitive-data exclusion, server-owned plan facts, context validation, microphone permission races, mute/unmute, sanitized errors, resource cleanup, duplicate starts, malformed call events, and delayed closing audio. Lint covers authored code; generated component-library sources are excluded because the starter's rule set flags its own vendor components.

Live speech, audible barge-in, microphone prompts, focus behavior, and visual responsiveness require browser acceptance checks with a funded key. Test viewport sizes: 1440×900, 1280×720, 1024×768, 390×844, and 375×667. Do not treat transport mocks as proof of live audio quality.

## Troubleshooting

- **Microphone:** grant access in browser site settings; use a device with an available microphone. Retry after changing permissions.
- **Secure context:** HTTPS is required outside localhost. Unsupported browsers show an explicit error.
- **Missing key:** chat continues to work; voice shows a configuration error. Enable the scripted fallback for rehearsal.
- **Network:** corporate firewalls can block WebRTC. Try a network that permits WebRTC. Connection attempts time out cleanly.
- **Autoplay:** press “Enable speaker audio” if the browser blocks playback.
- **Embedding:** Lincoln sends `frame-ancestors 'self'` and `X-Frame-Options: SAMEORIGIN`, so the app deliberately uses a modular local shell instead of an iframe.
- **Transfer:** the visible transfer is simulated, never an actual Lincoln representative.
- **Reset:** Shift+R outside an input, or the `demoControls=1` reset, ends capture and clears demo state.

## Source-content limitations

See `knowledge/source-map.md`. The supplied Lincoln retirement and LTC pages had no extractable text, and the supplied PDF could not be retrieved. No policy answers were inferred from these unavailable sources. The IRS page supports only general tax/plan distinctions. Plan facts, portal labels and workflow steps come from the supplied demo specification and still need Lincoln-approved wording for real-world use. No exact processing SLA, loan terms, balances or document types are invented.

Official implementation references: [OpenAI WebRTC](https://developers.openai.com/api/docs/guides/voice-webrtc), [Realtime calls API](https://developers.openai.com/api/reference/typescript/resources/realtime/subresources/calls/methods/create).
