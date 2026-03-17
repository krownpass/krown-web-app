import type { Metadata } from 'next';
import { Cormorant_Garamond } from 'next/font/google';
import '@/styles/globals.css';
import { Providers } from './providers';
import { Navbar } from '@/components/layout/Navbar';
import { BottomNav } from '@/components/layout/BottomNav';
import { Sidebar } from '@/components/layout/Sidebar';
import { MainWrapper } from '@/components/layout/MainWrapper';
import { getBaseMetadata } from '@/lib/seo';

// ─── FONT CONFIGURATION ──────────────────────────────────────────────────────
// To change the display font, swap this import and update --font-display below.
// Premium alternatives: Cormorant_Garamond | EB_Garamond | Cinzel | DM_Serif_Display
const displayFont = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap',
});


export const metadata: Metadata = getBaseMetadata();

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${displayFont.variable}`}>
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
