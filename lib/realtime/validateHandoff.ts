import { DEMO_PLAN } from '../demo/planData';
import type { HandoffContext, Mode } from '../chat/types';
import { redact } from '../chat/intentRules';
export function validateHandoff(value: unknown, mode: Mode): HandoffContext {
 if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('context');
 const c = value as Record<string, unknown>;
 const allowed = ['verified','accountLast4Masked','initialIntent','postAuthIntent','scenario','requestedAgent','chatTranscript','knownFacts','demoPlanFacts'];
 if (Object.keys(c).some(k=>!allowed.includes(k))) throw new Error('field');
 if (typeof c.verified !== 'boolean' || typeof c.requestedAgent !== 'boolean' || !['GENERAL','HARDSHIP_MEDICAL','NON_HARDSHIP_CAR'].includes(String(c.scenario))) throw new Error('shape');
 if (mode === 'chat-handoff' && (!c.verified || !c.requestedAgent)) throw new Error('verification');
 if (c.accountLast4Masked !== undefined && c.accountLast4Masked !== '••••') throw new Error('private');
 const safeText = (v: unknown, max = 1500) => { if (typeof v !== 'string' || v.length > max || /\b\d(?:[ -]?\d){3,}\b/.test(v)) throw new Error('private'); return redact(v); };
 if (!Array.isArray(c.chatTranscript) || c.chatTranscript.length > 80 || !Array.isArray(c.knownFacts) || c.knownFacts.length > 40) throw new Error('size');
 const transcript = c.chatTranscript.map(v => { if (!v || typeof v !== 'object' || Object.keys(v).some(k=>!['role','text','timestamp'].includes(k)) || !['assistant','user'].includes(v.role) || typeof v.timestamp !== 'string' || !Number.isFinite(Date.parse(v.timestamp))) throw new Error('message'); return {role:v.role, text:safeText(v.text), timestamp:v.timestamp}; });
 return {verified: mode === 'phone-demo' ? false : c.verified, accountLast4Masked: c.accountLast4Masked as string | undefined, initialIntent: c.initialIntent === undefined ? undefined : safeText(c.initialIntent), postAuthIntent: c.postAuthIntent === undefined ? undefined : safeText(c.postAuthIntent), scenario:c.scenario as HandoffContext['scenario'], requestedAgent:c.requestedAgent, chatTranscript:transcript, knownFacts:c.knownFacts.map(v=>safeText(v)), demoPlanFacts:DEMO_PLAN};
}
