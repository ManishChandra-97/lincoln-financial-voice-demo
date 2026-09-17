import hardship from '../../knowledge/hardship.md';
import distributions from '../../knowledge/distributions.md';
import {
  VOICEBOT_PROMPT,
  VOICE_CHANNEL_INSTRUCTIONS,
} from '../../prompts/assistantPrompts';
import type { HandoffContext, Mode } from '../chat/types';
export function buildVoiceInstructions(context: HandoffContext, mode: Mode) {
  const channel =
    mode === 'chat-handoff'
      ? VOICE_CHANNEL_INSTRUCTIONS.chatHandoff
      : VOICE_CHANNEL_INSTRUCTIONS.phoneDemo;
  const handoff = JSON.stringify(context)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e');
  return VOICEBOT_PROMPT.replace('{{CHANNEL_INSTRUCTIONS}}', channel)
    .replace('{{HANDOFF_DATA}}', handoff)
    .replace('{{CURATED_KNOWLEDGE}}', `${hardship}\n${distributions}`);
}
export const voiceTools = [
  {
    type: 'function',
    name: 'request_human_transfer',
    description:
      'Prepare a specialist follow-up request with relevant chat and voice context.',
    parameters: {
      type: 'object',
      properties: {
        reason: { type: 'string' },
        customerSummary: { type: 'string' },
      },
      required: ['reason', 'customerSummary'],
      additionalProperties: false,
    },
  },
  {
    type: 'function',
    name: 'end_call',
    description:
      'End after the spoken goodbye has played, when the customer is finished.',
    parameters: { type: 'object', properties: {}, additionalProperties: false },
  },
];
