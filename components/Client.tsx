'use client';
import { useEffect, useRef, useState, type ReactNode } from 'react';

// سلوك الصفحة: اختبار قصير، ونافذة الدولة (Esc ومنع التمرير خلفها)
export function PageBehavior() {
  useEffect(() => {
    const wel = document.getElementById('welcome');
    const sync = () => {
      if (!wel) return;
      const open = wel.classList.contains('show') || location.hash === '#welcome';
      document.documentElement.classList.toggle('wel-open', open);
      if (open) (wel.querySelector('.wel-c') as HTMLElement | null)?.focus();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || !wel) return;
      if (wel.classList.contains('show')) (wel.querySelector('.wel-skip') as HTMLElement | null)?.click();
      else if (location.hash === '#welcome') location.hash = '';
    };
    const onClick = (e: MouseEvent) => {
      const b = (e.target as HTMLElement).closest('.qo') as HTMLElement | null; if (!b) return;
      const q = b.closest('.q') as HTMLElement; if (q.dataset.done) return; q.dataset.done = '1';
      const ok = b.dataset.ok === '1'; b.classList.add(ok ? 'good' : 'bad');
      if (!ok) q.querySelector('.qo[data-ok="1"]')?.classList.add('good');
      const blk = q.closest('.blk') as HTMLElement, all = blk.querySelectorAll('[data-q]'), done = blk.querySelectorAll('[data-q][data-done]');
      if (ok) blk.dataset.right = String((+(blk.dataset.right || 0)) + 1);
      if (all.length === done.length) (blk.querySelector('[data-qres]') as HTMLElement).textContent = 'نتيجتك: ' + (blk.dataset.right || 0) + ' / ' + all.length;
    };
    sync(); window.addEventListener('hashchange', sync); document.addEventListener('keydown', onKey); document.addEventListener('click', onClick);
    return () => { window.removeEventListener('hashchange', sync); document.removeEventListener('keydown', onKey); document.removeEventListener('click', onClick); document.documentElement.classList.remove('wel-open'); };
  }, []);
  return null;
}

// نموذج بنافذة تأكيد عصرية بدل confirm
export function ConfirmForm({ action, confirm, children, className }: { action: (fd: FormData) => void | Promise<void>; confirm: string; children: ReactNode; className?: string }) {
  const ref = useRef<HTMLFormElement>(null); const [open, setOpen] = useState(false); const ok = useRef(false);
  return (
    <>
      <form ref={ref} action={action} className={className} onSubmit={(e) => { if (!ok.current) { e.preventDefault(); setOpen(true); } ok.current = false; }}>{children}</form>
      {open && (
        <div className="esdlg" onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
          <div><p>{confirm}</p><div className="row">
            <button type="button" className="btn" onClick={() => { ok.current = true; setOpen(false); ref.current?.requestSubmit(); }}>نعم، تابع</button>
            <button type="button" className="btn alt" autoFocus onClick={() => setOpen(false)}>إلغاء</button></div></div>
        </div>
      )}
    </>
  );
}

// تلميح صيغة المحتوى في محرر الإدارة: يتغير مع نوع القسم المختار
export function BlockTypeSelect({ options }: { options: [string, string, string][] }) {
  const [h, setH] = useState(options[0]?.[2] ?? '');
  return (<><select name="type" onChange={(e) => setH(options.find((o) => o[0] === e.target.value)?.[2] ?? '')}>{options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select><small className="hint" style={{ flexBasis: "100%" }}>{h}</small></>);
}
