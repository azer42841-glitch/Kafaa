import { q1 } from './db';
// المستوى الأول من كل مساق مفتوح، وبقية المستويات تُفتح بمنح من الإدارة
export async function levelOpen(uid: number, lvl: { id: number; ord: number }): Promise<boolean> {
  if (Number(lvl.ord) === 1) return true;
  return !!(await q1('SELECT 1 FROM level_access WHERE user_id=$1 AND level_id=$2', [uid, lvl.id]));
}
