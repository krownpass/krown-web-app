import type { Metadata } from 'next';
import { Playfair_Display } from 'next/font/google';
import '@/styles/globals.css';
import { Providers } from './providers';
import { Navbar } from '@/components/layout/Navbar';
import { BottomNav } from '@/components/layout/BottomNav';
import { Sidebar } from '@/components/layout/Sidebar';
import { MainWrapper } from '@/components/layout/MainWrapper';
import { getBaseMetadata } from '@/lib/seo';

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});


export const metadata: Metadata = getBaseMetadata();

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable}`}>
      <body className="bg-[#0A0A0A] text-white antialiased">
        <Providers>
          <Navbar />
          <Sidebar />
          <MainWrapper>{children}</MainWrapper>
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}
