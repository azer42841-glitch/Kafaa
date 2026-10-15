import { redirect } from 'next/navigation';
import Shell from '@/components/Shell';
import AuthForm from '@/components/AuthForm';
import { adminLoginAction } from '@/app/actions';
import { isAdmin } from '@/lib/session';
import { setting } from '@/lib/settings';
export const metadata = { title: 'دخول الإدارة' };
export const dynamic = 'force-dynamic';
export default async function AdminLogin() {
  if (await isAdmin()) redirect('/admin');
  const ready = (await setting('admin_hash')) !== '';
  return (
    <Shell bodyClass="authpg"><div className="auth"><h1>دخول الإدارة</h1>
      {!ready ? <div className="flash err">لم يكتمل التثبيت بعد: افتح /install لإنشاء حساب الإدارة.</div> :
        <AuthForm action={adminLoginAction} submit="دخول"><label>اسم المستخدم</label><input name="user" required dir="ltr" autoComplete="username" />
          <label>كلمة المرور</label><input type="password" name="pw" required dir="ltr" autoComplete="current-password" /></AuthForm>}</div></Shell>
  );
}
