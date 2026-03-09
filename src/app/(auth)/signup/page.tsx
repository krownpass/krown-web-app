'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { useAuthStore } from '@/stores/authStore';
import { signupSchema } from '@/lib/validators';
import { toast } from 'sonner';
import { z } from 'zod';

type FormErrors = Partial<Record<'name' | 'email' | 'phone' | 'referral_code', string>>;

export default function SignupPage() {
  const searchParams = useSearchParams();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: searchParams.get('phone') ?? '',
    referral_code: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const { signup, isLoading } = useAuthStore();
  const router = useRouter();

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = signupSchema.parse(form);
      await signup(data);
      toast.success('Welcome to Krown!');
      router.push('/');
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors: FormErrors = {};
        err.errors.forEach((e) => {
          const field = e.path[0] as keyof FormErrors;
          fieldErrors[field] = e.message;
        });
        setErrors(fieldErrors);
      } else {
        toast.error('Registration failed. Please try again.');
      }
    }
  };

  const fields = [
    { key: 'name', label: 'Full Name', type: 'text', placeholder: 'Your name' },
    { key: 'email', label: 'Email Address', type: 'email', placeholder: 'you@example.com' },
    { key: 'phone', label: 'Mobile Number', type: 'tel', placeholder: '10-digit number' },
    { key: 'referral_code', label: 'Referral Code (optional)', type: 'text', placeholder: 'Enter code' },
  ] as const;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-[#0A0A0A]">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4">
            <Image src="/krown-icon.png" alt="Krown" width={64} height={64} className="rounded-2xl" />
          </div>
          <h1 className="font-playfair text-2xl font-bold text-white">Join Krown</h1>
          <p className="text-white/40 text-sm mt-1">Create your free account</p>
        </div>

        <div className="bg-[#1E1E1E] border border-[#2A2A2A] rounded-2xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {fields.map(({ key, label, type, placeholder }) => (
              <div key={key}>
                <label className="block text-sm text-white/60 mb-1.5">{label}</label>
                <input
                  type={type}
                  value={form[key]}
                  onChange={(e) => handleChange(key, e.target.value)}
                  placeholder={placeholder}
                  className="w-full bg-[#111] border border-[#2A2A2A] rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/20 focus:border-[#800020] focus:outline-none transition-colors"
                />
                {errors[key] && <p className="text-red-400 text-xs mt-1">{errors[key]}</p>}
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

          <div className="mt-4 pt-4 border-t border-[#2A2A2A] text-center">
            <p className="text-white/40 text-xs">
              Already have an account?{' '}
              <Link href="/login" className="text-[#800020] hover:text-[#C11E38] font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
