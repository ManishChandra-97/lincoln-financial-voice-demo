import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Lincoln Financial | Here for your next step', description: 'A demonstration of connected chat and voice support.', robots: { index: false, follow: false } };
export default function RootLayout({ children }: { children: React.ReactNode }) { return <html lang="en"><body>{children}</body></html>; }
