import './globals.css';
import type { Metadata, Viewport } from 'next';
export const metadata: Metadata = { title: { default: 'سلاسة', template: '%s | سلاسة' }, description: 'منصة سلاسة المعرفية: مساقات أكاديمية ومهنية بالإنجليزية' };
export const viewport: Viewport = { themeColor: '#0f3d6e', width: 'device-width', initialScale: 1 };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="ar" dir="rtl"><body>{children}</body></html>;
}
