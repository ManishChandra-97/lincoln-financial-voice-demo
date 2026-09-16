import type { DemoScenario } from './types';
export function classifyScenario(text: string): DemoScenario {
 if (/family emergency|medical|hospital|uninsured|hardship|emergency expense/i.test(text)) return 'HARDSHIP_MEDICAL';
 if (/personal loan|\bcar\b|vehicle|auto loan/i.test(text)) return 'NON_HARDSHIP_CAR';
 return 'GENERAL';
}
export function requestedAgent(text: string) { return /\b(agent|representative|human|someone|specialist)\b|speak (to|with)|talk (to|with)/i.test(text); }
// Credentials never enter transcripts, including when volunteered in free text.
export function redact(text: string) { return text.replace(/\b\d(?:[\s-]?\d){3,}\b/g, '[private details removed]').slice(0, 1500); }
