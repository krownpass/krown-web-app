'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Crown, Gift, ArrowRight, Star, BookOpen, Users, MessageSquare, X, ArrowLeft } from 'lucide-react';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { Skeleton } from '@/components/ui/Skeleton';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useRewardsInfo, useRedemptionHistory } from '@/queries/useRewards';
import api from '@/services/api';
import { toast } from 'sonner';

const earnMethods = [
  { icon: <BookOpen size={16} />, label: 'Book a table', points: '+10 pts' },
  { icon: <Star size={16} />, label: 'Write a review', points: '+5 pts' },
  { icon: <Users size={16} />, label: 'Refer a friend', points: '+50 pts' },
  { icon: <Crown size={16} />, label: 'Every café visit', points: '+2 pts' },
];

export default function RewardsPage() {
  const { data: rewards, isLoading } = useRewardsInfo();
  const { data: history = [] } = useRedemptionHistory();
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);

  const handleHubbleRedirect = async () => {
    if (isRedeeming) return;
    setIsRedeeming(true);

    try {
      const res = await api.get('/hubble/token');
      const data = res.data;
      
      if (data?.success && data?.data?.url) {
        setIframeUrl(data.data.url);
        setIsRedeeming(false);
      } else if (data?.success && data?.data?.token) {
        // Fallback just in case
        const token = data.data.token;
        const baseUrl = process.env.NEXT_PUBLIC_HUBBLE_BASE_URL || '';
        const clientId = process.env.NEXT_PUBLIC_HUBBLE_CLIENT_ID || '';
        const appSecret = process.env.NEXT_PUBLIC_HUBBLE_APP_SECRET || '';

        const hubbleUrl = new URL(baseUrl);
        hubbleUrl.searchParams.append('clientId', clientId);
        hubbleUrl.searchParams.append('appSecret', appSecret);
        hubbleUrl.searchParams.append('token', token);
        
        setIframeUrl(hubbleUrl.toString());
        setIsRedeeming(false);
      } else {
        toast.error('Could not initiate redeem session');
        setIsRedeeming(false);
      }
    } catch (error) {
      toast.error('Failed to initiate redeem session');
      setIsRedeeming(false);
    }
  };

  // If iframe URL is set, render the Hubble SDK iframe instead of the Rewards dashboard
  if (iframeUrl) {
    return (
      <div className="fixed inset-0 z-[100] bg-[#050505] flex flex-col">
        <div className="flex bg-[#111] items-center px-4 py-3 border-b border-white/10 relative shrink-0">
          <button 
            onClick={() => setIframeUrl(null)}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition text-white/80 hover:text-white flex items-center justify-center -ml-2 mr-3"
            aria-label="Go back"
          >
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-white font-playfair font-semibold flex-1 text-center pr-8">Redeem Rewards</h2>
        </div>
        <div className="flex-1 w-full bg-[#111] relative overflow-hidden">
          <iframe 
            src={iframeUrl} 
            className="absolute inset-0 w-full h-full border-none"
            allow="payment; camera; microphone"
            title="Hubble SDK"
          />
        </div>
      </div>
    );
  }

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
                {(rewards.krown_points ?? 0).toLocaleString()}
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
                  value={Math.min((((rewards.krown_points ?? 0) / ((rewards.krown_points ?? 0) + rewards.next_tier_points)) * 100), 100)}
                  color="#D4AF37"
                  height={4}
                />
              </div>
            )}
          </motion.div>
        ) : null}

        {/* Redeem CTA */}
        <button
          onClick={handleHubbleRedirect}
          disabled={isRedeeming}
          className="w-full text-left"
        >
          <motion.div
            whileHover={{ scale: 1.01 }}
            className={`flex items-center justify-between p-4 bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl transition-all cursor-pointer ${isRedeeming ? 'opacity-70' : 'hover:border-[#800020]'}`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#800020]/10 flex items-center justify-center">
                <Gift size={18} className="text-[#800020]" />
              </div>
              <div>
                <p className="text-white font-medium text-sm">
                  {isRedeeming ? 'Initiating Session...' : 'Redeem Points'}
                </p>
                <p className="text-white/40 text-xs">Vouchers, discounts & more</p>
              </div>
            </div>
            {isRedeeming ? (
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="w-4 h-4 border-2 border-white/20 border-t-[#800020] rounded-full" />
            ) : (
              <ArrowRight size={16} className="text-white/30" />
            )}
          </motion.div>
        </button>

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
                <div key={record.redeem_code} className="flex items-center justify-between p-3 bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl">
                  <div>
                    <p className="text-white text-sm">{record.item_name ?? 'Redemption'}</p>
                    <p className="text-white/40 text-xs">{new Date(record.updated_at).toLocaleDateString()}</p>
                  </div>
                  <span className="text-red-400 text-sm font-semibold">-{record.points_used ?? 0} pts</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
