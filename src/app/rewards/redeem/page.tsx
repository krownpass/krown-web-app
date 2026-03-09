'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Gift, Loader2, Copy, CheckCircle } from 'lucide-react';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { useRedemptionOptions, useRewardsInfo, useRedeemPoints } from '@/queries/useRewards';
import type { RedemptionOption } from '@/types/rewards';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

export default function RedeemPage() {
  const router = useRouter();
  const { data: rewards } = useRewardsInfo();
  const { data: options = [], isLoading } = useRedemptionOptions();
  const redeemMutation = useRedeemPoints();
  const [selected, setSelected] = useState<RedemptionOption | null>(null);
  const [voucherCode, setVoucherCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleRedeem = async () => {
    if (!selected) return;
    try {
      const res = await redeemMutation.mutateAsync(selected.option_id);
      if (res.voucher_code) setVoucherCode(res.voucher_code);
      toast.success('Points redeemed successfully!');
      setSelected(null);
    } catch {
      toast.error('Redemption failed. Please try again.');
    }
  };

  const copyCode = () => {
    if (!voucherCode) return;
    navigator.clipboard.writeText(voucherCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Code copied!');
  };

  return (
    <ProtectedRoute>
      <div className="max-w-2xl mx-auto px-4 md:px-6 py-6">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => router.back()} className="p-2 rounded-xl bg-[#1E1E1E] border border-[#2A2A2A] text-white/60">
            <ArrowLeft size={18} />
          </button>
          <h1 className="font-playfair text-xl font-bold text-white">Redeem Points</h1>
        </div>

        {rewards && (
          <p className="text-white/40 text-sm mb-6 ml-12">
            Balance: <span className="text-[#D4AF37] font-semibold">{rewards.krown_points.toLocaleString()} pts</span>
          </p>
        )}

        {/* Voucher success banner */}
        <AnimatePresence>
          {voucherCode && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-6 flex items-center justify-between"
            >
              <div>
                <p className="text-green-400 text-xs font-semibold mb-1">Your Voucher Code</p>
                <p className="text-white font-mono font-bold text-lg">{voucherCode}</p>
              </div>
              <button onClick={copyCode} className="p-2 rounded-lg bg-green-500/20 text-green-400">
                {copied ? <CheckCircle size={18} /> : <Copy size={18} />}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-xl" />)}
          </div>
        ) : options.length === 0 ? (
          <EmptyState icon="Gift" title="No redemption options" subtitle="Check back later" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {options.map((option, i) => (
              <motion.button
                key={option.option_id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                onClick={() => option.is_available && setSelected(option)}
                disabled={!option.is_available || (rewards?.krown_points ?? 0) < option.points_required}
                className={`text-left bg-[#1E1E1E] border rounded-xl p-4 transition-all ${
                  option.is_available && (rewards?.krown_points ?? 0) >= option.points_required
                    ? 'border-[#2A2A2A] hover:border-[#800020] cursor-pointer'
                    : 'border-[#2A2A2A] opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Gift size={16} className="text-[#800020]" />
                  {option.partner_name && <span className="text-white/40 text-xs">{option.partner_name}</span>}
                </div>
                <p className="text-white font-semibold text-sm mb-1">{option.title}</p>
                {option.description && <p className="text-white/50 text-xs mb-3">{option.description}</p>}
                {option.value && <p className="text-green-400 text-xs mb-2">Worth {formatCurrency(option.value)}</p>}
                <div className="flex items-center justify-between">
                  <span className="text-[#D4AF37] text-sm font-bold">{option.points_required} pts</span>
                  {!option.is_available && <span className="text-white/30 text-xs">Unavailable</span>}
                  {option.is_available && (rewards?.krown_points ?? 0) < option.points_required && (
                    <span className="text-red-400 text-xs">Need more pts</span>
                  )}
                </div>
              </motion.button>
            ))}
          </div>
        )}

        {/* Confirm modal */}
        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 bg-black/60"
              onClick={() => setSelected(null)}
            >
              <motion.div
                initial={{ y: 60 }}
                animate={{ y: 0 }}
                exit={{ y: 60 }}
                className="bg-[#1E1E1E] border border-[#2A2A2A] rounded-2xl p-6 w-full max-w-sm"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="font-playfair font-bold text-white text-lg mb-1">Confirm Redemption</h3>
                <p className="text-white/50 text-sm mb-4">You&apos;re about to redeem <strong className="text-white">{selected.points_required} points</strong> for:</p>
                <div className="bg-[#111] rounded-xl p-3 mb-6">
                  <p className="text-white font-semibold">{selected.title}</p>
                  {selected.partner_name && <p className="text-white/50 text-xs">{selected.partner_name}</p>}
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setSelected(null)} className="flex-1 py-2.5 border border-[#2A2A2A] text-white/60 rounded-xl text-sm">
                    Cancel
                  </button>
                  <button
                    onClick={handleRedeem}
                    disabled={redeemMutation.isPending}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#800020] text-white rounded-xl text-sm hover:bg-[#C11E38] disabled:opacity-50"
                  >
                    {redeemMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                    Redeem
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
