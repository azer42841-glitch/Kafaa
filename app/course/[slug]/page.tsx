import Link from 'next/link';
import { notFound } from 'next/navigation';
import Shell from '@/components/Shell';
import { q, q1 } from '@/lib/db';
import { studentId } from '@/lib/session';
import { levelOpen } from '@/lib/access';
export const dynamic = 'force-dynamic';

export default async function Course({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = await q1('SELECT * FROM courses WHERE slug=$1 AND published=1', [slug]); if (!c) notFound();
  const levels = await q('SELECT l.*, (SELECT COUNT(*)::int FROM lessons x JOIN units u ON u.id=x.unit_id WHERE u.level_id=l.id AND x.published=1) AS nl FROM levels l WHERE course_id=$1 ORDER BY ord', [c.id]);
  const uid = await studentId();
  const opens = await Promise.all(levels.map((l) => (uid ? levelOpen(uid, l as any) : Promise.resolve(Number(l.ord) === 1))));
  return (
    <Shell welcome back={`/course/${slug}`}>
      <div className="crumb"><Link href="/">الرئيسية</Link> ‹ {c.title_ar}</div>
      <div className="course-head"><div className="ico big">{c.icon}</div><div><h1>{c.title_ar}</h1><div className="en" dir="ltr">{c.title_en}</div><p>{c.description_ar}</p></div></div>
      <h2 className="sec-h">المستويات</h2>
      <div className="levels">
        {levels.map((l, i) => (
          <Link key={l.id} className={'card level ' + (opens[i] ? '' : 'locked')} href={`/level/${l.id}`}>
            <div className="num">المستوى {l.ord}</div><h3>{l.title_ar}</h3><div className="en" dir="ltr">{l.title_en}</div><p>{l.description_ar}</p>
            <small>{opens[i] ? `${l.nl} درساً منشوراً` : '🔒 يُفتح بعد إتمام المستوى السابق أو بموافقة الإدارة'}</small>
          </Link>
        ))}
      </div>
    </Shell>
  );
}
