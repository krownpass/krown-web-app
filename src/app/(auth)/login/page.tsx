'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Phone, ArrowRight, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';

export default function LoginPage() {
  const [phone, setPhone] = useState('');
  const { login, isLoading } = useAuthStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length !== 10) {
      toast.error('Enter a valid 10-digit mobile number');
      return;
    }
    try {
      await login(phone);
      router.push(`/verify-otp?phone=${phone}`);
    } catch {
      toast.error('Failed to send OTP. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#0A0A0A]">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4">
            <Image src="/krown-icon.png" alt="Krown" width={64} height={64} className="rounded-2xl" />
          </div>
          <h1 className="font-playfair text-3xl font-bold text-white">KROWN</h1>
          <p className="text-white/40 text-sm mt-1">Premium café experiences in Chennai</p>
        </div>

        <div className="bg-[#1E1E1E] border border-[#2A2A2A] rounded-2xl p-6">
          <h2 className="font-playfair text-xl font-bold text-white mb-1">Welcome back</h2>
          <p className="text-white/40 text-sm mb-6">Enter your mobile number to continue</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-white/60 mb-2">Mobile Number</label>
              <div className="flex items-center bg-[#111] border border-[#2A2A2A] rounded-xl px-4 py-3 focus-within:border-[#800020] transition-colors">
                <span className="text-white/40 text-sm mr-2 flex-shrink-0 flex items-center gap-1">
                  <Phone size={14} />
                  +91
                </span>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="1234567890"
                  className="bg-transparent text-white text-sm flex-1 outline-none placeholder:text-white/20"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || phone.length !== 10}
              className="w-full flex items-center justify-center gap-2 bg-[#800020] hover:bg-[#C11E38] disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-semibold text-sm transition-all active:scale-95"
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
              {isLoading ? 'Sending OTP...' : 'Get OTP'}
            </button>
          </form>

          <div className="mt-4 pt-4 border-t border-[#2A2A2A] text-center">
            <p className="text-white/40 text-xs">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="text-[#800020] hover:text-[#C11E38] font-medium">
                Sign up
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-white/20 text-xs mt-4">
          Test: 1234567890 · OTP: 123456
        </p>
      </motion.div>
    </div>
  );
}
