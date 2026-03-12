'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, House, Compass, Calendar, BookOpen, User, Crown, Star, Settings, Ticket } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { useUiStore } from '@/stores/uiStore';
import { Avatar } from '@/components/ui/Avatar';

const NAV_ITEMS = [
  { icon: House, label: 'Home', href: '/' },
  { icon: Compass, label: 'Explore Cafés', href: '/cafes' },
  { icon: Calendar, label: 'Events', href: '/events' },
  { icon: Ticket, label: 'My Tickets', href: '/events/my-tickets' },
  { icon: BookOpen, label: 'My Bookings', href: '/bookings' },
  { icon: User, label: 'Profile', href: '/profile' },
  { icon: Crown, label: 'Krown Pass', href: '/krown-pass' },
  { icon: Star, label: 'Rewards', href: '/rewards' },
  { icon: Settings, label: 'Settings', href: '/profile/settings' },
];

export function Sidebar() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isOpen = useUiStore((s) => s.isSidebarOpen);
  const onClose = useUiStore((s) => s.toggleSidebar);

  const isAuthPage = ['/login', '/signup', '/verify-otp'].some((p) => pathname.startsWith(p));
  if (isAuthPage) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Sidebar panel */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="absolute left-0 top-0 bottom-0 w-72 bg-[#111] border-r border-[#2A2A2A] flex flex-col overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-[#2A2A2A]">
              <div className="flex items-center gap-2">
                <Image quality={90} src="/krown-icon.png" alt="Krown" width={32} height={32} className="rounded-lg" />
                <span className="font-playfair text-2xl font-bold text-[#800020] tracking-wider">KROWN</span>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Nav links */}
            <nav className="flex-1 p-4 space-y-1">
              {NAV_ITEMS.map((item) => {
                const isActive =
                  item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-xl transition-all',
                      isActive
                        ? 'bg-[#800020]/20 text-[#C11E38] border border-[#800020]/30'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    )}
                  >
                    <Icon size={18} strokeWidth={isActive ? 2.5 : 1.5} />
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* User info at bottom */}
            {isAuthenticated && user ? (
              <div className="p-4 border-t border-[#2A2A2A]">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-[#1A1A1A]">
                  <Avatar src={user.profile_image} name={user.name} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{user.name}</p>
                    <p className="text-xs text-white/40 mt-0.5">
                      {(user.krown_points ?? 0).toLocaleString()} points
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 border-t border-[#2A2A2A]">
                <Link
                  href="/login"
                  onClick={onClose}
                  className="flex items-center justify-center w-full py-3 rounded-xl bg-[#800020] hover:bg-[#C11E38] text-white text-sm font-medium transition-colors"
                >
                  Login to Krown
                </Link>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
