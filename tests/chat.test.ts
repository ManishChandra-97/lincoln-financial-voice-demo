import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initialState, transition, addReply } from '../lib/chat/chatMachine';
import { validateHandoff } from '../lib/realtime/validateHandoff';
import { classifyScenario, requestedAgent } from '../lib/chat/intentRules';

void test('chat starts with the Chicago Financial greeting', () => {
  const state = initialState();
  assert.equal(state.context.chatTranscript[0].role, 'assistant');
  assert.match(state.context.chatTranscript[0].text, /Chicago Financial/);
});

void test('chat keeps the conversation concise and offers the Agent path', () => {
  let state = initialState();
  const result = transition(
    state,
    'Can I speak with someone about a withdrawal?',
  );
  state = addReply(result.state, result.replies[0]);
  assert.equal(state.step, 'POST_AUTH_INTENT');
  assert.match(result.replies[0], /Agent/);
  assert.equal(state.context.requestedAgent, true);
  assert.match(state.context.chatTranscript.at(-1)?.text ?? '', /Agent/);
});

void test('voice handoff accepts an unverified conversation opened from chat', () => {
  const state = initialState();
  const next = transition(state, 'I have a family emergency.');
  const handoff = validateHandoff(next.state.context, 'chat-handoff');
  assert.equal(handoff.verified, false);
  assert.equal(handoff.scenario, 'HARDSHIP_MEDICAL');
});

void test('credentials remain redacted from chat and handoff data', () => {
  const state = transition(
    initialState(),
    'My SSN is 123-45-6789 and I need help.',
  ).state;
  assert.doesNotMatch(JSON.stringify(state), /6789/);
  assert.throws(() =>
    validateHandoff({ ...state.context, ssn: '1234' }, 'chat-handoff'),
  );
});

void test('scenario and Agent intent rules remain predictable', () => {
  assert.equal(
    classifyScenario('I need help with a family emergency'),
    'HARDSHIP_MEDICAL',
  );
  assert.equal(classifyScenario('I want to buy a new car'), 'NON_HARDSHIP_CAR');
  assert.equal(requestedAgent('Please connect me to an agent'), true);
  assert.equal(requestedAgent('career advice'), false);
});
