'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Wine, Clock, RefreshCw, AlertCircle, Ticket } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { useRedemptionHistory } from '@/queries/useRewards';
import type { RedemptionRecord } from '@/types/rewards';

export default function RedeemedDrinksPage() {
  const router = useRouter();
  const { data: redeems, isLoading, isError, refetch } = useRedemptionHistory();
  const [filter, setFilter] = useState<'active' | 'redeemed'>('active');

  const filteredRedeems = React.useMemo(() => {
    if (!redeems) return [];
    if (filter === 'active') {
      return redeems.filter((r) => !r.is_redeemed);
    }
    return redeems.filter((r) => r.is_redeemed);
  }, [redeems, filter]);

  const activeCount = redeems?.filter(r => !r.is_redeemed).length || 0;
  const redeemedCount = redeems?.filter(r => r.is_redeemed).length || 0;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#0A0A0A] pb-24 font-sans selection:bg-[#800020]/30">
        
        {/* Sticky Header */}
        <div className="sticky top-0 z-50 bg-[#0A0A0A]/80 backdrop-blur-xl border-b border-white/[0.05]">
          <div className="max-w-3xl mx-auto px-4 py-4">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => router.push('/profile')}
                  className="w-10 h-10 rounded-full bg-white/[0.03] flex items-center justify-center border border-white/[0.05] hover:bg-white/[0.08] transition-colors"
                >
                  <ChevronLeft size={20} className="text-white" />
                </button>
                <div>
                  <h1 className="text-xl font-playfair font-bold text-white">Redeemed Drinks</h1>
                  <p className="text-sm text-white/50 font-light">Your cafe drink history</p>
                </div>
              </div>

              {/* Status Header Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div 
                  onClick={() => setFilter('active')}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    filter === 'active' 
                      ? 'bg-gradient-to-br from-[#800020]/20 to-transparent border-[#800020]/50' 
                      : 'bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.04]'
                  }`}
                >
                  <p className="text-xs text-white/50 uppercase tracking-wider mb-1 font-medium">Active</p>
                  <div className="flex items-end justify-between">
                    <p className={`text-2xl font-playfair font-bold ${filter === 'active' ? 'text-white' : 'text-white/70'}`}>
                      {isLoading ? <Skeleton className="h-8 w-12 bg-white/10" /> : activeCount}
                    </p>
                    <Wine size={16} className={filter === 'active' ? 'text-[#800020]' : 'text-white/30'} />
                  </div>
                </div>

                <div 
                  onClick={() => setFilter('redeemed')}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    filter === 'redeemed' 
                      ? 'bg-gradient-to-br from-green-900/20 to-transparent border-green-500/50' 
                      : 'bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.04]'
                  }`}
                >
                  <p className="text-xs text-white/50 uppercase tracking-wider mb-1 font-medium">History</p>
                  <div className="flex items-end justify-between">
                    <p className={`text-2xl font-playfair font-bold ${filter === 'redeemed' ? 'text-white' : 'text-white/70'}`}>
                      {isLoading ? <Skeleton className="h-8 w-12 bg-white/10" /> : redeemedCount}
                    </p>
                    <Clock size={16} className={filter === 'redeemed' ? 'text-green-500' : 'text-white/30'} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="max-w-3xl mx-auto px-4 py-8">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
                  <Skeleton className="w-20 h-20 rounded-xl bg-white/10" />
                  <div className="flex-1 space-y-3">
                    <Skeleton className="h-6 w-3/4 bg-white/10" />
                    <Skeleton className="h-4 w-1/2 bg-white/10" />
                    <Skeleton className="h-8 w-1/3 bg-white/10" />
                  </div>
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="text-center py-12 px-4 bg-white/[0.02] rounded-[2rem] border border-white/[0.05]">
              <AlertCircle size={48} className="mx-auto text-red-500/50 mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">Failed to load drinks</h3>
              <p className="text-white/50 mb-6 font-light">There was a problem retrieving your redemption history.</p>
              <Button onClick={() => refetch()} variant="secondary" className="border-white/10 text-white hover:bg-white/5">
                <RefreshCw size={16} className="mr-2" /> Try Again
              </Button>
            </div>
          ) : filteredRedeems.length === 0 ? (
            <div className="text-center py-16 px-4 bg-white/[0.02] rounded-[2rem] border border-white/[0.05] mt-4">
              <div className="w-20 h-20 bg-white/[0.03] rounded-full flex items-center justify-center mx-auto mb-6 border border-white/[0.05]">
                <Wine size={32} className="text-white/30" />
              </div>
              <h3 className="text-xl font-playfair font-medium text-white mb-3">No {filter} drinks</h3>
              <p className="text-white/50 mb-8 max-w-[280px] mx-auto font-light leading-relaxed">
                {filter === 'active' 
                  ? "You don't have any active drink codes right now." 
                  : "You haven't claimed any drinks yet."}
              </p>
              <Button onClick={() => router.push('/cafes')} className="bg-[#800020] hover:bg-[#600018] text-white rounded-xl shadow-lg shadow-[#800020]/20">
                Explore Cafes
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {filteredRedeems.map((item, idx) => (
                  <motion.div
                    key={`${item.redeem_code}-${idx}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2, delay: idx * 0.05 }}
                    className="relative overflow-hidden bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] rounded-2xl p-4 flex gap-4 items-center group hover:bg-white/[0.03] transition-colors"
                  >
                    {!item.is_redeemed && (
                      <div className="absolute top-0 right-0 w-32 h-32 bg-[#800020]/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                    )}

                    {/* Image */}
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-black/50 border border-white/10 flex-shrink-0">
                      {item.image_url ? (
                        <Image 
                          src={item.image_url} 
                          alt={item.item_name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Wine size={24} className="text-white/20" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-medium text-base truncate mb-1">
                        {item.item_name}
                      </h3>
                      <p className="text-white/50 text-sm mb-3 truncate">
                        @ {item.cafe_name}
                      </p>
                      
                      {item.is_redeemed && (
                        <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium">
                          Redeemed
                        </div>
                      )}
                    </div>

                    {!item.is_redeemed && (
                      <div className="flex flex-col gap-2 items-end ml-4">
                        <div className="inline-flex items-center px-5 py-2.5 rounded-xl bg-[#800020]/20 border border-[#800020]/30 w-fit shadow-lg shadow-[#800020]/10">
                          <Ticket size={20} className="text-[#ff4d79] mr-3" />
                          <span className="text-white font-mono text-xl font-bold tracking-[0.2em]">{item.redeem_code}</span>
                        </div>
                        {item.redeem_code_exp_time && (
                          <p className="text-white/40 text-xs uppercase tracking-wider text-right">
                            Valid until {new Date(item.redeem_code_exp_time).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
