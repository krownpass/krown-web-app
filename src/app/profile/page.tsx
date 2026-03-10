'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  User, Edit2, Bookmark, BookOpen, Receipt, Smartphone, Users, Crown,
  LogOut, ChevronRight, AlertTriangle, Star, Ticket,
} from 'lucide-react';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { Avatar } from '@/components/ui/Avatar';
import { Skeleton } from '@/components/ui/Skeleton';
import { useProfile } from '@/queries/useUser';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';

const menuItems = [
  { href: '/events/my-tickets', icon: Ticket, label: 'My Tickets' },
  { href: '/profile/bookmarks', icon: Bookmark, label: 'Saved Cafés' },
  { href: '/bookings', icon: BookOpen, label: 'Booking History' },
  { href: '/profile/transactions', icon: Receipt, label: 'Transaction History' },
  { href: '/profile/devices', icon: Smartphone, label: 'Active Sessions' },
  { href: '/profile/referrals', icon: Users, label: 'Referrals' },
  { href: '/krown-pass', icon: Crown, label: 'Krown Pass' },
];

export default function ProfilePage() {
  const router = useRouter();
  const { data: profile, isLoading } = useProfile();
  const { logout } = useAuthStore();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    router.push('/login');
  };

  return (
    <ProtectedRoute>
      <div className="max-w-2xl mx-auto px-4 md:px-6 py-6">
        {/* Header */}
        {isLoading ? (
          <div className="flex items-center gap-4 mb-8">
            <Skeleton className="w-20 h-20 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        ) : profile ? (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4 mb-6">
            <div className="relative">
              <Avatar src={profile.profile_image} name={profile.name} size="xl" />
              {profile.has_krown_pass && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#D4AF37] flex items-center justify-center">
                  <Crown size={12} className="text-black" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <h1 className="font-playfair text-xl font-bold text-white">{profile.name}</h1>
              <p className="text-white/40 text-sm">+91 {profile.phone}</p>
              {profile.email && <p className="text-white/30 text-xs">{profile.email}</p>}
            </div>
            <Link href="/profile/edit" className="p-2 rounded-xl bg-[#1E1E1E] border border-[#2A2A2A] text-white/60 hover:text-white transition-colors">
              <Edit2 size={16} />
            </Link>
          </motion.div>
        ) : null}

        {/* Stats */}
        {profile && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-3 gap-3 mb-6"
          >
            {[
              { label: 'Bookings', value: '—' },
              { label: 'Events', value: '—' },
              { label: 'Points', value: (profile.krown_points ?? 0).toLocaleString() },
            ].map((stat) => (
              <div key={stat.label} className="bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl p-3 text-center">
                <p className="font-playfair text-xl font-bold text-white">{stat.value}</p>
                <p className="text-white/40 text-xs">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        )}

        {/* Krown Pass card */}
        {profile && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mb-6">
            {profile.has_krown_pass ? (
              <div className="bg-gradient-to-r from-[#800020] to-[#C11E38] rounded-xl p-4 flex items-center gap-3">
                <Crown size={20} className="text-[#D4AF37]" />
                <div>
                  <p className="text-[#D4AF37] text-xs font-semibold">KROWN PASS ACTIVE</p>
                  {profile.krown_pass_expiry && (
                    <p className="text-white/70 text-xs">Expires {new Date(profile.krown_pass_expiry).toLocaleDateString()}</p>
                  )}
                </div>
              </div>
            ) : (
              <Link href="/krown-pass">
                <div className="border border-[#800020]/30 rounded-xl p-4 flex items-center justify-between hover:bg-[#800020]/5 transition-all">
                  <div className="flex items-center gap-3">
                    <Crown size={18} className="text-[#800020]" />
                    <div>
                      <p className="text-white font-medium text-sm">Get Krown Pass</p>
                      <p className="text-white/40 text-xs">Unlock exclusive benefits</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-white/30" />
                </div>
              </Link>
            )}
          </motion.div>
        )}

        {/* Menu */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl overflow-hidden mb-4">
          {menuItems.map(({ href, icon: Icon, label }, i) => (
            <Link key={href} href={href}>
              <div className={`flex items-center justify-between px-4 py-3.5 hover:bg-[#242424] transition-colors ${i < menuItems.length - 1 ? 'border-b border-[#2A2A2A]' : ''}`}>
                <div className="flex items-center gap-3">
                  <Icon size={17} className="text-white/50" />
                  <span className="text-white/80 text-sm">{label}</span>
                </div>
                <ChevronRight size={14} className="text-white/20" />
              </div>
            </Link>
          ))}
        </motion.div>

        {/* Logout */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full flex items-center gap-3 px-4 py-3.5 bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl text-red-400 hover:bg-red-500/5 transition-all"
          >
            <LogOut size={17} />
            <span className="text-sm">Logout</span>
          </button>
        </motion.div>

        {/* Logout confirm modal */}
        <AnimatePresence>
          {showLogoutConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 bg-black/60"
              onClick={() => setShowLogoutConfirm(false)}
            >
              <motion.div
                initial={{ y: 60 }}
                animate={{ y: 0 }}
                exit={{ y: 60 }}
                className="bg-[#1E1E1E] border border-[#2A2A2A] rounded-2xl p-6 w-full max-w-sm"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-3 mb-3">
                  <LogOut size={18} className="text-red-400" />
                  <h3 className="font-semibold text-white">Logout?</h3>
                </div>
                <p className="text-white/50 text-sm mb-6">You&apos;ll need to sign in again to access your account.</p>
                <div className="flex gap-3">
                  <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 py-2.5 border border-[#2A2A2A] text-white/60 rounded-xl text-sm">
                    Cancel
                  </button>
                  <button onClick={handleLogout} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm hover:bg-red-500">
                    Logout
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ProtectedRoute>
  );
}
