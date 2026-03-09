'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ArrowLeft, AlertTriangle, Loader2, Bell, BellOff } from 'lucide-react';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { useAuthStore } from '@/stores/authStore';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { toast } from 'sonner';

export default function SettingsPage() {
  const router = useRouter();
  const { deleteAccount } = useAuthStore();
  const [notifications, setNotifications] = useLocalStorage('krown_notifications', true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (deleteInput !== 'DELETE') { toast.error('Type DELETE to confirm'); return; }
    setIsDeleting(true);
    try {
      await deleteAccount();
      toast.success('Account deleted');
      router.push('/login');
    } catch {
      toast.error('Failed to delete account.');
    } finally {
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
            <h3 className="text-red-400 font-semibold text-sm mb-1">Danger Zone</h3>
            <p className="text-white/40 text-xs mb-3">Permanently delete your account and all associated data.</p>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="text-red-400 text-sm font-medium hover:text-red-300 transition-colors"
            >
              Delete My Account
            </button>
          </div>
        </div>

        {/* Delete confirm modal */}
        <AnimatePresence>
          {showDeleteConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 bg-black/60"
              onClick={() => setShowDeleteConfirm(false)}
            >
              <motion.div
                initial={{ y: 60 }}
                animate={{ y: 0 }}
                exit={{ y: 60 }}
                className="bg-[#1E1E1E] border border-[#2A2A2A] rounded-2xl p-6 w-full max-w-sm"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-3 mb-3">
                  <AlertTriangle size={20} className="text-red-400" />
                  <h3 className="font-semibold text-white">Delete Account</h3>
                </div>
                <p className="text-white/50 text-sm mb-4">This will permanently delete your account, bookings, and all data. This cannot be undone.</p>
                <p className="text-white/60 text-xs mb-2">Type <strong className="text-white">DELETE</strong> to confirm:</p>
                <input
                  type="text"
                  value={deleteInput}
                  onChange={(e) => setDeleteInput(e.target.value)}
                  placeholder="DELETE"
                  className="w-full bg-[#111] border border-[#2A2A2A] rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-red-500 mb-4"
                />
                <div className="flex gap-3">
                  <button onClick={() => { setShowDeleteConfirm(false); setDeleteInput(''); }} className="flex-1 py-2.5 border border-[#2A2A2A] text-white/60 rounded-xl text-sm">
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleteInput !== 'DELETE' || isDeleting}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-600 text-white rounded-xl text-sm hover:bg-red-500 disabled:opacity-50"
                  >
                    {isDeleting && <Loader2 size={14} className="animate-spin" />}
                    Delete
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
