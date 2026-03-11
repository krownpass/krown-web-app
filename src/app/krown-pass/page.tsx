'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useProfile } from '@/queries/useUser';
import { rewardsService } from '@/services/rewards.service';
import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';
import { 
  Crown, Check, ExternalLink, Percent, Star, Coffee, 
  Zap, Headphones, ArrowLeft, ChevronRight 
} from 'lucide-react';
import { KROWN_PASS_BENEFITS } from '@/lib/constants';

const iconMap: Record<string, React.ReactNode> = {
  Percent: <Percent size={24} />,
  Crown: <Crown size={24} />,
  Star: <Star size={24} />,
  Coffee: <Coffee size={24} />,
  Zap: <Zap size={24} />,
  Headphones: <Headphones size={24} />,
};

export default function KrownPassPage() {
  const router = useRouter();
  const { token } = useAuthStore();
  const [redirecting, setRedirecting] = useState(false);
  const { data: profile, isLoading: profileLoading } = useProfile();
  const [activePlans, setActivePlans] = useState<any[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);

  useEffect(() => {
    if (profile?.has_krown_pass) {
      setLoadingPlans(true);
      rewardsService.getRedemptionOptions()
        .then(res => {
          if (Array.isArray(res)) setActivePlans(res);
        })
        .finally(() => setLoadingPlans(false));
    }
  }, [profile?.has_krown_pass]);

  const handleManageMembership = async () => {
    if (redirecting) return;
    setRedirecting(true);

    try {
      const WEB_DOMAIN = process.env.NEXT_PUBLIC_APP_URL || 'https://krownpass.com';
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.krownpass.com';
      
      const currentUrl = encodeURIComponent(window.location.href);
      let targetUrl = `${WEB_DOMAIN}/plans?source=web&redirect_url=${currentUrl}`;
      
      if (token) {
        try {
          const res = await fetch(`${API_BASE_URL}/api/auth/web-login-token`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          });
          
          if (res.ok) {
            const data = await res.json();
            if (data?.success && data?.token) {
              targetUrl = `${WEB_DOMAIN}/api/auth/session?token=${data.token}&source=web&redirect_url=${currentUrl}`;
            }
          }
        } catch {
          // fallback to standard URL
        }
      }

      window.location.href = targetUrl;
    } catch (err: any) {
      toast.error('Could not open website');
      setRedirecting(false);
    }
  };

  if (profileLoading || loadingPlans) {
    return (
      <div className="min-h-screen bg-[#0B0B0B] text-[#D4AF37] flex flex-col items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}>
          <Crown size={40} />
        </motion.div>
        <p className="mt-4 text-white/50 text-sm font-playfair tracking-widest">VERIFYING ACCESS</p>
      </div>
    );
  }

  // Active User UI
  if (profile?.has_krown_pass && activePlans.length > 0) {
    return (
      <div className="min-h-dvh bg-[#0B0B0B] text-white pb-10 selection:bg-[#800020] selection:text-white relative overflow-x-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#D4AF37]/10 rounded-full blur-[120px] pointer-events-none -translate-y-1/2 translate-x-1/3" />
        
        {/* Navbar */}
        <nav className="relative z-50 pt-8 px-6">
          <button 
            onClick={() => router.back()} 
            className="group flex items-center justify-center w-10 h-10 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300"
          >
            <ArrowLeft size={18} className="text-white/70 group-hover:text-white transition-colors" />
          </button>
        </nav>

        <div className="max-w-3xl mx-auto px-6 pt-10 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-semibold uppercase tracking-widest mb-4">
              <Check size={14} /> Active Member
            </div>
            
            <h1 className="text-4xl md:text-5xl font-playfair font-bold text-white mb-2">
              Your Subscriptions
            </h1>
            <p className="text-white/50 mb-10">Manage your active Krown passes and benefits.</p>

            <div className="space-y-6">
              {activePlans.map((plan, i) => (
                <motion.div 
                  key={plan.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="relative p-[1px] rounded-3xl bg-gradient-to-br from-[#D4AF37]/40 via-white/5 to-[#800020]/20 overflow-hidden"
                >
                  <div className="bg-[#121212] rounded-3xl p-8 h-full w-full relative overflow-hidden">
                    <div className="absolute top-0 right-0 opacity-5 -translate-y-8 translate-x-8">
                       <Crown size={180} />
                    </div>
                    
                    <div className="relative z-10">
                      <div className="flex justify-between items-start mb-8">
                        <div>
                           <div className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-1">Pass Type</div>
                           <h3 className="text-3xl font-playfair font-bold text-[#D4AF37]">{plan.subscription_name}</h3>
                        </div>
                        <span className="bg-green-500/10 text-green-400 border border-green-500/20 text-[10px] px-2 py-1 rounded uppercase tracking-wider font-bold">
                          Live
                        </span>
                      </div>

                      <div className="flex flex-col md:flex-row gap-6 md:gap-12 pb-8 border-b border-white/10 mb-8">
                        <div>
                           <div className="text-white/40 text-xs uppercase tracking-wider mb-1 flex items-center gap-2"><Coffee size={14} /> Limit per cafe</div>
                           <div className="text-xl font-medium text-white">{plan.redemption_limit_per_cafe} Drinks</div>
                        </div>
                        <div>
                           <div className="text-white/40 text-xs uppercase tracking-wider mb-1 flex items-center gap-2"><Zap size={14} /> Validity</div>
                           <div className="text-xl font-medium text-white">{plan.valid_days} Days</div>
                        </div>
                        <div>
                           <div className="text-white/40 text-xs uppercase tracking-wider mb-1 flex items-center gap-2"><Star size={14} /> Expires</div>
                           <div className="text-xl font-medium text-white">
                             {plan.end_date ? new Date(plan.end_date).toLocaleDateString('en-GB') : 'N/A'}
                           </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                         <div className="font-mono text-white/30 tracking-[0.3em] text-sm">
                           ID: {plan.id ? String(plan.id).split('-')[0].toUpperCase() : 'KROWN-VIP'}
                         </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Marketing UI (Original return statement)
  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white selection:bg-[#800020] selection:text-white pb-20">
      {/* Navbar overlay */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0B0B0B]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <button 
            onClick={() => router.back()} 
            className="group flex items-center justify-center w-10 h-10 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300"
          >
            <ArrowLeft size={18} className="text-white/70 group-hover:text-white transition-colors" />
          </button>
          <div className="font-playfair font-bold tracking-widest text-[#D4AF37] text-sm uppercase">
            Membership
          </div>
          <div className="w-10" /> {/* Spacer */}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Abstract Background Glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#800020]/20 rounded-full blur-[120px] opacity-50 mix-blend-screen pointer-events-none" />
        
        <div className="max-w-5xl mx-auto flex flex-col lg:flex-row items-center justify-center gap-16 relative z-10">
          
          {/* Left Text */}
          <motion.div 
            className="flex-1 text-center lg:text-left"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#800020]/10 border border-[#800020]/30 text-[#D4AF37] text-xs font-semibold uppercase tracking-widest mb-6"
            >
              <Crown size={14} /> The Ultimate Access
            </motion.div>
            
            <h1 className="text-5xl md:text-7xl font-playfair font-bold text-white mb-6 leading-[1.1]">
              Elevate your <br className="hidden lg:block" />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#D4AF37] via-[#FFF3B0] to-[#D4AF37]">
                lifestyle.
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-white/50 mb-10 max-w-xl mx-auto lg:mx-0 font-light leading-relaxed">
              Unlock exclusive privileges, complimentary drinks, priority access, and seamless bookings at the finest cafés and events in the city.
            </p>

            <motion.button
              onClick={handleManageMembership}
              disabled={redirecting}

              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center justify-center gap-3 bg-[#800020] text-white px-8 py-4 rounded-full font-medium text-lg hover:shadow-[0_0_30px_rgba(128,0,32,0.4)] transition-shadow duration-300"
            >
              {redirecting ? 'Redirecting...' : 'Explore Pricing'} <ChevronRight size={20} />
            </motion.button>
          </motion.div>

          {/* Right Card (3D visual representation) */}
          <motion.div 
            className="flex-1 relative w-full max-w-[400px]"
            initial={{ opacity: 0, x: 40, rotateY: -10 }}
            animate={{ opacity: 1, x: 0, rotateY: 0 }}
            transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* The Pass */}
            <div className="relative aspect-[1/1.5] w-full rounded-3xl p-[2px] bg-gradient-to-b from-[#D4AF37]/50 via-transparent to-[#800020]/50 shadow-2xl shadow-[#800020]/20 overflow-hidden transform-gpu">
              <div className="absolute inset-0 bg-[#121212] rounded-3xl overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-[#800020]/40 to-transparent rounded-full blur-[60px] -translate-y-1/2 translate-x-1/3" />
                <div className="absolute bottom-0 text-[#D4AF37]/5 -left-10 transform -rotate-12 select-none">
                   <Crown size={300} />
                </div>
                
                <div className="relative h-full flex flex-col justify-between p-8 z-10">
                  <div className="flex justify-between items-start">
                    <div className="font-playfair font-bold text-3xl text-white tracking-widest">KROWN</div>
                    <div className="bg-[#D4AF37] text-black text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">Premium</div>
                  </div>
                  
                  <div className="space-y-1.5">
                    <div className="font-mono text-gray-400 text-lg tracking-[0.3em]">**** **** **** 8892</div>
                    <div className="text-white/40 text-xs font-semibold uppercase tracking-widest">Member Since '25</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Floating Elements next to card */}
            <motion.div 
              animate={{ y: [0, -10, 0] }} 
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -right-6 top-1/4 bg-[#1A1A1A] border border-white/10 p-4 rounded-2xl shadow-xl backdrop-blur-md"
            >
              <Coffee size={24} className="text-[#D4AF37] mb-2" />
              <div className="text-xs text-white/50 uppercase font-bold tracking-wider">Free Drinks</div>
            </motion.div>

            <motion.div 
              animate={{ y: [0, 10, 0] }} 
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -left-8 bottom-1/4 bg-[#1A1A1A] border border-white/10 p-4 rounded-2xl shadow-xl backdrop-blur-md"
            >
              <Zap size={24} className="text-[#800020] mb-2" />
              <div className="text-xs text-white/50 uppercase font-bold tracking-wider">Priority entry</div>
            </motion.div>
          </motion.div>

        </div>
      </section>

      {/* Benefits Grid */}
      <section className="px-6 py-20 bg-gradient-to-b from-transparent to-[#111111]">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-playfair font-bold text-white mb-4">Privileges that define you</h2>
            <p className="text-white/50 text-lg max-w-2xl mx-auto">Everything you need to experience the city like a VIP.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {KROWN_PASS_BENEFITS.map((benefit, i) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
                className="group relative bg-[#151515] hover:bg-[#1A1A1A] border border-white/5 hover:border-white/10 rounded-3xl p-8 transition-all duration-500 overflow-hidden"
              >
                {/* Hover gradient effect inside card */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#800020]/0 to-[#800020]/0 group-hover:from-[#800020]/5 group-hover:to-transparent transition-all duration-500" />
                
                <div className="relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[#D4AF37] mb-6 group-hover:scale-110 group-hover:bg-[#D4AF37] group-hover:text-black transition-all duration-500">
                    {iconMap[benefit.icon] ?? <Check size={24} />}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3 tracking-wide">{benefit.title}</h3>
                  <p className="text-white/50 leading-relaxed font-light">{benefit.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[#800020] opacity-[0.03]" />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <Crown size={48} className="text-white/20 mx-auto mb-8" />
          <h2 className="text-4xl font-playfair font-bold text-white mb-6">Ready to join the elite?</h2>
          <p className="text-xl text-white/50 mb-10 font-light">
            Secure your Krown Pass today and redefine your social experiences. Available exclusively through our official portal.
          </p>
          <button
            onClick={handleManageMembership}
            disabled={redirecting}

            className="inline-flex items-center gap-2 bg-white text-black px-10 py-5 rounded-full font-bold text-lg hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] transition-all duration-300"
          >
            {redirecting ? 'Redirecting...' : 'Get Krown Pass'} <ExternalLink size={18} className="ml-2" />
          </button>
        </div>
      </section>
    </div>
  );
}
