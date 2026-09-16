# Assistant prompts

Edit [`assistantPrompts.ts`](./assistantPrompts.ts) to change the chatbot or
voicebot instructions and wording.

- `CHATBOT_PROMPT` is the single source of truth for the deterministic text
  assistant's instructions and every assistant message in its verification and
  handoff flow.
- `VOICEBOT_PROMPT` is the complete Realtime voice system prompt.
- `VOICE_CHANNEL_INSTRUCTIONS` contains the two channel-specific additions for
  chat-to-voice and direct voice mode.

Runtime handoff data and curated knowledge are inserted into the marked
`{{...}}` placeholders by the server. They are data, not extra behavioral
instructions. Application validation, privacy controls, tool schemas, and the
verification state machine intentionally remain in code.

After an edit, run `npm test && npm run typecheck && npm run build` from the
repository root. Commit and push to `main`; the connected Vercel project then
builds and publishes the change automatically.
