'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Search, Bell, ChevronDown, LogOut, User, Bookmark, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { useUnreadCount } from '@/queries/useNotifications';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';

const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Cafés', href: '/cafes' },
  { label: 'Events', href: '/events' },
  { label: 'Bookings', href: '/bookings' },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const logout = useAuthStore((s) => s.logout);
  const { data: unreadCount } = useUnreadCount();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isAuthPage = ['/login', '/signup', '/verify-otp'].some((p) => pathname.startsWith(p));
  if (isAuthPage) return null;

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={cn(
        'fixed top-0 left-0 right-0 z-40 hidden md:flex transition-all duration-300',
        scrolled
          ? 'bg-[#0A0A0A]/95 backdrop-blur-xl border-b border-[#2A2A2A] shadow-xl'
          : 'bg-transparent'
      )}
    >
      <div className="w-full max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Image src="/krown-icon.png" alt="Krown" width={36} height={36} className="rounded-lg" />
          <span className="font-playfair text-2xl font-bold text-[#800020] tracking-wider">KROWN</span>
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                pathname === link.href
                  ? 'text-white bg-white/10'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <Link
            href="/search"
            className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-colors"
          >
            <Search size={18} />
          </Link>

          {isAuthenticated && (
            <Link
              href="/notifications"
              className="relative p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-colors"
            >
              <Bell size={18} />
              {unreadCount != null && unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#800020] text-white text-[10px] font-bold flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
          )}

          {isAuthenticated && user ? (
            <div className="relative">
              <button
                onClick={() => setProfileOpen((prev) => !prev)}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-white/5 transition-colors"
              >
                <Avatar src={user.profile_image} name={user.name} size="sm" />
                <span className="text-sm font-medium text-white/80 max-w-[100px] truncate">
                  {(user.name ?? '').split(' ')[0]}
                </span>
                <ChevronDown size={14} className="text-white/40" />
              </button>

              {profileOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setProfileOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-52 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl shadow-2xl z-20 py-1 overflow-hidden">
                    <div className="px-4 py-3 border-b border-[#2A2A2A]">
                      <p className="text-sm font-medium text-white">{user.name}</p>
                      <p className="text-xs text-white/40 mt-0.5">{user.phone}</p>
                    </div>
                    {[
                      { icon: <User size={14} />, label: 'My Profile', href: '/profile' },
                      { icon: <Bookmark size={14} />, label: 'Bookmarks', href: '/profile/bookmarks' },
                      { icon: <BookOpen size={14} />, label: 'Bookings', href: '/bookings' },
                    ].map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                      >
                        {item.icon}
                        {item.label}
                      </Link>
                    ))}
                    <div className="border-t border-[#2A2A2A] mt-1">
                      <button
                        onClick={() => { logout(); setProfileOpen(false); }}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <LogOut size={14} />
                        Logout
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Link href="/login">
              <Button variant="primary" size="sm">Login</Button>
            </Link>
          )}
        </div>
      </div>
    </motion.header>
  );
}
