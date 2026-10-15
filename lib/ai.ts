import { exec, q1 } from './db';
import { setting } from './settings';
// قياس تكلفة الذكاء الاصطناعي وضبطها: كل استدعاء يمرّ على aiQuota() قبل التنفيذ ثم aiLog() بعده.
// لا يوجد هنا اتصال بأي مزوّد: هذه الطبقة تسبق ربط المزوّد كي تُقاس التكلفة من اليوم الأول.
export const AI_FEATURES: Record<string, [string, number]> = {
  tutor: ['المساعد الأكاديمي', 10], assess: ['تقييم الأعمال', 5], translate: ['الترجمة السياقية', 40],
  stt: ['تحويل الصوت إلى نص (بالدقائق)', 15], generate: ['توليد المحتوى (إدارة)', 0],
};
export const AI_DEFAULT_PRICES: Record<string, [number, number]> = { 'gpt-5-mini': [0.25, 2.0], 'claude-haiku-4-5': [1.0, 5.0], 'claude-sonnet-4-6': [3.0, 15.0], stt_per_min: [0.006, 0] };
export async function aiPrices(): Promise<Record<string, [number, number]>> {
  try { const j = JSON.parse(await setting('ai_prices', '')); return j && typeof j === 'object' && Object.keys(j).length ? j : AI_DEFAULT_PRICES; } catch { return AI_DEFAULT_PRICES; }
}
export async function aiCost(model: string, tin: number, tout: number, audioSec = 0): Promise<number> {
  const p = await aiPrices();
  if (audioSec > 0) return Math.round((audioSec / 60) * (p.stt_per_min?.[0] ?? 0.006) * 1e6) / 1e6;
  if (!p[model]) return Math.round(((tin * 3 + tout * 15) / 1e6) * 1e6) / 1e6; // نموذج غير مسعّر: أعلى سعر احتياطًا
  return Math.round(((tin * p[model][0] + tout * p[model][1]) / 1e6) * 1e6) / 1e6;
}
export const monthStart = () => new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1)).toISOString();
export const dayStart = () => new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate())).toISOString();
export async function aiMonthSpend(uid?: number): Promise<number> {
  const r = await q1(`SELECT COALESCE(SUM(cost_usd),0)::float AS s FROM ai_usage WHERE created_at >= $1${uid != null ? ' AND user_id=$2' : ''}`, uid != null ? [monthStart(), uid] : [monthStart()]);
  return Number(r?.s ?? 0);
}
export async function aiEnabled(): Promise<boolean> {
  if ((await setting('ai_master', '0')) !== '1') return false;
  const cap = Number(await setting('ai_budget_month', '50'));
  return cap <= 0 || (await aiMonthSpend()) < cap;
}
export async function aiLimit(feature: string): Promise<number> {
  const f = AI_FEATURES[feature]; if (!f) return 0;
  return Math.max(0, parseInt(await setting('ai_lim_' + feature, String(f[1])), 10) || 0);
}
// هل يُسمح لهذا الطالب بهذه الوظيفة الآن؟ [مسموح, رسالة, المتبقي اليوم]
export async function aiQuota(uid: number | null, feature: string): Promise<[boolean, string, number]> {
  if (!(await aiEnabled())) return [false, 'الخدمة الذكية متوقفة حالياً', 0];
  const lim = await aiLimit(feature);
  if (lim <= 0) return [false, 'هذه الخدمة غير متاحة حالياً', 0];
  if (uid === null) return [true, '', lim];
  const cap = Number(await setting('ai_student_cap_month', '3'));
  if (cap > 0 && (await aiMonthSpend(uid)) >= cap) return [false, 'بلغت حدّك الشهري من الخدمات الذكية، يتجدد مع بداية الشهر', 0];
  const r = await q1(`SELECT COALESCE(${feature === 'stt' ? 'CEIL(SUM(audio_sec)/60.0)' : 'COUNT(*)'},0)::int AS n FROM ai_usage WHERE user_id=$1 AND feature=$2 AND created_at >= $3`, [uid, feature, dayStart()]);
  const used = Number(r?.n ?? 0);
  return used >= lim ? [false, `استنفدت حدّك اليومي لهذه الخدمة (${lim})، جرّب غداً`, 0] : [true, '', lim - used];
}
export async function aiLog(uid: number | null, feature: string, model: string, tin: number, tout: number, audioSec = 0, ok = true): Promise<number> {
  const c = await aiCost(model, tin, tout, audioSec);
  await exec('INSERT INTO ai_usage(user_id,feature,model,tok_in,tok_out,audio_sec,cost_usd,ok) VALUES($1,$2,$3,$4,$5,$6,$7,$8)', [uid, feature, model.slice(0, 80), Math.max(0, tin), Math.max(0, tout), Math.max(0, audioSec), c, ok ? 1 : 0]);
  return c;
}
