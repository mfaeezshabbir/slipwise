// Proxy GET/PUT/DELETE for a single expense by id to the backend server.
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

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const id = params.id;
  return forward(`/expenses/${id}`);
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const id = params.id;
  const body = await request.text();
  return forward(`/expenses/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body,
  });
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const id = params.id;
  return forward(`/expenses/${id}`, { method: 'DELETE' });
}

// no-op default export to silence expo-router page warnings on web builds
export default function _() {
  return null;
}
