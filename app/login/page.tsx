import Link from 'next/link';
import { redirect } from 'next/navigation';
import Shell from '@/components/Shell';
import AuthForm from '@/components/AuthForm';
import { loginAction } from '@/app/actions';
import { studentId } from '@/lib/session';
export const metadata = { title: 'دخول' };
export const dynamic = 'force-dynamic';
export default async function Login({ searchParams }: { searchParams: Promise<{ f?: string }> }) {
  if (await studentId()) redirect('/');
  const { f } = await searchParams;
  return (
    <Shell bodyClass="authpg" flash={f}><div className="auth"><h1>تسجيل الدخول</h1>
      <AuthForm action={loginAction} submit="دخول">
        <label>البريد الإلكتروني</label><input type="email" name="email" required autoComplete="email" dir="ltr" />
        <label>كلمة المرور</label><input type="password" name="password" required autoComplete="current-password" dir="ltr" />
      </AuthForm>
      <p className="muted">ليس لديك حساب؟ <Link href="/register">أنشئ حساباً</Link></p></div></Shell>
  );
}
