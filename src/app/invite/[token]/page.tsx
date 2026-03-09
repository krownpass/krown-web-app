'use client';

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Crown, Users, Gift, Star, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { KROWN_PASS_BENEFITS } from '@/lib/constants';

const previewBenefits = [
  { icon: Gift, label: '25 bonus Krown Points on signup' },
  { icon: Star, label: 'Exclusive member benefits' },
  { icon: Users, label: 'Priority table bookings' },
];

export default function InvitePage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      // Already logged in - apply referral and redirect
      // In a real implementation, call API to apply referral
      router.push('/rewards');
    }
  }, [isAuthenticated, router]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-[#0A0A0A]">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        {/* Hero */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#800020] to-[#C11E38] flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#800020]/30">
            <Crown size={36} className="text-[#D4AF37]" />
          </div>
          <h1 className="font-playfair text-3xl font-bold text-white mb-2">You&apos;re Invited!</h1>
          <p className="text-white/50 text-sm">Join Krown — Chennai&apos;s premium café experience platform</p>
        </div>

        {/* Benefits */}
        <div className="bg-[#1E1E1E] border border-[#2A2A2A] rounded-2xl p-5 mb-6 space-y-3">
          <p className="text-[#D4AF37] text-xs font-semibold uppercase tracking-wider mb-4">Your exclusive perks</p>
          {previewBenefits.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#800020]/10 flex items-center justify-center flex-shrink-0">
                <Icon size={15} className="text-[#800020]" />
              </div>
              <p className="text-white/70 text-sm">{label}</p>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <Link
            href={`/signup?referral_code=${params.token}`}
            className="w-full flex items-center justify-center gap-2 bg-[#800020] hover:bg-[#C11E38] text-white py-4 rounded-xl font-semibold transition-all hover:shadow-lg hover:shadow-[#800020]/30"
          >
            Join Krown <ArrowRight size={16} />
          </Link>
          <Link
            href="/login"
            className="w-full flex items-center justify-center text-white/40 text-sm hover:text-white/60 transition-colors py-2"
          >
            Already have an account? Sign in
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
