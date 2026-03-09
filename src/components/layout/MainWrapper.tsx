'use client';

import { usePathname } from 'next/navigation';

const AUTH_PATHS = ['/login', '/signup', '/verify-otp'];

export function MainWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = AUTH_PATHS.some((p) => pathname.startsWith(p));
  return (
    <main className={isAuthPage ? 'min-h-screen' : 'min-h-screen pb-20 md:pb-0 pt-0 md:pt-16'}>
      {children}
    </main>
  );
}
