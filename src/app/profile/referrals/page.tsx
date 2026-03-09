'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Copy, CheckCircle, Share2, Users, Gift, ArrowRight } from 'lucide-react';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { Skeleton } from '@/components/ui/Skeleton';
import { useReferral } from '@/queries/useUser';
import { APP_URL } from '@/lib/constants';
import { toast } from 'sonner';

const steps = [
  { icon: Share2, label: 'Share your code', desc: 'Send your unique referral link to friends' },
  { icon: Users, label: 'Friend signs up', desc: 'They join Krown using your referral code' },
  { icon: Gift, label: 'Both get points', desc: 'You earn 50 pts, your friend earns 25 pts' },
];

export default function ReferralsPage() {
  const router = useRouter();
  const { data: referral, isLoading } = useReferral();
  const [copied, setCopied] = useState(false);

  const referralLink = referral ? `${APP_URL}/invite/${referral.code}` : '';

  const copyCode = () => {
    if (!referral) return;
    navigator.clipboard.writeText(referral.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Code copied!');
  };

  const share = async () => {
    if (!referral) return;
    if (navigator.share) {
      await navigator.share({ title: 'Join Krown!', text: 'Use my referral code to join Krown and earn points!', url: referralLink });
    } else {
      navigator.clipboard.writeText(referralLink);
      toast.success('Link copied!');
    }
  };

  return (
    <ProtectedRoute>
      <div className="max-w-lg mx-auto px-4 md:px-6 py-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="p-2 rounded-xl bg-[#1E1E1E] border border-[#2A2A2A] text-white/60">
            <ArrowLeft size={18} />
          </button>
          <h1 className="font-playfair text-xl font-bold text-white">Refer & Earn</h1>
        </div>

        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-[#800020] to-[#1A1A1A] rounded-2xl p-6 mb-6 text-center">
          <div className="text-4xl mb-2">🎁</div>
          <h2 className="font-playfair text-2xl font-bold text-white mb-1">Invite Friends</h2>
          <p className="text-white/60 text-sm">Earn 50 Krown Points for every friend you invite</p>
        </motion.div>

        {/* Code & stats */}
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-16 rounded-xl" />
          </div>
        ) : referral ? (
          <>
            <div className="bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl p-4 mb-4">
              <p className="text-white/40 text-xs mb-2">Your Referral Code</p>
              <div className="flex items-center justify-between">
                <span className="font-mono text-white text-2xl font-bold tracking-widest">{referral.code}</span>
                <button onClick={copyCode} className="flex items-center gap-1.5 text-xs px-3 py-2 bg-[#800020] text-white rounded-lg hover:bg-[#C11E38] transition-colors">
                  {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl p-3 text-center">
                <p className="font-playfair text-2xl font-bold text-white">{referral.total_referrals}</p>
                <p className="text-white/40 text-xs">Friends Invited</p>
              </div>
              <div className="bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl p-3 text-center">
                <p className="font-playfair text-2xl font-bold text-[#D4AF37]">{referral.points_earned}</p>
                <p className="text-white/40 text-xs">Points Earned</p>
              </div>
            </div>

            <button
              onClick={share}
              className="w-full flex items-center justify-center gap-2 bg-[#800020] hover:bg-[#C11E38] text-white py-3 rounded-xl font-semibold text-sm transition-all mb-6"
            >
              <Share2 size={16} />Share Referral Link
            </button>
          </>
        ) : null}

        {/* How it works */}
        <div>
          <h3 className="text-white font-semibold mb-4 text-sm">How it works</h3>
          <div className="space-y-3">
            {steps.map(({ icon: Icon, label, desc }, i) => (
              <motion.div key={label} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.07 }} className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#800020]/10 flex items-center justify-center flex-shrink-0">
                  <Icon size={16} className="text-[#800020]" />
                </div>
                <div>
                  <p className="text-white font-medium text-sm">{label}</p>
                  <p className="text-white/50 text-xs">{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
