'use client';
import { useActionState, type ReactNode } from 'react';
export default function AuthForm({ action, children, submit }: { action: (prev: string, fd: FormData) => Promise<string>; children: ReactNode; submit: string }) {
  const [err, run, pending] = useActionState(action, '');
  return (<>{err && <div className="flash err">{err}</div>}<form action={run}>{children}<button className="btn" disabled={pending}>{submit}</button></form></>);
}
