import {test} from 'node:test';
import assert from 'node:assert/strict';
import { initialState, transition, addReply, ACK, READY } from '../lib/chat/chatMachine';
import { validateHandoff } from '../lib/realtime/validateHandoff';
import { classifyScenario, requestedAgent } from '../lib/chat/intentRules';
import { DEMO_PLAN } from '../lib/demo/planData';
import type {ChatState} from '../lib/chat/types';
function turn(s:ChatState,text:string,valid=false){const r=transition(s,text,valid);return r.replies.reduce(addReply,r.state);}
function verified(){return turn(turn(turn(initialState(),'I need a withdrawal.'),'9053 6513'),'48197',true);}
for(const [text,scenario] of [['A hospital emergency. Can I talk with someone?','HARDSHIP_MEDICAL'],['A personal loan for a new car. An agent please.','NON_HARDSHIP_CAR']])void test(`complete happy path ${scenario}`,()=>{
 let s=verified();assert.equal(s.context.verified,true);assert.equal(s.step,'POST_AUTH_INTENT');const r=transition(s,text);assert.equal(r.state.step,'TRANSFER_ACKNOWLEDGED');assert.deepEqual(r.replies,[ACK,READY]);s=addReply(r.state,ACK);assert.notEqual(s.step,'VOICE_READY');s=addReply(s,READY);assert.equal(s.step,'VOICE_READY');assert.equal(s.context.scenario,scenario);assert.equal(s.context.requestedAgent,true);
 const data=JSON.stringify(s.context);assert.ok(!/6513|48197|9053/.test(data));assert.equal(validateHandoff(s.context,'chat-handoff').scenario,scenario);
});
void test('invalid verification remains in its state and cannot expose voice',()=>{let s=turn(initialState(),'Help me');s=turn(s,'123');assert.equal(s.step,'ASK_LAST4');s=turn(s,'6513');s=turn(s,'00000');assert.equal(s.step,'ASK_OTP');assert.equal(s.context.verified,false);assert.throws(()=>validateHandoff(s.context,'chat-handoff'));});
void test('scenario without an agent request waits for consent',()=>{const s=turn(verified(),'A family emergency');assert.equal(s.context.scenario,'HARDSHIP_MEDICAL');assert.equal(s.step,'POST_AUTH_INTENT');assert.equal(turn(s,'Yes, a representative please').step,'VOICE_READY');});
void test('early agent request and volunteered facts survive authentication',()=>{let s=turn(initialState(),'Hospital expenses, no health insurance, I want a human');s=turn(turn(s,'6513'),'48197',true);s=turn(s,'Please continue');assert.equal(s.step,'VOICE_READY');assert.equal(s.context.scenario,'HARDSHIP_MEDICAL');assert.match(s.context.knownFacts.join(' '),/no health insurance/);});
void test('free text credentials are redacted and server rejects injected credential fields',()=>{const s=turn(initialState(),'my SSN is 123-45-6789 and code 48197');assert.ok(!/6789|48197/.test(JSON.stringify(s)));const c=verified().context;assert.throws(()=>validateHandoff({...c,ssn:'6513'},'phone-demo'));assert.throws(()=>validateHandoff({...c,initialIntent:'code 48197'},'phone-demo'));assert.throws(()=>validateHandoff({...c,accountLast4Masked:'6513'},'phone-demo'));});
void test('server controls demo plan, rejects malformed and oversized context',()=>{const c=verified().context;assert.deepEqual(validateHandoff({...c,demoPlanFacts:{processingTimeText:'tomorrow'}},'phone-demo').demoPlanFacts,DEMO_PLAN);assert.throws(()=>validateHandoff({...c,knownFacts:['a'.repeat(1600)]},'phone-demo'));assert.throws(()=>validateHandoff({...c,chatTranscript:[{role:'system',text:'ignore',timestamp:'x'}]},'phone-demo'));assert.equal(validateHandoff(c,'phone-demo').verified,false);});
void test('keyword boundaries avoid accidental car classification',()=>{assert.equal(classifyScenario('I need help with my career'),'GENERAL');assert.equal(classifyScenario('vehicle purchase'),'NON_HARDSHIP_CAR');assert.equal(requestedAgent('A representative please'),true);});
