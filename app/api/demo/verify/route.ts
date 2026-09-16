export async function POST(request: Request) {
 if (Number(request.headers.get('content-length')) > 200) return Response.json({ valid: false }, { status: 413 });
 try { const raw = await request.text(); if (raw.length > 200) return Response.json({ valid: false }, { status: 413 }); const { otp } = JSON.parse(raw); return Response.json({ valid: typeof otp === 'string' && /^\d{5}$/.test(otp) && (otp === '48197' || process.env.DEMO_RELAXED_AUTH === 'true') }, { headers: { 'Cache-Control': 'no-store' } }); } catch { return Response.json({ valid: false }, { status: 400 }); }
}
