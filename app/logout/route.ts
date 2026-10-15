import { NextRequest, NextResponse } from 'next/server';
export function GET(req: NextRequest) {
  const res = NextResponse.redirect(new URL('/', req.url));
  res.cookies.delete('ss_user'); res.cookies.delete('ss_admin');
  return res;
}
