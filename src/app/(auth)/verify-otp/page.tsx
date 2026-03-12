'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';

export default function VerifyOtpPage() {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const sendingRef = useRef(false);
  const verifyingRef = useRef(false);
  const { verifyOtp, login, isLoading } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const phone = searchParams.get('phone') ?? '';

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (countdown <= 0) { setCanResend(true); return; }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
    if (newOtp.every((d) => d !== '') && newOtp.join('').length === 6) {
      handleVerify(newOtp.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      handleVerify(pasted);
    }
  };

  const handleVerify = useCallback(async (code: string) => {
    if (verifyingRef.current) return;   // prevent paste+change double-fire
    verifyingRef.current = true;
    try {
      await verifyOtp(phone, code);
      toast.success('Welcome to Krown!');
      router.push('/');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('not found') || msg.includes('register')) {
        router.push(`/signup?phone=${phone}`);
      } else {
        toast.error('Invalid OTP. Please try again.');
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } finally {
      verifyingRef.current = false;
    }
  }, [verifyOtp, phone, router]);

  const handleResend = async () => {
    if (sendingRef.current) return;
    sendingRef.current = true;
    try {
      await login(phone);
      setCountdown(60);
      setCanResend(false);
      toast.success('OTP resent!');
    } catch {
      toast.error('Failed to resend OTP.');
    } finally {
      sendingRef.current = false;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#0A0A0A]">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4">
            <Image quality={90} src="/krown-icon.png" alt="Krown" width={64} height={64} className="rounded-2xl" />
          </div>
          <h1 className="font-playfair text-2xl font-bold text-white">Verify OTP</h1>
          <p className="text-white/40 text-sm mt-1">
            Code sent to +91 {phone}
          </p>
          <Link href="/login" className="text-[#800020] text-xs hover:text-[#C11E38] mt-1 inline-block">
            Change number
          </Link>
        </div>

        <div className="bg-[#1E1E1E] border border-[#2A2A2A] rounded-2xl p-6">
          <div className="flex gap-2 justify-center mb-6" onPaste={handlePaste}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="w-11 h-14 text-center text-xl font-bold bg-[#111] border border-[#2A2A2A] rounded-xl text-white focus:border-[#800020] focus:outline-none transition-colors"
              />
            ))}
          </div>

          {isLoading && (
            <div className="flex items-center justify-center gap-2 text-white/50 text-sm mb-4">
              <Loader2 size={16} className="animate-spin" />
              Verifying...
            </div>
          )}

          <div className="text-center text-sm text-white/40">
            {canResend ? (
              <button onClick={handleResend} className="text-[#800020] hover:text-[#C11E38] font-medium">
                Resend OTP
              </button>
            ) : (
              <span>Resend in {countdown}s</span>
            )}
          </div>
        </div>

        <Link href="/login" className="flex items-center justify-center gap-2 text-white/40 text-sm mt-4 hover:text-white/60 transition-colors">
          <ArrowLeft size={14} />
          Back to login
        </Link>
      </motion.div>
    </div>
  );
}
