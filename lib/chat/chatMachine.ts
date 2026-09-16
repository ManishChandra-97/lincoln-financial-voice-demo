import { DEMO_PLAN } from '../demo/planData';
import { CHATBOT_PROMPT } from '../../prompts/assistantPrompts';
import { classifyScenario, requestedAgent, redact } from './intentRules';
import type { ChatState, Message } from './types';
const COPY = CHATBOT_PROMPT.messages;
export const ACK = COPY.transferAcknowledged;
export const READY = COPY.voiceReady;
export const message = (role: Message['role'], text: string): Message => ({ role, text, timestamp: new Date().toISOString() });
export function initialState(): ChatState { return { step: 'WELCOME', context: { verified: false, scenario: 'GENERAL', requestedAgent: false, chatTranscript: [message('assistant', COPY.welcome)], knownFacts: [], demoPlanFacts: DEMO_PLAN } }; }
export function transition(state: ChatState, input: string, otpValid = false): { state: ChatState; replies: string[] } {
 const context = { ...state.context, chatTranscript: [...state.context.chatTranscript], knownFacts: [...state.context.knownFacts] };
 let step = state.step; let replies: string[] = [];
 if (step === 'WELCOME') { const safe = redact(input); context.initialIntent = safe; context.requestedAgent = requestedAgent(input); context.scenario = classifyScenario(input); context.knownFacts.push(safe); context.chatTranscript.push(message('user', safe)); replies = [COPY.confirmAccount, COPY.askLastFour]; step = 'ASK_LAST4'; }
 else if (step === 'ASK_LAST4') { const digits = input.replace(/\D/g, ''); if (digits.length < 4 || digits.length > 12) replies = [COPY.invalidLastFour]; else { context.accountLast4Masked = '••••'; context.chatTranscript.push(message('user', '••••')); replies = [COPY.askPasscode]; step = 'ASK_OTP'; } }
 else if (step === 'ASK_OTP') { context.chatTranscript.push(message('user', '[Passcode entered]')); if (!otpValid) replies = [COPY.invalidPasscode]; else { context.verified = true; replies = [COPY.verified]; step = 'POST_AUTH_INTENT'; } }
 else if (step === 'POST_AUTH_INTENT') { const safe = redact(input); context.postAuthIntent = safe; context.chatTranscript.push(message('user', safe)); context.knownFacts.push(safe); const scenario = classifyScenario(input); if (scenario !== 'GENERAL') context.scenario = scenario; context.requestedAgent ||= requestedAgent(input); if (context.requestedAgent) { step = 'TRANSFER_ACKNOWLEDGED'; replies = [ACK, READY]; } else replies = [COPY.offerAgent]; }
 return { state: { step, context }, replies };
}
export function addReply(state: ChatState, text: string): ChatState { return { ...state, step: text === READY ? 'VOICE_READY' : state.step, context: { ...state.context, chatTranscript: [...state.context.chatTranscript, message('assistant', text)] } }; }
