import Link from 'next/link';
import { redirect } from 'next/navigation';
import Shell, { Flag } from '@/components/Shell';
import { BlockTypeSelect, ConfirmForm } from '@/components/Client';
import { adminAction } from './actions';
import { q, q1 } from '@/lib/db';
import { requireAdmin } from '@/lib/session';
import { setting } from '@/lib/settings';
import { countries } from '@/lib/countries';
import { AI_FEATURES, aiLimit, aiPrices, dayStart, monthStart } from '@/lib/ai';
import { BLOCK_CATALOG, TEMPLATES, templateTypes } from '@/lib/blocks';
export const metadata = { title: 'الإدارة' };
export const dynamic = 'force-dynamic';

const H = ({ a, id, extra }: { a: string; id?: number | string; extra?: Record<string, string | number> }) => (
  <><input type="hidden" name="a" value={a} />{id !== undefined && <input type="hidden" name="id" value={id} />}{Object.entries(extra ?? {}).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}</>
);
const money = (n: number, d = 2) => '$' + n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });

export default async function Admin({ searchParams }: { searchParams: Promise<{ t?: string; id?: string; f?: string }> }) {
  await requireAdmin();
  const sp = await searchParams; const t = sp.t ?? 'courses'; const id = parseInt(sp.id ?? '', 10) || 0;
  const tabs: Record<string, string> = { courses: 'المساقات', students: 'الطلاب', ai: 'تكاليف الذكاء' };
  let body: React.ReactNode;

  if (t === 'ai') {
    const ms = monthStart(), day = dayStart();
    const tot = Number((await q1('SELECT COALESCE(SUM(cost_usd),0)::float AS s FROM ai_usage WHERE created_at>=$1', [ms]))!.s);
    const today = Number((await q1('SELECT COALESCE(SUM(cost_usd),0)::float AS s FROM ai_usage WHERE created_at>=$1', [day]))!.s);
    const act = Number((await q1('SELECT COUNT(DISTINCT user_id)::int AS n FROM ai_usage WHERE created_at>=$1 AND user_id IS NOT NULL', [ms]))!.n);
    const now = new Date(), dm = now.getUTCDate(), dim = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0)).getUTCDate(); const proj = dm ? (tot / dm) * dim : 0;
    const byf = await q('SELECT feature, COUNT(*)::int n, COALESCE(SUM(tok_in),0)::int ti, COALESCE(SUM(tok_out),0)::int tout, COALESCE(SUM(audio_sec),0)::int sec, COALESCE(SUM(cost_usd),0)::float c, SUM(CASE WHEN ok=0 THEN 1 ELSE 0 END)::int fails FROM ai_usage WHERE created_at>=$1 GROUP BY feature ORDER BY c DESC', [ms]);
    const top = await q('SELECT u.name, u.email, COUNT(*)::int n, SUM(a.cost_usd)::float c FROM ai_usage a JOIN users u ON u.id=a.user_id WHERE a.created_at>=$1 GROUP BY a.user_id, u.name, u.email ORDER BY c DESC LIMIT 10', [ms]);
    const prices = await aiPrices(); const budget = Number(await setting('ai_budget_month', '50')); const master = (await setting('ai_master', '0')) === '1';
    const lims = await Promise.all(Object.keys(AI_FEATURES).map(async (k) => [k, await aiLimit(k)] as const));
    body = (<>
      <h1>تكاليف الذكاء الاصطناعي</h1>
      <p className="muted">كل طلب ذكاء اصطناعي يُسجَّل بتكلفته، وتُحسب الأرقام من الأسعار المدخلة أدناه (حدّثها من لوحة المزوّد). لا يوجد مزوّد مربوط بعد، فالأرقام تبقى صفراً حتى يبدأ الاستخدام.</p>
      <div className="stats">
        <div className="stat"><b>{money(tot)}</b><span>هذا الشهر{budget > 0 ? ' من $' + budget.toFixed(0) : ''}</span></div>
        <div className="stat"><b>{money(today)}</b><span>اليوم</span></div>
        <div className="stat"><b>{money(proj)}</b><span>المتوقع نهاية الشهر</span></div>
        <div className="stat"><b>{act}</b><span>طلاب استخدموا الخدمة</span></div>
        <div className="stat"><b>{act ? money(tot / act, 3) : '$0.000'}</b><span>متوسط الطالب</span></div>
      </div>
      <div className="tbl"><table><tbody><tr><th>الوظيفة</th><th>الطلبات</th><th>إدخال</th><th>إخراج</th><th>دقائق صوت</th><th>فاشل</th><th>التكلفة</th></tr>
        {byf.map((r) => <tr key={r.feature}><td>{AI_FEATURES[r.feature]?.[0] ?? r.feature}</td><td>{r.n}</td><td>{r.ti.toLocaleString('en-US')}</td><td>{r.tout.toLocaleString('en-US')}</td><td>{Math.round((r.sec / 60) * 10) / 10}</td><td>{r.fails}</td><td dir="ltr">{money(r.c, 4)}</td></tr>)}
        {!byf.length && <tr><td colSpan={7} className="muted">لا استخدام هذا الشهر بعد</td></tr>}</tbody></table></div>
      <h2>أعلى الطلاب استهلاكاً هذا الشهر</h2>
      <div className="tbl"><table><tbody><tr><th>الطالب</th><th>البريد</th><th>الطلبات</th><th>التكلفة</th></tr>
        {top.map((r, i) => <tr key={i}><td>{r.name}</td><td dir="ltr">{r.email}</td><td>{r.n}</td><td dir="ltr">{money(r.c, 4)}</td></tr>)}
        {!top.length && <tr><td colSpan={4} className="muted">—</td></tr>}</tbody></table></div>
      <h2>الإعدادات والحدود</h2>
      <form action={adminAction} className="box"><H a="save_ai" />
        <label className="chkl"><input type="checkbox" name="master" defaultChecked={master} /> تشغيل الخدمات الذكية (مفتاح رئيسي: مطفأ افتراضياً)</label>
        <div className="grid2"><div><label>السقف الشهري العام ($) — 0 = بلا سقف</label><input type="number" step="0.01" min="0" name="budget" defaultValue={budget} dir="ltr" /></div>
          <div><label>السقف الشهري لكل طالب ($) — 0 = بلا سقف</label><input type="number" step="0.01" min="0" name="student_cap" defaultValue={await setting('ai_student_cap_month', '3')} dir="ltr" /></div></div>
        <h3>الحد اليومي لكل طالب (0 = الخدمة معطّلة)</h3>
        <div className="grid2">{lims.map(([k, v]) => <div key={k}><label>{AI_FEATURES[k][0]}</label><input type="number" min="0" max="1000" name={'lim_' + k} defaultValue={v} dir="ltr" /></div>)}</div>
        <h3>الأسعار لكل مليون رمز بالدولار (أو للدقيقة للصوت)</h3>
        {[...Object.entries(prices), ['', [0, 0] as [number, number]] as const].map(([m, pp], i) => <div className="inl" key={i}><input name="pm" defaultValue={m} placeholder="اسم النموذج" dir="ltr" /><input type="number" step="0.0001" min="0" name="pi" defaultValue={pp[0]} dir="ltr" title="إدخال" /><input type="number" step="0.0001" min="0" name="po" defaultValue={pp[1]} dir="ltr" title="إخراج" /></div>)}
        <small className="hint">آخر سطر فارغ لإضافة نموذج جديد. نموذج غير مسعّر يُحسب بأعلى سعر احتياطاً كي لا تُقدَّر التكلفة بأقل من حقيقتها.</small>
        <button className="btn sm">حفظ</button></form>
    </>);
  } else if (t === 'students') {
    const us = await q('SELECT u.id, u.name, u.email, u.created_at::text AS created_at, (SELECT COUNT(*)::int FROM progress p WHERE p.user_id=u.id) AS done FROM users u ORDER BY u.id DESC LIMIT 200');
    const lvs = await q('SELECT l.id, l.ord, l.title_ar, c.title_ar AS ct FROM levels l JOIN courses c ON c.id=l.course_id WHERE l.ord>1 ORDER BY c.ord, l.ord');
    body = (<>
      <h2>فتح مستوى لطالب</h2>
      <form action={adminAction} className="inl"><H a="grant" /><input type="email" name="email" placeholder="بريد الطالب" required dir="ltr" />
        <select name="level_id">{lvs.map((l) => <option key={l.id} value={l.id}>{`${l.ct} — المستوى ${l.ord}: ${l.title_ar}`}</option>)}</select><button className="btn sm">فتح</button></form>
      <h2>الطلاب ({us.length})</h2>
      <div className="tbl"><table><tbody><tr><th>الاسم</th><th>البريد</th><th>الدروس المتمة</th><th>التسجيل</th></tr>
        {us.map((u) => <tr key={u.id}><td>{u.name}</td><td dir="ltr">{u.email}</td><td>{u.done}</td><td dir="ltr">{u.created_at.slice(0, 19)}</td></tr>)}</tbody></table></div>
    </>);
  } else if (t === 'course') {
    const c = await q1('SELECT * FROM courses WHERE id=$1', [id]); if (!c) redirect('/admin');
    const lv = await q('SELECT * FROM levels WHERE course_id=$1 ORDER BY ord', [id]);
    const levelsX = await Promise.all(lv.map(async (l) => ({ l, units: await Promise.all((await q('SELECT * FROM units WHERE level_id=$1 ORDER BY ord', [l.id])).map(async (u) => ({ u, lessons: await q('SELECT * FROM lessons WHERE unit_id=$1 ORDER BY ord', [u.id]) }))) })));
    body = (<>
      <div className="crumb"><Link href="/admin">المساقات</Link> ‹ {c.title_ar}</div>
      <h1>{c.icon} {c.title_ar} <small>(قالب: {TEMPLATES[c.template]?.name ?? c.template})</small></h1>
      {levelsX.map(({ l, units }) => (
        <details className="box" open key={l.id}><summary><b>المستوى {l.ord}:</b> {l.title_ar} <span className="en" dir="ltr">{l.title_en}</span></summary>
          <form action={adminAction} className="grid2"><H a="save_level" id={l.id} extra={{ course_id: id }} />
            <input name="title_ar" defaultValue={l.title_ar} placeholder="العنوان بالعربية" required /><input name="title_en" defaultValue={l.title_en} placeholder="Title" dir="ltr" required />
            <input name="description_ar" defaultValue={l.description_ar} placeholder="الوصف" className="full" /><button className="btn sm">حفظ المستوى</button></form>
          {units.map(({ u, lessons }) => (
            <div className="unit-a" key={u.id}><b>الوحدة {u.ord}: {u.title_ar}</b>
              <ConfirmForm action={adminAction} className="delf" confirm="حذف الوحدة وكل دروسها؟"><H a="del_unit" id={u.id} /><button className="lnk bad">حذف</button></ConfirmForm>
              {lessons.map((x) => <Link className="lrow sm" key={x.id} href={`/admin?t=lesson&id=${x.id}`}><span className="chk">{x.ord}</span><span>{x.title_ar} <small>{x.published ? '✅ منشور' : '📝 مسودة'}</small></span></Link>)}
              <form action={adminAction} className="inl"><H a="add_lesson" extra={{ unit_id: u.id }} /><input name="title_ar" placeholder="عنوان درس جديد" required /><input name="title_en" placeholder="Lesson title" dir="ltr" required /><button className="btn sm">+ درس</button></form>
            </div>))}
          <form action={adminAction} className="inl"><H a="save_unit" extra={{ level_id: l.id }} /><input name="title_ar" placeholder="وحدة جديدة" required /><input name="title_en" placeholder="Unit title" dir="ltr" required /><button className="btn sm alt">+ وحدة</button></form>
          <ConfirmForm action={adminAction} className="delf" confirm="حذف المستوى بكل محتواه؟"><H a="del_level" id={l.id} /><button className="lnk bad">حذف المستوى</button></ConfirmForm>
        </details>))}
      <h3>مستوى جديد</h3>
      <form action={adminAction} className="grid2"><H a="save_level" extra={{ course_id: id }} /><input name="title_ar" placeholder="العنوان بالعربية" required /><input name="title_en" placeholder="Title" dir="ltr" required /><input name="description_ar" placeholder="الوصف" className="full" /><button className="btn sm">+ مستوى</button></form>
    </>);
  } else if (t === 'lesson') {
    const x = await q1('SELECT x.*, x.reviewed_at::text AS reviewed, c.template, c.id AS cid, c.title_ar AS ct FROM lessons x JOIN units u ON u.id=x.unit_id JOIN levels l ON l.id=u.level_id JOIN courses c ON c.id=l.course_id WHERE x.id=$1', [id]); if (!x) redirect('/admin');
    const allowed = templateTypes(x.template); const opts = allowed.map((ty) => [ty, `${BLOCK_CATALOG[ty][0]} ${BLOCK_CATALOG[ty][1]}`, BLOCK_CATALOG[ty][2]] as [string, string, string]);
    const blocks = await q('SELECT * FROM lesson_blocks WHERE lesson_id=$1 ORDER BY ord, id', [id]);
    const sel = new Set((await q('SELECT country FROM lesson_countries WHERE lesson_id=$1', [id])).map((r) => String(r.country).trim())); const cs = await countries();
    body = (<>
      <div className="crumb"><Link href={`/admin?t=course&id=${x.cid}`}>{x.ct}</Link> ‹ تحرير الدرس</div>
      <form action={adminAction} className="box grid2"><H a="save_lesson" id={id} />
        <input name="title_ar" defaultValue={x.title_ar} required /><input name="title_en" defaultValue={x.title_en} dir="ltr" required />
        <div className="full"><b>الدول التي يخصها هذا الدرس</b> <small className="hint">(لا تختر شيئاً = درس مشترك لكل الدول)</small>
          <div className="inl">{cs.map((cn) => <label className="chkl" key={cn.code}><input type="checkbox" name="lc" value={cn.code.trim()} defaultChecked={sel.has(cn.code.trim())} /> <Flag code={cn.code} w={22} /> {cn.name_ar}</label>)}</div></div>
        <input name="standard" defaultValue={x.standard} placeholder="المعيار (IFRS / EAS / عام…)" maxLength={20} dir="ltr" /><input type="date" name="reviewed_at" defaultValue={x.reviewed ?? ''} title="تاريخ آخر مراجعة" />
        <label className="chkl"><input type="checkbox" name="published" defaultChecked={!!x.published} /> منشور للطلاب</label><button className="btn sm">حفظ</button></form>
      {!!x.published && <Link className="lnk" href={`/lesson/${id}`} target="_blank">معاينة الدرس ↗</Link>}
      <h2>أقسام الدرس</h2>
      {blocks.map((b) => (<div key={b.id}>
        <form action={adminAction} className="box blk-ed"><H a="save_block" id={b.id} extra={{ lesson_id: id }} />
          <div className="row"><select name="type" defaultValue={b.type}>{opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
            <input name="title" defaultValue={b.title} placeholder="عنوان (اختياري)" /><input type="number" name="ord" defaultValue={b.ord} className="ord" title="الترتيب" /></div>
          <textarea name="body" rows={7} dir="auto" defaultValue={b.body} /><small className="hint">{BLOCK_CATALOG[b.type]?.[2] ?? ''}</small>
          <div className="row"><button className="btn sm">حفظ القسم</button></div></form>
        <ConfirmForm action={adminAction} className="delf" confirm="حذف هذا القسم؟"><H a="del_block" id={b.id} /><button className="lnk bad">حذف القسم أعلاه</button></ConfirmForm></div>))}
      <h3>قسم جديد</h3>
      <form action={adminAction} className="box blk-ed"><H a="save_block" extra={{ lesson_id: id }} />
        <div className="row"><BlockTypeSelect options={opts} /><input name="title" placeholder="عنوان (اختياري)" /></div>
        <textarea name="body" rows={7} dir="auto" required /><div className="row"><button className="btn sm">+ إضافة القسم</button></div></form>
    </>);
  } else {
    const cs = await q('SELECT * FROM courses ORDER BY ord, id');
    const tplOpts = Object.entries(TEMPLATES);
    body = (<>
      <h2>المساقات</h2>
      {cs.map((c) => (
        <details className="box" key={c.id}><summary>{c.icon} {c.title_ar} <span className="en" dir="ltr">{c.title_en}</span> <small>{c.published ? '✅' : '🚫 مخفي'}</small></summary>
          <Link className="btn sm" href={`/admin?t=course&id=${c.id}`}>المستويات والدروس ←</Link>
          <form action={adminAction} className="grid2"><H a="save_course" id={c.id} />
            <input name="title_ar" defaultValue={c.title_ar} required /><input name="title_en" defaultValue={c.title_en} dir="ltr" required />
            <input name="slug" defaultValue={c.slug} dir="ltr" required /><input name="icon" defaultValue={c.icon} maxLength={8} />
            <select name="template" defaultValue={c.template}>{tplOpts.map(([k, tp]) => <option key={k} value={k}>قالب: {tp.name}</option>)}</select><input type="number" name="ord" defaultValue={c.ord} />
            <input name="description_ar" defaultValue={c.description_ar} className="full" /><label className="chkl"><input type="checkbox" name="published" defaultChecked={!!c.published} /> منشور</label><button className="btn sm">حفظ</button></form>
          <ConfirmForm action={adminAction} className="delf" confirm="حذف المساق بكل محتواه؟ لا يمكن التراجع."><H a="del_course" id={c.id} /><button className="lnk bad">حذف المساق</button></ConfirmForm>
        </details>))}
      <h3>مساق جديد</h3>
      <form action={adminAction} className="grid2 box"><H a="save_course" />
        <input name="title_ar" placeholder="الاسم بالعربية" required /><input name="title_en" placeholder="Course title" dir="ltr" required /><input name="slug" placeholder="slug-latin" dir="ltr" required /><input name="icon" placeholder="🎓" maxLength={8} />
        <select name="template">{tplOpts.map(([k, tp]) => <option key={k} value={k}>قالب: {tp.name}</option>)}</select><input type="number" name="ord" defaultValue={9} />
        <input name="description_ar" placeholder="وصف قصير" className="full" /><label className="chkl"><input type="checkbox" name="published" defaultChecked /> منشور</label><button className="btn sm">+ إضافة</button></form>
    </>);
  }
  return (
    <Shell bodyClass="adm" flash={sp.f}>
      <div className="admtabs">{Object.entries(tabs).map(([k, l]) => <Link key={k} className={t === k || (k === 'courses' && (t === 'course' || t === 'lesson')) ? 'on' : ''} href={`/admin?t=${k}`}>{l}</Link>)}<a href="/logout">خروج</a></div>
      {body}
    </Shell>
  );
}
