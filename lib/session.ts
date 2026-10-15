import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { q1 } from './db';
import { sign, verify, sha256hex } from './token';
import { setting } from './settings';
import { SESSION_IDLE_ADMIN } from './util';

const SECURE = process.env.NODE_ENV === 'production';
const base = { httpOnly: true, sameSite: 'lax' as const, secure: SECURE, path: '/' };

// ---- جلسة الطالب (كوكي موقّع، مدة 30 يومًا)
export async function studentId(): Promise<number> {
  const t = await verify<{ uid: number; exp: number }>((await cookies()).get('ss_user')?.value);
  return t && t.exp > Date.now() / 1000 ? t.uid : 0;
}
export async function loginStudent(uid: number) {
  (await cookies()).set('ss_user', await sign({ uid, exp: Math.floor(Date.now() / 1000) + 30 * 86400 }), { ...base, maxAge: 30 * 86400 });
}
export async function logoutAll() { const c = await cookies(); c.delete('ss_user'); c.delete('ss_admin'); }
export async function curUser(): Promise<{ id: number; name: string; email: string } | null> {
  const id = await studentId();
  return id ? ((await q1('SELECT id,name,email FROM users WHERE id=$1', [id])) as any) : null;
}
export async function requireStudent() { if (!(await studentId())) redirect('/login?f=login_required'); }

// ---- جلسة الإدارة: خمول 30 دقيقة، ربط بالمتصفح (UA)، وتبطل بتغيير كلمة المرور
export async function loginAdmin() {
  const ua = await sha256hex((await headers()).get('user-agent') || '');
  const now = Math.floor(Date.now() / 1000);
  (await cookies()).set('ss_admin', await sign({ at: now, seen: now, ua }), { ...base });
}
export async function isAdmin(): Promise<boolean> {
  const t = await verify<{ at: number; seen: number; ua: string }>((await cookies()).get('ss_admin')?.value);
  if (!t) return false;
  const now = Math.floor(Date.now() / 1000);
  if (now - t.seen > SESSION_IDLE_ADMIN) return false;
  if (t.ua !== (await sha256hex((await headers()).get('user-agent') || ''))) return false;
  return t.at >= Number(await setting('admin_pw_epoch', '0'));
}
export async function requireAdmin() { if (!(await isAdmin())) redirect('/admin/login'); }
