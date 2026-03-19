"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { Copy, AlertCircle, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { EventDetailsPresentation } from "@/components/event/EventDetailsPresentation";
import { useEventRoom } from "@/hooks/useWebSocket";
import { useQuery } from '@tanstack/react-query';
import { useUserLocation } from '@/hooks/useUserLocation';
import { getDistanceFromLatLon } from '@/lib/utils';
import { eventService } from '@/services/event.service';
import { AuthModal } from '@/components/modals/AuthModal';

type InviteLinkMeta = {
    max_uses?: number;
    current_uses?: number;
    spots_remaining?: number;
};

export default function EventInviteClaimPage() {
    const params = useParams();
    const router = useRouter();
    const { isAuthenticated, token: authToken } = useAuthStore();
    
    const slug = params.slug as string;
    const inviteSegment = params.inviteToken as string;

    const [loading, setLoading] = useState(true);
    const [claiming, setClaiming] = useState(false);
    const [error, setError] = useState("");
    const [alreadyRegistered, setAlreadyRegistered] = useState(false);
    const [eventData, setEventData] = useState<any>(null);
    const [inviteLinkMeta, setInviteLinkMeta] = useState<InviteLinkMeta | null>(null);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [pendingAction, setPendingAction] = useState<'claim' | null>(null);

    const roomData = useEventRoom(eventData?.event_id || '');

    const event = React.useMemo(() => {
        if (!eventData) return eventData;
        const mergedEvent = { ...eventData, ...roomData.eventUpdates };
        if (roomData.registrationCount !== undefined) {
            mergedEvent.current_registrations = roomData.registrationCount;
        }
        return mergedEvent;
    }, [eventData, roomData]);

    const { latitude, longitude, hasPermission } = useUserLocation();

    const { data: galleryImages = [] } = useQuery<string[]>({
        queryKey: ['event-gallery', event?.event_id],
        queryFn: async () => {
            if (!event?.event_id) return [];
            if (event.gallery_images?.length) return event.gallery_images;
            return eventService.getEventGallery(event.event_id);
        },
        enabled: !!event?.event_id,
    });

    const eventLat = event?.venue_latitude ?? event?.latitude;
    const eventLng = event?.venue_longitude ?? event?.longitude;
    const venueDistance =
        hasPermission && latitude && longitude && eventLat && eventLng
            ? getDistanceFromLatLon(latitude, longitude, eventLat, eventLng)
            : null;

    // Extract the numeric token
    const tokenMatch = inviteSegment?.match(/^invite-(.+)$/);
    const token = tokenMatch ? tokenMatch[1] : null;

    useEffect(() => {
        if (!token) {
            setError("Malformed or invalid invite link.");
            setLoading(false);
            return;
        }

        const fetchPreview = async () => {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://api.krownpass.com";
                const headers: HeadersInit = {};
                
                let localToken = typeof window !== "undefined" ? localStorage.getItem("krown_token") : null;
                if (!localToken && typeof window !== "undefined") {
                    try {
                        const parsed = JSON.parse(localStorage.getItem("krown-auth") || "{}");
                        if (parsed?.state?.token) {
                            localToken = parsed.state.token;
                        }
                    } catch(e) {}
                }
                const activeToken = authToken || localToken;
                
                if (activeToken && activeToken !== "null" && activeToken !== "undefined") {
                    headers["Authorization"] = `Bearer ${activeToken}`;
                }

                const res = await fetch(`${apiUrl}/api/events/invite/${token}/preview`, { headers });
                const json = await res.json();
                
                if (!json.success) {
                    setError(json.message || "This invite link is invalid or expired.");
                } else if (json.already_registered) {
                    setAlreadyRegistered(true);
                    setEventData(json.data.event);
                    setInviteLinkMeta(json.data.link ?? null);
                } else {
                    setEventData(json.data.event);
                    setInviteLinkMeta(json.data.link ?? null);
                }
            } catch (err) {
                setError("Failed to load event details. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchPreview();
    }, [token, isAuthenticated, authToken]);

    const handleClaimSpot = async () => {
        if (!isAuthenticated) {
            sessionStorage.setItem("returnTo", `/events/${slug}/${inviteSegment}`);
            setPendingAction('claim');
            setShowAuthModal(true);
            return;
        }

        setClaiming(true);
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://api.krownpass.com";
            const res = await fetch(`${apiUrl}/api/events/invite/${token}/claim`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${authToken}`
                }
            });
            const json = await res.json();

            if (json.success) {
                if (json.data.requires_payment) {
                    router.push(`/checkout/${json.data.registration_id}`);
                } else {
                    router.push(`/events/my-tickets/${json.data.event_id || json.data.registration_id}`);
                }
            } else {
                setError(json.message || "Failed to claim invite.");
            }
        } catch (err) {
            setError("Something went wrong while claiming your ticket.");
        } finally {
            setClaiming(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#0A0A0A]">
                <div className="animate-spin text-[#800020] mb-4">
                    <AlertCircle size={40} />
                </div>
                <p className="text-white/60">Verifying your invite...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center px-4 bg-[#0A0A0A]">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-[#1E1E1E] p-8 rounded-2xl max-w-sm w-full text-center border border-[#2A2A2A]">
                    <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
                    <h1 className="text-xl font-bold text-white mb-2">Invite Unavailable</h1>
                    <p className="text-white/60 text-sm mb-6">{error}</p>
                    <button onClick={() => router.push('/')} className="w-full bg-[#3A3A3A] hover:bg-[#4A4A4A] text-white py-3 rounded-xl transition">
                        Return Home
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <>
        <EventDetailsPresentation
            event={event}
            galleryImages={galleryImages}
            venueDistance={venueDistance}
            onBack={() => router.push('/')}
            bottomBarSlot={
                <div className="w-full max-w-4xl bg-black/60 backdrop-blur-3xl md:rounded-[32px] border-t md:border border-white/[0.08] pointer-events-auto p-4 md:p-5 shadow-[0_-20px_40px_rgba(0,0,0,0.5)] flex flex-col md:flex-row items-center justify-between gap-4 transition-all duration-500">
                    <div className="flex-shrink-0 pl-2 text-center md:text-left w-full md:w-auto mb-2 md:mb-0">
                        <p className="text-white font-semibold text-xl tracking-tight leading-none text-[#D4AF37]">
                            VIP Exclusive Invite
                        </p>
                        <p className="text-white/60 text-[13px] mt-1 tracking-wide">
                            {alreadyRegistered ? "You're on the list" : "A spot has been reserved for you"}
                        </p>
                        {typeof inviteLinkMeta?.spots_remaining === "number" && (
                            <p className="text-[#D4AF37] text-[12px] mt-1 tracking-wide font-medium">
                                {inviteLinkMeta.spots_remaining > 0
                                    ? `${inviteLinkMeta.spots_remaining} invite spots left on this link`
                                    : "This invite link is at capacity"}
                            </p>
                        )}
                        {!isAuthenticated && !alreadyRegistered && (
                            <p className="text-[#C11E38] text-[11px] mt-1 font-medium">Please login to claim</p>
                        )}
                    </div>

                    <div className="flex-1 flex justify-end w-full md:w-auto">


                        {alreadyRegistered ? (
                            <button 
                                onClick={() => router.push('/events/my-tickets')}
                                className="w-full md:w-auto md:max-w-[240px] flex items-center justify-center gap-2 py-3.5 px-6 rounded-full bg-white/[0.04] text-white font-semibold text-[16px] tracking-wide hover:bg-white/[0.1] active:scale-[0.98] transition-all duration-300"
                            >
                                View My Tickets
                            </button>
                        ) : inviteLinkMeta && inviteLinkMeta.spots_remaining && inviteLinkMeta.spots_remaining > 0 ? (
                            <button 
                                onClick={handleClaimSpot}
                                disabled={claiming}
                                className="w-full md:w-auto md:max-w-[240px] flex items-center justify-center gap-2 py-3.5 px-6 rounded-full bg-gradient-to-r from-[#C11E38] to-[#9B0028] disabled:from-white/10 disabled:to-white/10 disabled:text-white/40 text-white font-semibold text-[16px] tracking-wide hover:shadow-[0_0_20px_rgba(193,30,56,0.4)] active:scale-[0.98] transition-all duration-300"
                            >
                                {claiming ? (
                                    <div className="animate-spin border-2 border-white/20 border-t-white rounded-full w-5 h-5 mx-8" />
                                ) : (
                                    <>Claim My Spot <ArrowRight size={18} /></>
                                )}
                            </button>
                        ) :(
                            <button 
                                disabled={true}
                                className="w-full md:w-auto md:max-w-[240px] flex items-center justify-center gap-2 py-3.5 px-6 rounded-full bg-white/10 text-white/40 font-semibold text-[16px] tracking-wide cursor-not-allowed transition-all duration-300"
                            >
                                Spots Full
                            </button>
                        )}
                    </div>
                </div>
            }
        />
        <AuthModal
            isOpen={showAuthModal}
            onClose={() => {
                setShowAuthModal(false);
                setPendingAction(null);
            }}
            onSuccess={() => {
                setShowAuthModal(false);
                if (pendingAction === 'claim') handleClaimSpot();
                setPendingAction(null);
            }}
        />
        </>
    );
}
