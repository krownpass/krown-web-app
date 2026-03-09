'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Camera, Loader2 } from 'lucide-react';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { Avatar } from '@/components/ui/Avatar';
import { useProfile, useUpdateProfile } from '@/queries/useUser';
import { updateProfileSchema } from '@/lib/validators';
import { z } from 'zod';
import { toast } from 'sonner';

export default function EditProfilePage() {
  const router = useRouter();
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const [form, setForm] = useState({ name: '', email: '' });
  const [errors, setErrors] = useState<Partial<Record<'name' | 'email', string>>>({});

  useEffect(() => {
    if (profile) setForm({ name: profile.name, email: profile.email ?? '' });
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      updateProfileSchema.parse(form);
      await updateProfile.mutateAsync(form);
      toast.success('Profile updated!');
      router.back();
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors: typeof errors = {};
        err.errors.forEach((e) => { fieldErrors[e.path[0] as 'name' | 'email'] = e.message; });
        setErrors(fieldErrors);
      } else {
        toast.error('Failed to update profile.');
      }
    }
  };

  return (
    <ProtectedRoute>
      <div className="max-w-lg mx-auto px-4 md:px-6 py-6">
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => router.back()} className="p-2 rounded-xl bg-[#1E1E1E] border border-[#2A2A2A] text-white/60">
            <ArrowLeft size={18} />
          </button>
          <h1 className="font-playfair text-xl font-bold text-white">Edit Profile</h1>
        </div>

        {/* Avatar */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative">
            <Avatar src={profile?.profile_image} name={profile?.name ?? ''} size="xl" />
            <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#800020] flex items-center justify-center border-2 border-[#0A0A0A]">
              <Camera size={14} className="text-white" />
            </button>
          </div>
          <p className="text-white/40 text-xs mt-2">Tap to change photo</p>
        </div>

        <motion.form
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          {[
            { key: 'name' as const, label: 'Full Name', type: 'text', placeholder: 'Your name' },
            { key: 'email' as const, label: 'Email Address', type: 'email', placeholder: 'you@example.com' },
          ].map(({ key, label, type, placeholder }) => (
            <div key={key}>
              <label className="block text-sm text-white/60 mb-1.5">{label}</label>
              <input
                type={type}
                value={form[key]}
                onChange={(e) => { setForm((f) => ({ ...f, [key]: e.target.value })); setErrors((er) => ({ ...er, [key]: undefined })); }}
                placeholder={placeholder}
                className="w-full bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/20 focus:border-[#800020] focus:outline-none transition-colors"
              />
              {errors[key] && <p className="text-red-400 text-xs mt-1">{errors[key]}</p>}
            </div>
          ))}

          <div>
            <label className="block text-sm text-white/60 mb-1.5">Mobile Number</label>
            <input
              type="tel"
              value={profile?.phone ?? ''}
              disabled
              className="w-full bg-[#111] border border-[#2A2A2A] rounded-xl px-4 py-3 text-white/30 text-sm cursor-not-allowed"
            />
            <p className="text-white/30 text-xs mt-1">Phone number cannot be changed</p>
          </div>

          <button
            type="submit"
            disabled={updateProfile.isPending}
            className="w-full flex items-center justify-center gap-2 bg-[#800020] hover:bg-[#C11E38] disabled:opacity-50 text-white py-3 rounded-xl font-semibold text-sm transition-all mt-2"
          >
            {updateProfile.isPending && <Loader2 size={16} className="animate-spin" />}
            {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </motion.form>
      </div>
    </ProtectedRoute>
  );
}
