import Shell from '@/components/Shell';
import { q1 } from '@/lib/db';
import { curUser, requireStudent } from '@/lib/session';
export const metadata = { title: 'حسابي' };
export const dynamic = 'force-dynamic';
export default async function Account() {
  await requireStudent(); const u = (await curUser())!;
  const done = Number((await q1('SELECT COUNT(*)::int AS n FROM progress WHERE user_id=$1', [u.id]))?.n ?? 0);
  return (<Shell><h1>حسابي</h1><div className="box"><p><b>الاسم:</b> {u.name}</p><p><b>البريد:</b> <span dir="ltr">{u.email}</span></p><p><b>الدروس المُتمَّة:</b> {done}</p></div></Shell>);
}
