import type { DemoScenario, Mode } from '../chat/types';

export function scriptedConversation(scenario: DemoScenario, _mode: Mode) {
  const opening =
    'Hi, this is the Lincoln Financial virtual assistant. I understand you’re calling about a potential distribution. I already have your details here, so we can jump right in, how can I help you?';
  if (scenario === 'HARDSHIP_MEDICAL')
    return [
      { assistant: opening, reply: 'I have uninsured medical expenses.' },
      {
        assistant:
          'Based on what you have described, you may qualify for a hardship withdrawal, subject to review. Sign in at lincolnfinancial.com, open Withdrawals and Distributions, select Hardship Withdrawal, upload your supporting documents, and submit the request.',
        reply: 'What happens next?',
      },
      {
        assistant:
          'Most requests are processed within a few business days after all documents are received. Distributions may be subject to income tax and a ten percent early withdrawal penalty, so please consult a tax advisor.',
        reply: 'Thank you.',
      },
      {
        assistant:
          'You are welcome. Is there anything else I can help with today?',
      },
    ];
  if (scenario === 'NON_HARDSHIP_CAR')
    return [
      { assistant: opening, reply: 'I want a distribution for a new car.' },
      {
        assistant:
          'I understand why that feels frustrating. While you are actively employed, IRS rules generally restrict in-service withdrawals without a qualifying hardship, and a car purchase would not qualify; a plan loan may still be available depending on your plan rules.',
        reply: 'Thank you.',
      },
      {
        assistant:
          'You are welcome. Is there anything else I can help with today?',
      },
    ];
  return [
    { assistant: opening, reply: 'I have a retirement plan question.' },
    {
      assistant:
        'I can help with hardship withdrawals, distributions, plan loans, and related documentation. What would you like to explore?',
      reply: 'That is all for now.',
    },
    {
      assistant:
        'Alright, I think we have covered everything for now. If anything else comes up, do not hesitate to give us a call. Take care.',
    },
  ];
}
