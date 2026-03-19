"use client";

import React, { useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { Loader2, CheckCircle, Clock, Minus, Plus } from 'lucide-react';
import { useEventDetail, useRegisterForEvent, useJoinWaitlist, useUserRegistration } from '@/queries/useEventDetail';
import { useEventBookmarks, useAddEventBookmark, useRemoveEventBookmark } from '@/queries/useUser';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatCurrency, getDistanceFromLatLon } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { paymentService } from '@/services/payment.service';
import { eventService } from '@/services/event.service';
import { queryKeys } from '@/queries/queryKeys';
import { useUserLocation } from '@/hooks/useUserLocation';
import { useEventRoom } from '@/hooks/useWebSocket';
import { EventBookingSuccess } from '@/components/animations/EventBookingSuccess';
import { AuthModal } from '@/components/modals/AuthModal';
import { EventDetailsPresentation } from '@/components/event/EventDetailsPresentation';
import { toast } from 'sonner';

export default function EventDetailPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuthStore();
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [ticketCount, setTicketCount] = useState(1);
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
    const mergedEvent = { ...initialEvent, ...roomData.eventUpdates };
    if (roomData.registrationCount !== undefined) {
      mergedEvent.current_registrations = roomData.registrationCount;
    }
    return mergedEvent;
  }, [initialEvent, roomData]);

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

  const handleRegister = async () => {
    if (!isAuthenticated) {
      setPendingAction('register');
      setShowAuthModal(true);
      return;
    }
    if (!event) return;

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

        await eventService.registerForEvent(event.event_id, ticketCount);
        isRegistrationCreated = true;

        const totalAmount = Number(event.base_price) * ticketCount;
        const order = await paymentService.initiateEventPayment(event.event_id, totalAmount);
        
        const rzp = new window.Razorpay({
          key: order.key || '', 
          amount: Number(order.amount),
          currency: order.currency || 'INR',
          name: 'Krown',
          description: event.title,
          order_id: order.razorpay_order_id || order.order_id || '',
          prefill: { name: user?.name, contact: user?.phone, email: user?.email },
          theme: { color: '#800020' },
          handler: async (response: any) => {
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

  const eventLat = event.venue_latitude ?? (event as any).latitude;
  const eventLng = event.venue_longitude ?? (event as any).longitude;
  const venueDistance =
    hasPermission && latitude && longitude && eventLat && eventLng
      ? getDistanceFromLatLon(latitude, longitude, eventLat, eventLng)
      : null;

  const isPastEvent = event.end_time 
    ? new Date(event.end_time).getTime() < Date.now() 
    : new Date(event.start_time).getTime() < Date.now();

  return (
    <>
    <EventBookingSuccess show={showBookingAnimation} onComplete={handleBookingAnimationComplete} />
    
    <EventDetailsPresentation 
      event={event}
      galleryImages={galleryImages}
      isBookmarked={isBookmarked}
      isTogglingBookmark={isTogglingBookmark}
      onToggleBookmark={toggleBookmark}
      onShare={handleShare}
      onBack={() => router.back()}
      venueDistance={venueDistance}
      hasActiveRegistration={hasActiveRegistration}
      isRegistrationConfirmed={isRegistrationConfirmed}
      userBookedTickets={userBookedTickets}
      onViewTickets={() => router.push(`/events/my-tickets/${event.event_id}`)}
      bottomBarSlot={
        <>
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
        </>
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
        if (pendingAction === 'register') handleRegister();
        else if (pendingAction === 'waitlist') handleWaitlist();
        else if (pendingAction === 'bookmark') toggleBookmark();
        setPendingAction(null);
      }}
    />
    </>
  );
}
