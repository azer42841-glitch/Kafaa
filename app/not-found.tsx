import Link from 'next/link';
import Shell from '@/components/Shell';
export default function NotFound() { return <Shell><h1>الصفحة غير موجودة</h1><p><Link className="btn" href="/">العودة إلى الرئيسية</Link></p></Shell>; }
