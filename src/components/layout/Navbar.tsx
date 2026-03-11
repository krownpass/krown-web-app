'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Bell, ChevronDown, LogOut, User, Bookmark, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { useUnreadCount } from '@/queries/useNotifications';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Ticket } from 'lucide-react';

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
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-6 left-0 right-0 z-50 hidden md:flex justify-center pointer-events-none px-6"
    >
      <div 
        className={cn(
          "pointer-events-auto flex items-center justify-between w-full max-w-5xl px-3 py-2.5 rounded-full transition-all duration-500 shadow-2xl",
          scrolled 
            ? "bg-[#0B0B0B]/80 backdrop-blur-2xl border border-white/10 shadow-[#000000]/50" 
            : "bg-[#0A0A0A]/40 backdrop-blur-lg border border-white/[0.05]"
        )}
      >
        {/* Left: Logo */}
        <Link href="/" className="flex items-center gap-3 pl-3 pr-2 group">
          <div className="relative w-8 h-8 rounded-lg overflow-hidden shrink-0 group-hover:scale-105 transition-transform duration-300">
            <Image src="/krown-icon.png" alt="Krown" fill className="object-cover" />
          </div>
          <span className="font-playfair text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#D4AF37] to-[#FFF3B0] tracking-widest hidden lg:block">
            KROWN
          </span>
        </Link>

        {/* Center: Nav links */}
        <nav className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1 bg-white/[0.02] p-1.5 rounded-full border border-white/[0.05]">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'relative px-5 py-2 rounded-full text-sm font-medium transition-colors duration-300',
                  isActive ? 'text-white' : 'text-white/50 hover:text-white'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="navbar-pill"
                    className="absolute inset-0 bg-white/10 rounded-full -z-10 border border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.05)]"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 pr-1">
          <Link
            href={pathname === '/cafes' ? '/search?type=cafes' : pathname === '/events' ? '/search?type=events' : '/search'}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/5 text-white/70 hover:text-white hover:bg-white/10 hover:border-white/10 transition-all duration-300"
          >
            <Search size={16} />
          </Link>

          {isAuthenticated && (
            <Link
              href="/notifications"
              className="relative w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/5 text-white/70 hover:text-white hover:bg-white/10 hover:border-white/10 transition-all duration-300"
            >
              <Bell size={16} />
              {unreadCount != null && unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-3 h-3 rounded-full bg-[#800020] border border-[#0B0B0B] text-white text-[8px] font-bold flex items-center justify-center">
                  <span className="-scale-y-0 translate-y-[0.5px]"></span> {/* visual centering trick */}
                </span>
              )}
            </Link>
          )}

          {isAuthenticated && user ? (
            <div className="relative ml-2">
              <button
                onClick={() => setProfileOpen((prev) => !prev)}
                className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-white/10 hover:border-[#D4AF37]/50 transition-colors duration-300 p-0 overflow-hidden"
              >
                <Avatar src={user.profile_image} name={user.name} size="sm" className="w-full h-full" />
              </button>

              <AnimatePresence>
                {profileOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setProfileOpen(false)}
                    />
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 top-[calc(100%+12px)] w-56 bg-[#121212]/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.5)] z-20 py-2 overflow-hidden"
                    >
                      <div className="px-5 py-4 border-b border-white/[0.08] bg-white/[0.02]">
                        <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                        <p className="text-xs text-white/40 mt-1 truncate">{user.phone}</p>
                      </div>
                      <div className="py-2">
                        {[
                          { icon: <User size={14} />, label: 'My Profile', href: '/profile' },
                          { icon: <Ticket size={14} />, label: 'My Tickets', href: '/events/my-tickets' },
                          { icon: <Bookmark size={14} />, label: 'Bookmarks', href: '/profile/bookmarks' },
                          { icon: <BookOpen size={14} />, label: 'Bookings', href: '/bookings' },
                        ].map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-3 px-5 py-2.5 text-sm font-medium text-white/60 hover:text-white hover:bg-white/[0.06] transition-all duration-200"
                          >
                            <span className="text-[#D4AF37]/70">{item.icon}</span>
                            {item.label}
                          </Link>
                        ))}
                      </div>
                      <div className="border-t border-white/[0.08] mt-1 pt-1">
                        <button
                          onClick={() => { logout(); setProfileOpen(false); }}
                          className="flex items-center gap-3 w-full px-5 py-3 text-sm font-medium text-[#C11E38]/80 hover:text-[#C11E38] hover:bg-[#C11E38]/10 transition-colors"
                        >
                          <LogOut size={14} />
                          Logout
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="pl-2">
              <Link href="/login">
                <button className="h-10 px-6 rounded-full bg-[#800020] text-white text-sm font-semibold tracking-wide hover:shadow-[0_0_20px_rgba(128,0,32,0.4)] hover:bg-[#900024] transition-all duration-300">
                  Login
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </motion.header>
  );
}
