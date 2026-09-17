export type DemoScenario = 'HARDSHIP_MEDICAL' | 'NON_HARDSHIP_CAR' | 'GENERAL';
export type Message = {
  role: 'assistant' | 'user';
  text: string;
  timestamp: string;
};
export type HandoffContext = {
  verified: boolean;
  accountLast4Masked?: string;
  initialIntent?: string;
  postAuthIntent?: string;
  scenario: DemoScenario;
  requestedAgent: boolean;
  chatTranscript: Message[];
  knownFacts: string[];
  demoPlanFacts: {
    hardshipWithdrawalsAllowed: boolean;
    documentationRequired: boolean;
    processingTimeText: string;
    nonHardshipWhileEmployedAllowed: boolean;
  };
};
export type ChatStep =
  | 'WELCOME'
  | 'ASK_LAST4'
  | 'ASK_OTP'
  | 'POST_AUTH_INTENT'
  | 'REQUEST_CLARIFICATION'
  | 'TRANSFER_ACKNOWLEDGED'
  | 'VOICE_READY'
  | 'COMPLETED';
export type ChatState = { step: ChatStep; context: HandoffContext };
export type Mode = 'chat-handoff' | 'phone-demo';
