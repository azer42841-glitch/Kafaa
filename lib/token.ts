// رموز موقّعة (HMAC-SHA256) بـ Web Crypto: تعمل في Node وفي middleware. لا حاجة لتخزين جلسات على القرص.
const enc = new TextEncoder();
function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (s && s.length >= 16) return s;
  if (process.env.NODE_ENV === 'production') throw new Error('SESSION_SECRET غير مضبوط (16 حرفًا على الأقل)');
  return 'dev-only-secret-change-me';
}
const b64 = (u: Uint8Array) => btoa(String.fromCharCode(...u)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64 = (s: string) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));
async function key() { return crypto.subtle.importKey('raw', enc.encode(secret()), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']); }
export async function sign(payload: object): Promise<string> {
  const body = b64(enc.encode(JSON.stringify(payload)));
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', await key(), enc.encode(body)));
  return body + '.' + b64(sig);
}
export async function verify<T = any>(token: string | undefined): Promise<T | null> {
  if (!token) return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  try {
    if (!(await crypto.subtle.verify('HMAC', await key(), unb64(sig), enc.encode(body)))) return null;
    return JSON.parse(new TextDecoder().decode(unb64(body))) as T;
  } catch { return null; }
}
export async function sha256hex(s: string): Promise<string> {
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(s)))].map((x) => x.toString(16).padStart(2, '0')).join('');
}
