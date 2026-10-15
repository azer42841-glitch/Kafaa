import Link from 'next/link';
import { notFound } from 'next/navigation';
import Shell, { Flag } from '@/components/Shell';
import { q, q1 } from '@/lib/db';
import { studentId } from '@/lib/session';
import { levelOpen } from '@/lib/access';
import { curCountry, lessonCountrySql, lessonFlags } from '@/lib/countries';
export const dynamic = 'force-dynamic';

export default async function Level({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ f?: string }> }) {
  const id = parseInt((await params).id, 10) || 0; const { f } = await searchParams;
  const lv = await q1('SELECT l.*, c.slug, c.title_ar AS ctitle FROM levels l JOIN courses c ON c.id=l.course_id WHERE l.id=$1 AND c.published=1', [id]); if (!lv) notFound();
  const uid = await studentId(); const open = Number(lv.ord) === 1 || (!!uid && (await levelOpen(uid, lv as any)));
  const units = open ? await q('SELECT * FROM units WHERE level_id=$1 ORDER BY ord', [lv.id]) : [];
  const done = new Set<number>(uid ? (await q('SELECT lesson_id FROM progress WHERE user_id=$1', [uid])).map((r) => Number(r.lesson_id)) : []);
  const [cw, cp] = lessonCountrySql('lessons', await curCountry(), 2); const flags = await lessonFlags();
  const lessonsBy = new Map<number, any[]>();
  for (const u of units) lessonsBy.set(u.id, await q(`SELECT * FROM lessons WHERE unit_id=$1 AND published=1 AND ${cw} ORDER BY ord`, [u.id, ...cp]));
  return (
    <Shell welcome back={`/level/${id}`} flash={f}>
      <div className="crumb"><Link href="/">الرئيسية</Link> ‹ <Link href={`/course/${lv.slug}`}>{lv.ctitle}</Link> ‹ المستوى {lv.ord}</div>
      <h1>{lv.title_ar}</h1><div className="en" dir="ltr">{lv.title_en}</div>
      {!open ? <div className="box lock-box">🔒 هذا المستوى مغلق. يُفتح بعد إتمام المستوى السابق أو بموافقة الإدارة.</div> :
        units.map((u) => { const lessons = lessonsBy.get(u.id)!; return (
          <div className="unit" key={u.id}><h2>الوحدة {u.ord}: {u.title_ar} <small className="en" dir="ltr">{u.title_en}</small></h2>
            {lessons.map((x) => (
              <Link className="lrow" key={x.id} href={`/lesson/${x.id}`}><span className="chk">{done.has(Number(x.id)) ? '✓' : x.ord}</span>
                <span>{x.title_ar}<small className="en" dir="ltr">{x.title_en}</small></span>
                <span className="tags">{x.standard !== '' && <i className="tag">{x.standard}</i>}{(flags.get(Number(x.id)) ?? []).map((c) => <Flag key={c} code={c} w={20} />)}</span></Link>
            ))}
            {!lessons.length && <p className="muted">لا توجد دروس منشورة في هذه الوحدة بعد.</p>}
          </div>); })}
    </Shell>
  );
}
