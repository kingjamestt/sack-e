import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { kv } from '@vercel/kv';

const ratelimit = new Ratelimit({
  redis: kv,
  // 5 requests from the same IP in 10 seconds
  limiter: Ratelimit.slidingWindow(5, '10 s'),
});

export async function proxy(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || (request as any).ip || '127.0.0.1';
    const { success } = await ratelimit.limit(ip);

    if (!success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }
  } catch (error) {
    console.warn("Ratelimit failed (KV likely unconfigured):", error);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*', '/checkout/:path*'],
};
