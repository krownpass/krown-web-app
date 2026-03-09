'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { House, Compass, Calendar, BookOpen, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { icon: House, label: 'Home', href: '/' },
  { icon: Compass, label: 'Explore', href: '/cafes' },
  { icon: Calendar, label: 'Events', href: '/events' },
  { icon: BookOpen, label: 'Bookings', href: '/bookings' },
  { icon: User, label: 'Profile', href: '/profile' },
];

export function BottomNav() {
  const pathname = usePathname();

  const isAuthPage = ['/login', '/signup', '/verify-otp'].some((p) => pathname.startsWith(p));
  if (isAuthPage) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden">
      <div
        className="border-t border-[#2A2A2A] bg-[#0A0A0A]/80 backdrop-blur-xl"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-stretch">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 min-h-[56px]"
              >
                <motion.div
                  whileTap={{ scale: 0.85 }}
                  animate={{ scale: isActive ? 1.1 : 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  className={cn(
                    'p-1.5 rounded-lg transition-colors',
                    isActive ? 'text-[#C11E38]' : 'text-white/40'
                  )}
                >
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
                </motion.div>
                <span
                  className={cn(
                    'text-[10px] font-medium',
                    isActive ? 'text-[#C11E38]' : 'text-white/30'
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
