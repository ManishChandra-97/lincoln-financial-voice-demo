import type { ChatState, DemoScenario, Message } from './types';

const now = () => new Date().toISOString();
const add = (
  state: ChatState,
  role: Message['role'],
  text: string,
): ChatState => ({
  ...state,
  context: {
    ...state.context,
    chatTranscript: [
      ...state.context.chatTranscript,
      { role, text, timestamp: now() },
    ],
  },
});

const initialStateValue: ChatState = {
  step: 'WELCOME',
  context: {
    verified: false,
    scenario: 'GENERAL',
    requestedAgent: false,
    chatTranscript: [
      {
        role: 'assistant',
        text: 'Hi, thanks for reaching out to Lincoln Financial. How can I help you today?',
        timestamp: now(),
      },
    ],
    knownFacts: [],
    demoPlanFacts: {
      hardshipWithdrawalsAllowed: true,
      documentationRequired: true,
      processingTimeText:
        'Most requests are reviewed within a few business days once your documentation is received.',
      nonHardshipWhileEmployedAllowed: false,
    },
  },
};
export function initialState(): ChatState {
  return {
    ...initialStateValue,
    context: {
      ...initialStateValue.context,
      chatTranscript: [...initialStateValue.context.chatTranscript],
    },
  };
}

export function addReply(state: ChatState, text: string) {
  return add(state, 'assistant', text);
}

function classify(text: string): DemoScenario {
  const t = text.toLowerCase();
  if (
    /medical|hospital|tuition|funeral|housing|hardship|uninsured|emergency/.test(
      t,
    )
  )
    return 'HARDSHIP_MEDICAL';
  if (/car|car purchase|vacation|general expense|new vehicle/.test(t))
    return 'NON_HARDSHIP_CAR';
  return 'GENERAL';
}

export function transition(state: ChatState, input: string, otpValid = false) {
  const value = input.trim();
  const next: ChatState = add(state, 'user', redactSensitive(value));
  const replies: string[] = [];
  const human = /human|specialist|agent|representative|person/i.test(value);
  if (human) {
    next.context.requestedAgent = true;
    replies.push(
      'Please click the Agent button in the chat header to speak with a human specialist.',
    );
    return { state: next, replies };
  }

  if (state.step === 'WELCOME') {
    next.context.initialIntent = redactSensitive(value);
    next.step = 'ASK_LAST4';
    replies.push(
      "Before we get started, I'll need to verify your identity. Could you please share the last four digits of your Social Security Number?",
    );
  } else if (state.step === 'ASK_LAST4') {
    if (!/^\d{4}$/.test(value) || value !== '9053')
      replies.push(
        "Sorry I can't seem to locate a profile with that number, can you please check again and confirm?",
      );
    else {
      next.step = 'ASK_OTP';
      next.context.accountLast4Masked = '****';
      replies.push(
        "Thanks, I've sent a one-time passcode to your registered contact. Can you share that code with me?",
      );
    }
  } else if (state.step === 'ASK_OTP') {
    if (!otpValid && value !== '48197')
      replies.push(
        "That code doesn't seem to match — want to try again or I can resend one?",
      );
    else {
      next.step = 'POST_AUTH_INTENT';
      next.context.verified = true;
      replies.push(
        "You're all set — you're verified. Now, how can I help you?",
      );
    }
  } else if (state.step === 'POST_AUTH_INTENT') {
    next.context.initialIntent = redactSensitive(value);
    next.step = 'REQUEST_CLARIFICATION';
    replies.push(
      "Just to make sure I'm pointing you in the right direction — are you looking to take money out due to a specific hardship, or is this more of a general withdrawal or loan inquiry?",
    );
  } else if (state.step === 'REQUEST_CLARIFICATION') {
    next.context.postAuthIntent = value;
    next.context.scenario = classify(value);
    if (human) {
      next.step = 'TRANSFER_ACKNOWLEDGED';
      replies.push(
        "Of course — I'll connect you with one of our specialists right away. I'll pass along what we've already covered so you won't need to repeat yourself.",
      );
    } else if (next.context.scenario === 'HARDSHIP_MEDICAL') {
      next.step = 'POST_AUTH_INTENT';
      replies.push(
        "Based on what you've shared, it sounds like you may qualify for a hardship withdrawal. Your plan does allow for these in situations involving things like uninsured medical expenses, and I can walk you through the steps to submit your request.",
      );
    } else if (next.context.scenario === 'NON_HARDSHIP_CAR') {
      next.step = 'POST_AUTH_INTENT';
      replies.push(
        "I understand — it's your money and I get why it can feel frustrating. Unfortunately, because you're still actively employed, IRS rules generally restrict in-service withdrawals without a qualifying hardship reason. A new car purchase, for example, wouldn't meet the IRS hardship criteria, so a distribution wouldn't be available through that route right now. A plan loan might be an option depending on your plan's rules — would you like me to look into that for you?",
      );
    } else {
      next.step = 'POST_AUTH_INTENT';
      replies.push(
        'I can help with Lincoln Financial retirement plan matters, including hardship withdrawals, distributions, and plan loans. Please tell me whether you are still employed and what you need the money for.',
      );
    }
  }
  return { state: next, replies };
}

export function redactSensitive(text: string) {
  return text.replace(/\b\d[\d -]{2,}\d\b/g, '[redacted]');
}
