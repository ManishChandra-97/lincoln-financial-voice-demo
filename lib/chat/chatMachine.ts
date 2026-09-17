import { DEMO_PLAN } from '../demo/planData';
import { CHATBOT_PROMPT } from '../../prompts/assistantPrompts';
import { classifyScenario, requestedAgent, redact } from './intentRules';
import type { ChatState, Message } from './types';

const COPY = CHATBOT_PROMPT.messages;

export const ACK = COPY.agent;
export const READY = COPY.agent;

export const message = (role: Message['role'], text: string): Message => ({
  role,
  text,
  timestamp: new Date().toISOString(),
});

export function initialState(): ChatState {
  return {
    step: 'WELCOME',
    context: {
      verified: false,
      scenario: 'GENERAL',
      requestedAgent: false,
      chatTranscript: [message('assistant', COPY.welcome)],
      knownFacts: [],
      demoPlanFacts: DEMO_PLAN,
    },
  };
}

export function transition(
  state: ChatState,
  input: string,
  _otpValid = false,
): { state: ChatState; replies: string[] } {
  const safe = redact(input);
  const scenario = classifyScenario(input);
  const wantsAgent = requestedAgent(input);
  const context = {
    ...state.context,
    initialIntent: state.context.initialIntent ?? safe,
    postAuthIntent: safe,
    scenario: scenario === 'GENERAL' ? state.context.scenario : scenario,
    requestedAgent: state.context.requestedAgent || wantsAgent,
    knownFacts: [...state.context.knownFacts, safe].slice(-40),
    chatTranscript: [
      ...state.context.chatTranscript,
      message('user', safe),
    ].slice(-80),
  };

  const reply = wantsAgent
    ? COPY.agent
    : scenario === 'HARDSHIP_MEDICAL'
      ? COPY.hardship
      : scenario === 'NON_HARDSHIP_CAR'
        ? COPY.distribution
        : COPY.general;

  return {
    state: { step: 'POST_AUTH_INTENT', context },
    replies: [reply],
  };
}

export function addReply(state: ChatState, text: string): ChatState {
  return {
    ...state,
    context: {
      ...state.context,
      chatTranscript: [
        ...state.context.chatTranscript,
        message('assistant', text),
      ].slice(-80),
    },
  };
}
