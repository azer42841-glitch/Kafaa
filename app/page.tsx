import Link from 'next/link';
import Shell from '@/components/Shell';
import { q } from '@/lib/db';
export const dynamic = 'force-dynamic';

export default async function Home({ searchParams }: { searchParams: Promise<{ f?: string }> }) {
  const { f } = await searchParams;
  const courses = await q('SELECT c.*, (SELECT COUNT(*)::int FROM levels l WHERE l.course_id=c.id) AS nl FROM courses c WHERE published=1 ORDER BY ord, id');
  return (
    <Shell bodyClass="home" flash={f} welcome back="/">
      <section className="hero">
        <h1>تعلّم تخصصك <span>بالإنجليزية</span></h1>
        <p>مساقات أكاديمية ومهنية متدرجة المستويات: تتقن فيها المادة العلمية ومصطلحاتها الإنجليزية معاً، بشرح واضح وتمارين وقيود محلولة واختبارات.</p>
        <a className="btn" href="#courses">استعرض المساقات</a>
      </section>
      <h2 id="courses" className="sec-h">المساقات</h2>
      <div className="cards">
        {courses.map((c) => (
          <Link key={c.id} className="card course" href={`/course/${c.slug}`}>
            <div className="ico">{c.icon}</div><h3>{c.title_ar}</h3><div className="en" dir="ltr">{c.title_en}</div>
            <p>{c.description_ar}</p><small>{c.nl} مستويات</small>
          </Link>
        ))}
        {!courses.length && <p className="muted">لا توجد مساقات منشورة بعد.</p>}
      </div>
    </Shell>
  );
}
