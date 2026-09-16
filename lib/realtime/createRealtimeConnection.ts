import type { HandoffContext, Mode, Message } from '../chat/types';
import { redact } from '../chat/intentRules';
export type VoiceStatus = 'idle'|'requesting microphone'|'connecting'|'listening'|'assistant speaking'|'ending'|'ended'|'error';
export type Transfer = {reason: string; customerSummary: string};
export type ConnectionCallbacks = {status:(status:VoiceStatus)=>void; error:(message:string)=>void; transcript:(message:Message)=>void; transfer:(summary:Transfer)=>void; audioBlocked:()=>void};
export function createRealtimeConnection(context:HandoffContext, mode:Mode, callbacks:ConnectionCallbacks) {
 let pc:RTCPeerConnection|undefined, stream:MediaStream|undefined, dc:RTCDataChannel|undefined, audio:HTMLAudioElement|undefined;
 let closed=false, started=false, ending=false, playing=false, muted=false;
 let endingTimer:ReturnType<typeof setTimeout>|undefined;
 const abort = new AbortController(); const timers = new Set<ReturnType<typeof setTimeout>>();
 const delay=(fn:()=>void, ms:number)=>{const t=setTimeout(()=>{timers.delete(t);fn();},ms);timers.add(t);return t;};
 const send=(event:unknown)=>{if(dc?.readyState==='open') dc.send(JSON.stringify(event));};
 function close() { if(closed) return; closed=true; abort.abort(); timers.forEach(clearTimeout); timers.clear(); if(dc){dc.onopen=null;dc.onmessage=null;dc.onerror=null;dc.onclose=null;dc.close();} if(pc){pc.ontrack=null;pc.onconnectionstatechange=null;pc.close();} stream?.getTracks().forEach(t=>t.stop()); if(audio){audio.pause();audio.srcObject=null;audio.remove();} }
 function fail(message:string) {if(closed)return; close(); callbacks.status('error'); callbacks.error(message);}
 function finish(){if(closed)return;callbacks.status('ending');close();callbacks.status('ended');}
 const handleEvent=(event:Record<string, unknown>)=>{
  if(closed)return;
  if(event.type==='input_audio_buffer.speech_started') callbacks.status('listening'); // Server VAD cancels and truncates WebRTC playout automatically.
  if(event.type==='output_audio_buffer.started'){playing=true;if(endingTimer){clearTimeout(endingTimer);timers.delete(endingTimer);endingTimer=undefined;}callbacks.status('assistant speaking');}
  if(event.type==='output_audio_buffer.stopped'||event.type==='output_audio_buffer.cleared'){playing=false;if(ending)finish();else callbacks.status('listening');}
  if(event.type==='response.output_audio_transcript.done'||event.type==='conversation.item.input_audio_transcription.completed') {if(typeof event.transcript==='string')callbacks.transcript({role:event.type.startsWith('response')?'assistant':'user',text:redact(event.transcript),timestamp:new Date().toISOString()});}
  if(event.type==='response.function_call_arguments.done'){
   let args:Record<string,unknown>;try{args=JSON.parse(String(event.arguments));}catch{return;}
   if(!args||typeof args!=='object'||Array.isArray(args)||typeof event.call_id!=='string')return;
   if(event.name==='request_human_transfer'&&typeof args.reason==='string'&&typeof args.customerSummary==='string') {callbacks.transfer({reason:redact(args.reason),customerSummary:redact(args.customerSummary)});send({type:'conversation.item.create',item:{type:'function_call_output',call_id:event.call_id,output:JSON.stringify({status:'demo_transfer_ready',realTransfer:false})}});send({type:'response.create'});}
   if(event.name==='end_call'&&!ending){ending=true;send({type:'conversation.item.create',item:{type:'function_call_output',call_id:event.call_id,output:'{"status":"ending"}'}});if(!playing)endingTimer=delay(finish,1600);delay(finish,20000);}
  }
  if(event.type==='error')fail('The voice session encountered a problem. Please try again.');
 };
 async function start(){
  if(closed||started)return;
  started=true;
  if(!navigator.mediaDevices?.getUserMedia||typeof RTCPeerConnection==='undefined'){fail('Voice requires a supported browser and a secure connection.');return;}
  callbacks.status('requesting microphone');
  try {
   const acquired=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true}});
   if(closed){acquired.getTracks().forEach(t=>t.stop());return;} stream=acquired; stream.getAudioTracks().forEach(t=>{t.enabled=!muted;});
   callbacks.status('connecting'); pc=new RTCPeerConnection(); audio=document.createElement('audio');audio.autoplay=true;audio.setAttribute('playsinline','');
   const connectTimer=delay(()=>fail('The voice assistant couldn’t connect. Please try again.'),35000);
   pc.ontrack=e=>{if(audio){audio.srcObject=e.streams[0]||new MediaStream([e.track]);void audio.play().catch(()=>{if(!closed)callbacks.audioBlocked();});}};
   pc.onconnectionstatechange=()=>{if(pc?.connectionState==='failed')fail('Connection lost. Please try again.');if(pc?.connectionState==='disconnected')delay(()=>{if(pc?.connectionState==='disconnected')fail('Connection lost. Please try again.');},5000);};
   stream.getTracks().forEach(track=>pc!.addTrack(track,stream!));dc=pc.createDataChannel('oai-events');
   dc.onmessage=e=>{try{const event:unknown=JSON.parse(e.data);if(event&&typeof event==='object'&&!Array.isArray(event))handleEvent(event as Record<string,unknown>);}catch{/* Ignore malformed events without logging customer data. */}};
   dc.onerror=()=>fail('The voice connection was interrupted. Please try again.');dc.onclose=()=>{if(!closed)fail('The voice connection ended. Please try again.');};
   dc.onopen=()=>{clearTimeout(connectTimer);timers.delete(connectTimer);callbacks.status('listening');send({type:'response.create'});};
   const offer=await pc.createOffer();if(closed)return;await pc.setLocalDescription(offer);if(closed)return;
   const response=await fetch('/api/realtime/session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sdp:offer.sdp,handoffContext:context,mode}),signal:abort.signal});
   if(!response.ok){let message='The voice assistant couldn’t connect. Please try again.';try{const result=await response.json() as {error?:string};if(typeof result.error==='string')message=result.error;}catch{}fail(message);return;}
   const answer=await response.text();if(!closed)await pc.setRemoteDescription({type:'answer',sdp:answer});
  } catch(error){if(closed)return;fail(error instanceof DOMException&&['NotAllowedError','SecurityError'].includes(error.name)?'Microphone access is required for the voice demo.':error instanceof DOMException&&error.name==='NotFoundError'?'No microphone was found. Connect one and try again.':'The voice assistant couldn’t connect. Please try again.');}
 }
 return {start,close,setMuted(value:boolean){muted=value;stream?.getAudioTracks().forEach(t=>{t.enabled=!value;});},async play(){try{await audio?.play();return true;}catch{return false;}}};
}
export type RealtimeConnection=ReturnType<typeof createRealtimeConnection>;
