import Link from 'next/link';
import { cookies } from 'next/headers';
import type { ReactNode } from 'react';
import { studentId } from '@/lib/session';
import { countries, curCountry } from '@/lib/countries';
import { flagSvg } from '@/lib/flags';
import { FLASH, SITE_NAME, SITE_NAME_EN } from '@/lib/util';
import { PageBehavior } from './Client';
import { setCountryAction } from '@/app/actions';

const Flag = ({ code, w }: { code: string; w: number }) => <span dangerouslySetInnerHTML={{ __html: flagSvg(code, w) }} />;
export { Flag };

async function Welcome({ back }: { back: string }) {
  const cur = await curCountry(); const first = cur === '' && !(await cookies()).get('ss_welcomed');
  const list = await countries();
  return (
    <div className={'wel' + (first ? ' show' : '')} id="welcome" role="dialog" aria-modal="true" aria-labelledby="wel-t">
      <div className="wel-bg" aria-hidden="true"><i /><i /><i /><i /><i /><i /></div>
      <form action={setCountryAction} className="wel-card">
        <input type="hidden" name="back" value={back} /><a className="wel-x" href="#" aria-label="إغلاق">✕</a>
        <div className="wel-logo">س</div><h2 id="wel-t">أهلاً بك في <span>منصة سلاسة المعرفية</span></h2>
        <p className="wel-s">اختر دولتك لنعرض لك المنهج الذي يناسب جامعتك</p>
        <div className="wel-grid">
          {list.filter((c) => c.featured === 1).map((c, i) => (
            <button key={c.code} name="c" value={c.code.trim()} className="wel-c" style={{ ['--i' as any]: i }}><Flag code={c.code} w={64} /><b>{c.name_ar}</b><small dir="ltr">{c.name_en}</small></button>
          ))}
        </div>
        {list.some((c) => c.featured !== 1) && <><div className="wel-more"><span>دول عربية أخرى</span></div>
          <div className="wel-others">{list.filter((c) => c.featured !== 1).map((c) => <button key={c.code} name="c" value={c.code.trim()} className="wel-o"><Flag code={c.code} w={28} /><span>{c.name_ar}</span></button>)}</div></>}
        <button name="skip" value="1" className="wel-skip">تصفّح كل المناهج الآن</button>
      </form>
    </div>
  );
}
async function CountryBar() {
  const cur = (await curCountry()).trim(); const row = cur ? (await countries()).find((c) => c.code.trim() === cur) : null;
  return <div className="cbar"><span className="cbar-l">منهج الدولة:</span><b className="cbar-n">{row ? <><Flag code={cur} w={22} /> {row.name_ar}</> : '🌍 كل الدول'}</b><a className="cbar-b" href="#welcome">تغيير ▾</a></div>;
}

export default async function Shell({ children, bodyClass = '', flash, welcome = false, back = '/', nav = true }: { children: ReactNode; bodyClass?: string; flash?: string; welcome?: boolean; back?: string; nav?: boolean }) {
  const student = await studentId(); const f = flash ? FLASH[flash] : undefined;
  return (
    <div className={'shell ' + bodyClass}>
      <nav className="top"><Link className="brand" href="/"><span className="logo">س</span><b>{SITE_NAME}</b><small>منصة معرفية</small></Link>
        <div className="links">{student ? <><Link href="/account">حسابي</Link><a href="/logout">خروج</a></> : <><Link href="/login">دخول</Link><Link className="cta" href="/register">ابدأ مجاناً</Link></>}</div></nav>
      {welcome && nav && <><CountryBar /><Welcome back={back} /></>}
      <main>{f && <div className={'flash ' + f[0]}>{f[1]}</div>}{children}</main>
      <footer>© {new Date().getUTCFullYear()} {SITE_NAME} — {SITE_NAME_EN}</footer>
      <PageBehavior />
    </div>
  );
}
