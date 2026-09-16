import { DEMO_PLAN } from '../demo/planData';
import { classifyScenario, requestedAgent, redact } from './intentRules';
import type { ChatState, Message } from './types';
export const ACK = 'Absolutely. I can connect you with our virtual assistant and carry over everything you’ve already shared, so you won’t need to start over.';
export const READY = 'When you’re ready, click the agent icon in the top-right to continue by voice.';
export const message = (role: Message['role'], text: string): Message => ({ role, text, timestamp: new Date().toISOString() });
export function initialState(): ChatState { return { step: 'WELCOME', context: { verified: false, scenario: 'GENERAL', requestedAgent: false, chatTranscript: [message('assistant', 'Hi! Thanks for reaching out to Lincoln Financial. How can I help you?')], knownFacts: [], demoPlanFacts: DEMO_PLAN } }; }
export function transition(state: ChatState, input: string, otpValid = false): { state: ChatState; replies: string[] } {
 const context = { ...state.context, chatTranscript: [...state.context.chatTranscript], knownFacts: [...state.context.knownFacts] };
 let step = state.step; let replies: string[] = [];
 if (step === 'WELCOME') { const safe = redact(input); context.initialIntent = safe; context.requestedAgent = requestedAgent(input); context.scenario = classifyScenario(input); context.knownFacts.push(safe); context.chatTranscript.push(message('user', safe)); replies = ['Before we begin, can I confirm your account?', 'Please enter the last 4 digits of your SSN.']; step = 'ASK_LAST4'; }
 else if (step === 'ASK_LAST4') { const digits = input.replace(/\D/g, ''); if (digits.length < 4 || digits.length > 12) replies = ['Please enter four digits. Use demo details only.']; else { context.accountLast4Masked = '••••'; context.chatTranscript.push(message('user', '••••')); replies = ['I’ve sent a one-time passcode. Please enter it here.']; step = 'ASK_OTP'; } }
 else if (step === 'ASK_OTP') { context.chatTranscript.push(message('user', '[Passcode entered]')); if (!otpValid) replies = ['That code didn’t match. Please try again.']; else { context.verified = true; replies = ['Thanks, you’re verified. How can I help you?']; step = 'POST_AUTH_INTENT'; } }
 else if (step === 'POST_AUTH_INTENT') { const safe = redact(input); context.postAuthIntent = safe; context.chatTranscript.push(message('user', safe)); context.knownFacts.push(safe); const scenario = classifyScenario(input); if (scenario !== 'GENERAL') context.scenario = scenario; context.requestedAgent ||= requestedAgent(input); if (context.requestedAgent) { step = 'TRANSFER_ACKNOWLEDGED'; replies = [ACK, READY]; } else replies = ['I can help you explore that with our virtual assistant. Would you like to speak to an agent?']; }
 return { state: { step, context }, replies };
}
export function addReply(state: ChatState, text: string): ChatState { return { ...state, step: text === READY ? 'VOICE_READY' : state.step, context: { ...state.context, chatTranscript: [...state.context.chatTranscript, message('assistant', text)] } }; }
