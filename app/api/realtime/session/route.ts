import { buildVoiceInstructions, voiceTools } from '@/lib/realtime/buildVoiceInstructions';
import { validateHandoff } from '@/lib/realtime/validateHandoff';
const fail = (status: number, error: string) => Response.json({error}, {status, headers:{'Cache-Control':'no-store'}});
export async function POST(request: Request) {
 const origin = request.headers.get('origin');
 if (origin && origin !== new URL(request.url).origin) return fail(403, 'Request not allowed.');
 if (Number(request.headers.get('content-length')) > 64000) return fail(413, 'Session request is too large.');
 let body;
 try { const reader = request.body?.getReader(); if (!reader) return fail(400, 'Invalid session request.'); const chunks: Uint8Array[] = []; let bytes = 0; while (true) { const {value,done} = await reader.read(); if(done) break; bytes += value.byteLength; if(bytes>64000) {await reader.cancel(); return fail(413,'Session request is too large.');} chunks.push(value); } const joined = new Uint8Array(bytes); let offset=0; for(const chunk of chunks) {joined.set(chunk,offset);offset+=chunk.length;} body=JSON.parse(new TextDecoder().decode(joined)); } catch { return fail(400,'Invalid session request.'); }
 let context;
 try { if (!['chat-handoff','phone-demo'].includes(body.mode) || typeof body.sdp !== 'string' || !body.sdp.startsWith('v=0') || body.sdp.length>24000 || !body.sdp.includes('m=audio')) throw new Error('sdp'); context=validateHandoff(body.handoffContext,body.mode); } catch { return fail(400,'Invalid or unsafe handoff data.'); }
 const apiKey = process.env.OPENAI_API_KEY;
 if (!apiKey) return fail(503, 'Voice is not configured yet. Please try again later.');
 const form = new FormData(); form.set('sdp',body.sdp); form.set('session',JSON.stringify({type:'realtime',model:process.env.OPENAI_REALTIME_MODEL || 'gpt-realtime',output_modalities:['audio'],instructions:buildVoiceInstructions(context,body.mode),audio:{input:{transcription:{model:'gpt-4o-mini-transcribe'},turn_detection:{type:'server_vad',create_response:true,interrupt_response:true,silence_duration_ms:600}},output:{voice:process.env.OPENAI_REALTIME_VOICE || 'alloy'}},tools:voiceTools,tool_choice:'auto',max_output_tokens:1000}));
 try { const upstream=await fetch('https://api.openai.com/v1/realtime/calls',{method:'POST',headers:{Authorization:`Bearer ${apiKey}`},body:form,signal:AbortSignal.timeout(25000)}); if(!upstream.ok) return fail(502,'The voice assistant couldn’t connect. Please try again.'); const answer=await upstream.text(); if(!answer.startsWith('v=0')) return fail(502,'The voice assistant couldn’t connect. Please try again.'); return new Response(answer,{headers:{'Content-Type':'application/sdp','Cache-Control':'no-store'}}); } catch { return fail(502,'The voice assistant couldn’t connect. Please try again.'); }
}
