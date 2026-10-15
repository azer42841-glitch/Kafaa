'use server';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { exec, q, q1 } from '@/lib/db';
import { audit, clamp, clientIp, rateCount, rateHit } from '@/lib/util';
import { setCountry } from '@/lib/countries';
import { loginAdmin, loginStudent, requireStudent, studentId } from '@/lib/session';
import { setting } from '@/lib/settings';

let dummy: string | null = null; // هاش صالح للتسوية الزمنية حين لا يوجد المستخدم (منعًا لكشف وجود البريد)
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function loginAction(_: string, fd: FormData): Promise<string> {
  const email = clamp(fd.get('email'), 190).toLowerCase(), pw = String(fd.get('password') ?? ''), ip = await clientIp();
  if ((await rateCount(`login:${ip}`, 900)) >= 15 || (await rateCount(`loginm:${email}`, 900)) >= 8) return 'محاولات كثيرة. انتظر 15 دقيقة ثم أعد المحاولة.';
  const u = await q1('SELECT id,password_hash FROM users WHERE email=$1', [email]);
  const ok = await bcrypt.compare(pw, u?.password_hash ?? (dummy ??= await bcrypt.hash('not-a-real-password', 10)));
  if (u && ok) { await loginStudent(u.id); await exec('UPDATE users SET last_login_at=now() WHERE id=$1', [u.id]); redirect('/'); }
  await rateHit(`login:${ip}`); await rateHit(`loginm:${email}`);
  return 'البريد أو كلمة المرور غير صحيحة';
}
export async function registerAction(_: string, fd: FormData): Promise<string> {
  const name = clamp(fd.get('name'), 200), email = clamp(fd.get('email'), 300).toLowerCase();
  const pw = String(fd.get('password') ?? ''), pw2 = String(fd.get('password2') ?? ''), ip = await clientIp();
  if ((await rateCount(`reg:${ip}`, 3600)) >= 10) return 'محاولات كثيرة، حاول لاحقاً.';
  if ([...name].length < 2 || [...name].length > 80) return 'الاسم من حرفين إلى 80 حرفاً';
  if (!EMAIL.test(email) || email.length > 190) return 'البريد الإلكتروني غير صالح';
  if (pw.length < 8) return 'كلمة المرور 8 أحرف على الأقل';
  if (pw.length > 200) return 'كلمة المرور طويلة جداً';
  if (pw !== pw2) return 'كلمتا المرور غير متطابقتين';
  await rateHit(`reg:${ip}`);
  if (await q1('SELECT 1 FROM users WHERE email=$1', [email])) return 'هذا البريد مسجّل مسبقاً، جرّب تسجيل الدخول';
  const r = await q1('INSERT INTO users(name,email,password_hash) VALUES($1,$2,$3) RETURNING id', [name, email, await bcrypt.hash(pw, 10)]);
  await loginStudent(r!.id); redirect('/?f=welcome');
}
export async function adminLoginAction(_: string, fd: FormData): Promise<string> {
  const ip = await clientIp();
  if ((await rateCount(`adm:${ip}`, 900)) >= 6) return 'محاولات كثيرة. انتظر 15 دقيقة.';
  const user = clamp(fd.get('user'), 80), pw = String(fd.get('pw') ?? '');
  const hash = await setting('admin_hash');
  if (hash !== '' && user === (await setting('admin_user')) && (await bcrypt.compare(pw, hash))) { await loginAdmin(); await audit('admin', 'login', ip); redirect('/admin'); }
  await rateHit(`adm:${ip}`); return 'بيانات الدخول غير صحيحة';
}
export async function setCountryAction(fd: FormData) {
  (await cookies()).set('ss_welcomed', '1', { path: '/', maxAge: 365 * 86400, sameSite: 'lax' });
  if (!fd.has('skip')) await setCountry(clamp(fd.get('c'), 2));
  const back = String(fd.get('back') ?? '');
  redirect(back.startsWith('/') && !back.startsWith('//') && !/[\r\n\\]/.test(back) ? back : '/');
}
export async function completeLessonAction(fd: FormData) {
  await requireStudent(); const uid = await studentId(); const lid = parseInt(String(fd.get('lesson') ?? ''), 10) || 0;
  if (!(await q1('SELECT 1 FROM lessons WHERE id=$1 AND published=1', [lid]))) redirect('/');
  await exec('INSERT INTO progress(user_id,lesson_id) VALUES($1,$2) ON CONFLICT DO NOTHING', [uid, lid]);
  redirect(`/lesson/${lid}?f=lesson_done`);
}
