'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, AlertTriangle, Loader2, Bell, BellOff } from 'lucide-react';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { authService } from '@/services/auth.service';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';

export default function SettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { logout } = useAuthStore();
  const [notifications, setNotifications] = useLocalStorage('krown_notifications', true);
  const [isDeleting, setIsDeleting] = useState(false);

  // Check if we returning from a successful deletion
  React.useEffect(() => {
    const checkRedirectStatus = async () => {
      const status = searchParams.get('status');
      if (status === 'success') {
        toast.success('Account deleted successfully');
        await logout();
        router.replace('/login');
      } else if (status === 'canceled') {
        // User canceled deletion, clear the loading state and clean up the URL
        setIsDeleting(false);
        router.replace('/profile/settings');
      }
    };
    checkRedirectStatus();
  }, [searchParams, logout, router]);

  const handleDeleteInitiate = async () => {
    setIsDeleting(true);
    try {
      const token = await authService.generateWebLoginToken();
      if (token) {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://krownpass.com';
        const webFallbackUrl = encodeURIComponent(window.location.origin + '/profile/settings');
        const targetUrl = encodeURIComponent(`/account/delete?app_redirect=${webFallbackUrl}`);
        window.location.href = `${appUrl}/api/auth/session?token=${token}&redirect_url=${targetUrl}`;
      } else {
        toast.error('Could not generate secure session. Please try again.');
        setIsDeleting(false);
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to initiate account deletion.');
      setIsDeleting(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="max-w-lg mx-auto px-4 md:px-6 py-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="p-2 rounded-xl bg-[#1E1E1E] border border-[#2A2A2A] text-white/60">
            <ArrowLeft size={18} />
          </button>
          <h1 className="font-playfair text-xl font-bold text-white">Settings</h1>
        </div>

        <div className="space-y-4">
          {/* Notifications */}
          <div className="bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {notifications ? <Bell size={18} className="text-white/60" /> : <BellOff size={18} className="text-white/40" />}
              <div>
                <p className="text-white font-medium text-sm">Push Notifications</p>
                <p className="text-white/40 text-xs">Bookings, events, and promos</p>
              </div>
            </div>
            <button
              onClick={() => setNotifications(!notifications)}
              className={`relative w-12 h-6 rounded-full transition-colors ${notifications ? 'bg-[#800020]' : 'bg-[#2A2A2A]'}`}
            >
              <motion.div
                animate={{ x: notifications ? 24 : 2 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="absolute top-1 w-4 h-4 rounded-full bg-white"
              />
            </button>
          </div>

          {/* App version */}
          <div className="bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl p-4">
            <div className="flex items-center justify-between">
              <p className="text-white/60 text-sm">App Version</p>
              <p className="text-white/30 text-sm font-mono">1.0.0</p>
            </div>
          </div>

          {/* Delete account */}
          <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
            <h3 className="text-red-400 font-semibold text-sm mb-1">Account Deletion</h3>
            <p className="text-white/40 text-xs mb-3">Permanently delete your account and all associated data. This action cannot be undone.</p>
            <button
              onClick={handleDeleteInitiate}
              disabled={isDeleting}
              className="flex items-center gap-2 text-red-400 text-sm font-medium hover:text-red-300 transition-colors"
            >
              {isDeleting && <Loader2 size={14} className="animate-spin" />}
              Delete My Account
            </button>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
