import { cookies } from 'next/headers';
import { exec, q } from './db';
import { studentId } from './session';

export type Country = { code: string; name_ar: string; name_en: string; featured: number };
export async function countries(): Promise<Country[]> {
  return (await q('SELECT code,name_ar,name_en,featured FROM countries WHERE active=1 ORDER BY featured DESC, ord, code')) as Country[];
}
// منهج الدولة: كوكي للزائر، ويُحفظ في حساب الطالب. الاختيار الفارغ = كل المناهج.
export async function curCountry(): Promise<string> {
  const c = (await cookies()).get('ss_country')?.value;
  if (c !== undefined) return c;
  const uid = await studentId();
  if (uid) { const r = (await q('SELECT country FROM users WHERE id=$1', [uid]))[0]; return String(r?.country ?? '').trim(); }
  return '';
}
export async function setCountry(code: string) {
  const list = await countries();
  code = list.some((x) => x.code === code) ? code : '';
  (await cookies()).set('ss_country', code, { path: '/', maxAge: 365 * 86400, sameSite: 'lax', httpOnly: true, secure: process.env.NODE_ENV === 'production' });
  const uid = await studentId();
  if (uid) await exec('UPDATE users SET country=$1 WHERE id=$2', [code === '' ? null : code, uid]);
}
// شرط SQL: الدرس مشترك (بلا دول) أو مخصّص للدولة المختارة. بلا اختيار تظهر كل الدروس.
export function lessonCountrySql(alias: string, country: string, startIdx: number): [string, unknown[]] {
  if (country === '') return ['TRUE', []];
  return [`(NOT EXISTS (SELECT 1 FROM lesson_countries lc WHERE lc.lesson_id=${alias}.id) OR EXISTS (SELECT 1 FROM lesson_countries lc2 WHERE lc2.lesson_id=${alias}.id AND lc2.country=$${startIdx}))`, [country]];
}
export async function lessonFlags(): Promise<Map<number, string[]>> {
  const m = new Map<number, string[]>();
  for (const r of await q('SELECT lc.lesson_id, c.code FROM lesson_countries lc JOIN countries c ON c.code=lc.country ORDER BY c.featured DESC, c.ord')) {
    const a = m.get(Number(r.lesson_id)) ?? []; a.push(String(r.code).trim()); m.set(Number(r.lesson_id), a);
  }
  return m;
}
