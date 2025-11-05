// Proxy GET (list) and POST (create) requests to the backend server.
const TARGET = process.env.API_URL || 'http://localhost:4000';

// mark server runtime for expo-router
export const runtime = 'edge';

async function forward(path: string, init: RequestInit = {}) {
  const url = `${TARGET}${path}`;
  try {
    const res = await fetch(url, init);
    const body = await res.text();
    const headers: Record<string, string> = {
      'content-type': res.headers.get('content-type') || 'application/json',
    };
    return new Response(body, { status: res.status, headers });
  } catch (err: any) {
    console.error('[api/proxy] error forwarding request', err && err.message ? err.message : err);
    const errBody = JSON.stringify({
      error: 'proxy_error',
      message: err?.message ?? String(err),
      target: TARGET,
      path,
    });
    return new Response(errBody, { status: 502, headers: { 'content-type': 'application/json' } });
  }
}

export async function GET() {
  return forward('/expenses');
}

export async function POST(request: Request) {
  const body = await request.text();
  return forward('/expenses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });
}

// expo-router expects a default export for pages; provide a no-op default to
// silence warnings when building for web. This component is never used for
// API route handling.
export default function _() {
  return null;
}
