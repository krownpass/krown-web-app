'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Gift } from 'lucide-react';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { useRedemptionHistory } from '@/queries/useRewards';
import { formatDate } from '@/lib/utils';

export default function RedemptionHistoryPage() {
  const router = useRouter();
  const { data: history = [], isLoading } = useRedemptionHistory();

  return (
    <ProtectedRoute>
      <div className="max-w-2xl mx-auto px-4 md:px-6 py-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="p-2 rounded-xl bg-[#1E1E1E] border border-[#2A2A2A] text-white/60">
            <ArrowLeft size={18} />
          </button>
          <h1 className="font-playfair text-xl font-bold text-white">Redemption History</h1>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
          </div>
        ) : history.length === 0 ? (
          <EmptyState icon="Gift" title="No redemptions yet" subtitle="Redeem your points for exciting rewards" actionLabel="Redeem Now" onAction={() => router.push('/rewards')} />
        ) : (
          <div className="space-y-3">
            {history.map((record, i) => (
              <motion.div
                key={record.redeem_code}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-4 p-4 bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl"
              >
                <div className="w-10 h-10 rounded-xl bg-[#800020]/10 flex items-center justify-center flex-shrink-0">
                  <Gift size={18} className="text-[#800020]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm truncate">{record.item_name ?? 'Redemption'}</p>
                  <p className="text-white/40 text-xs">{formatDate(record.updated_at)}</p>
                  {record.voucher_code && (
                    <p className="text-green-400 text-xs font-mono mt-0.5">{record.voucher_code}</p>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-red-400 text-sm font-semibold">-{record.points_used ?? 0} pts</p>
                  <Badge variant={record.is_redeemed ? 'success' : 'warning'} className="mt-1">
                    {record.is_redeemed ? "completed" : "pending"}
                  </Badge>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
