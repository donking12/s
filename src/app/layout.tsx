import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tafreegh AI | تفريغ الصوت المحلي الذكي',
  description: 'مساحة العمل المتطورة لتفريغ الملفات الصوتية والتسجيلات الحية بالكامل داخل جهازك دون خوادم حماية للخصوصية.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className="antialiased bg-darkBg text-slate-100 font-sans">
        {children}
      </body>
    </html>
  );
}
