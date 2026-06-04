// app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';
import { Nav } from './_components/Nav';

export const metadata: Metadata = {
  title: 'Pharmacy Task Tracker',
  description: 'Log and review daily operational tasks.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="nl">
      <body className="min-h-screen bg-gradient-to-b from-white to-sky-100 text-slate-800 antialiased">
        <Nav />
        {children}
      </body>
    </html>
  );
}