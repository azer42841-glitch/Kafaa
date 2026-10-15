import { NextRequest, NextResponse } from 'next/server';
import { sign, verify } from './lib/token';

// يجدّد وقت «آخر نشاط» لجلسة الإدارة مع كل طلب لصفحاتها (الفحص الفعلي في lib/session.ts)
export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const t = await verify<{ at: number; seen: number; ua: string }>(req.cookies.get('ss_admin')?.value);
  if (t && Math.floor(Date.now() / 1000) - t.seen <= 1800)
    res.cookies.set('ss_admin', await sign({ ...t, seen: Math.floor(Date.now() / 1000) }), { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/' });
  return res;
}
export const config = { matcher: ['/admin/:path*'] };
