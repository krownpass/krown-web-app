'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Heart, Share2, MapPin, Calendar, Clock,
  Users, ChevronDown, ChevronUp, Loader2, Crown, ExternalLink, CheckCircle, Ticket, Minus, Plus
} from 'lucide-react';
import { useEventDetail, useRegisterForEvent, useJoinWaitlist, useUserRegistration } from '@/queries/useEventDetail';
import { useEventBookmarks, useAddEventBookmark, useRemoveEventBookmark } from '@/queries/useUser';
import { Skeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { CountdownTimer } from '@/components/event/CountdownTimer';
import { formatDate, formatTime, getCapacityPercent, formatCurrency } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { paymentService } from '@/services/payment.service';
import { eventService } from '@/services/event.service';
import { RAZORPAY_KEY_ID } from '@/lib/constants';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/queries/queryKeys';

export default function EventDetailPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuthStore();
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [ticketCount, setTicketCount] = useState(1);

  const { data: event, isLoading } = useEventDetail(params.slug);
  const { data: userRegistration } = useUserRegistration(event?.event_id);
  const registerMutation = useRegisterForEvent();
  const waitlistMutation = useJoinWaitlist();

  const { data: eventBookmarks = [] } = useEventBookmarks();
  const addBookmark = useAddEventBookmark();
  const removeBookmark = useRemoveEventBookmark();

  const isBookmarked = eventBookmarks?.some((b) => b.event_id === event?.event_id) ?? false;
  const isTogglingBookmark = addBookmark.isPending || removeBookmark.isPending;

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
                toast.success('Registration successful!');
                router.push('/events/my-tickets');
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
          toast.success('You\'re registered!');
          router.push('/events/my-tickets');
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
      <div>
        <Skeleton className="h-[320px] w-full" />
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
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

  return (
    <div className="max-w-4xl mx-auto pb-32">
      {/* Hero */}
      <div className="relative h-[300px] md:h-[420px] overflow-hidden bg-[#1E1E1E]">
        {event.cover_image && (
          <Image
            src={event.cover_image}
            alt={event.title}
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-black/20 to-transparent" />

        <div className="absolute top-4 left-4 right-4 flex justify-between">
          <button onClick={() => router.back()} className="p-2 rounded-full bg-black/40 backdrop-blur-sm text-white">
            <ArrowLeft size={18} />
          </button>
          <div className="flex gap-2">
            <button
              onClick={toggleBookmark}
              disabled={isTogglingBookmark}
              className={`p-2 rounded-full bg-black/40 backdrop-blur-sm text-white transition-all ${
                isTogglingBookmark ? 'opacity-50 cursor-not-allowed' : 'hover:bg-black/60'
              }`}
            >
              <Heart size={18} fill={isBookmarked ? '#800020' : 'none'} className={isBookmarked ? 'text-[#800020]' : ''} />
            </button>
            <button onClick={handleShare} className="p-2 rounded-full bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 transition-all">
              <Share2 size={18} />
            </button>
          </div>
        </div>

        {hasActiveRegistration && userBookedTickets > 0 && (
          <button 
            onClick={() => router.push(`/events/my-tickets/${event.event_id}`)}
            className="absolute bottom-4 right-4 px-4 py-2 rounded-full bg-[#800020] text-white flex items-center gap-2 text-sm font-semibold shadow-lg hover:bg-[#C11E38] transition-all"
          >
            {isRegistrationConfirmed ? <Ticket size={16} /> : <Clock size={16} />}
            {isRegistrationConfirmed ? 'Tickets' : 'Confirming...'}
          </button>
        )}
      </div>

      <div className="px-4 md:px-6 pt-5 space-y-5">
        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {event.category && <Badge variant="burgundy">{event.category}</Badge>}
          {event.tags?.map((t) => <Badge key={t} variant="default">{t}</Badge>)}
          {!event.is_paid && <Badge variant="success">Free Entry</Badge>}
          {isRegistrationOpen && !isFull && <Badge variant="success">Open</Badge>}
          {isFull && <Badge variant="error">Full</Badge>}
        </div>

        {/* Title */}
        <h1 className="font-playfair text-2xl md:text-3xl font-bold text-white leading-tight">{event.title}</h1>

        {/* Countdown */}
        {event.start_time && new Date(event.start_time) > new Date() && (
          <CountdownTimer targetDate={event.start_time} />
        )}

        {/* Capacity */}
        {event.max_capacity && (
          <div className="bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl p-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-white/60 flex items-center gap-1.5">
                <Users size={14} />
                {event.current_registrations ?? 0} of {event.max_capacity} spots filled
              </span>
              <span className={`font-semibold ${isFull ? 'text-red-400' : 'text-[#D4AF37]'}`}>
                {isFull ? 'Full' : `${event.seats_left ?? (event.max_capacity - (event.current_registrations ?? 0))} left`}
              </span>
            </div>
            <ProgressBar value={capacityPercent} color={capacityPercent > 80 ? '#EF4444' : '#800020'} />
          </div>
        )}

        {/* Venue & Time */}
        <div className="space-y-3">
          <div className="flex items-start gap-3 bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl p-4">
            <Calendar size={18} className="text-[#800020] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-white text-sm font-medium">{formatDate(event.start_time)}</p>
              <p className="text-white/50 text-xs">{formatTime(event.start_time)}{event.end_time ? ` – ${formatTime(event.end_time)}` : ''}</p>
              {event.gates_open_time && (
                <p className="text-white/40 text-xs mt-0.5">Gates open: {formatTime(event.gates_open_time)}</p>
              )}
            </div>
          </div>

          <a
            href={`https://maps.google.com/?q=${encodeURIComponent(event.venue_name)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-3 bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl p-4 hover:border-[#800020] transition-all group"
          >
            <MapPin size={18} className="text-[#800020] flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-white text-sm font-medium">{event.venue_name}</p>
              {event.venue_address && <p className="text-white/50 text-xs">{event.venue_address}</p>}
            </div>
            <ExternalLink size={14} className="text-white/30 group-hover:text-white/60 flex-shrink-0 mt-0.5" />
          </a>
        </div>

        {/* About */}
        {event.description && (
          <div className="bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl p-4">
            <h3 className="font-semibold text-white mb-2">About the event</h3>
            <AnimatePresence mode="wait">
              <motion.p
                key={showFullDesc ? 'full' : 'short'}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-white/60 text-sm leading-relaxed"
              >
                {showFullDesc ? event.description : event.description.slice(0, 200) + (event.description.length > 200 ? '...' : '')}
              </motion.p>
            </AnimatePresence>
            {event.description.length > 200 && (
              <button
                onClick={() => setShowFullDesc(!showFullDesc)}
                className="text-[#800020] text-xs font-medium mt-2 flex items-center gap-1"
              >
                {showFullDesc ? <><ChevronUp size={12} />Read less</> : <><ChevronDown size={12} />Read more</>}
              </button>
            )}
          </div>
        )}

        {/* Schedule */}
        {event.schedule && event.schedule.length > 0 && (
          <div>
            <h3 className="font-semibold text-white mb-3">Schedule</h3>
            <div className="space-y-2">
              {event.schedule.map((item, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <span className="text-white/40 text-xs pt-0.5 flex-shrink-0 w-14">{item.time}</span>
                  <p className="text-white/70 text-sm">{item.activity}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Krown Pass benefit */}
        <div className="bg-[#800020]/10 border border-[#800020]/20 rounded-xl p-4 flex items-center gap-3">
          <Crown size={20} className="text-[#D4AF37] flex-shrink-0" />
          <div>
            <p className="text-[#D4AF37] text-xs font-semibold">KROWN PASS MEMBERS</p>
            <p className="text-white/60 text-sm">Get early access and priority registration</p>
          </div>
        </div>
      </div>

      {/* Sticky bottom bar */}
      <div className="fixed bottom-16 md:bottom-0 left-0 right-0 bg-[#0A0A0A]/95 backdrop-blur-sm border-t border-[#2A2A2A] p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex-shrink-0">
            {event.is_paid && event.base_price ? (
              <>
                <p className="text-white font-bold text-lg">{formatCurrency(Number(event.base_price))}</p>
              </>
            ) : (
              <>
                <p className="text-green-400 font-bold text-lg">Free</p>
              </>
            )}
            <p className="text-white/40 text-xs mt-0.5 whitespace-nowrap">
              {remainingAllowance > 0
                ? `${remainingAllowance} remaining tickets`
                : 'All slots booked'}
            </p>
          </div>

          <div className="flex-1 flex justify-end gap-3">
            {userRegistration?.status === "PENDING" ? (
              <button disabled className="flex-1 max-w-[200px] flex items-center justify-center gap-2 py-3 rounded-xl bg-[#2A2A2A] text-white/60 font-semibold text-sm cursor-not-allowed">
                <Clock size={16} /> Confirming...
              </button>
            ) : hasMaxedOut || (isSoldOut && hasBookedTickets) ? (
              <button disabled className="flex-1 max-w-[200px] flex items-center justify-center gap-2 py-3 rounded-xl bg-[#2A2A2A] text-white/60 font-semibold text-sm cursor-not-allowed">
                <CheckCircle size={16} /> Booked
              </button>
            ) : isSoldOut && !event.is_waitlist_open ? (
              <button disabled className="flex-1 max-w-[200px] flex items-center justify-center gap-2 py-3 rounded-xl bg-white/10 text-white/40 font-semibold text-sm cursor-not-allowed">
                Sold Out
              </button>
            ) : !isRegistrationOpen ? (
              <button disabled className="flex-1 max-w-[200px] py-3 rounded-xl bg-white/10 text-white/40 font-semibold text-sm cursor-not-allowed">
                Registration Closed
              </button>
            ) : isSoldOut && event.is_waitlist_open ? (
              <button
                onClick={handleWaitlist}
                disabled={waitlistMutation.isPending}
                className="flex-1 max-w-[200px] flex items-center justify-center gap-2 py-3 rounded-xl bg-[#1E1E1E] border border-[#800020] text-[#800020] font-semibold text-sm hover:bg-[#800020]/10 transition-all"
              >
                {waitlistMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : null}
                Join Waitlist
              </button>
            ) : (
              <div className="flex flex-1 justify-end items-center gap-3">
                {remainingAllowance > 1 && isRegistrationOpen && (
                  <div className="flex items-center bg-[#1E1E1E] border border-[#2A2A2A] rounded-full p-1 max-w-[120px]">
                    <button
                      onClick={() => setTicketCount(Math.max(1, ticketCount - 1))}
                      disabled={ticketCount <= 1}
                      className="w-8 h-8 rounded-full flex items-center justify-center bg-[#2A2A2A] disabled:opacity-50 hover:bg-[#3A3A3A] transition-all text-white"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-8 text-center font-bold text-white text-sm">
                      {ticketCount}
                    </span>
                    <button
                      onClick={() => setTicketCount(Math.min(remainingAllowance as number, ticketCount + 1))}
                      disabled={ticketCount >= (remainingAllowance as number)}
                      className="w-8 h-8 rounded-full flex items-center justify-center bg-[#2A2A2A] disabled:opacity-50 hover:bg-[#3A3A3A] transition-all text-white"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                )}
                
                <button
                  onClick={handleRegister}
                  disabled={registerMutation.isPending || paymentLoading}
                  className="flex-1 max-w-[200px] flex items-center justify-center gap-2 py-3 rounded-xl bg-[#800020] hover:bg-[#C11E38] disabled:opacity-50 text-white font-semibold text-sm transition-all"
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
  );
}
