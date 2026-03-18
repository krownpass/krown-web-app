'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    User, Edit2, Bookmark, BookOpen, Receipt, Smartphone, Users, Crown,
    LogOut, ChevronRight, AlertTriangle, Star, Ticket, Activity, Home,
    Calendar, GlassWater, Settings, Wine
} from 'lucide-react';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { Avatar } from '@/components/ui/Avatar';
import { Skeleton } from '@/components/ui/Skeleton';
import { useProfile } from '@/queries/useUser';
import { useMyBookings } from '@/queries/useBookings';
import { useMyTickets } from '@/queries/useEventDetail';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';

const menuItems = [
    { href: '/events/my-tickets', icon: Ticket, label: 'My Tickets', description: 'View and manage your upcoming event passes' },
    { href: '/profile/bookmarks', icon: Bookmark, label: 'Favorites', description: 'Access your saved events and artists' },
    { href: '/bookings', icon: BookOpen, label: 'Booking History', description: 'Review your past table and event bookings' },
    { href: '/profile/redeemed-drinks', icon: Wine, label: 'Redeemed Drinks', description: 'View your drink redemption history across all cafes' },
    { href: '/profile/transactions', icon: Receipt, label: 'Transactions', description: 'Download receipts and view payment history' },
    { href: '/profile/devices', icon: Smartphone, label: 'Active Sessions', description: 'Manage your logged-in devices and security' },
    { href: '/profile/referrals', icon: Users, label: 'Referrals', description: 'Invite friends and earn Krown points' },
    { href: '/krown-pass', icon: Crown, label: 'Krown Pass', description: 'Manage your exclusive membership benefits' },
    { href: '/profile/settings', icon: Settings, label: 'Settings', description: 'App settings and account deletion' },
];

export default function ProfilePage() {
    const router = useRouter();
    const { data: profile, isLoading } = useProfile();
    const { data: bookings } = useMyBookings('cafe');
    const { data: tickets } = useMyTickets();

    const { logout } = useAuthStore();
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const handleLogout = async () => {
        await logout();
        toast.success('Logged out successfully');
        router.push('/login');
    };

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-[#0A0A0A] pb-12 font-sans selection:bg-[#800020]/30">
                {/* Page Header Area */}
                <div className="bg-[#0A0A0A] border-b border-white/[0.05] pt-12 pb-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-[#800020]/10 to-transparent pointer-events-none" />
                    <div className="max-w-7xl mx-auto flex items-center justify-between relative z-10">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-playfair font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/50 tracking-tight">
                                My Account
                            </h1>
                            <p className="text-white/40 text-sm mt-2 font-light tracking-wide">Manage your ultra-premium profile, bookings & preferences</p>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                    {isLoading ? (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                            <div className="lg:col-span-4 space-y-6">
                                <Skeleton className="h-[28rem] rounded-2xl bg-white/[0.02]" />
                                <Skeleton className="h-32 rounded-2xl bg-white/[0.02]" />
                            </div>
                            <div className="lg:col-span-8 space-y-6">
                                <Skeleton className="h-64 rounded-2xl bg-white/[0.02]" />
                                <Skeleton className="h-64 rounded-2xl bg-white/[0.02]" />
                            </div>
                        </div>
                    ) : profile ? (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">

                            {/* Left Column: Profile Card & Stats */}
                            <div className="lg:col-span-4 space-y-6 relative z-10">

                                {/* Main Profile Info Card */}
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] rounded-[2rem] shadow-2xl relative overflow-hidden group"
                                >
                                    {/* Rich Gradient Cover Photo */}
                                    <div className="w-full h-32 bg-gradient-to-br from-[#800020]/40 via-[#800020]/20 to-black/40 relative">
                                        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay"></div>
                                        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-[#050505] to-transparent"></div>
                                    </div>

                                    <div className="px-6 pb-8 flex flex-col items-center text-center -mt-16 relative z-10">
                                        <div className="relative mb-5 p-1 bg-[#0A0A0A] rounded-full shadow-2xl">
                                            <Avatar
                                                src={profile.profile_image}
                                                name={profile.name}
                                                size="xl"
                                                className="w-28 h-28 border border-white/[0.05]"
                                            />
                                            {profile.has_krown_pass && (
                                                <div className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-gradient-to-br from-[#F5D061] via-[#D4AF37] to-[#AA8529] flex items-center justify-center border-4 border-[#0A0A0A] shadow-[0_0_15px_rgba(212,175,55,0.4)]">
                                                    <Crown size={14} className="text-black" />
                                                </div>
                                            )}
                                        </div>

                                        <h2 className="font-playfair text-2xl font-bold text-white mb-2 tracking-wide group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-white/70 transition-all duration-300">
                                            {profile.name}
                                        </h2>

                                        <div className="flex flex-col items-center gap-1.5 mb-6">
                                            <p className="text-white/70 text-sm font-medium bg-white/[0.03] border border-white/[0.05] px-4 py-1.5 rounded-full backdrop-blur-md">
                                                +91 {profile.phone}
                                            </p>
                                            {profile.email && <p className="text-white/40 text-sm font-light">{profile.email}</p>}
                                        </div>

                                        <Link href="/profile/edit" className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.05] text-white/90 hover:text-white transition-all duration-300 text-sm font-medium shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
                                            <Edit2 size={16} className="opacity-70" />
                                            Edit Profile
                                        </Link>
                                    </div>
                                </motion.div>

                                {/* Account Stats */}
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] rounded-[2rem] p-6 shadow-xl relative z-10">
                                    <h3 className="text-white/60 text-xs font-semibold tracking-[0.2em] uppercase mb-5 flex items-center gap-2">
                                        <Activity size={14} className="text-[#800020]" /> Statistics
                                    </h3>
                                    <div className="grid grid-cols-3 gap-3">
                                        {[
                                            { label: 'Bookings', value: bookings ? bookings.length.toString() : '—', icon: Calendar },
                                            { label: 'Events', value: tickets ? tickets.length.toString() : '—', icon: Ticket },
                                            { label: 'Points', value: (profile.krown_points ?? 0).toLocaleString(), icon: Star },
                                        ].map((stat, idx) => (
                                            <div key={stat.label} className="bg-white/[0.02] rounded-2xl p-4 text-center border border-white/[0.03] hover:border-[#800020]/30 transition-colors duration-300 group relative overflow-hidden">
                                                <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                                <div className="relative z-10 flex flex-col items-center">
                                                    <stat.icon size={14} className="text-white/30 mb-2 group-hover:text-[#ff4d79] transition-colors" />
                                                    <p className="font-playfair text-xl font-bold text-white mb-1 group-hover:scale-105 transition-transform">{stat.value}</p>
                                                    <p className="text-white/40 text-[10px] uppercase tracking-widest font-semibold">{stat.label}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>

                                {/* Krown Pass Card */}
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                                    {profile.has_krown_pass ? (
                                        <div className="bg-gradient-to-br from-[#800020] to-[#3A000E] border border-[#ff4d79]/20 rounded-[2rem] p-6 shadow-[0_10px_40px_rgba(128,0,32,0.2)] relative overflow-hidden group">
                                            <div className="absolute -right-8 -top-8 text-black/10 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                                                <Crown size={140} />
                                            </div>
                                            <div className="relative flex items-center gap-5">
                                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#AA8529] p-[1px] shadow-[0_0_20px_rgba(212,175,55,0.3)]">
                                                    <div className="w-full h-full bg-black/50 rounded-2xl backdrop-blur-md flex items-center justify-center">
                                                        <Crown size={26} className="text-[#F5D061]" />
                                                    </div>
                                                </div>
                                                <div>
                                                    <h3 className="text-transparent bg-clip-text bg-gradient-to-r from-[#F5D061] to-[#D4AF37] text-sm font-bold tracking-[0.15em] mb-1">KROWN PASS ACTIVE</h3>
                                                    {profile.krown_pass_expiry && (
                                                        <p className="text-white/70 text-xs font-light tracking-wide">Valid until {new Date(profile.krown_pass_expiry).toLocaleDateString()}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <Link href="/krown-pass" className="block outline-none">
                                            <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] rounded-[2rem] p-6 hover:bg-[#800020]/5 hover:border-[#800020]/50 hover:shadow-[0_0_30px_rgba(128,0,32,0.15)] transition-all duration-300 group relative overflow-hidden">
                                                <div className="absolute inset-0 bg-gradient-to-r from-[#800020]/0 via-[#800020]/5 to-[#800020]/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                                                <div className="flex items-center justify-between relative z-10">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-2xl bg-[#800020]/10 flex items-center justify-center group-hover:bg-[#800020]/20 transition-colors border border-[#800020]/20 group-hover:border-[#800020]/40">
                                                            <Crown size={22} className="text-[#C11E38]" />
                                                        </div>
                                                        <div>
                                                            <p className="text-white font-medium text-sm tracking-wide">Get Krown Pass</p>
                                                            <p className="text-white/40 text-xs mt-1 font-light tracking-wide">Unlock exquisite benefits</p>
                                                        </div>
                                                    </div>
                                                    <div className="w-8 h-8 rounded-full bg-white/[0.02] flex items-center justify-center group-hover:bg-[#800020]/20 transition-colors">
                                                        <ChevronRight size={16} className="text-white/30 group-hover:text-[#ff4d79] transition-colors translate-x-0 group-hover:translate-x-1" />
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    )}
                                </motion.div>

                                {/* Logout Button (Desktop) */}
                                <motion.div className="hidden lg:block" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                                    <button
                                        onClick={() => setShowLogoutConfirm(true)}
                                        className="w-full flex items-center justify-center gap-2 p-4 bg-white/[0.01] border border-white/[0.03] rounded-[1.5rem] text-white/40 hover:bg-red-500/5 hover:border-red-900/30 hover:text-red-400 transition-all duration-300 font-medium text-sm"
                                    >
                                        <LogOut size={16} />
                                        <span className="tracking-wide">Sign Out</span>
                                    </button>
                                </motion.div>

                            </div>

                            {/* Right Column: Menu Grid & Activity Timeline */}
                            <div className="lg:col-span-8 flex flex-col gap-10">

                                {/* Menu Grid */}
                                <section>
                                    <h2 className="text-xs font-semibold text-white/40 tracking-[0.2em] uppercase mb-6 ml-2">Dashboard</h2>
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.15 }}
                                        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                                    >
                                        {menuItems.map(({ href, icon: Icon, label, description }, i) => (
                                            <motion.div
                                                key={href}
                                                initial={{ opacity: 0, y: 15 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.1 + (i * 0.05) }}
                                            >
                                                <Link href={href} className="outline-none block h-full group">
                                                    <div className="h-full bg-white/[0.02] backdrop-blur-sm border border-white/[0.05] rounded-[1.5rem] p-5 transition-all duration-300 group-hover:border-[#800020]/50 group-hover:shadow-[0_0_30px_rgba(128,0,32,0.15)] group-hover:-translate-y-1 group-hover:bg-white/[0.03] flex items-start gap-4 overflow-hidden relative">
                                                        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                                        <div className="w-12 h-12 rounded-[1rem] bg-white/[0.03] flex items-center justify-center group-hover:bg-[#800020]/10 group-hover:scale-110 text-white/50 group-hover:text-[#ff4d79] transition-all duration-300 shrink-0 border border-white/[0.02] group-hover:border-[#800020]/30 shadow-inner">
                                                            <Icon size={20} strokeWidth={1.5} />
                                                        </div>
                                                        <div className="flex-1 min-w-0 pt-0.5">
                                                            <h3 className="text-white/90 font-medium text-base mb-1.5 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-white/70 transition-all tracking-wide">{label}</h3>
                                                            <p className="text-white/40 text-xs leading-relaxed font-light line-clamp-2">{description}</p>
                                                        </div>
                                                        <div className="pt-2">
                                                            <ChevronRight size={18} className="text-white/10 group-hover:text-white/40 transform group-hover:translate-x-1 transition-all duration-300" />
                                                        </div>
                                                    </div>
                                                </Link>
                                            </motion.div>
                                        ))}
                                    </motion.div>
                                </section>

                                {/* Timeline Empty State */}
                                <section>
                                    <div className="flex items-center justify-between mb-6 ml-2">
                                        <h2 className="text-xs font-semibold text-white/40 tracking-[0.2em] uppercase">Recent Activity</h2>
                                    </div>
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.3 }}
                                        className="bg-white/[0.01] border border-white/[0.03] rounded-[2rem] p-8 sm:p-10 relative overflow-hidden group"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.01] to-transparent pointer-events-none" />

                                        {/* Timeline Line */}
                                        <div className="absolute left-8 sm:left-12 top-10 bottom-10 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent border-dashed border-l border-white/10"></div>

                                        <div className="relative z-10 flex gap-6 sm:gap-8 items-start">
                                            {/* Timeline Node */}
                                            <div className="mt-1 relative flex items-center justify-center ml-0 sm:ml-4">
                                                <div className="w-4 h-4 rounded-full bg-[#0A0A0A] border-4 border-[#800020]/30 group-hover:border-[#800020]/60 transition-colors z-10 relative shadow-[0_0_15px_rgba(128,0,32,0.5)]">
                                                    <div className="absolute inset-0 bg-[#C11E38] rounded-full animate-pulse opacity-50"></div>
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1">
                                                <h3 className="text-white/80 font-medium text-lg mb-2 tracking-wide font-playfair">Your Journey Begins</h3>
                                                <p className="text-white/40 text-sm leading-relaxed max-w-md font-light">
                                                    Reserve tables, book exclusive events, and unlock Krown points. Your high-end lifestyle tracking awaits.
                                                </p>

                                                <div className="mt-6">
                                                    <Link href="/">
                                                        <button className="px-5 py-2.5 rounded-full bg-white/[0.03] border border-white/[0.08] text-white/60 text-xs font-medium hover:bg-white/[0.08] hover:text-white transition-all tracking-wider uppercase">
                                                            Explore Krown
                                                        </button>
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                </section>

                            </div>

                            {/* Mobile Logout Button */}
                            <div className="lg:hidden col-span-1 mt-4 mb-8">
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
                                    <button
                                        onClick={() => setShowLogoutConfirm(true)}
                                        className="w-full flex items-center justify-center gap-3 p-[18px] bg-red-500/[0.03] border border-red-500/10 rounded-[1.5rem] text-red-400/80 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 transition-all duration-300 font-medium text-[15px] shadow-[0_0_20px_rgba(220,38,38,0.05)]"
                                    >
                                        <LogOut size={18} />
                                        <span className="tracking-wide">Sign Out</span>
                                    </button>
                                </motion.div>
                            </div>

                        </div>
                    ) : null}
                </div>

                {/* Logout confirm modal */}
                <AnimatePresence>
                    {showLogoutConfirm && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0A0A0A]/80 backdrop-blur-xl"
                            onClick={() => setShowLogoutConfirm(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                                className="bg-[#121212] border border-white/[0.08] rounded-[2rem] p-8 w-full max-w-sm shadow-[0_20px_60px_rgba(0,0,0,0.5)] relative overflow-hidden"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-red-900/10 to-transparent pointer-events-none" />
                                <div className="relative z-10">
                                    <div className="w-16 h-16 rounded-[1.5rem] bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6 mx-auto shadow-inner">
                                        <LogOut size={28} className="text-red-400" />
                                    </div>
                                    <h3 className="font-playfair font-bold text-white text-2xl text-center mb-3 tracking-wide">Secure Sign Out</h3>
                                    <p className="text-white/50 text-sm text-center mb-8 font-light">You&apos;ll need to verify your identity to access your exclusive account again.</p>
                                    <div className="flex gap-4">
                                        <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 py-3.5 bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.05] text-white/80 rounded-2xl text-sm font-medium transition-all tracking-wide">
                                            Cancel
                                        </button>
                                        <button onClick={handleLogout} className="flex-1 py-3.5 bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white rounded-2xl text-sm font-medium shadow-[0_0_20px_rgba(220,38,38,0.3)] transition-all tracking-wide">
                                            Sign Out
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </ProtectedRoute>
    );
}
