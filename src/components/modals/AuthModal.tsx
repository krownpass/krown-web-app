'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Phone, ArrowRight, Loader2, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import { useAuthStore } from '@/stores/authStore';
import { signupSchema } from '@/lib/validators';
import { toast } from 'sonner';
import { z } from 'zod';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type FormErrors = Partial<Record<'name' | 'email' | 'phone' | 'referral_code', string>>;

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [step, setStep] = useState<'login' | 'otp' | 'signup'>('login');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  
  // Signup state
  const [signupForm, setSignupForm] = useState({
    name: '',
    email: '',
    phone: '',
    referral_code: '',
  });
  const [signupErrors, setSignupErrors] = useState<FormErrors>({});

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const { login, verifyOtp, signup, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isOpen) {
      // Don't reset states immediately on close to allow for smooth exit animations
      const timer = setTimeout(() => {
        setStep('login');
        setPhone('');
        setOtp(['', '', '', '', '', '']);
        setCountdown(60);
        setCanResend(false);
        setSignupForm({ name: '', email: '', phone: '', referral_code: '' });
        setSignupErrors({});
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    if (step === 'otp' && isOpen) {
      inputRefs.current[0]?.focus();
    }
  }, [step, isOpen]);

  useEffect(() => {
    let t: NodeJS.Timeout;
    if (step === 'otp' && countdown > 0) {
      t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    } else if (countdown <= 0) {
      setCanResend(true);
    }
    return () => clearTimeout(t);
  }, [countdown, step]);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length !== 10) {
      toast.error('Enter a valid 10-digit mobile number');
      return;
    }
    try {
      await login(phone);
      setStep('otp');
      setCountdown(60);
      setCanResend(false);
    } catch {
      toast.error('Failed to send OTP. Please try again.');
    }
  };

  const handleOtpChange = (index: number, value: string) => {
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
    try {
      await verifyOtp(phone, code);
      toast.success('Welcome to Krown!');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('not found') || msg.includes('register')) {
        setSignupForm((prev) => ({ ...prev, phone }));
        setStep('signup');
      } else {
        toast.error('Invalid OTP. Please try again.');
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    }
  }, [verifyOtp, phone, onClose, onSuccess]);

  const handleResend = async () => {
    try {
      await login(phone);
      setCountdown(60);
      setCanResend(false);
      toast.success('OTP resent!');
    } catch {
      toast.error('Failed to resend OTP.');
    }
  };

  const handleSignupChange = (field: keyof typeof signupForm, value: string) => {
    setSignupForm((f) => ({ ...f, [field]: value }));
    if (signupErrors[field]) setSignupErrors((e) => ({ ...e, [field]: undefined }));
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = signupSchema.parse(signupForm);
      await signup(data);
      toast.success('Welcome to Krown!');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors: FormErrors = {};
        err.errors.forEach((e) => {
          const field = e.path[0] as keyof FormErrors;
          fieldErrors[field] = e.message;
        });
        setSignupErrors(fieldErrors);
      } else {
        toast.error('Registration failed. Please try again.');
      }
    }
  };

  const signupFields = [
    { key: 'name', label: 'Full Name', type: 'text', placeholder: 'Your name' },
    { key: 'email', label: 'Email Address', type: 'email', placeholder: 'you@example.com' },
    { key: 'phone', label: 'Mobile Number', type: 'tel', placeholder: '10-digit number' },
    { key: 'referral_code', label: 'Referral Code (optional)', type: 'text', placeholder: 'Enter code' },
  ] as const;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#0A0A0A]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-[#1E1E1E] border border-[#2A2A2A] rounded-3xl p-6 relative shadow-2xl"
            >
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-white/40 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={16} />
              </button>

              <div className="text-center mb-6">
                <div className="w-12 h-12 mx-auto mb-3">
                  <Image quality={90} src="/krown-icon.png" alt="Krown" width={48} height={48} className="rounded-xl shadow-lg" />
                </div>
                <h2 className="font-playfair text-xl font-bold text-white mb-1">
                  {step === 'login' ? 'Join Krown' : step === 'otp' ? 'Verify Mobile' : 'Create Account'}
                </h2>
                <p className="text-white/40 text-sm">
                  {step === 'login' ? 'Sign in to access exclusive features' : step === 'otp' ? `Code sent to +91 ${phone}` : 'Complete your profile'}
                </p>
              </div>

              {step === 'login' && (
                <form onSubmit={handlePhoneSubmit} className="space-y-4">
                  <div>
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
                        autoFocus
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
                    {isLoading ? 'Sending OTP...' : 'Continue'}
                  </button>
                </form>
              )}
              
              {step === 'otp' && (
                <div className="space-y-4">
                  <div className="flex gap-2 justify-center" onPaste={handlePaste}>
                    {otp.map((digit, i) => (
                      <input
                        key={i}
                        ref={(el) => { inputRefs.current[i] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(i, e)}
                        className="w-11 h-14 text-center text-xl font-bold bg-[#111] border border-[#2A2A2A] rounded-xl text-white focus:border-[#800020] focus:outline-none transition-colors"
                      />
                    ))}
                  </div>

                  {isLoading && (
                    <div className="flex items-center justify-center gap-2 text-white/50 text-sm">
                      <Loader2 size={16} className="animate-spin" />
                      Verifying...
                    </div>
                  )}

                  <div className="text-center text-sm text-white/40 mt-4">
                    {canResend ? (
                      <button onClick={handleResend} className="text-[#800020] hover:text-[#C11E38] font-medium">
                        Resend OTP
                      </button>
                    ) : (
                      <span>Resend in {countdown}s</span>
                    )}
                  </div>

                  <button
                    onClick={() => setStep('login')}
                    className="w-full flex items-center justify-center gap-2 text-white/40 text-sm mt-4 hover:text-white/60 transition-colors"
                  >
                    <ArrowLeft size={14} />
                    Change number
                  </button>
                </div>
              )}

              {step === 'signup' && (
                <form onSubmit={handleSignupSubmit} className="space-y-4">
                  {signupFields.map(({ key, label, type, placeholder }) => (
                    <div key={key}>
                      <label className="block text-sm text-white/60 mb-1.5">{label}</label>
                      <input
                        type={type}
                        value={signupForm[key as keyof typeof signupForm]}
                        onChange={(e) => handleSignupChange(key as keyof typeof signupForm, e.target.value)}
                        placeholder={placeholder}
                        className="w-full bg-[#111] border border-[#2A2A2A] rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/20 focus:border-[#800020] focus:outline-none transition-colors"
                      />
                      {signupErrors[key as keyof typeof signupForm] && <p className="text-red-400 text-xs mt-1">{signupErrors[key as keyof typeof signupForm]}</p>}
                    </div>
                  ))}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 bg-[#800020] hover:bg-[#C11E38] disabled:opacity-50 text-white py-3 rounded-xl font-semibold text-sm transition-all active:scale-95"
                  >
                    {isLoading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                    {isLoading ? 'Creating account...' : 'Create Account'}
                  </button>
                </form>
              )}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
