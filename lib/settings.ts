import { exec, q1 } from './db';
export async function setting(k: string, d = ''): Promise<string> { const r = await q1('SELECT v FROM settings WHERE k=$1', [k]); return r ? String(r.v) : d; }
export async function settingSet(k: string, v: string) { await exec('INSERT INTO settings(k,v) VALUES($1,$2) ON CONFLICT (k) DO UPDATE SET v=EXCLUDED.v', [k, v]); }
