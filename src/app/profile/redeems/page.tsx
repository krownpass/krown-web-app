'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, Clock, Copy, CheckCheck } from 'lucide-react';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { useRedeems } from '@/queries/useUser';
import { formatDate, formatTime } from '@/lib/utils';
import { isToday, isYesterday, differenceInMinutes } from 'date-fns';

// ─── Types ────────────────────────────────────────────────────────────────────

type Redeem = {
  redeem_id: string;
  redeem_code: string;
  cafe_name?: string;
  cafe_id: string;
  item_name?: string;
  item_id: string;
  is_redeemed: boolean;
  created_at: string;
  updated_at: string;
  expires_at?: string;
};

type FilterType = 'all' | 'pending' | 'confirmed';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getExpiryDisplay(expiresAt?: string): { label: string; urgent: boolean } | null {
  if (!expiresAt) return null;
  const now = new Date();
  const expiry = new Date(expiresAt);
  const mins = differenceInMinutes(expiry, now);
  if (mins <= 0) return { label: 'Expired', urgent: true };
  if (mins < 60) return { label: `${mins}m remaining`, urgent: mins < 10 };
  const hours = Math.floor(mins / 60);
  if (hours < 24) return { label: `${hours}h remaining`, urgent: false };
  return { label: `${Math.floor(hours / 24)}d remaining`, urgent: false };
}

function groupByDate(redeems: Redeem[]) {
  const groups: Record<string, Redeem[]> = {};
  for (const r of redeems) {
    const d = new Date(r.created_at);
    let key = formatDate(r.created_at);
    if (isToday(d)) key = 'Today';
    else if (isYesterday(d)) key = 'Yesterday';
    if (!groups[key]) groups[key] = [];
    groups[key].push(r);
  }
  return Object.entries(groups).map(([title, data]) => ({ title, data }));
}

// ─── Copy Button ──────────────────────────────────────────────────────────────

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <button
      onClick={handleCopy}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-medium transition-all duration-300
        ${copied
          ? 'bg-[#22C55E]/10 border-[#22C55E]/30 text-[#22C55E]'
          : 'bg-white/[0.04] border-white/[0.08] text-white/50 hover:text-white hover:border-white/20 hover:bg-white/[0.08]'
        }`}
    >
      {copied
        ? <><CheckCheck size={12} /> Copied</>
        : <><Copy size={12} /> Copy</>
      }
    </button>
  );
}

// ─── Pending Redeem Card ──────────────────────────────────────────────────────
// Code is always visible — no tapping required

function PendingRedeemCard({ redeem, index }: { redeem: Redeem; index: number }) {
  const expiry = getExpiryDisplay(redeem.expires_at);
  const isExpired = expiry?.label === 'Expired';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.4), duration: 0.3 }}
      className={`rounded-[1.25rem] border overflow-hidden
        ${isExpired
          ? 'border-white/[0.05] bg-white/[0.01] opacity-60'
          : expiry?.urgent
          ? 'border-[#EF4444]/25 bg-[#EF4444]/[0.03]'
          : 'border-[#FBBF24]/20 bg-[#FBBF24]/[0.02]'
        }`}
    >
      {/* Header row */}
      <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-white font-medium text-[15px] tracking-wide truncate">
            {redeem.item_name ?? 'Redeemed Drink'}
          </p>
          <p className="text-white/40 text-xs mt-0.5 font-light truncate">
            {redeem.cafe_name ?? `Cafe · ${redeem.cafe_id.slice(0, 8)}`}
          </p>
        </div>
        <div className="shrink-0 flex flex-col items-end gap-1">
          <span className={`text-[10px] font-bold uppercase tracking-[0.12em] flex items-center gap-1
            ${isExpired ? 'text-white/30' : expiry?.urgent ? 'text-[#EF4444]' : 'text-[#FBBF24]'}`}>
            <Clock size={10} />
            {isExpired ? 'Expired' : 'Pending'}
          </span>
          {expiry && !isExpired && (
            <span className={`text-[10px] font-light ${expiry.urgent ? 'text-[#EF4444]/80' : 'text-white/30'}`}>
              {expiry.label}
            </span>
          )}
        </div>
      </div>

      {/* Code block — always visible */}
      <div className={`mx-3 mb-3 rounded-[0.875rem] border px-4 py-3.5 flex items-center justify-between gap-3
        ${isExpired
          ? 'bg-white/[0.02] border-white/[0.04]'
          : expiry?.urgent
          ? 'bg-[#EF4444]/[0.06] border-[#EF4444]/20'
          : 'bg-white/[0.04] border-white/[0.08]'
        }`}
      >
        <div>
          <p className="text-white/30 text-[9px] uppercase tracking-[0.15em] font-semibold mb-1.5">
            Redemption Code
          </p>
          <p className={`font-mono font-bold tracking-[0.25em] text-xl leading-none
            ${isExpired ? 'text-white/20' : expiry?.urgent ? 'text-[#EF4444]' : 'text-white'}`}>
            {redeem.redeem_code ?? '——'}
          </p>
        </div>
        {!isExpired && redeem.redeem_code && (
          <CopyButton value={redeem.redeem_code} />
        )}
      </div>

      {/* Footer: date */}
      <div className="px-4 pb-3">
        <p className="text-white/20 text-[10px] font-light tracking-wide">
          Initiated {formatDate(redeem.created_at)} at {formatTime(redeem.created_at)}
        </p>
      </div>
    </motion.div>
  );
}

// ─── Confirmed Redeem Card ────────────────────────────────────────────────────
// Expandable — code shown with "already used" context

function ConfirmedRedeemCard({ redeem, index }: { redeem: Redeem; index: number }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.4), duration: 0.3 }}
    >
      <div
        onClick={() => setExpanded((v) => !v)}
        className={`rounded-[1.25rem] border cursor-pointer transition-all duration-300 overflow-hidden
          ${expanded
            ? 'border-[#22C55E]/30 bg-[#22C55E]/[0.03]'
            : 'border-white/[0.05] bg-white/[0.02] hover:border-white/[0.1] hover:bg-white/[0.03]'
          }`}
      >
        {/* Main row */}
        <div className="p-4 flex items-center gap-4">
          <div className="w-11 h-11 rounded-[0.875rem] flex items-center justify-center shrink-0 border bg-[#22C55E]/10 border-[#22C55E]/20">
            <Check size={18} className="text-[#22C55E]" strokeWidth={2.5} />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-white font-medium text-[15px] tracking-wide truncate">
              {redeem.item_name ?? 'Redeemed Drink'}
            </p>
            <p className="text-white/40 text-xs mt-0.5 font-light tracking-wide truncate">
              {redeem.cafe_name ?? `Cafe · ${redeem.cafe_id.slice(0, 8)}`}
            </p>
          </div>

          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#22C55E] flex items-center gap-1">
              <Check size={10} strokeWidth={3} /> Confirmed
            </span>
            <span className="text-white/30 text-[10px] font-light tracking-wide">
              {formatDate(redeem.updated_at)}
            </span>
          </div>
        </div>

        {/* Expanded: code + timestamps */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mx-4 mb-4 pt-3 border-t border-white/[0.05] space-y-4">
                {/* Code block */}
                {redeem.redeem_code && (
                  <div className="bg-white/[0.02] border border-white/[0.06] rounded-[0.875rem] px-4 py-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-white/30 text-[9px] uppercase tracking-[0.15em] font-semibold mb-1.5">
                        Code Used
                      </p>
                      <p className="font-mono font-bold tracking-[0.25em] text-lg text-white/50 leading-none">
                        {redeem.redeem_code}
                      </p>
                    </div>
                    <span className="text-[10px] text-white/20 font-light tracking-wide border border-white/[0.06] px-2.5 py-1 rounded-full">
                      Used
                    </span>
                  </div>
                )}

                {/* Timestamps */}
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                  <div>
                    <p className="text-white/30 text-[10px] uppercase tracking-[0.12em] font-semibold mb-1">Initiated</p>
                    <p className="text-white/50 text-xs">{formatDate(redeem.created_at)} at {formatTime(redeem.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-white/30 text-[10px] uppercase tracking-[0.12em] font-semibold mb-1">Confirmed</p>
                    <p className="text-white/50 text-xs">{formatDate(redeem.updated_at)} at {formatTime(redeem.updated_at)}</p>
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RedeemedDrinksPage() {
  const router = useRouter();
  const { data: redeems = [], isLoading } = useRedeems();
  const [filter, setFilter] = useState<FilterType>('all');

  const filtered = useMemo(() => {
    if (filter === 'pending') return redeems.filter((r: Redeem) => !r.is_redeemed);
    if (filter === 'confirmed') return redeems.filter((r: Redeem) => r.is_redeemed);
    return redeems;
  }, [redeems, filter]);

  const grouped = useMemo(() => groupByDate(filtered as Redeem[]), [filtered]);

  const confirmedCount = redeems.filter((r: Redeem) => r.is_redeemed).length;
  const pendingCount = redeems.filter((r: Redeem) => !r.is_redeemed).length;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#0A0A0A] pb-20 font-sans">

        {/* Sticky Header */}
        <div className="bg-[#0A0A0A] border-b border-white/[0.05] pt-12 pb-6 px-4 sm:px-6 sticky top-0 z-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-[#800020]/10 to-transparent pointer-events-none" />
          <div className="max-w-xl mx-auto relative">
            <div className="flex items-center gap-4 mb-8">
              <button
                onClick={() => router.back()}
                className="w-10 h-10 rounded-full bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.08] hover:border-white/[0.1] text-white flex items-center justify-center transition-all shadow-lg backdrop-blur-md"
              >
                <ArrowLeft size={18} strokeWidth={2.5} />
              </button>
              <h1 className="text-2xl font-playfair font-bold text-white tracking-tight">
                Redeemed Drinks
              </h1>
            </div>

            {/* Summary Card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] rounded-3xl p-6 shadow-2xl relative overflow-hidden"
            >
              <p className="text-white/40 text-xs font-semibold tracking-[0.15em] uppercase mb-3">Redemption Summary</p>
              <div className="flex items-end gap-6">
                <div>
                  <p className="text-3xl font-bold text-white tracking-tight">{redeems.length}</p>
                  <p className="text-white/40 text-xs font-light mt-1">Total</p>
                </div>
                <div className="w-px h-10 bg-white/[0.06]" />
                <div>
                  <p className="text-2xl font-bold text-[#22C55E]">{confirmedCount}</p>
                  <p className="text-white/40 text-xs font-light mt-1">Confirmed</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#FBBF24]">{pendingCount}</p>
                  <p className="text-white/40 text-xs font-light mt-1">Pending</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="max-w-xl mx-auto px-4 sm:px-6 pt-6">

          {/* Filter Pills */}
          <div className="flex gap-2 pb-1 overflow-x-auto hide-scrollbar mb-8">
            {(['all', 'pending', 'confirmed'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`whitespace-nowrap text-sm px-5 py-2.5 rounded-full border transition-all duration-300 font-medium
                  ${filter === f
                    ? 'bg-[#800020] border-[#800020] text-white shadow-[0_0_15px_rgba(128,0,32,0.3)]'
                    : 'bg-white/[0.02] border-white/[0.05] text-white/60 hover:text-white hover:bg-white/[0.05]'}`}
              >
                {f === 'all' ? 'All' : f === 'pending' ? 'Pending' : 'Confirmed'}
              </button>
            ))}
          </div>

          {/* List */}
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-[120px] rounded-[1.25rem] bg-white/[0.02]" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-12">
              <EmptyState
                icon="Coffee"
                title="No redeems found"
                subtitle={filter === 'all'
                  ? 'Visit a Krown cafe and redeem a drink to get started'
                  : `No ${filter} redeems yet`}
              />
            </motion.div>
          ) : (
            <div className="space-y-8">
              {grouped.map((group) => (
                <div key={group.title}>
                  <h3 className="text-white/40 text-[11px] font-bold uppercase tracking-[0.2em] mb-4 ml-1">
                    {group.title}
                  </h3>
                  <div className="space-y-3">
                    {group.data.map((redeem, i) =>
                      redeem.is_redeemed
                        ? <ConfirmedRedeemCard key={redeem.redeem_id} redeem={redeem} index={i} />
                        : <PendingRedeemCard key={redeem.redeem_id} redeem={redeem} index={i} />
                    )}
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
