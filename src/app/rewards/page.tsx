'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Crown, Gift, ArrowRight, Star, BookOpen, Users, MessageSquare } from 'lucide-react';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { Skeleton } from '@/components/ui/Skeleton';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useRewardsInfo, useRedemptionHistory } from '@/queries/useRewards';

const earnMethods = [
  { icon: <BookOpen size={16} />, label: 'Book a table', points: '+10 pts' },
  { icon: <Star size={16} />, label: 'Write a review', points: '+5 pts' },
  { icon: <Users size={16} />, label: 'Refer a friend', points: '+50 pts' },
  { icon: <Crown size={16} />, label: 'Every café visit', points: '+2 pts' },
];

export default function RewardsPage() {
  const { data: rewards, isLoading } = useRewardsInfo();
  const { data: history = [] } = useRedemptionHistory();

  return (
    <ProtectedRoute>
      <div className="max-w-2xl mx-auto px-4 md:px-6 py-6 space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-playfair text-2xl font-bold text-white">Krown Rewards</h1>
          <p className="text-white/40 text-sm">Earn and redeem exclusive rewards</p>
        </motion.div>

        {/* Points balance */}
        {isLoading ? (
          <Skeleton className="h-36 rounded-2xl" />
        ) : rewards ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative overflow-hidden bg-gradient-to-br from-[#800020] to-[#1A1A1A] rounded-2xl p-6"
          >
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/5 -translate-y-8 translate-x-8" />
            <p className="text-[#D4AF37] text-xs font-semibold uppercase tracking-wider mb-2">Your Balance</p>
            <div className="flex items-end gap-2 mb-1">
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="font-playfair text-5xl font-bold text-white"
              >
                {rewards.krown_points.toLocaleString()}
              </motion.span>
              <span className="text-white/50 text-sm mb-2">points</span>
            </div>
            {rewards.tier && (
              <span className="text-xs px-2 py-0.5 bg-[#D4AF37]/20 text-[#D4AF37] rounded-full capitalize">
                {rewards.tier} Tier
              </span>
            )}
            {rewards.next_tier_points && (
              <div className="mt-3">
                <p className="text-white/40 text-xs mb-1">{rewards.next_tier_points} pts to next tier</p>
                <ProgressBar
                  value={Math.min(((rewards.krown_points / (rewards.krown_points + rewards.next_tier_points)) * 100), 100)}
                  color="#D4AF37"
                  height={4}
                />
              </div>
            )}
          </motion.div>
        ) : null}

        {/* Redeem CTA */}
        <Link href="/rewards/redeem">
          <motion.div
            whileHover={{ scale: 1.01 }}
            className="flex items-center justify-between p-4 bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl hover:border-[#800020] transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#800020]/10 flex items-center justify-center">
                <Gift size={18} className="text-[#800020]" />
              </div>
              <div>
                <p className="text-white font-medium text-sm">Redeem Points</p>
                <p className="text-white/40 text-xs">Vouchers, discounts & more</p>
              </div>
            </div>
            <ArrowRight size={16} className="text-white/30" />
          </motion.div>
        </Link>

        {/* How to earn */}
        <div>
          <h2 className="text-white font-semibold mb-3 text-sm">How to Earn Points</h2>
          <div className="space-y-2">
            {earnMethods.map((method, i) => (
              <motion.div
                key={method.label}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07 }}
                className="flex items-center justify-between p-3 bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl"
              >
                <div className="flex items-center gap-3 text-white/60">
                  {method.icon}
                  <span className="text-sm">{method.label}</span>
                </div>
                <span className="text-[#D4AF37] text-sm font-semibold">{method.points}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Recent history */}
        {history.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-white font-semibold text-sm">Recent Redemptions</h2>
              <Link href="/rewards/history" className="text-[#800020] text-xs hover:text-[#C11E38]">
                View all
              </Link>
            </div>
            <div className="space-y-2">
              {history.slice(0, 3).map((record) => (
                <div key={record.redemption_id} className="flex items-center justify-between p-3 bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl">
                  <div>
                    <p className="text-white text-sm">{record.option?.title ?? 'Redemption'}</p>
                    <p className="text-white/40 text-xs">{new Date(record.redeemed_at).toLocaleDateString()}</p>
                  </div>
                  <span className="text-red-400 text-sm font-semibold">-{record.points_used} pts</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
