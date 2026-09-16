import type { DemoScenario, Mode } from '../chat/types';
import { DEMO_PLAN } from './planData';
export function scriptedConversation(scenario:DemoScenario,mode:Mode) {
 if(mode==='phone-demo')return [
 {assistant:'Hi, I’m the Lincoln Financial virtual assistant. This scripted demonstration covers general hardship and distribution questions. What would you like to know?',reply:'What documentation is needed?'},
 {assistant:'This demo plan requires supporting documentation for a hardship withdrawal. The exact document types are not provided. I can prepare a demo handoff to a specialist to review those details.',reply:'How long does processing take?'},
 {assistant:`${DEMO_PLAN.processingTimeText} I can also prepare a demo specialist handoff.`,reply:'Is a hardship withdrawal automatically tax-free?'},
 {assistant:'No automatic tax-free treatment is established here. Tax treatment and plan withdrawal availability are different questions. A specialist can review your circumstances; I can prepare a demo handoff.',reply:'Thank you, that’s all.'},
 {assistant:'Thanks for speaking with me. Please reach out if you need anything else.'}];
 if(scenario==='HARDSHIP_MEDICAL')return [
 {assistant:'Hi, I’m the Lincoln Financial virtual assistant. Your distribution request and chat details have carried over. I’m sorry you’re dealing with a family emergency. What else would you like me to know?',reply:'I don’t currently have health insurance.'},
 {assistant:'Thanks for clarifying. Based on the demo plan information I have, hardship withdrawals are available and supporting documentation is required. I can walk you through the steps or prepare a demo handoff to a specialist.',reply:'Can you walk me through it?'},
 {assistant:'First, log in to your Lincoln Financial account. Let me know when you’re ready for the next step.',reply:'I’m ready.'},
 {assistant:'Navigate to Withdrawals & Distributions, then select Hardship Withdrawal. Let me know when you’re ready to continue.',reply:'Ready for the next step.'},
 {assistant:`Upload the required documentation, then submit the request for review. ${DEMO_PLAN.processingTimeText} I can still prepare a demo specialist handoff and carry your information forward.`,reply:'No, I understand. Thanks for your time.'},
 {assistant:'Of course. I’m glad I could help you understand the next steps. Take care, and please reach out if you need anything else.'}];
 if(scenario==='NON_HARDSHIP_CAR')return [
 {assistant:'Hi, I’m the Lincoln Financial virtual assistant. I have your distribution request and the personal-loan details you shared in chat. What else would you like me to know?',reply:'I was thinking about getting a new car.'},
 {assistant:'Thanks for clarifying. Based on the hardship criteria configured for this demo plan, purchasing a new car would not qualify as a hardship withdrawal reason.',reply:'That doesn’t seem fair. It’s my money.'},
 {assistant:'I understand why that feels frustrating. Retirement-plan withdrawals can be limited by the plan’s rules and applicable regulations. For this demo plan, a new-car purchase isn’t an eligible hardship reason. I can prepare a demo handoff to a specialist to review other options.',reply:'No, I’m not happy, but I understand. Thanks.'},
 {assistant:'I understand. Thanks for speaking with me, and I’m sorry I couldn’t give you the answer you were hoping for. If you want to review other options later, a specialist can help.'}];
 return [{assistant:'Hi, I’m the Lincoln Financial virtual assistant. Your chat details have carried over. For questions beyond the demo plan information, I can prepare a simulated specialist handoff.',reply:'Thank you.'},{assistant:'Thanks for speaking with me. Take care.'}];
}
