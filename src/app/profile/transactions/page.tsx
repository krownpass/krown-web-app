'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { useTransactions } from '@/queries/useUser';
import { formatDate, formatCurrency, getStatusColor } from '@/lib/utils';

type TxFilter = 'all' | 'dining' | 'krown';

export default function TransactionsPage() {
  const router = useRouter();
  const { data: transactions = [], isLoading } = useTransactions();
  const [filter, setFilter] = useState<TxFilter>('all');

  const filtered = transactions.filter((t) => filter === 'all' || t.type === filter);

  return (
    <ProtectedRoute>
      <div className="max-w-lg mx-auto px-4 md:px-6 py-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="p-2 rounded-xl bg-[#1E1E1E] border border-[#2A2A2A] text-white/60">
            <ArrowLeft size={18} />
          </button>
          <h1 className="font-playfair text-xl font-bold text-white">Transaction History</h1>
        </div>

        <div className="flex gap-2 mb-6">
          {(['all', 'dining', 'krown'] as TxFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-xs px-3 py-1.5 rounded-full border capitalize transition-all ${filter === f ? 'bg-[#800020] border-[#800020] text-white' : 'border-[#2A2A2A] text-white/50'}`}
            >
              {f}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon="Receipt" title="No transactions" subtitle="Your transactions will appear here" />
        ) : (
          <div className="space-y-2">
            {filtered.map((tx, i) => (
              <motion.div
                key={tx.transaction_id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center gap-3 p-3.5 bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl"
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${tx.amount > 0 ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                  {tx.amount > 0
                    ? <ArrowDownLeft size={16} className="text-green-400" />
                    : <ArrowUpRight size={16} className="text-red-400" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm truncate">{tx.description}</p>
                  <p className="text-white/40 text-xs">{formatDate(tx.created_at)}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`text-sm font-semibold ${tx.amount > 0 ? 'text-green-400' : 'text-white'}`}>
                    {tx.amount > 0 ? '+' : ''}{formatCurrency(Math.abs(tx.amount))}
                  </p>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full capitalize ${getStatusColor(tx.status)}`}>
                    {tx.status}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
