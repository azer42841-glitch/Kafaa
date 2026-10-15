'use server';
import { redirect } from 'next/navigation';
import { exec, q, q1 } from '@/lib/db';
import { audit, clamp, FLASH } from '@/lib/util';
import { requireAdmin } from '@/lib/session';
import { settingSet } from '@/lib/settings';
import { countries } from '@/lib/countries';
import { AI_FEATURES } from '@/lib/ai';
import { BLOCK_CATALOG, TEMPLATES } from '@/lib/blocks';

const int = (v: unknown) => parseInt(String(v ?? ''), 10) || 0;
const num = (v: unknown) => { const n = parseFloat(String(v ?? '')); return Number.isFinite(n) ? n : 0; };
function go(f: keyof typeof FLASH | '', t: string, id = 0): never { redirect(`/admin?t=${t}${id ? `&id=${id}` : ''}${f ? `&f=${f}` : ''}`); }

export async function adminAction(fd: FormData) {
  await requireAdmin();
  const a = String(fd.get('a') ?? ''), pid = int(fd.get('id'));
  const s = (k: string, max: number) => clamp(fd.get(k), max);
  switch (a) {
    case 'save_course': {
      const slug = s('slug', 40).replace(/[^a-z0-9-]/gi, '').toLowerCase(); const tpl = s('template', 30) in TEMPLATES ? s('template', 30) : 'general';
      if (!slug || !s('title_ar', 120) || !s('title_en', 120)) go('fields', 'courses');
      const v = [slug, s('title_en', 120), s('title_ar', 120), s('description_ar', 500), s('icon', 16) || '📘', tpl, int(fd.get('ord')), fd.has('published') ? 1 : 0];
      try {
        if (pid) await exec('UPDATE courses SET slug=$1,title_en=$2,title_ar=$3,description_ar=$4,icon=$5,template=$6,ord=$7,published=$8 WHERE id=$9', [...v, pid]);
        else await exec('INSERT INTO courses(slug,title_en,title_ar,description_ar,icon,template,ord,published) VALUES($1,$2,$3,$4,$5,$6,$7,$8)', v);
      } catch { go('slug_dup', 'courses'); }
      await audit('admin', 'save_course', slug); go('course_saved', 'courses');
    }
    case 'del_course': await exec('DELETE FROM courses WHERE id=$1', [pid]); await audit('admin', 'del_course', String(pid)); go('course_deleted', 'courses');
    case 'save_level': {
      const cid = int(fd.get('course_id'));
      if (pid) await exec('UPDATE levels SET title_en=$1,title_ar=$2,description_ar=$3 WHERE id=$4', [s('title_en', 120), s('title_ar', 120), s('description_ar', 500), pid]);
      else { const o = Number((await q1('SELECT COALESCE(MAX(ord),0)+1 AS o FROM levels WHERE course_id=$1', [cid]))!.o); await exec('INSERT INTO levels(course_id,ord,title_en,title_ar,description_ar) VALUES($1,$2,$3,$4,$5)', [cid, o, s('title_en', 120), s('title_ar', 120), s('description_ar', 500)]); }
      go('level_saved', 'course', cid);
    }
    case 'del_level': { const cid = Number((await q1('SELECT course_id FROM levels WHERE id=$1', [pid]))?.course_id ?? 0); await exec('DELETE FROM levels WHERE id=$1', [pid]); go('level_deleted', 'course', cid); }
    case 'save_unit': {
      const lid = int(fd.get('level_id')); const cid = Number((await q1('SELECT course_id FROM levels WHERE id=$1', [lid]))?.course_id ?? 0);
      const o = Number((await q1('SELECT COALESCE(MAX(ord),0)+1 AS o FROM units WHERE level_id=$1', [lid]))!.o);
      await exec('INSERT INTO units(level_id,ord,title_en,title_ar) VALUES($1,$2,$3,$4)', [lid, o, s('title_en', 120), s('title_ar', 120)]); go('unit_added', 'course', cid);
    }
    case 'del_unit': { const cid = Number((await q1('SELECT l.course_id FROM units u JOIN levels l ON l.id=u.level_id WHERE u.id=$1', [pid]))?.course_id ?? 0); await exec('DELETE FROM units WHERE id=$1', [pid]); go('unit_deleted', 'course', cid); }
    case 'add_lesson': {
      const uid = int(fd.get('unit_id')); const o = Number((await q1('SELECT COALESCE(MAX(ord),0)+1 AS o FROM lessons WHERE unit_id=$1', [uid]))!.o);
      const r = await q1('INSERT INTO lessons(unit_id,ord,title_en,title_ar) VALUES($1,$2,$3,$4) RETURNING id', [uid, o, s('title_en', 160), s('title_ar', 160)]); go('lesson_added', 'lesson', r!.id);
    }
    case 'save_lesson': {
      const rv = /^\d{4}-\d{2}-\d{2}$/.test(s('reviewed_at', 10)) ? s('reviewed_at', 10) : null;
      await exec('UPDATE lessons SET title_en=$1,title_ar=$2,published=$3,standard=$4,reviewed_at=$5 WHERE id=$6', [s('title_en', 160), s('title_ar', 160), fd.has('published') ? 1 : 0, s('standard', 20), rv, pid]);
      await exec('DELETE FROM lesson_countries WHERE lesson_id=$1', [pid]);
      const valid = new Set((await countries()).map((c) => c.code.trim()));
      for (const cc of fd.getAll('lc').map(String)) if (valid.has(cc)) await exec('INSERT INTO lesson_countries(lesson_id,country) VALUES($1,$2) ON CONFLICT DO NOTHING', [pid, cc]);
      go('lesson_saved', 'lesson', pid);
    }
    case 'del_lesson': { const cid = Number((await q1('SELECT l.course_id FROM lessons x JOIN units u ON u.id=x.unit_id JOIN levels l ON l.id=u.level_id WHERE x.id=$1', [pid]))?.course_id ?? 0); await exec('DELETE FROM lessons WHERE id=$1', [pid]); go('lesson_deleted', 'course', cid); }
    case 'save_block': {
      const lid = int(fd.get('lesson_id')), type = s('type', 20);
      if (!BLOCK_CATALOG[type]) go('block_type', 'lesson', lid);
      const body = String(fd.get('body') ?? '').replace(/\r\n/g, '\n').slice(0, 60000);
      if (pid) await exec('UPDATE lesson_blocks SET type=$1,title=$2,body=$3,ord=$4 WHERE id=$5 AND lesson_id=$6', [type, s('title', 160), body, int(fd.get('ord')), pid, lid]);
      else { const o = Number((await q1('SELECT COALESCE(MAX(ord),0)+1 AS o FROM lesson_blocks WHERE lesson_id=$1', [lid]))!.o); await exec('INSERT INTO lesson_blocks(lesson_id,ord,type,title,body) VALUES($1,$2,$3,$4,$5)', [lid, o, type, s('title', 160), body]); }
      go('block_saved', 'lesson', lid);
    }
    case 'del_block': { const lid = Number((await q1('SELECT lesson_id FROM lesson_blocks WHERE id=$1', [pid]))?.lesson_id ?? 0); await exec('DELETE FROM lesson_blocks WHERE id=$1', [pid]); go('block_deleted', 'lesson', lid); }
    case 'save_ai': {
      await settingSet('ai_master', fd.has('master') ? '1' : '0');
      await settingSet('ai_budget_month', String(Math.max(0, Math.round(num(fd.get('budget')) * 100) / 100)));
      await settingSet('ai_student_cap_month', String(Math.max(0, Math.round(num(fd.get('student_cap')) * 100) / 100)));
      for (const f of Object.keys(AI_FEATURES)) await settingSet('ai_lim_' + f, String(Math.max(0, Math.min(1000, int(fd.get('lim_' + f))))));
      const pm = fd.getAll('pm').map(String), pi = fd.getAll('pi'), po = fd.getAll('po'), pr: Record<string, [number, number]> = {};
      pm.forEach((m, i) => { m = m.replace(/[^A-Za-z0-9._-]/g, ''); if (m) pr[m] = [Math.max(0, num(pi[i])), Math.max(0, num(po[i]))]; });
      if (Object.keys(pr).length) await settingSet('ai_prices', JSON.stringify(pr));
      await audit('admin', 'save_ai', 'master=' + (fd.has('master') ? 1 : 0)); go('ai_saved', 'ai');
    }
    case 'grant': {
      const em = s('email', 190).toLowerCase(), lvid = int(fd.get('level_id'));
      const u = await q1('SELECT id FROM users WHERE email=$1', [em]);
      if (!u || !(await q1('SELECT 1 FROM levels WHERE id=$1', [lvid]))) go('grant_bad', 'students');
      await exec('INSERT INTO level_access(user_id,level_id) VALUES($1,$2) ON CONFLICT DO NOTHING', [u!.id, lvid]); await audit('admin', 'grant_level', `${u!.id}:${lvid}`); go('granted', 'students');
    }
  }
  go('', 'courses');
}
