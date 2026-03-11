'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Heart, Share2, MapPin, Calendar, Clock,
  Users, ChevronDown, ChevronUp, Loader2, Crown, ExternalLink, CheckCircle, Ticket, Minus, Plus,
  Info, Eye, EyeOff, ImageIcon, Navigation
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
import { EventBookingSuccess } from '@/components/animations/EventBookingSuccess';

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

  const handleBookingAnimationComplete = useCallback(() => {
    setShowBookingAnimation(false);
    router.push('/events/my-tickets');
  }, [router]);

  const { data: event, isLoading } = useEventDetail(params.slug);
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
      toast.error('Please sign in to save events');
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
      router.push(`/login?redirect=/events/${params.slug}`);
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
      if (!isAuthenticated) { router.push('/login'); return; }
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
      <div className="min-h-screen bg-[#0A0A0A]">
        <Skeleton className="h-[420px] md:h-[520px] w-full" />
        <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
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

  const isRevealed = event.is_revealed !== false;

  const eventLat = event.venue_latitude ?? (event as any).latitude;
  const eventLng = event.venue_longitude ?? (event as any).longitude;
  const venueDistance =
    hasPermission && latitude && longitude && eventLat && eventLng
      ? getDistanceFromLatLon(latitude, longitude, eventLat, eventLng)
      : null;

  const thingsToKnow = event.instructions ?? [];
  const visibleThingsToKnow = showAllThingsToKnow ? thingsToKnow : thingsToKnow.slice(0, 3);

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
      <div className="relative h-[420px] md:h-[520px] overflow-hidden">
        {event.cover_image ? (
          <Image
            src={event.cover_image}
            alt={event.title}
            fill
            className="object-cover scale-[1.02]"
            priority
            sizes="100vw"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#1A0A10] via-[#0A0A0A] to-[#0A0A1A]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/50 to-black/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0A]/20 to-transparent" />

        {/* Floating Nav */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="absolute top-0 left-0 right-0 p-5 flex justify-between items-center z-10"
        >
          <button
            onClick={() => router.back()}
            className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/[0.08] flex items-center justify-center text-white hover:bg-white/20 transition-all duration-300"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex gap-2.5">
            <button
              onClick={toggleBookmark}
              disabled={isTogglingBookmark}
              className={`w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/[0.08] flex items-center justify-center transition-all duration-300 ${
                isTogglingBookmark ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/20'
              }`}
            >
              <Heart
                size={18}
                fill={isBookmarked ? '#C11E38' : 'none'}
                className={`transition-colors duration-300 ${isBookmarked ? 'text-[#C11E38]' : 'text-white'}`}
              />
            </button>
            <button
              onClick={handleShare}
              className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/[0.08] flex items-center justify-center text-white hover:bg-white/20 transition-all duration-300"
            >
              <Share2 size={18} />
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
            className="absolute bottom-6 right-6 z-20 px-5 py-2.5 rounded-2xl bg-white/15 backdrop-blur-xl border border-white/[0.12] text-white flex items-center gap-2.5 text-sm font-medium shadow-2xl hover:bg-white/25 transition-all duration-300"
          >
            {isRegistrationConfirmed ? <Ticket size={16} /> : <Clock size={16} />}
            {isRegistrationConfirmed ? 'View Tickets' : 'Confirming...'}
          </motion.button>
        )}

        {/* Hero bottom overlay — title & badges */}
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-7 md:px-8">
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="flex flex-wrap gap-2 mb-4">
                {event.category && <Badge variant="default" className="backdrop-blur-sm bg-white/20 text-white border-white/20">{event.category}</Badge>}
                {event.tags?.map((t) => <Badge key={t} variant="default" className="backdrop-blur-sm">{t}</Badge>)}
                {event.event_type && event.event_type !== 'OPEN' && (
                  <Badge variant={isMembersOnlyType ? 'gold' : 'burgundy'} className="backdrop-blur-sm">{getEventTypeLabel()}</Badge>
                )}
                {!event.is_paid && <Badge variant="success" className="backdrop-blur-sm">Free Entry</Badge>}
                {isRegistrationOpen && !isFull && <Badge variant="success" className="backdrop-blur-sm">Open</Badge>}
                {isFull && <Badge variant="error" className="backdrop-blur-sm">Full</Badge>}
              </div>
              <h1 className="font-playfair text-3xl md:text-5xl font-bold text-white leading-[1.08] tracking-tight">
                {event.title}
              </h1>
            </motion.div>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-3xl mx-auto px-5 md:px-8">

        {/* Countdown */}
        {event.start_time && new Date(event.start_time) > new Date() && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-8"
          >
            <CountdownTimer targetDate={event.start_time} />
          </motion.div>
        )}

        {/* Quick Info Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-8"
        >
          {/* Date & Time */}
          <div className="relative overflow-hidden rounded-2xl bg-white/[0.04] border border-white/[0.06] p-5 hover:bg-white/[0.06] transition-all duration-500">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#800020]/15 flex items-center justify-center flex-shrink-0">
                <Calendar size={18} className="text-[#C11E38]" />
              </div>
              <div className="min-w-0">
                <p className="text-white font-medium text-[15px]">{formatDate(event.start_time)}</p>
                <p className="text-white/40 text-sm mt-0.5">
                  {formatTime(event.start_time)}{event.end_time ? ` – ${formatTime(event.end_time)}` : ''}
                </p>
                {event.gates_open_time && (
                  <p className="text-white/25 text-xs mt-1.5">Gates open {formatTime(event.gates_open_time)}</p>
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
              className="group relative overflow-hidden rounded-2xl bg-white/[0.04] border border-white/[0.06] p-5 hover:bg-white/[0.06] hover:border-[#800020]/25 transition-all duration-500"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#800020]/15 flex items-center justify-center flex-shrink-0">
                  <MapPin size={18} className="text-[#C11E38]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-[15px] truncate">
                    {event.venue_name}{event.venue_city ? `, ${event.venue_city}` : ''}
                  </p>
                  <p className="text-white/40 text-sm mt-0.5 truncate">
                    {venueDistance
                      ? `${venueDistance.toFixed(1)} km away · View on map`
                      : event.venue_address || 'View on map'}
                  </p>
                </div>
                <ExternalLink size={14} className="text-white/20 group-hover:text-white/50 flex-shrink-0 mt-1 transition-colors duration-300" />
              </div>
            </a>
          ) : !isRevealed ? (
            <div className="relative overflow-hidden rounded-2xl bg-white/[0.04] border border-white/[0.06] p-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#800020]/15 flex items-center justify-center flex-shrink-0">
                  <EyeOff size={18} className="text-[#C11E38]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-[15px]">Venue will be revealed soon!</p>
                  <p className="text-white/40 text-sm mt-0.5">Stay tuned</p>
                </div>
              </div>
            </div>
          ) : null}
        </motion.div>

        {/* Capacity */}
        {event.max_capacity && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-6"
          >
            <div className="rounded-2xl bg-white/[0.04] border border-white/[0.06] p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Users size={15} className="text-white/40" />
                  <span className="text-white/50 text-sm">
                    {event.current_registrations ?? 0} / {event.max_capacity}
                  </span>
                </div>
                <span className={`text-sm font-semibold ${isFull ? 'text-red-400' : capacityPercent > 80 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {isFull ? 'Sold Out' : `${event.seats_left ?? (event.max_capacity - (event.current_registrations ?? 0))} spots left`}
                </span>
              </div>
              <ProgressBar
                value={capacityPercent}
                color={capacityPercent > 80 ? '#EF4444' : '#800020'}
                height={4}
              />
            </div>
          </motion.div>
        )}

        {/* About */}
        {event.description && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.45 }}
            className="mt-8"
          >
            <h3 className="text-white/30 text-xs font-semibold uppercase tracking-[0.15em] mb-4">About</h3>
            <div className="rounded-2xl bg-white/[0.04] border border-white/[0.06] p-5">
              <AnimatePresence mode="wait">
                <motion.p
                  key={showFullDesc ? 'full' : 'short'}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-white/55 text-[15px] leading-[1.75]"
                >
                  {showFullDesc ? event.description : event.description.slice(0, 200) + (event.description.length > 200 ? '...' : '')}
                </motion.p>
              </AnimatePresence>
              {event.description.length > 200 && (
                <button
                  onClick={() => setShowFullDesc(!showFullDesc)}
                  className="text-[#C11E38] text-sm font-medium mt-3 flex items-center gap-1 hover:text-[#E8334F] transition-colors duration-300"
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
            className="mt-8"
          >
            <h3 className="text-white/30 text-xs font-semibold uppercase tracking-[0.15em] mb-4">Schedule</h3>
            <div className="rounded-2xl bg-white/[0.04] border border-white/[0.06] overflow-hidden divide-y divide-white/[0.04]">
              {event.schedule.map((item, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-4">
                  <span className="text-white/30 text-sm font-mono w-16 flex-shrink-0">{item.time}</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-[#800020] flex-shrink-0" />
                  <p className="text-white/70 text-[15px]">{item.activity}</p>
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
            className="mt-8"
          >
            <h3 className="text-white/30 text-xs font-semibold uppercase tracking-[0.15em] mb-4">Things to Know</h3>
            <div className="rounded-2xl bg-white/[0.04] border border-white/[0.06] overflow-hidden divide-y divide-white/[0.04]">
              {visibleThingsToKnow.map((text, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-4">
                  <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center flex-shrink-0">
                    <Info size={15} className="text-white/50" />
                  </div>
                  <p className="text-white/70 text-[15px] flex-1">{text}</p>
                </div>
              ))}
            </div>
            {thingsToKnow.length > 3 && (
              <button
                onClick={() => setShowAllThingsToKnow(!showAllThingsToKnow)}
                className="text-[#C11E38] text-sm font-medium mt-3 flex items-center gap-1 hover:text-[#E8334F] transition-colors duration-300"
              >
                {showAllThingsToKnow ? <><ChevronUp size={14} />Show less</> : <><ChevronDown size={14} />See all {thingsToKnow.length} items</>}
              </button>
            )}
          </motion.div>
        )}

        {/* Event Gallery */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.54 }}
          className="mt-8"
        >
          <h3 className="text-white/30 text-xs font-semibold uppercase tracking-[0.15em] mb-4">Gallery</h3>
          {galleryImages.length > 0 ? (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-5 px-5 md:-mx-8 md:px-8">
              {galleryImages.map((img, i) => {
                const src = typeof img === 'string' ? img : (img as any).image_url || (img as any).url || (img as any).image;
                return (
                  <div key={i} className="relative flex-shrink-0 w-44 h-44 rounded-2xl overflow-hidden group">
                    <Image
                      src={src}
                      alt={`Gallery ${i + 1}`}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="176px"
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl bg-white/[0.04] border border-white/[0.06] h-44 flex flex-col items-center justify-center gap-2">
              <ImageIcon size={24} className="text-white/20" />
              <p className="text-white/30 text-sm">No images added yet</p>
            </div>
          )}
        </motion.div>

        {/* Ticket Tiers */}
        {event.ticket_tiers && event.ticket_tiers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.56 }}
            className="mt-8"
          >
            <h3 className="text-white/30 text-xs font-semibold uppercase tracking-[0.15em] mb-4">Select Ticket</h3>
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
                    className={`w-full text-left rounded-2xl p-5 border-2 transition-all duration-300 flex items-center justify-between gap-4 ${
                      isSelected
                        ? 'border-[#C11E38] bg-[#C11E38]/5'
                        : 'border-white/[0.06] bg-white/[0.04] hover:bg-white/[0.06]'
                    } ${!isAvailable ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="min-w-0">
                      <p className="text-white font-semibold text-[15px]">{tier.name}</p>
                      {tier.description && <p className="text-white/40 text-sm mt-1">{tier.description}</p>}
                      <p className={`text-xs mt-1.5 font-medium ${isAvailable ? 'text-emerald-400' : 'text-red-400'}`}>
                        {isAvailable ? `${available} left` : 'Sold Out'}
                      </p>
                    </div>
                    <div className="flex flex-col items-end flex-shrink-0">
                      <p className="text-white font-bold text-lg">{tier.price > 0 ? formatCurrency(tier.price) : 'FREE'}</p>
                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-[#C11E38] flex items-center justify-center mt-1">
                          <CheckCircle size={14} className="text-white" />
                        </div>
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
          className="mt-8"
        >
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#800020]/10 via-[#D4AF37]/5 to-[#800020]/10 border border-[#D4AF37]/15 p-5">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/15 flex items-center justify-center flex-shrink-0">
                <Crown size={18} className="text-[#D4AF37]" />
              </div>
              <div>
                <p className="text-[#D4AF37] text-xs font-semibold tracking-[0.1em] uppercase">Krown Pass</p>
                <p className="text-white/50 text-sm mt-0.5">Early access & priority registration</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Sticky Bottom Bar ── */}
      <div className="fixed bottom-16 md:bottom-0 left-0 right-0 z-50">
        <div className="bg-[#0A0A0A]/80 backdrop-blur-2xl border-t border-white/[0.06]">
          <div className="max-w-3xl mx-auto px-5 md:px-8 py-4">
            <div className="flex items-center justify-between gap-4">
              {/* Price */}
              <div className="flex-shrink-0">
                {event.is_paid && event.base_price ? (
                  <p className="text-white font-bold text-xl tracking-tight">{formatCurrency(Number(event.base_price))}</p>
                ) : (
                  <p className="text-emerald-400 font-bold text-xl tracking-tight">Free</p>
                )}
                <p className="text-white/30 text-xs mt-0.5">
                  {remainingAllowance > 0
                    ? `${remainingAllowance} tickets available`
                    : 'All slots booked'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex-1 flex justify-end gap-3">
                {userRegistration?.status === "PENDING" ? (
                  <button disabled className="flex-1 max-w-[200px] flex items-center justify-center gap-2 py-3 rounded-2xl bg-white/[0.06] text-white/40 font-semibold text-sm cursor-not-allowed">
                    <Clock size={16} /> Confirming...
                  </button>
                ) : hasMaxedOut || (isSoldOut && hasBookedTickets) ? (
                  <button disabled className="flex-1 max-w-[200px] flex items-center justify-center gap-2 py-3 rounded-2xl bg-white/[0.06] text-white/40 font-semibold text-sm cursor-not-allowed">
                    <CheckCircle size={16} /> Booked
                  </button>
                ) : isSoldOut && !event.is_waitlist_open ? (
                  <button disabled className="flex-1 max-w-[200px] flex items-center justify-center gap-2 py-3 rounded-2xl bg-white/[0.06] text-white/30 font-semibold text-sm cursor-not-allowed">
                    Sold Out
                  </button>
                ) : !isRegistrationOpen ? (
                  <button disabled className="flex-1 max-w-[200px] py-3 rounded-2xl bg-white/[0.06] text-white/30 font-semibold text-sm cursor-not-allowed">
                    Registration Closed
                  </button>
                ) : isSoldOut && event.is_waitlist_open ? (
                  <button
                    onClick={handleWaitlist}
                    disabled={waitlistMutation.isPending}
                    className="flex-1 max-w-[200px] flex items-center justify-center gap-2 py-3 rounded-2xl bg-transparent border border-[#800020]/60 text-[#C11E38] font-semibold text-sm hover:bg-[#800020]/10 transition-all duration-300"
                  >
                    {waitlistMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : null}
                    Join Waitlist
                  </button>
                ) : (
                  <div className="flex flex-1 justify-end items-center gap-3">
                    {remainingAllowance > 1 && isRegistrationOpen && (
                      <div className="flex items-center bg-white/[0.06] border border-white/[0.08] rounded-2xl p-1">
                        <button
                          onClick={() => setTicketCount(Math.max(1, ticketCount - 1))}
                          disabled={ticketCount <= 1}
                          className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/[0.06] disabled:opacity-30 hover:bg-white/[0.12] transition-all duration-300 text-white"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-9 text-center font-bold text-white text-sm tabular-nums">
                          {ticketCount}
                        </span>
                        <button
                          onClick={() => setTicketCount(Math.min(remainingAllowance as number, ticketCount + 1))}
                          disabled={ticketCount >= (remainingAllowance as number)}
                          className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/[0.06] disabled:opacity-30 hover:bg-white/[0.12] transition-all duration-300 text-white"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    )}

                    <button
                      onClick={handleRegister}
                      disabled={registerMutation.isPending || paymentLoading}
                      className="flex-1 max-w-[200px] flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#800020] hover:bg-[#9B0028] disabled:opacity-50 text-white font-semibold text-sm transition-all duration-300 shadow-lg shadow-[#800020]/20"
                    >
                      {(registerMutation.isPending || paymentLoading) ? <Loader2 size={16} className="animate-spin" /> : null}
                      {hasBookedTickets ? 'Book More' : event.is_paid ? `Pay ${formatCurrency(ticketCount * Number(event.base_price || 0))}` : 'Register'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}