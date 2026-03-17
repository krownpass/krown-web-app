'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Heart, Share2, MapPin, Calendar, Clock,
  Users, ChevronDown, ChevronUp, Loader2, Crown, ExternalLink, CheckCircle, Ticket, Minus, Plus,
  Info, Eye, EyeOff, ImageIcon, Navigation, Lock
} from 'lucide-react';
import { useEventDetail, useRegisterForEvent, useJoinWaitlist, useUserRegistration } from '@/queries/useEventDetail';
import { useEventBookmarks, useAddEventBookmark, useRemoveEventBookmark } from '@/queries/useUser';
import { Skeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { CountdownTimer } from '@/components/event/CountdownTimer';
import { formatDate, formatTime, getCapacityPercent, formatCurrency, getDistanceFromLatLon } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { paymentService } from '@/services/payment.service';
import { eventService } from '@/services/event.service';
import { RAZORPAY_KEY_ID } from '@/lib/constants';
import { toast } from 'sonner';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/queries/queryKeys';
import { useUserLocation } from '@/hooks/useUserLocation';
import { useEventRoom } from '@/hooks/useWebSocket';
import { EventBookingSuccess } from '@/components/animations/EventBookingSuccess';
import { AuthModal } from '@/components/modals/AuthModal';

export default function EventDetailPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuthStore();
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [ticketCount, setTicketCount] = useState(1);
  const [showAllThingsToKnow, setShowAllThingsToKnow] = useState(false);
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [showBookingAnimation, setShowBookingAnimation] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<'register' | 'waitlist' | 'bookmark' | null>(null);

  const handleBookingAnimationComplete = useCallback(() => {
    setShowBookingAnimation(false);
    router.push('/events/my-tickets');
  }, [router]);

  const { data: initialEvent, isLoading } = useEventDetail(params.slug);
  const roomData = useEventRoom(initialEvent?.event_id || '');

  const event = React.useMemo(() => {
    if (!initialEvent) return initialEvent;
    
    // Merge updates from websocket
    const mergedEvent = { ...initialEvent, ...roomData.eventUpdates };
    
    if (roomData.registrationCount !== undefined) {
      mergedEvent.current_registrations = roomData.registrationCount;
    }
    
    return mergedEvent;
  }, [initialEvent, roomData]);

  const [hasRevealTimePassed, setHasRevealTimePassed] = useState(true);

  // Use an effect to properly initialize hasRevealTimePassed when event loads
  // Also keep it checking regularly if the time hasn't passed yet
  React.useEffect(() => {
    if (!event?.reveal_time) {
      setHasRevealTimePassed(true);
      return;
    }

    const checkTime = () => {
      const isPassed = new Date(event.reveal_time).getTime() <= Date.now();
      setHasRevealTimePassed(isPassed);
      return isPassed;
    };

    if (checkTime()) return;

    const interval = setInterval(checkTime, 1000);
    return () => clearInterval(interval);
  }, [event?.reveal_time]);

  const { data: userRegistration } = useUserRegistration(event?.event_id);
  const registerMutation = useRegisterForEvent();
  const waitlistMutation = useJoinWaitlist();

  const { data: eventBookmarks = [] } = useEventBookmarks();
  const addBookmark = useAddEventBookmark();
  const removeBookmark = useRemoveEventBookmark();

  const isBookmarked = eventBookmarks?.some((b) => b.event_id === event?.event_id) ?? false;
  const isTogglingBookmark = addBookmark.isPending || removeBookmark.isPending;

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

  const toggleBookmark = () => {
    if (!isAuthenticated) {
      setPendingAction('bookmark');
      setShowAuthModal(true);
      return;
    }
    if (!event?.event_id || isTogglingBookmark) return;

    if (isBookmarked) {
      removeBookmark.mutate(event.event_id);
    } else {
      addBookmark.mutate(event.event_id);
    }
  };

  const handleShare = async () => {
    const path = event?.slug ?? event?.event_id ?? params.slug;
    const url = `${window.location.origin}/events/${path}`;
    const title = event?.title ?? 'Krown Event';
    const text = `Check out ${title} on Krown!`;
    if (navigator.share) {
      await navigator.share({ title, text, url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard!');
    }
  };

  const capacityPercent = getCapacityPercent(event?.current_registrations, event?.max_capacity);

  const handleRegister = async () => {
    if (!isAuthenticated) {
      setPendingAction('register');
      setShowAuthModal(true);
      return;
    }
    if (!event) return;

    // Block unsupported event types with a clear message
    if (event.event_type === 'CONCERT') {
      toast.error('Concert seat booking is available in the Krown mobile app.');
      return;
    }
    if (event.event_type === 'INVITE_ONLY') {
      toast.error('This is an invite-only event. You need an invite code to register.');
      return;
    }
    if (event.event_type === 'MEMBER_ONLY') {
      toast.error('This event is for members only.');
      return;
    }

    if (event.is_paid && event.base_price) {
      setPaymentLoading(true);
      let isRegistrationCreated = false;

      try {
        const loaded = await paymentService.loadRazorpayScript();
        if (!loaded) { toast.error('Payment service unavailable'); return; }

        // Register first (creates PENDING registration), then initiate payment
        await eventService.registerForEvent(event.event_id, ticketCount);
        isRegistrationCreated = true;

        const totalAmount = Number(event.base_price) * ticketCount;
        const order = await paymentService.initiateEventPayment(event.event_id, totalAmount);

        const rzp = new window.Razorpay({
          // Use dynamic Key from backend, exactly like mobile app
          key: order.key || '', 
          amount: Number(order.amount),
          currency: order.currency || 'INR',
          name: 'Krown',
          description: event.title,
          order_id: order.razorpay_order_id || order.order_id || '',
          prefill: { name: user?.name, contact: user?.phone, email: user?.email },
          theme: { color: '#800020' },
          handler: async (response) => {
            try {
              await paymentService.verifyEventPayment(event.event_id, response);
                await queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
                await queryClient.invalidateQueries({ queryKey: queryKeys.events.tickets() });
                await queryClient.invalidateQueries({ queryKey: ['event-registration', event.event_id] });
                setPaymentLoading(false);
                setShowBookingAnimation(true);
              } catch {
                toast.error('Payment verification failed.');
                await eventService.cancelRegistration(event.event_id).catch(() => {});
              }
            },
            modal: { 
              ondismiss: async () => {
                setPaymentLoading(false);
                toast.error('Payment cancelled');
                await eventService.cancelRegistration(event.event_id).catch(() => {});
              } 
            },
          });
          rzp.open();
        } catch (err: any) {
          if (isRegistrationCreated) {
            await eventService.cancelRegistration(event.event_id).catch(() => {});
          }
          const msg = err?.response?.data?.message ?? 'Failed to initiate payment.';
          toast.error(msg);
        } finally {
          // Only stop loading if an error occurred before opening Razorpay
          // Razorpay modal manages its own loading state via ondismiss/handler
          if (!isRegistrationCreated) {
              setPaymentLoading(false);
          }
        }
      } else {
        try {
          await eventService.registerForEvent(event.event_id, ticketCount);
          await queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
          await queryClient.invalidateQueries({ queryKey: queryKeys.events.tickets() });
          await queryClient.invalidateQueries({ queryKey: ['event-registration', event.event_id] });
          setShowBookingAnimation(true);
        } catch (err: any) {
          const msg = err?.response?.data?.message ?? 'Registration failed. Please try again.';
          toast.error(msg);
        }
      }
    };

    const handleWaitlist = async () => {
      if (!isAuthenticated) {
        setPendingAction('waitlist');
        setShowAuthModal(true);
        return;
      }
      if (!event) return;
      try {
        const res = await waitlistMutation.mutateAsync(event.event_id);
      toast.success(`Added to waitlist. Position: #${res.position}`);
    } catch {
      toast.error('Failed to join waitlist.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] pb-36">
        <div className="w-full max-w-[1400px] mx-auto md:px-6 lg:px-12 md:mt-6">
          <Skeleton className="h-[65vh] md:h-[75vh] min-h-[500px] w-full md:rounded-[32px]" />
        </div>
        <div className="max-w-4xl mx-auto px-5 md:px-8 mt-8 space-y-6">
          <Skeleton className="h-10 w-3/4 rounded-xl" />
          <Skeleton className="h-5 w-1/2 rounded-lg" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
          </div>
          <Skeleton className="h-32 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!event) return null;

  const isRegistrationOpen = event.is_registration_open !== false;
  const isFull = event.seats_left !== undefined && event.seats_left <= 0;

  const isRegistrationConfirmed = userRegistration?.status === "CONFIRMED" || userRegistration?.status === "CHECKED_IN";
  const hasActiveRegistration = isRegistrationConfirmed || userRegistration?.status === "PENDING";
  const userBookedTickets = hasActiveRegistration ? (userRegistration?.ticket_count ?? 0) : 0;
  const maxPerUser = (event as any).max_tickets_per_user || 5;

  const confirmedCount = (event as any).confirmed_registrations ?? event.current_registrations ?? 0;
  const overallAvailable = event.max_capacity ? Math.max(0, event.max_capacity - confirmedCount) : 'Unlimited';
  const perUserAllowance = Math.max(0, maxPerUser - userBookedTickets);
  const remainingAllowance = overallAvailable === 'Unlimited' ? perUserAllowance : Math.min(perUserAllowance, overallAvailable as number);

  const hasBookedTickets = userBookedTickets > 0;
  const hasMaxedOut = remainingAllowance === 0 && hasBookedTickets;
  const isSoldOut = overallAvailable === 0;

  const isRevealed = event.reveal_time 
    ? hasRevealTimePassed 
    : event.is_revealed !== false;

  const eventLat = event.venue_latitude ?? (event as any).latitude;
  const eventLng = event.venue_longitude ?? (event as any).longitude;
  const venueDistance =
    hasPermission && latitude && longitude && eventLat && eventLng
      ? getDistanceFromLatLon(latitude, longitude, eventLat, eventLng)
      : null;

  const thingsToKnow = event.instructions ?? [];
  const visibleThingsToKnow = showAllThingsToKnow ? thingsToKnow : thingsToKnow.slice(0, 3);

  const isPastEvent = event.end_time 
    ? new Date(event.end_time).getTime() < Date.now() 
    : new Date(event.start_time).getTime() < Date.now();

  const getEventTypeLabel = () => {
    switch (event.event_type) {
      case 'KROWN_EXCLUSIVE': return 'Krown Exclusive';
      case 'MEMBER_ONLY': return 'Members Only';
      case 'INVITE_ONLY': return 'Invite Only';
      case 'CONCERT': return 'Concert';
      default: return 'Open';
    }
  };

  const isMembersOnlyType = event.event_type === 'KROWN_EXCLUSIVE' || event.event_type === 'MEMBER_ONLY';

  return (
    <>
    <EventBookingSuccess show={showBookingAnimation} onComplete={handleBookingAnimationComplete} />
    <div className="min-h-screen bg-[#0A0A0A] pb-36">
      {/* ── Hero ── */}
      <div className="w-full max-w-[1400px] mx-auto md:px-6 lg:px-12 md:mt-6">
        <div className="relative h-[65vh] md:h-[75vh] min-h-[500px] overflow-hidden md:rounded-[32px]">
          <motion.div 
            className="absolute inset-0"
            initial={{ scale: 1.05 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          >
          {event.cover_image ? (
            <Image
              src={event.cover_image}
              alt={event.title}
              fill
              className="object-cover"
              priority
              sizes="100vw"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#10080C] via-[#0A0A0A] to-[#0A0A10]" />
          )}
        </motion.div>
        
        {/* Seamless fade to black */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-[#0A0A0A] opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/80 to-transparent h-1/2 top-auto" />

        {/* Floating Nav */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          className="absolute top-0 left-0 right-0 max-w-4xl mx-auto p-5 md:p-8 flex justify-between items-center z-20"
        >
          <button
            onClick={() => router.back()}
            className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-3xl border border-white/10 flex items-center justify-center text-white hover:bg-black/60 hover:scale-105 active:scale-95 transition-all duration-300 shadow-[0_4px_30px_rgba(0,0,0,0.5)]"
          >
            <ArrowLeft size={18} strokeWidth={2} />
          </button>
          <div className="flex gap-3">
            <button
              onClick={toggleBookmark}
              disabled={isTogglingBookmark}
              className={`w-11 h-11 rounded-full bg-black/40 backdrop-blur-3xl border border-white/10 flex items-center justify-center transition-all duration-300 shadow-[0_4px_30px_rgba(0,0,0,0.5)] ${
                isTogglingBookmark ? 'opacity-50 cursor-not-allowed' : 'hover:bg-black/60 hover:scale-105 active:scale-95'
              }`}
            >
              <Heart
                size={18}
                strokeWidth={isBookmarked ? 0 : 2}
                fill={isBookmarked ? '#C11E38' : 'none'}
                className={isBookmarked ? 'text-[#C11E38]' : 'text-white'}
              />
            </button>
            <button
              onClick={handleShare}
              className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-3xl border border-white/10 flex items-center justify-center text-white hover:bg-black/60 hover:scale-105 active:scale-95 transition-all duration-300 shadow-[0_4px_30px_rgba(0,0,0,0.5)]"
            >
              <Share2 size={18} strokeWidth={2} />
            </button>
          </div>
        </motion.div>

        {/* View Tickets pill */}
        {hasActiveRegistration && userBookedTickets > 0 && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            onClick={() => router.push(`/events/my-tickets/${event.event_id}`)}
            className="absolute top-24 right-5 md:right-8 z-20 px-5 py-2.5 rounded-full bg-black/40 backdrop-blur-3xl border border-white/10 text-white flex items-center gap-2.5 text-sm font-medium shadow-[0_4px_30px_rgba(0,0,0,0.5)] hover:bg-black/60 transition-all duration-300"
          >
            {isRegistrationConfirmed ? <Ticket size={16} /> : <Clock size={16} />}
            {isRegistrationConfirmed ? 'View Tickets' : 'Confirming...'}
          </motion.button>
        )}

        {/* Hero bottom overlay — title & badges */}
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-8 md:px-8 z-10">
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            >
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mb-4 text-[13px] font-medium tracking-wide">
                {event.category && (
                  <span className="text-white/70 uppercase tracking-[0.2em] font-medium">{event.category}</span>
                )}
                
                {event.category && event.event_type && event.event_type !== 'OPEN' && (
                  <span className="w-1 h-1 rounded-full bg-white/20" />
                )}
                
                {event.event_type && event.event_type !== 'OPEN' && (
                  <span className={isMembersOnlyType ? 'text-[#D4AF37]' : 'text-[#C11E38]'}>
                    {getEventTypeLabel()}
                  </span>
                )}

                {((!event.is_paid) || isFull) && (
                  <span className="w-1 h-1 rounded-full bg-white/20" />
                )}

                {!event.is_paid && (
                  <span className="text-emerald-400">Free Entry</span>
                )}

                {isFull && (
                  <span className="text-red-400">Sold Out</span>
                )}
              </div>
              
              <h1 className="font-playfair text-4xl md:text-6xl lg:text-7xl font-semibold text-white leading-[1.05] tracking-tight mb-2 drop-shadow-lg">
                {event.title}
              </h1>
            </motion.div>
          </div>
        </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-4xl mx-auto px-5 md:px-8 mt-6 relative z-20">

        {/* Reveal Timer if Secret Location Event */}
        {!isRevealed && event.reveal_time && new Date(event.reveal_time) > new Date() && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3, type: "spring", stiffness: 100 }}
            className="mb-8 flex justify-center"
          >
            <div className="inline-block p-1 rounded-full bg-gradient-to-r from-transparent via-[#C11E38]/20 to-transparent">
              <CountdownTimer 
                targetDate={event.reveal_time} 
                label="Location Reveals In" 
                completedText="Unlocking location..." 
                onComplete={() => setHasRevealTimePassed(true)} 
              />
            </div>
          </motion.div>
        )}

        {/* Info & Availability Glass Panel */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="bg-white/[0.03] backdrop-blur-3xl rounded-[32px] border border-white/[0.08] p-2 flex flex-col drop-shadow-2xl"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {/* Date & Time */}
            <div className="rounded-[24px] bg-black/20 p-6 flex flex-col justify-center transition-colors duration-500 hover:bg-black/40">
              <div className="flex items-start gap-5">
                <div className="w-12 h-12 rounded-full bg-white/[0.05] flex items-center justify-center flex-shrink-0">
                  <Calendar size={20} strokeWidth={1.5} className="text-white/80" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-white/90 font-medium text-[16px] tracking-wide">{formatDate(event.start_time)}</p>
                  <p className="text-white/50 text-[14px] mt-1 font-light tracking-wide">
                    {formatTime(event.start_time)}{event.end_time ? ` – ${formatTime(event.end_time)}` : ''}
                  </p>
                  {event.gates_open_time && (
                    <p className="text-[#D4AF37]/80 text-[11px] uppercase tracking-[0.1em] mt-3 font-semibold">Gates Open {formatTime(event.gates_open_time)}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Venue */}
            {isRevealed && event.venue_name ? (
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(event.venue_name + (event.venue_city ? `, ${event.venue_city}` : ''))}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-[24px] bg-black/20 p-6 flex flex-col justify-center transition-all duration-500 hover:bg-black/40 relative overflow-hidden"
              >
                <div className="flex items-start gap-5 relative z-10">
                  <div className="w-12 h-12 rounded-full bg-white/[0.05] flex items-center justify-center flex-shrink-0 group-hover:bg-white/[0.1] transition-colors">
                    <MapPin size={20} strokeWidth={1.5} className="text-white/80" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-white/90 font-medium text-[16px] tracking-wide truncate">
                      {event.venue_name}{event.venue_city ? `, ${event.venue_city}` : ''}
                    </p>
                    <p className="text-white/50 text-[14px] mt-1 font-light truncate tracking-wide">
                      {venueDistance ? `${venueDistance.toFixed(1)} km away` : event.venue_address || 'View on map'}
                    </p>
                  </div>
                  <ExternalLink size={16} strokeWidth={1.5} className="text-white/20 group-hover:text-white/60 transition-colors" />
                </div>
              </a>
            ) : !isRevealed && event.reveal_time ? (
              <div className="relative rounded-[24px] bg-black/20 p-6 flex flex-col justify-center overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-[#C11E38] opacity-[0.08] blur-[40px] pointer-events-none rounded-full"></div>
                
                <div className="flex items-center gap-5 relative z-10">
                  <div className="w-12 h-12 rounded-full bg-white/[0.05] border border-white/[0.05] flex items-center justify-center flex-shrink-0">
                    <Crown size={20} strokeWidth={1.5} className="text-[#C11E38]/80" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-white/90 font-medium text-[16px] font-playfair tracking-wider">Secret Location</p>
                    <p className="text-white/50 text-[14px] mt-1 font-light flex items-center gap-2">
                      <Lock size={12} className="text-[#C11E38]/80" /> Unlocking soon
                    </p>
                  </div>
                </div>
              </div>
            ) : !isRevealed ? (
              <div className="rounded-[24px] bg-black/20 p-6 flex flex-col justify-center">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-full bg-white/[0.05] flex items-center justify-center flex-shrink-0">
                    <EyeOff size={20} strokeWidth={1.5} className="text-[#C11E38]/80" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-white/90 font-medium text-[16px] tracking-wide">Venue TBA</p>
                    <p className="text-white/50 text-[14px] mt-1 font-light tracking-wide">Stay tuned</p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {/* Availability Footer inline */}
          {event.max_capacity && (
            <div className="mt-2 rounded-[24px] bg-black/10 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users size={16} strokeWidth={1.5} className="text-white/40" />
                <span className="text-white/60 text-[14px] tracking-wide font-light">Availability</span>
              </div>
              <span className={`text-[14px] tracking-wide font-medium ${isFull ? 'text-red-400' : capacityPercent > 80 ? 'text-amber-400' : 'text-emerald-400/90'}`}>
                {isFull ? 'Sold Out' : `${event.seats_left ?? (event.max_capacity - (event.current_registrations ?? 0))} spots remaining`}
              </span>
            </div>
          )}
        </motion.div>

        {/* About */}
        {event.description && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.45 }}
            className="mt-12"
          >
            <h3 className="text-white/40 text-[11px] font-semibold uppercase tracking-[0.2em] mb-4">About</h3>
            <div className="rounded-[24px] bg-white/[0.02] border border-white/[0.05] p-6 md:p-8 backdrop-blur-xl">
              <AnimatePresence mode="wait">
                <motion.p
                  key={showFullDesc ? 'full' : 'short'}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-white/70 text-[16px] leading-[1.8] font-light"
                >
                  {showFullDesc ? event.description : event.description.slice(0, 200) + (event.description.length > 200 ? '...' : '')}
                </motion.p>
              </AnimatePresence>
              {event.description.length > 200 && (
                <button
                  onClick={() => setShowFullDesc(!showFullDesc)}
                  className="text-white/40 hover:text-white text-sm font-medium mt-4 flex items-center gap-1.5 transition-colors duration-300"
                >
                  {showFullDesc ? <><ChevronUp size={14} />Show less</> : <><ChevronDown size={14} />Read more</>}
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* Schedule */}
        {event.schedule && event.schedule.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-12"
          >
            <h3 className="text-white/40 text-[11px] font-semibold uppercase tracking-[0.2em] mb-4">Schedule</h3>
            <div className="rounded-[24px] bg-white/[0.02] border border-white/[0.05] overflow-hidden backdrop-blur-xl">
              {event.schedule.map((item, i) => (
                <div key={i} className="flex items-start gap-4 px-6 py-5 border-b border-white/[0.05] last:border-0 hover:bg-white/[0.02] transition-colors duration-300">
                  <span className="text-white/40 text-sm font-mono tracking-wider w-16 flex-shrink-0 pt-0.5">{item.time}</span>
                  <div className="w-2 h-2 rounded-full bg-[#C11E38] flex-shrink-0 mt-1.5 shadow-[0_0_10px_rgba(193,30,56,0.5)]" />
                  <p className="text-white/80 text-[16px] font-light leading-relaxed">{item.activity}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Things to Know */}
        {thingsToKnow.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.52 }}
            className="mt-12"
          >
            <h3 className="text-white/40 text-[11px] font-semibold uppercase tracking-[0.2em] mb-4">Things to Know</h3>
            <div className="rounded-[24px] bg-white/[0.02] border border-white/[0.05] overflow-hidden backdrop-blur-xl">
              {visibleThingsToKnow.map((text, i) => (
                <div key={i} className="flex items-start gap-4 px-6 py-5 border-b border-white/[0.05] last:border-0">
                  <div className="w-8 h-8 rounded-full bg-white/[0.05] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Info size={15} strokeWidth={1.5} className="text-white/60" />
                  </div>
                  <p className="text-white/70 text-[15px] font-light leading-relaxed flex-1 pt-1">{text}</p>
                </div>
              ))}
            </div>
            {thingsToKnow.length > 3 && (
              <button
                onClick={() => setShowAllThingsToKnow(!showAllThingsToKnow)}
                className="text-white/40 hover:text-white text-sm font-medium mt-4 flex items-center gap-1.5 transition-colors duration-300"
              >
                {showAllThingsToKnow ? <><ChevronUp size={14} />Show less</> : <><ChevronDown size={14} />See all {thingsToKnow.length} essentials</>}
              </button>
            )}
          </motion.div>
        )}

        {/* Event Gallery */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.54 }}
          className="mt-12"
        >
          <h3 className="text-white/40 text-[11px] font-semibold uppercase tracking-[0.2em] mb-4">Gallery</h3>
          {galleryImages.length > 0 ? (
            <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide -mx-5 px-5 md:-mx-8 md:px-8 snap-x">
              {galleryImages.map((img, i) => {
                const src = typeof img === 'string' ? img : (img as any).image_url || (img as any).url || (img as any).image;
                return (
                  <div key={i} className="relative flex-shrink-0 w-48 h-64 md:w-56 md:h-72 rounded-[24px] overflow-hidden group snap-center shadow-lg border border-white/[0.05]">
                    <Image
                      src={src}
                      alt={`Gallery ${i + 1}`}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-700 ease-[0.16,1,0.3,1]"
                      sizes="(max-width: 768px) 192px, 224px"
                    />
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-500" />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-[24px] bg-white/[0.02] border border-white/[0.05] h-48 flex flex-col items-center justify-center gap-3 backdrop-blur-xl">
              <ImageIcon size={24} strokeWidth={1.5} className="text-white/20" />
              <p className="text-white/40 text-[14px] font-light tracking-wide">No images added</p>
            </div>
          )}
        </motion.div>

        {/* Ticket Tiers */}
        {event.ticket_tiers && event.ticket_tiers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.56 }}
            className="mt-12"
          >
            <h3 className="text-white/40 text-[11px] font-semibold uppercase tracking-[0.2em] mb-4">Select Ticket</h3>
            <div className="space-y-3">
              {event.ticket_tiers.map((tier) => {
                const available = tier.quantity - tier.sold_count;
                const isAvailable = available > 0;
                const isSelected = selectedTier === tier.tier_id;
                return (
                  <button
                    key={tier.tier_id}
                    onClick={() => isAvailable && setSelectedTier(tier.tier_id)}
                    disabled={!isAvailable}
                    className={`w-full text-left rounded-[24px] p-6 border transition-all duration-500 flex items-center justify-between gap-4 backdrop-blur-xl ${
                      isSelected
                        ? 'border-[#C11E38] bg-[#C11E38]/10'
                        : 'border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.04]'
                    } ${!isAvailable ? 'opacity-50 cursor-not-allowed grayscale' : 'hover:scale-[1.01] active:scale-[0.99]'}`}
                  >
                    <div className="min-w-0">
                      <p className="text-white/90 font-medium text-[16px] tracking-wide">{tier.name}</p>
                      {tier.description && <p className="text-white/50 text-[14px] font-light mt-1">{tier.description}</p>}
                      <p className={`text-[12px] mt-2 font-medium tracking-wide uppercase ${isAvailable ? 'text-emerald-400' : 'text-red-400'}`}>
                        {isAvailable ? `${available} left` : 'Sold Out'}
                      </p>
                    </div>
                    <div className="flex flex-col items-end flex-shrink-0">
                      <p className="text-white font-semibold text-xl tracking-tight">{tier.price > 0 ? formatCurrency(tier.price) : 'FREE'}</p>
                      {isSelected && (
                        <motion.div 
                          initial={{ scale: 0 }} 
                          animate={{ scale: 1 }} 
                          className="w-6 h-6 rounded-full bg-[#C11E38] flex items-center justify-center mt-2 shadow-[0_0_15px_rgba(193,30,56,0.6)]"
                        >
                          <CheckCircle size={14} className="text-white" strokeWidth={2.5} />
                        </motion.div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Krown Pass */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.55 }}
          className="mt-12"
        >
          <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-r from-[#D4AF37]/10 via-transparent to-[#D4AF37]/5 border border-[#D4AF37]/20 p-6 backdrop-blur-xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37] opacity-[0.03] blur-[50px] pointer-events-none rounded-full" />
            <div className="flex items-center gap-5 relative z-10">
              <div className="w-12 h-12 rounded-full bg-[#D4AF37]/10 flex items-center justify-center flex-shrink-0 border border-[#D4AF37]/20">
                <Crown size={20} strokeWidth={1.5} className="text-[#D4AF37]" />
              </div>
              <div>
                <p className="text-[#D4AF37] text-[12px] font-bold tracking-[0.2em] uppercase">Krown Pass</p>
                <p className="text-[#D4AF37]/70 text-[14px] font-light mt-1">Unlock early access & priority privileges</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Sticky Bottom Bar ── */}
      <div className="fixed bottom-16 md:bottom-6 left-0 right-0 z-50 md:px-8 pointer-events-none flex justify-center">
        <div className="w-full max-w-4xl bg-black/60 backdrop-blur-3xl md:rounded-[32px] border-t md:border border-white/[0.08] pointer-events-auto p-4 md:p-5 shadow-[0_-20px_40px_rgba(0,0,0,0.5)] flex items-center justify-between gap-4 transition-all duration-500">
          {/* Price */}
          <div className="flex-shrink-0 pl-2">
            {event.is_paid && event.base_price ? (
              <p className="text-white font-semibold text-2xl tracking-tight leading-none">{formatCurrency(Number(event.base_price))}</p>
            ) : (
              <p className="text-white font-semibold text-2xl tracking-tight leading-none">Free</p>
            )}
            <p className="text-white/40 text-[12px] mt-1 font-medium tracking-wide uppercase">
              {remainingAllowance > 0
                ? `${remainingAllowance} slots left`
                : 'All slots booked'}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex-1 flex justify-end gap-3">
            {isPastEvent ? (
              <button disabled className="flex-1 max-w-[220px] flex items-center justify-center gap-2 py-3.5 rounded-full bg-white/[0.04] text-white/40 font-semibold text-[15px] cursor-not-allowed">
                <CheckCircle size={18} className="opacity-50" /> Ended
              </button>
            ) : userRegistration?.status === "PENDING" ? (
              <button disabled className="flex-1 max-w-[220px] flex items-center justify-center gap-2 py-3.5 rounded-full bg-white/[0.04] text-white/40 font-semibold text-[15px] cursor-not-allowed">
                <Clock size={18} /> Confirming...
              </button>
            ) : hasMaxedOut || (isSoldOut && hasBookedTickets) ? (
              <button disabled className="flex-1 max-w-[220px] flex items-center justify-center gap-2 py-3.5 rounded-full bg-white/[0.04] text-white/40 font-semibold text-[15px] cursor-not-allowed">
                <CheckCircle size={18} /> Booked
              </button>
            ) : isSoldOut && !event.is_waitlist_open ? (
              <button disabled className="flex-1 max-w-[220px] flex items-center justify-center gap-2 py-3.5 rounded-full bg-white/[0.04] text-white/30 font-semibold text-[15px] cursor-not-allowed">
                Sold Out
              </button>
            ) : !isRegistrationOpen ? (
              <button disabled className="flex-1 max-w-[220px] py-3.5 rounded-full bg-white/[0.04] text-white/30 font-semibold text-[15px] cursor-not-allowed">
                Closed
              </button>
            ) : isSoldOut && event.is_waitlist_open ? (
              <button
                onClick={handleWaitlist}
                disabled={waitlistMutation.isPending}
                className="flex-1 max-w-[220px] flex items-center justify-center gap-2 py-3.5 rounded-full bg-transparent border border-white/20 text-white font-semibold text-[15px] hover:bg-white/10 active:scale-[0.98] transition-all duration-300"
              >
                {waitlistMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : null}
                Join Waitlist
              </button>
            ) : (
              <div className="flex flex-1 justify-end items-center gap-4">
                {remainingAllowance > 1 && isRegistrationOpen && (
                  <div className="flex items-center bg-white/[0.04] border border-white/[0.08] rounded-full p-1.5 backdrop-blur-xl">
                    <button
                      onClick={() => setTicketCount(Math.max(1, ticketCount - 1))}
                      disabled={ticketCount <= 1}
                      className="w-10 h-10 rounded-full flex items-center justify-center bg-white/[0.05] disabled:opacity-30 hover:bg-white/[0.15] active:scale-95 transition-all duration-300 text-white"
                    >
                      <Minus size={16} strokeWidth={2} />
                    </button>
                    <span className="w-10 text-center font-semibold text-white text-[15px] tabular-nums">
                      {ticketCount}
                    </span>
                    <button
                      onClick={() => setTicketCount(Math.min(remainingAllowance as number, ticketCount + 1))}
                      disabled={ticketCount >= (remainingAllowance as number)}
                      className="w-10 h-10 rounded-full flex items-center justify-center bg-white/[0.05] disabled:opacity-30 hover:bg-white/[0.15] active:scale-95 transition-all duration-300 text-white"
                    >
                      <Plus size={16} strokeWidth={2} />
                    </button>
                  </div>
                )}

                <button
                  onClick={handleRegister}
                  disabled={registerMutation.isPending || paymentLoading}
                  className="flex-1 max-w-[240px] flex items-center justify-center gap-2 py-3.5 px-6 rounded-full bg-gradient-to-r from-[#C11E38] to-[#9B0028] disabled:from-white/10 disabled:to-white/10 disabled:text-white/40 text-white font-semibold text-[16px] tracking-wide hover:shadow-[0_0_20px_rgba(193,30,56,0.4)] active:scale-[0.98] transition-all duration-300"
                >
                  {(registerMutation.isPending || paymentLoading) ? <Loader2 size={18} className="animate-spin" /> : null}
                  {hasBookedTickets ? 'Book More' : event.is_paid ? `Pay ${formatCurrency(ticketCount * Number(event.base_price || 0))}` : 'Register'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    <AuthModal
      isOpen={showAuthModal}
      onClose={() => {
        setShowAuthModal(false);
        setPendingAction(null);
      }}
      onSuccess={() => {
        setShowAuthModal(false);
        if (pendingAction === 'register') handleRegister();
        else if (pendingAction === 'waitlist') handleWaitlist();
        else if (pendingAction === 'bookmark') toggleBookmark();
        setPendingAction(null);
      }}
    />
    </>
  );
}