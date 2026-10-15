import { headers } from 'next/headers';
import { exec, q1 } from './db';

export const SITE_NAME = 'سلاسة';
export const SITE_NAME_EN = 'Salasa Knowledge Platform';
export const SESSION_IDLE_ADMIN = 1800;

export async function clientIp(): Promise<string> {
  const h = await headers();
  return (h.get('x-forwarded-for')?.split(',')[0] || h.get('x-real-ip') || '0.0.0.0').trim();
}
export async function audit(actor: string, action: string, detail = '') {
  await exec('INSERT INTO audit_log(actor,action,detail) VALUES($1,$2,$3)', [actor.slice(0, 80), action.slice(0, 80), detail.slice(0, 300)]);
}
// تحديد المعدل: عدد المحاولات خلال نافذة زمنية
export async function rateCount(k: string, win: number): Promise<number> {
  const r = await q1('SELECT COUNT(*)::int AS n FROM rate_events WHERE k=$1 AND at>$2', [k, Math.floor(Date.now() / 1000) - win]);
  return Number(r?.n ?? 0);
}
export async function rateHit(k: string) {
  const now = Math.floor(Date.now() / 1000);
  await exec('INSERT INTO rate_events(k,at) VALUES($1,$2)', [k, now]);
  if (Math.random() < 0.02) await exec('DELETE FROM rate_events WHERE at<$1', [now - 172800]);
}
// رسائل التنبيه تُمرَّر برمز قصير في الرابط (لا نصوص حرة، منعًا لانتحال الرسائل)
export const FLASH: Record<string, [string, string]> = {
  login_required: ['err', 'سجّل الدخول أولاً'],
  lesson_done: ['ok', 'تم تسجيل إتمام الدرس ✓'],
  welcome: ['ok', 'أهلاً بك في منصة سلاسة المعرفية 🎓'],
  level_closed: ['err', 'هذا المستوى مغلق'],
  fields: ['err', 'أكمل الحقول المطلوبة'],
  slug_dup: ['err', 'المعرّف (slug) مستخدم مسبقاً'],
  course_saved: ['ok', 'تم حفظ المساق'], course_deleted: ['ok', 'حُذف المساق'],
  level_saved: ['ok', 'تم حفظ المستوى'], level_deleted: ['ok', 'حُذف المستوى'],
  unit_added: ['ok', 'أُضيفت الوحدة'], unit_deleted: ['ok', 'حُذفت الوحدة'],
  lesson_added: ['ok', 'أُضيف الدرس (غير منشور)'], lesson_saved: ['ok', 'تم حفظ الدرس'], lesson_deleted: ['ok', 'حُذف الدرس'],
  block_saved: ['ok', 'تم حفظ القسم'], block_deleted: ['ok', 'حُذف القسم'], block_type: ['err', 'نوع غير معروف'],
  ai_saved: ['ok', 'تم حفظ إعدادات الذكاء الاصطناعي'],
  granted: ['ok', 'تم فتح المستوى للطالب'], grant_bad: ['err', 'الطالب أو المستوى غير موجود'],
};
export function clamp(s: unknown, max: number): string { return String(s ?? '').trim().slice(0, max); }
