import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import { ensureSchema } from '@/lib/schema';
import { seedCountries, seedCourses } from '@/lib/seed';
import { setting, settingSet } from '@/lib/settings';
import { audit, clamp } from '@/lib/util';
export const metadata = { title: 'تثبيت منصة سلاسة' };
export const dynamic = 'force-dynamic';

async function create(fd: FormData) {
  'use server';
  await ensureSchema();
  if ((await setting('admin_hash')) !== '') redirect('/install');
  const u = clamp(fd.get('user'), 30), p = String(fd.get('pw') ?? ''), p2 = String(fd.get('pw2') ?? '');
  let err = '';
  if (!/^[A-Za-z0-9_.-]{3,30}$/.test(u)) err = 'اسم المستخدم 3-30 حرفاً لاتينياً أو أرقاماً';
  else if (p.length < 10) err = 'كلمة المرور 10 أحرف على الأقل';
  else if (p.length > 200) err = 'كلمة المرور طويلة جداً';
  else if (p !== p2) err = 'كلمتا المرور غير متطابقتين';
  if (err) redirect('/install?e=' + encodeURIComponent(err));
  await settingSet('admin_user', u); await settingSet('admin_hash', await bcrypt.hash(p, 12)); await settingSet('admin_pw_epoch', String(Math.floor(Date.now() / 1000)));
  await audit('install', 'admin_created', u); redirect('/admin/login');
}

export default async function Install({ searchParams }: { searchParams: Promise<{ e?: string }> }) {
  try { await ensureSchema(); await seedCourses(); await seedCountries(); }
  catch (x) { console.error(x); return <main className="auth"><h1>تعذّر إعداد قاعدة البيانات</h1><p>راجع متغير DATABASE_URL في إعدادات المشروع.</p></main>; }
  if ((await setting('admin_hash')) !== '') return <main className="auth"><h1>التثبيت مكتمل ومقفل.</h1></main>;
  const { e } = await searchParams; const known = ['اسم المستخدم 3-30 حرفاً لاتينياً أو أرقاماً', 'كلمة المرور 10 أحرف على الأقل', 'كلمة المرور طويلة جداً', 'كلمتا المرور غير متطابقتين'];
  return (
    <main className="auth"><h1>تثبيت منصة سلاسة</h1><p className="muted">تم إنشاء الجداول والمساقات. اختر حساب الإدارة:</p>
      {e && known.includes(e) && <div className="flash err">{e}</div>}
      <form action={create}><label>اسم مستخدم الإدارة</label><input name="user" required dir="ltr" />
        <label>كلمة المرور (10 أحرف على الأقل)</label><input type="password" name="pw" required minLength={10} dir="ltr" />
        <label>تأكيد كلمة المرور</label><input type="password" name="pw2" required minLength={10} dir="ltr" />
        <button className="btn">إنشاء حساب الإدارة</button></form></main>
  );
}
