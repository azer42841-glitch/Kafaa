import React from 'react';

// أنواع أقسام الدرس. كل مساق يختار «قالباً» يحدد الأنواع المتاحة له في محرر الإدارة.
export const BLOCK_CATALOG: Record<string, [string, string, string]> = {
  objectives: ['🎯', 'الأهداف', 'سطر لكل هدف'],
  explain: ['📖', 'الشرح', 'فقرات يفصل بينها سطر فارغ. اكتب بالإنجليزية، ويمكن إضافة ترجمة بعد علامة ||| في آخر الفقرة'],
  terms: ['🔤', 'المصطلحات', 'سطر لكل مصطلح بالشكل: Term | المعنى بالعربية'],
  example: ['💡', 'مثال', 'فقرات يفصل بينها سطر فارغ'],
  exercise: ['✏️', 'تمرين', 'سطر لكل سؤال بالشكل: السؤال || الجواب (يظهر الجواب بالضغط)'],
  quiz: ['✅', 'اختبار', 'سطر لكل سؤال: السؤال || خيار1 | خيار2* | خيار3 (النجمة تلحق الصحيح)'],
  entry: ['🧾', 'قيد محاسبي', 'سطر لكل حساب: اسم الحساب | مدين | دائن (اترك الخانة فارغة عند عدم وجود قيمة)'],
  case: ['🏢', 'حالة دراسية', 'فقرات يفصل بينها سطر فارغ'],
  framework: ['🧭', 'نموذج / إطار', 'سطر لكل عنصر بالشكل: العنصر | شرحه'],
  text: ['📜', 'النص الأدبي', 'النص الأصلي (من الملك العام أو مقتطف قصير)، فقرات يفصل بينها سطر فارغ'],
  analysis: ['🔍', 'التحليل', 'فقرات يفصل بينها سطر فارغ'],
};
const BASE = ['objectives', 'explain', 'terms', 'example', 'exercise', 'quiz'];
export const TEMPLATES: Record<string, { name: string; types: string[] }> = {
  general: { name: 'عام', types: BASE },
  accounting: { name: 'المحاسبة', types: [...BASE, 'entry'] },
  business: { name: 'إدارة الأعمال', types: [...BASE, 'case', 'framework'] },
  literature: { name: 'الأدب الإنجليزي', types: [...BASE, 'text', 'analysis'] },
};
export const templateTypes = (t: string) => (TEMPLATES[t] ?? TEMPLATES.general).types;

const lines = (body: string) => body.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
const split2 = (s: string, sep: string): [string, string] => { const i = s.indexOf(sep); return i < 0 ? [s.trim(), ''] : [s.slice(0, i).trim(), s.slice(i + sep.length).trim()]; };
function Multi({ text }: { text: string }) { return <>{text.split('\n').map((l, i) => <React.Fragment key={i}>{i > 0 && <br />}{l}</React.Fragment>)}</>; }

function Paras({ body }: { body: string }) {
  return <>{body.trim().split(/(?:\r?\n){2,}/).map((p) => p.trim()).filter(Boolean).map((p, i) => {
    let ar = ''; if (p.includes('|||')) [p, ar] = split2(p, '|||');
    return <React.Fragment key={i}><p className="en" dir="ltr"><Multi text={p} /></p>{ar !== '' && <p className="ar-tr"><Multi text={ar} /></p>}</React.Fragment>;
  })}</>;
}

export function RenderBlock({ b }: { b: { type: string; title: string; body: string } }) {
  const cat = BLOCK_CATALOG[b.type]; if (!cat) return null;
  const [ico, label] = cat; const title = b.title !== '' ? b.title : label; const body = String(b.body);
  let inner: React.ReactNode;
  switch (b.type) {
    case 'objectives': inner = <ul className="obj">{lines(body).map((l, i) => <li key={i} dir="auto">{l}</li>)}</ul>; break;
    case 'terms': inner = <table className="terms"><tbody><tr><th>Term</th><th>المعنى</th></tr>{lines(body).map((l, i) => { const [a, c] = split2(l, '|'); return <tr key={i}><td className="en" dir="ltr">{a}</td><td>{c}</td></tr>; })}</tbody></table>; break;
    case 'exercise': inner = <>{lines(body).map((l, i) => { const [a, c] = split2(l, '||'); return <details className="ex" key={i}><summary dir="auto">{i + 1}. {a}</summary><div className="ex-a" dir="auto">{c || '—'}</div></details>; })}</>; break;
    case 'quiz': inner = <>{lines(body).map((l, i) => {
      const [a, rest] = split2(l, '||'); const opts = rest.split('|').map((o) => o.trim());
      return <div className="q" data-q key={i}><div className="q-t" dir="auto">{i + 1}. {a}</div><div className="q-o">{opts.map((o, j) => { const ok = o.endsWith('*'); return <button type="button" className="qo" data-ok={ok ? 1 : 0} dir="auto" key={j}>{ok ? o.replace(/\*+$/, '') : o}</button>; })}</div></div>;
    })}<div className="q-res" data-qres /></>; break;
    case 'entry': inner = <table className="entry"><tbody><tr><th>الحساب</th><th>مدين</th><th>دائن</th></tr>{lines(body).map((l, i) => { const p = l.split('|').map((x) => x.trim()); return <tr key={i}><td dir="auto">{p[0]}</td><td className="num">{p[1] ?? ''}</td><td className="num">{p[2] ?? ''}</td></tr>; })}</tbody></table>; break;
    case 'framework': inner = <div className="fw">{lines(body).map((l, i) => { const [a, c] = split2(l, '|'); return <div className="fw-i" key={i}><b dir="auto">{a}</b><span dir="auto">{c}</span></div>; })}</div>; break;
    default: inner = <Paras body={body} />;
  }
  return <section className={`blk blk-${b.type}`}><h3>{ico} {title}</h3>{inner}</section>;
}
