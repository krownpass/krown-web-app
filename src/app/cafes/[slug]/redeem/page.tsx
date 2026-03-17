'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Check, X } from 'lucide-react';
import Image from 'next/image';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { useCafeDetail, useCafeMenu } from '@/queries/useCafeDetail';
import { useProfile } from '@/queries/useUser';
import { rewardsService } from '@/services/rewards.service';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';
import { KrownMembershipModal } from '@/components/modals/KrownMembershipModal';
import { DrinkRedemptionSuccess } from '@/components/animations/DrinkRedemptionSuccess';

export default function RedeemDrinkPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const { data: profile, refetch: refetchProfile } = useProfile();
  const { data: cafe } = useCafeDetail(params.slug);
  const { data: menu = [] } = useCafeMenu(cafe?.cafe_id ?? '');

  const redeemableItems = menu.flatMap((c: any) => c.items || []).filter((item: any) => item.is_recommended && item.is_available);

  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [redeemSuccessData, setRedeemSuccessData] = useState<any | null>(null);
  const [showAnimation, setShowAnimation] = useState(false);
  const [showSuccessContent, setShowSuccessContent] = useState(false);
  const [redeemError, setRedeemError] = useState<string | null>(null);
  const [showKrownModal, setShowKrownModal] = useState(false);
  const [plansLoaded, setPlansLoaded] = useState(false);

  const handleAnimationComplete = useCallback(() => {
    setShowAnimation(false);
    setShowSuccessContent(true);
  }, []);

  useEffect(() => {
    // Left intentionally empty as we fetch on Continue
  }, [selectedItem, user]);

  useEffect(() => {
    const status = searchParams.get('status');
    const reason = searchParams.get('reason');

    if (status === 'success') {
      toast.success('Membership Activated! You can now redeem drinks.');
      refetchProfile();
      
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    } else if (status === 'failed' || status === 'error' || status === 'cancelled') {
        let errorMsg = 'Payment cancelled or failed. Please try again.';
        if (reason === 'session_expired') errorMsg = 'Your session expired. Please try again.';
        toast.error(errorMsg);
        
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
    }
  }, [searchParams, refetchProfile]);

  const handleSelectItem = (item: any) => {
    setSelectedItem(item);
  };

  const performRedemption = async (planToUse: any) => {
    if (!selectedItem || !planToUse || !cafe) return;
    setIsProcessing(true);
    try {
      const res = await rewardsService.redeemDrink({
        cafeId: cafe.cafe_id,
        itemId: selectedItem.item_id,
        userSubscriptionId: planToUse.id,
      });
      setRedeemSuccessData(res);
      setShowAnimation(true);
    } catch (err: any) {
      setRedeemError(err?.response?.data?.message || 'Failed to redeem drink');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleContinue = () => {
    if (!selectedItem) return;
    const isMember = profile?.has_krown_pass || user?.has_krown_pass;
    if (!isMember) {
      setShowKrownModal(true);
      return;
    }
    setLoadingPlans(true);
    rewardsService.getRedemptionOptions()
      .then((res: any) => {
        if (Array.isArray(res) && res.length === 1) {
          setSelectedPlan(res[0]);
          performRedemption(res[0]);
        } else {
          setPlans(res);
          setPlansLoaded(true);
        }
      })
      .catch(() => toast.error('Failed to load plans'))
      .finally(() => setLoadingPlans(false));
  };

  const handleRedeem = () => {
    performRedemption(selectedPlan);
  };

  if (redeemError) {
    return (
      <ProtectedRoute>
        <div className="max-w-2xl mx-auto px-4 py-16 min-h-screen flex flex-col items-center justify-center text-center">
          <style>{`
            @keyframes scaleIn {
              0% { transform: scale(0); opacity: 0; }
              60% { transform: scale(1.1); opacity: 1; }
              100% { transform: scale(1); opacity: 1; }
            }
            .animate-scale-in {
              animation: scaleIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }
          `}</style>

          <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mb-6 animate-scale-in">
            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.5)]">
              <X size={32} className="text-white" strokeWidth={3} />
            </div>
          </div>
          
          <h1 className="text-3xl font-playfair font-bold text-white mb-4 animate-scale-in" style={{ animationDelay: '0.1s', opacity: 0 }}>
            Redemption Failed
          </h1>
          
          <p className="text-white/60 mb-12 text-lg max-w-sm animate-scale-in" style={{ animationDelay: '0.2s', opacity: 0 }}>
            {redeemError}
          </p>

          <div className="w-full max-w-sm flex flex-col gap-4 animate-scale-in" style={{ animationDelay: '0.3s', opacity: 0 }}>
            <button 
              onClick={() => {
                setRedeemError(null);
                router.push(`/cafes/${params.slug}`);
              }}
              className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white py-4 rounded-xl font-semibold hover:border-white/40 transition-all"
            >
              Back to Cafe
            </button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (redeemSuccessData) {
    return (
      <ProtectedRoute>
        <>
          <DrinkRedemptionSuccess
            show={showAnimation}
            onComplete={handleAnimationComplete}
          />

          {showSuccessContent && (
            <div className="max-w-2xl mx-auto px-4 py-8 min-h-screen flex flex-col items-center justify-center text-center">
              <style>{`
                @keyframes scaleIn {
                  0% { transform: scale(0); opacity: 0; }
                  60% { transform: scale(1.1); opacity: 1; }
                  100% { transform: scale(1); opacity: 1; }
                }
                .animate-scale-in {
                  animation: scaleIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
              `}</style>

              <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mb-6 animate-scale-in">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(34,197,94,0.5)]">
                  <Check size={32} className="text-white" strokeWidth={3} />
                </div>
              </div>
              
              <h1 className="text-3xl font-playfair font-bold text-white mb-2 animate-scale-in" style={{ animationDelay: '0.1s', opacity: 0 }}>
                Drink Redeemed!
              </h1>
              <p className="text-green-400 mb-8 animate-scale-in" style={{ animationDelay: '0.2s', opacity: 0 }}>
                Success. Show this code to the staff.
              </p>
              
              <div className="bg-[#1A1A1A] border border-[#333333] p-8 rounded-2xl w-full max-w-sm mb-8 text-center flex flex-col items-center animate-scale-in" style={{ animationDelay: '0.3s', opacity: 0 }}>
                <span className="text-[13px] text-[#9CA3AF] mb-3 uppercase tracking-wider">Redemption Code</span>
                <div className="text-5xl font-bold text-white tracking-[0.2em] mb-4 font-poppins">
                  {redeemSuccessData.redeem_code 
                    ? `${redeemSuccessData.redeem_code.slice(0, 4)} ${redeemSuccessData.redeem_code.slice(4)}`
                    : (redeemSuccessData.code || '— — —')}
                </div>
                <div className="text-md text-white font-medium mb-1">{selectedItem?.name}</div>
                <div className="text-sm text-[#9CA3AF] bg-[#2A2A2A] px-3 py-1 rounded-full mt-2">{cafe?.name}</div>
              </div>

              <div className="text-center mb-8 animate-scale-in" style={{ animationDelay: '0.4s', opacity: 0 }}>
                <p className="text-[#9CA3AF] text-sm">Valid for the next 10 minutes</p>
              </div>

              <button 
                onClick={() => router.push(`/cafes/${params.slug}`)}
                className="w-full max-w-sm bg-[#800020] text-white py-4 rounded-xl font-semibold hover:bg-[#A00028] transition-all animate-scale-in"
                style={{ animationDelay: '0.5s', opacity: 0 }}
              >
                Done
              </button>
            </div>
          )}
        </>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="max-w-2xl mx-auto px-4 md:px-6 py-6 min-h-screen pb-40 md:pb-32">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => {
            if (plansLoaded) {
              setPlansLoaded(false);
              setSelectedPlan(null);
            } else if (selectedItem) {
              setSelectedItem(null);
            } else {
              router.push(`/cafes/${params.slug}`);
            }
          }} className="p-2 rounded-xl bg-[#1E1E1E] border border-[#2A2A2A] text-white/60">
            <ArrowLeft size={18} />
          </button>
          <h1 className="font-playfair text-xl font-bold text-white">
             {plansLoaded ? 'Choose your plan' : 'Redeem a Drink'}
          </h1>
        </div>

        {!plansLoaded ? (
          <div className="space-y-4">
            <p className="text-white/60 text-sm mb-4">Select an eligible drink to redeem at {cafe?.name}</p>
            {redeemableItems.length === 0 ? (
              <div className="text-center text-white/40 border border-[#2A2A2A] p-8 rounded-2xl">
                No redeemable items available at this cafe.
              </div>
            ) : (
               redeemableItems.map((item: any) => (
                <div 
                  key={item.item_id}
                  onClick={() => handleSelectItem(item)}
                  className={`flex items-center gap-4 bg-[#181818] border p-4 rounded-2xl cursor-pointer transition-all ${
                    selectedItem?.item_id === item.item_id 
                      ? 'border-[#800020]' 
                      : 'border-[#2A2A2A] hover:border-[#800020]/50'
                  }`}
                >
                  {item.image_url ? (
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0">
                      <Image quality={90} src={item.image_url} alt={item.name} fill className="object-cover" />
                    </div>
                  ) : (
                    <div className="relative w-16 h-16 rounded-xl bg-[#2A2A2A] shrink-0 flex items-center justify-center text-white/20 text-xs">No img</div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-white">{item.name}</h3>
                    <p className="text-xs text-white/50">{item.category}</p>
                  </div>
                  {selectedItem?.item_id === item.item_id && (
                    <div className="w-5 h-5 rounded-full bg-[#800020] flex items-center justify-center shrink-0">
                      <Check size={12} className="text-white" />
                    </div>
                  )}
                </div>
              ))
            )}

            {!plansLoaded && (
              <div className="fixed bottom-10 md:bottom-0 left-0 right-0 p-4 pb-8 bg-[#0B0B0B] border-t border-[#2A2A2A] z-10">
                <div className="max-w-2xl mx-auto">
                  <button
                    disabled={!selectedItem || isProcessing}
                    onClick={handleContinue}
                    className={`w-full flex items-center justify-center bg-[#800020] text-white py-4 rounded-xl font-semibold transition-all ${
                      !selectedItem ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#A00028]'
                    }`}
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}
            
            <KrownMembershipModal 
              isOpen={showKrownModal} 
              onClose={() => setShowKrownModal(false)} 
            />
          </div>
        ) : (
           <div className="space-y-4">
            <p className="text-white/60 text-sm mb-4">Select an active subscription to redeem this drink</p>
            
            <div className="bg-[#181818] border border-[#800020]/50 p-4 rounded-2xl mb-8 flex items-center gap-4 opacity-80 pointer-events-none">
              <div className="flex-1 text-white font-medium">{selectedItem.name}</div>
            </div>

            {loadingPlans ? (
              <div className="text-center py-8 text-white/40">Loading plans...</div>
            ) : plans.length === 0 ? (
              <div className="text-center border border-[#2A2A2A] py-8 rounded-2xl text-white/40">
                You do not have any active plans.
              </div>
            ) : (
              plans.map(plan => (
                <div 
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan)}
                  className={`p-5 rounded-2xl cursor-pointer border transition-all ${
                    selectedPlan?.id === plan.id 
                      ? 'bg-[#800020]/10 border-[#800020]' 
                      : 'bg-[#181818] border-[#2A2A2A] hover:border-white/20'
                  }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-white">{plan.subscription_name}</h3>
                    {selectedPlan?.id === plan.id && <Check size={18} className="text-[#800020]" />}
                  </div>
                  <div className="text-xs py-1 px-2 bg-white/5 rounded-md inline-block text-white/60">
                    {plan.redemption_limit_per_cafe} redemptions / café
                  </div>
                </div>
              ))
            )}
           
            <div className="fixed bottom-20 md:bottom-0 left-0 right-0 p-4 pb-8 bg-[#0B0B0B] border-t border-[#2A2A2A]">
               <div className="max-w-2xl mx-auto">
                 <button
                   disabled={!selectedPlan || isProcessing}
                   onClick={handleRedeem}
                   className="w-full flex items-center justify-center bg-[#800020] text-white py-4 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                 >
                   {isProcessing ? 'Processing...' : 'Continue'}
                 </button>
               </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
