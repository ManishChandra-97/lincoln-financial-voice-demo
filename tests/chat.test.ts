import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initialState, transition, addReply } from '../lib/chat/chatMachine';
import { validateHandoff } from '../lib/realtime/validateHandoff';

void test('chat uses the mandatory Chicago Financial greeting and authentication flow', () => {
  let state = initialState();
  assert.equal(
    state.context.chatTranscript[0].text,
    'Hi, thanks for reaching out to Chicago Financial. How can I help you today?',
  );
  state = addReply(
    transition(state, 'I need a withdrawal.').state,
    transition(state, 'I need a withdrawal.').replies[0],
  );
  assert.equal(state.step, 'ASK_LAST4');
  const wrong = transition(state, '1111');
  assert.match(wrong.replies[0], /locate a profile/);
  const right = transition(state, '9053');
  assert.equal(right.state.step, 'ASK_OTP');
  assert.match(right.replies[0], /one-time passcode/);
  assert.equal(transition(right.state, '00000', false).state.step, 'ASK_OTP');
  const verified = transition(right.state, '48197', true);
  assert.equal(verified.state.context.verified, true);
  assert.equal(verified.state.step, 'POST_AUTH_INTENT');
});

void test('scenario clarification routes hardship and non-hardship requests', () => {
  let state = initialState();
  state = addReply(transition(state, 'Medical bills.').state, '');
  state = transition(state, '9053').state;
  state = transition(state, '48197', true).state;
  state = transition(
    state,
    'I am still employed and have uninsured medical expenses.',
  ).state;
  const hardship = transition(state, 'It is for a medical hardship.');
  assert.equal(hardship.state.context.scenario, 'HARDSHIP_MEDICAL');
  assert.match(hardship.replies[0], /may qualify/);
});

void test('human handoff is available without re-verification and credentials are redacted', () => {
  const state = initialState();
  const next = transition(state, 'Please connect me to a human agent.');
  assert.equal(next.state.context.requestedAgent, true);
  assert.match(next.replies[0], /Agent button/);
  assert.equal(
    validateHandoff(next.state.context, 'chat-handoff').verified,
    false,
  );
  const sensitive = transition(state, 'My SSN is 123-45-6789').state;
  assert.doesNotMatch(JSON.stringify(sensitive), /6789/);
});
