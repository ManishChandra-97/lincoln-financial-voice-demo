import type { DemoScenario, Mode } from '../chat/types';
import { DEMO_PLAN } from './planData';

export function scriptedConversation(scenario: DemoScenario, _mode: Mode) {
  if (scenario === 'HARDSHIP_MEDICAL')
    return [
      {
        assistant:
          'Hi, I’m the Chicago Financial AI assistant. I can help explain the general hardship-withdrawal process. What would you like to know?',
        reply: 'What are the next steps?',
      },
      {
        assistant:
          'Start by signing in and opening Withdrawals & Distributions. Choose Hardship Withdrawal when you are ready to continue.',
        reply: 'I’m ready.',
      },
      {
        assistant: `Attach the requested documentation and submit the request for review. ${DEMO_PLAN.processingTimeText}`,
        reply: 'Thank you.',
      },
      {
        assistant:
          'You’re welcome. Please reach out again if you have another question.',
      },
    ];

  if (scenario === 'NON_HARDSHIP_CAR')
    return [
      {
        assistant:
          'Hi, I’m the Chicago Financial AI assistant. How can I help?',
        reply: 'Can I use a hardship withdrawal for a vehicle?',
      },
      {
        assistant:
          'A vehicle purchase is not listed as a hardship reason in the available plan information. A qualified specialist can help review other distribution options.',
        reply: 'Thank you.',
      },
      { assistant: 'You’re welcome. Take care.' },
    ];

  return [
    {
      assistant:
        'Hi, I’m the Chicago Financial AI assistant. How can I help with your retirement or distribution question?',
      reply: 'What information do I need for a withdrawal?',
    },
    {
      assistant:
        'Requirements depend on the plan and reason for the withdrawal. A qualified specialist can confirm the documents needed for your situation.',
      reply: 'Thank you.',
    },
    { assistant: 'You’re welcome. Take care.' },
  ];
}
