import Link from 'next/link';
import { redirect } from 'next/navigation';
import Shell from '@/components/Shell';
import AuthForm from '@/components/AuthForm';
import { registerAction } from '@/app/actions';
import { studentId } from '@/lib/session';
export const metadata = { title: 'حساب جديد' };
export const dynamic = 'force-dynamic';
export default async function Register() {
  if (await studentId()) redirect('/');
  return (
    <Shell bodyClass="authpg"><div className="auth"><h1>إنشاء حساب</h1>
      <AuthForm action={registerAction} submit="إنشاء الحساب">
        <label>الاسم</label><input name="name" required maxLength={80} autoComplete="name" />
        <label>البريد الإلكتروني</label><input type="email" name="email" required dir="ltr" autoComplete="email" />
        <label>كلمة المرور (8 أحرف على الأقل)</label><input type="password" name="password" required minLength={8} dir="ltr" autoComplete="new-password" />
        <label>تأكيد كلمة المرور</label><input type="password" name="password2" required minLength={8} dir="ltr" autoComplete="new-password" />
      </AuthForm>
      <p className="muted">لديك حساب؟ <Link href="/login">سجّل الدخول</Link></p></div></Shell>
  );
}
