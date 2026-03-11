'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) setForm({ name: profile.name, email: profile.email ?? '' });
  }, [profile]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      updateProfileSchema.parse(form);
      const updatePromise = updateProfile.mutateAsync({
        ...form,
        ...(imageFile ? { profile_image: imageFile } : {})
      });
      toast.promise(updatePromise, {
        loading: 'Updating profile...',
        success: 'Profile updated successfully!',
        error: 'Failed to update profile.',
      });
      await updatePromise;
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
      <div className="min-h-screen bg-[#0A0A0A] pb-12">
        {/* Page Header */}
        <div className="bg-[#121212] border-b border-[#2A2A2A] pt-8 pb-6 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto flex items-center gap-4">
            <button 
              onClick={() => router.back()} 
              className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.05] transition-colors text-white/70 hover:text-white"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="font-playfair text-2xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
              Edit Profile
            </h1>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          
          {/* Profile Card & Form Container */}
          <div className="bg-[#1E1E1E]/80 backdrop-blur-md border border-[#2A2A2A] shadow-xl rounded-2xl overflow-hidden">
            
            {/* Cover Photo */}
            <div className="h-32 bg-gradient-to-br from-[#800020]/20 to-transparent relative" />

            {/* Avatar Section */}
            <div className="px-6 sm:px-10 relative">
              <div className="flex flex-col mb-8 -mt-16 relative">
                <div className="relative inline-block w-fit">
                  <div className="rounded-full p-1 bg-[#1E1E1E] shadow-2xl">
                    <Avatar 
                      src={previewUrl || profile?.profile_image} 
                      name={profile?.name ?? ''} 
                      size="xl" 
                      className="w-28 h-28 border-2 border-[#2A2A2A]"
                    />
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-1 right-1 w-9 h-9 rounded-full bg-gradient-to-br from-[#800020] to-[#400010] flex items-center justify-center border-2 border-[#1E1E1E] shadow-lg hover:shadow-[0_0_15px_rgba(128,0,32,0.4)] transition-all cursor-pointer group"
                  >
                    <Camera size={16} className="text-white group-hover:scale-110 transition-transform" />
                  </button>
                </div>
              </div>

              {/* Form */}
              <motion.form
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                onSubmit={handleSubmit}
                className="pb-10"
              >
                {/* Personal Information Section */}
                <div className="mb-8">
                  <h2 className="text-sm font-semibold text-white/80 uppercase tracking-wider mb-5 pb-2 border-b border-white/[0.05]">
                    Personal Information
                  </h2>
                  <div className="grid grid-cols-1 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-2">Full Name</label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => { 
                          setForm((f) => ({ ...f, name: e.target.value })); 
                          setErrors((er) => ({ ...er, name: undefined })); 
                        }}
                        placeholder="Your full name"
                        className="w-full bg-white/[0.02] border border-white/[0.05] focus:border-[#800020]/50 focus:shadow-[0_0_15px_rgba(128,0,32,0.15)] rounded-xl py-3 px-4 text-white text-sm placeholder:text-white/20 outline-none transition-all"
                      />
                      {errors.name && <p className="text-red-400/90 text-xs mt-1.5 font-medium">{errors.name}</p>}
                    </div>
                  </div>
                </div>

                {/* Contact Details Section */}
                <div className="mb-10">
                  <h2 className="text-sm font-semibold text-white/80 uppercase tracking-wider mb-5 pb-2 border-b border-white/[0.05]">
                    Contact Details
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-2">Email Address</label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => { 
                          setForm((f) => ({ ...f, email: e.target.value })); 
                          setErrors((er) => ({ ...er, email: undefined })); 
                        }}
                        placeholder="you@example.com"
                        className="w-full bg-white/[0.02] border border-white/[0.05] focus:border-[#800020]/50 focus:shadow-[0_0_15px_rgba(128,0,32,0.15)] rounded-xl py-3 px-4 text-white text-sm placeholder:text-white/20 outline-none transition-all"
                      />
                      {errors.email && <p className="text-red-400/90 text-xs mt-1.5 font-medium">{errors.email}</p>}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-2">Phone Number</label>
                      <div className="relative">
                        <input
                          type="tel"
                          value={profile?.phone ?? ''}
                          disabled
                          className="w-full bg-black/20 border border-transparent rounded-xl py-3 px-4 text-white/40 text-sm cursor-not-allowed"
                        />
                      </div>
                      <p className="text-white/30 text-xs mt-2 pl-1">Phone number cannot be changed</p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col-reverse sm:flex-row gap-4 pt-4 border-t border-white/[0.05]">
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="flex-1 sm:flex-none py-3 px-8 rounded-xl font-semibold text-sm text-white/70 bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.06] hover:text-white transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updateProfile.isPending}
                    className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-[#800020] to-[#5a0016] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] hover:to-[#400010] border border-[#990026]/50 disabled:opacity-50 text-white py-3 px-8 rounded-xl font-semibold text-sm transition-all relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-white/20 group-hover:bg-transparent transition-colors opacity-0 group-hover:opacity-100 mix-blend-overlay"></div>
                    {updateProfile.isPending && <Loader2 size={16} className="animate-spin" />}
                    {updateProfile.isPending ? 'Saving Changes...' : 'Save Changes'}
                  </button>
                </div>
              </motion.form>
            </div>
          </div>
          
        </div>
      </div>
    </ProtectedRoute>
  );
}
