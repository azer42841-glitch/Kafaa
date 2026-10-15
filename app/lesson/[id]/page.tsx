import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import Shell, { Flag } from '@/components/Shell';
import { q, q1 } from '@/lib/db';
import { isAdmin, studentId } from '@/lib/session';
import { levelOpen } from '@/lib/access';
import { lessonFlags } from '@/lib/countries';
import { RenderBlock } from '@/lib/blocks';
import { completeLessonAction } from '@/app/actions';
export const dynamic = 'force-dynamic';

export default async function Lesson({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ f?: string }> }) {
  const id = parseInt((await params).id, 10) || 0; const { f } = await searchParams;
  const ls = await q1(`SELECT x.*, x.reviewed_at::text AS reviewed, u.level_id, u.title_ar AS utitle, l.ord AS lord, c.slug, c.title_ar AS ctitle
    FROM lessons x JOIN units u ON u.id=x.unit_id JOIN levels l ON l.id=u.level_id JOIN courses c ON c.id=l.course_id WHERE x.id=$1 AND x.published=1 AND c.published=1`, [id]);
  if (!ls) notFound();
  const uid = await studentId();
  if (Number(ls.lord) > 1 && !(uid && (await levelOpen(uid, { id: ls.level_id, ord: ls.lord }))) && !(await isAdmin())) redirect(`/level/${ls.level_id}?f=level_closed`);
  const blocks = await q('SELECT * FROM lesson_blocks WHERE lesson_id=$1 ORDER BY ord, id', [id]);
  const done = !!(uid && (await q1('SELECT 1 FROM progress WHERE user_id=$1 AND lesson_id=$2', [uid, id])));
  const next = (await q1(`SELECT x.id FROM lessons x JOIN units u ON u.id=x.unit_id WHERE u.level_id=$1 AND x.published=1 AND (u.ord > (SELECT ord FROM units WHERE id=$2) OR (u.id=$2 AND x.ord > $3)) ORDER BY u.ord, x.ord LIMIT 1`, [ls.level_id, ls.unit_id, ls.ord]))?.id;
  const flags = (await lessonFlags()).get(id) ?? [];
  return (
    <Shell bodyClass="lessonpg" welcome back={`/lesson/${id}`} flash={f}>
      <div className="crumb"><Link href={`/course/${ls.slug}`}>{ls.ctitle}</Link> ‹ <Link href={`/level/${ls.level_id}`}>المستوى {ls.lord}</Link> ‹ {ls.utitle}</div>
      <h1>{ls.title_ar}</h1><div className="en lt" dir="ltr">{ls.title_en}</div>
      <div className="tags">{ls.standard !== '' && <i className="tag">{ls.standard}</i>}{flags.map((c) => <Flag key={c} code={c} w={20} />)}{ls.reviewed && <small className="muted">آخر مراجعة: {ls.reviewed}</small>}</div>
      {blocks.map((b) => <RenderBlock key={b.id} b={b as any} />)}
      <div className="lesson-foot">
        {uid ? <form action={completeLessonAction}><input type="hidden" name="lesson" value={id} /><button className={'btn ' + (done ? 'done' : '')} disabled={done}>{done ? '✓ أتممت هذا الدرس' : 'أتممت الدرس ✓'}</button></form>
          : <Link className="btn" href="/login">سجّل الدخول لحفظ تقدّمك</Link>}
        <Link className="btn alt" href={`/level/${ls.level_id}`}>العودة إلى الدروس</Link>
        {next && <Link className="btn" href={`/lesson/${next}`}>الدرس التالي ←</Link>}
      </div>
    </Shell>
  );
}
