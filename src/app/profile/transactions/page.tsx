'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, ArrowUpRight, ArrowDownLeft, Receipt, 
  ChevronDown, Search, Filter, Calendar as CalendarIcon, 
  Smartphone, CreditCard, Coffee, Sparkles, Check, AlertCircle, Clock
} from 'lucide-react';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { useTransactions } from '@/queries/useUser';
import { formatDate, formatTime, formatCurrency } from '@/lib/utils';
import { format, isToday, isYesterday } from 'date-fns';

type TxFilter = 'all' | 'dineout' | 'subscription' | 'events' | 'success' | 'initiated' | 'failure';

// Helper to normalize status strings to UI presentation
const normalizeStatus = (status: string) => {
  const s = status.toLowerCase();
  if (['success', 'completed', 'paid'].includes(s)) return 'success';
  if (['failed', 'failure', 'error'].includes(s)) return 'failed';
  if (['pending', 'processing', 'initiated', 'created'].includes(s)) return 'pending';
  return 'unknown';
};

const getStatusConfig = (rawStatus: string) => {
  const status = normalizeStatus(rawStatus);
  switch (status) {
    case 'success': return { icon: Check, color: 'text-[#22C55E]', bg: 'bg-[#22C55E]/10', border: 'border-[#22C55E]/20', label: 'Completed' };
    case 'failed': return { icon: AlertCircle, color: 'text-[#EF4444]', bg: 'bg-[#EF4444]/10', border: 'border-[#EF4444]/20', label: 'Failed' };
    case 'pending': return { icon: Clock, color: 'text-[#FBBF24]', bg: 'bg-[#FBBF24]/10', border: 'border-[#FBBF24]/20', label: 'Processing' };
    default: return { icon: AlertCircle, color: 'text-white/40', bg: 'bg-white/5', border: 'border-white/10', label: 'Unknown' };
  }
};

const getSourceIcon = (source: string) => {
  if (source === 'dineout') return <Coffee size={18} className="text-white/70" />;
  if (source === 'events') return <CalendarIcon size={18} className="text-[#ff4d79]" />;
  if (source === 'subscription') return <Sparkles size={18} className="text-[#F5D061]" />;
  return <CreditCard size={18} className="text-white/70" />;
};

function TransactionRow({ tx, i }: { tx: any, i: number }) {
  const [expanded, setExpanded] = useState(false);
  const amount = Number(tx.amount);
  const isPositive = amount > 0;
  const statusConfig = getStatusConfig(tx.status);
  const StatusIcon = statusConfig.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(i * 0.05, 0.5) }}
      className="mb-3"
    >
      <div 
        onClick={() => setExpanded(!expanded)}
        className={`bg-white/[0.02] border transition-all duration-300 rounded-[1.25rem] overflow-hidden cursor-pointer
          ${expanded ? 'border-[#800020]/40 bg-white/[0.04]' : 'border-white/[0.05] hover:border-white/[0.1] hover:bg-white/[0.03]'}`}
      >
        <div className="p-4 flex items-center gap-4">
          <div className={`w-12 h-12 rounded-[1rem] flex items-center justify-center shrink-0 border 
            ${tx.source === 'subscription' 
              ? 'bg-gradient-to-br from-[#800020]/20 to-black border-[#F5D061]/20 shadow-[0_0_15px_rgba(212,175,55,0.1)]' 
              : 'bg-white/[0.03] border-white/[0.05]'}`}
          >
            {getSourceIcon(tx.source)}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-medium text-base truncate tracking-wide">
              {tx.title || (tx.source === 'dineout' ? 'Cafe Payment' : tx.source === 'events' ? 'Event Ticket' : 'Krown Pass')}
            </h3>
            <p className="text-white/40 text-xs mt-1 font-light tracking-wide flex items-center gap-1.5">
              {formatTime(tx.txn_date)}
              <span className="w-1 h-1 rounded-full bg-white/20"></span>
              <span className="capitalize">{tx.source === 'dineout' ? 'Dining' : tx.source === 'events' ? 'Events' : 'Subscription'}</span>
            </p>
          </div>
          
          <div className="text-right flex flex-col items-end">
            <p className={`text-base font-semibold font-sans tracking-wide ${isPositive ? 'text-[#22C55E]' : 'text-white'}`}>
              {isPositive ? '+' : ''}{formatCurrency(Math.abs(amount))}
            </p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className={`text-[10px] uppercase tracking-wider font-semibold ${statusConfig.color}`}>
                {statusConfig.label}
              </span>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 pt-2 border-t border-white/[0.05] mx-4 mt-1">
                <div className="grid grid-cols-2 gap-y-4 gap-x-6 py-2">
                  <div>
                    <p className="text-white/30 text-[10px] uppercase tracking-[0.1em] font-semibold mb-1">Transaction ID</p>
                    <p className="text-white/70 text-xs font-mono break-all">{tx.id || 'N/A'}</p>
                  </div>
                  {tx.razorpay_payment_id && (
                    <div>
                      <p className="text-white/30 text-[10px] uppercase tracking-[0.1em] font-semibold mb-1">Payment Ref</p>
                      <p className="text-white/70 text-xs font-mono break-all">{tx.razorpay_payment_id}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-white/30 text-[10px] uppercase tracking-[0.1em] font-semibold mb-1">Status</p>
                    <div className="flex items-center gap-2">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${statusConfig.bg}`}>
                         <StatusIcon size={10} className={statusConfig.color} />
                      </div>
                      <span className="text-white/70 text-xs capitalize">{rawStatusDisplay(tx.status)}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-white/30 text-[10px] uppercase tracking-[0.1em] font-semibold mb-1">Date & Time</p>
                    <p className="text-white/70 text-xs">{formatDate(tx.txn_date)} at {formatTime(tx.txn_date)}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function rawStatusDisplay(status: string) {
  if (!status) return 'Unknown';
  return status.replace(/_/g, ' ');
}

// Group transactions by date relative strings (Today, Yesterday, Date)
const groupTransactionsByDate = (transactions: any[]) => {
  const groups: Record<string, any[]> = {};
  for (const t of transactions) {
    if (!t.txn_date) continue;
    const d = new Date(t.txn_date);
    let key = formatDate(d);
    if (isToday(d)) key = "Today";
    else if (isYesterday(d)) key = "Yesterday";
    
    if (!groups[key]) groups[key] = [];
    groups[key].push(t);
  }
  return Object.entries(groups).map(([title, data]) => ({ title, data }));
};

export default function TransactionsPage() {
  const router = useRouter();
  const { data: transactions = [], isLoading } = useTransactions();
  const [filter, setFilter] = useState<TxFilter>('all');
  const [statusFilter, setStatusFilter] = useState<TxFilter>('all');

  // Derive total spent from success interactions
  const totalSpent = useMemo(() => {
    return transactions
      .filter((t) => normalizeStatus(t.status) === 'success')
      .reduce((sum, t) => sum + Number(t.amount), 0);
  }, [transactions]);

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      const sourceMatch = filter === 'all' || t.source === filter;
      const statusMatch = statusFilter === 'all' || normalizeStatus(t.status) === statusFilter;
      return sourceMatch && statusMatch;
    });
  }, [transactions, filter, statusFilter]);

  const groupedData = useMemo(() => groupTransactionsByDate(filtered), [filtered]);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#0A0A0A] pb-20 font-sans">
        
        {/* Header Section */}
        <div className="bg-[#0A0A0A] border-b border-white/[0.05] pt-12 pb-6 px-4 sm:px-6 relative overflow-hidden sticky top-0 z-20">
          <div className="absolute inset-0 bg-gradient-to-b from-[#800020]/10 to-transparent pointer-events-none" />
          
          <div className="max-w-xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
              <button 
                onClick={() => router.back()} 
                className="w-10 h-10 rounded-full bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.08] hover:border-white/[0.1] text-white flex items-center justify-center transition-all shadow-lg backdrop-blur-md"
              >
                <ArrowLeft size={18} strokeWidth={2.5} />
              </button>
              <h1 className="text-2xl font-playfair font-bold text-white tracking-tight">
                Transactions
              </h1>
            </div>

            {/* Total Spending Card */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] rounded-3xl p-6 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Receipt size={80} strokeWidth={1} />
              </div>
              <p className="text-white/50 text-xs font-semibold tracking-[0.15em] uppercase mb-2">Total Payments</p>
              <h2 className="text-3xl sm:text-4xl font-sans font-bold text-white tracking-tight mb-2">
                {formatCurrency(totalSpent)}
              </h2>
              <p className="text-white/40 text-sm font-light">Across {transactions.length} total transactions</p>
            </motion.div>
          </div>
        </div>

        <div className="max-w-xl mx-auto px-4 sm:px-6 pt-6">
          
          {/* Filters */}
          <div className="flex flex-col gap-3 mb-8">
            <div className="flex gap-2 pb-1 overflow-x-auto hide-scrollbar">
              {(['all', 'dineout', 'subscription', 'events'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`whitespace-nowrap text-sm px-5 py-2.5 rounded-full border transition-all duration-300 font-medium
                    ${filter === f 
                      ? 'bg-[#800020] border-[#800020] text-white shadow-[0_0_15px_rgba(128,0,32,0.3)]' 
                      : 'bg-white/[0.02] border-white/[0.05] text-white/60 hover:text-white hover:bg-white/[0.05]'}`}
                >
                  {f === 'dineout' ? 'Dining' : f === 'subscription' ? 'Krown Pass' : f === 'events' ? 'Events' : 'All Types'}
                </button>
              ))}
            </div>
            
            <div className="flex gap-2 pb-1 overflow-x-auto hide-scrollbar">
              {(['all', 'success', 'pending', 'failed'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={`whitespace-nowrap text-[11px] uppercase tracking-wider px-4 py-1.5 rounded-full border transition-all duration-300 font-semibold
                    ${statusFilter === f 
                      ? 'bg-white/[0.1] border-white/20 text-white' 
                      : 'bg-transparent border-white/[0.05] text-white/40 hover:text-white/80'}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Transactions List */}
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-[1.25rem] bg-white/[0.02]" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="py-12"
            >
              <EmptyState 
                icon="Receipt" 
                title="No transactions found" 
                subtitle="Adjust your filters or make a payment to see history" 
              />
            </motion.div>
          ) : (
            <div className="space-y-6">
              {groupedData.map((group, groupIndex) => (
                <div key={group.title}>
                  <h3 className="text-white/50 text-[11px] font-bold uppercase tracking-[0.2em] mb-4 ml-1">
                    {group.title}
                  </h3>
                  <div className="space-y-3">
                    {group.data.map((tx, i) => (
                      <TransactionRow key={tx.id} tx={tx} i={i} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
