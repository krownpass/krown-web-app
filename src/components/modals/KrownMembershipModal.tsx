import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Diamond, Coffee, Ticket, RefreshCw } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';

interface KrownMembershipModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KrownMembershipModal({ isOpen, onClose }: KrownMembershipModalProps) {
  const router = useRouter();
  const { token } = useAuthStore();
  const [redirecting, setRedirecting] = useState(false);

  if (!isOpen) return null;

  const handleManageMembership = async () => {
    if (redirecting) return;
    setRedirecting(true);

    try {
      const WEB_DOMAIN = process.env.NEXT_PUBLIC_APP_URL || 'https://krownpass.com';
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.krownpass.com';
      
      // Capture current URL so plans page knows where to send them back
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75">
      <div className="w-full max-w-sm bg-[#141414] rounded-3xl p-6 border border-white/10 relative flex flex-col items-center animate-in fade-in zoom-in-95 duration-200">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <div className="w-16 h-16 rounded-2xl bg-[#C11E38]/10 flex items-center justify-center mb-4 mt-2 text-[#C11E38]">
          <Diamond size={32} />
        </div>

        <h2 className="text-white text-[22px] font-semibold text-center leading-[30px] mb-3 font-playfair">
          This perk is for<br />Krown members
        </h2>

        <p className="text-[#9CA3AF] text-sm text-center leading-[21px] mb-6">
          Redeeming drinks is an exclusive benefit available to active Krown members. Update your membership details to unlock this and other perks.
        </p>

        <div className="w-full space-y-3 mb-7">
          <FeatureRow icon={<Coffee size={18} />} text="Redeem drinks at partner cafés" />
          <FeatureRow icon={<Ticket size={18} />} text="Access member-only experiences" />
          <FeatureRow icon={<RefreshCw size={18} />} text="Benefits that refresh every month" />
        </div>

        <button
          onClick={handleManageMembership}
          disabled={redirecting}
          className={`w-full bg-[#800020] hover:bg-[#A00028] text-white rounded-xl py-4 font-semibold text-base transition-colors mb-2.5 ${redirecting ? 'opacity-70' : ''}`}
        >
          {redirecting ? 'Redirecting...' : 'Manage Membership'}
        </button>

        <button
          onClick={onClose}
          className="w-full py-3 text-[#6B7280] hover:text-white transition-colors text-[15px] mb-4"
        >
          Maybe later
        </button>

        <p className="text-[#374151] text-xs text-center">
          Manage your membership at krownpass.com
        </p>
      </div>
    </div>
  );
}

function FeatureRow({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 shrink-0 rounded-[10px] bg-[#C11E38]/12 flex items-center justify-center text-[#C11E38]">
        {icon}
      </div>
      <span className="flex-1 text-[#D1D5DB] text-sm leading-5">
        {text}
      </span>
    </div>
  );
}
