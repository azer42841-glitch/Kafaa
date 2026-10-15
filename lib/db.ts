// طبقة قاعدة البيانات: Postgres عبر Neon على Vercel (DATABASE_URL)، وPGlite محلي للتطوير بلا إعداد.
type Row = Record<string, any>;
type Runner = (text: string, params?: unknown[]) => Promise<Row[]>;

let runner: Runner | null = null;
async function getRunner(): Promise<Runner> {
  if (runner) return runner;
  const url = process.env.DATABASE_URL;
  if (url) {
    const { Pool } = await import('@neondatabase/serverless');
    const pool = new Pool({ connectionString: url });
    runner = async (t, p) => (await pool.query(t, p as any[])).rows;
  } else {
    if (process.env.VERCEL) throw new Error('DATABASE_URL غير مضبوط');
    const { PGlite } = await import('@electric-sql/pglite');
    const g = globalThis as any;
    g.__pglite ??= new PGlite(process.env.PGLITE_DIR || '.pglite');
    const db = g.__pglite as InstanceType<typeof PGlite>;
    runner = async (t, p) => (await db.query(t, p as any[])).rows as Row[];
  }
  return runner;
}
export async function q(text: string, params: unknown[] = []): Promise<Row[]> { return (await getRunner())(text, params); }
export async function q1(text: string, params: unknown[] = []): Promise<Row | null> { return (await q(text, params))[0] ?? null; }
export async function exec(text: string, params: unknown[] = []): Promise<void> { await q(text, params); }
