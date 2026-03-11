
'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft, Heart, Share2, MapPin, Phone, Mail, Star,
  ChevronRight, Clock, Crown, ExternalLink, ChevronLeft, ChevronRight as ChevronRightIcon, Navigation, X
} from 'lucide-react';
import { useCafeDetail, useCafeMenu, useCafeReviews, useCafeImages } from '@/queries/useCafeDetail';
import { useBookmarks, useAddBookmark, useRemoveBookmark } from '@/queries/useUser';
import { Skeleton } from '@/components/ui/Skeleton';
import { Tabs } from '@/components/ui/Tabs';
import { Badge } from '@/components/ui/Badge';
import { ReviewCard } from '@/components/cafe/ReviewCard';
import { RatingStars } from '@/components/shared/RatingStars';
import { EmptyState } from '@/components/shared/EmptyState';
import { getDistance, getPriceRange, formatCurrency } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';

const TABS = [
  { label: 'Overview', value: 'about' },
  { label: 'Menu', value: 'menu' },
  { label: 'Gallery', value: 'gallery' },
  { label: 'Reviews', value: 'reviews' },
];

export default function CafeDetailPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [activeTab, setActiveTab] = useState('about');
  const [imgIndex, setImgIndex] = useState(0);
  const [expandedMenuImg, setExpandedMenuImg] = useState<string | null>(null);

  const { data: cafe, isLoading } = useCafeDetail(params.slug);
  const { data: menu = [] } = useCafeMenu(cafe?.cafe_id ?? '');
  const { data: cafeImages } = useCafeImages(cafe?.cafe_id ?? '');
  const { data: reviews = [] } = useCafeReviews(cafe?.cafe_id ?? '');
  const redeemableItems = menu.flatMap((c: any) => c.items || []).filter((item: any) => item.is_recommended && item.is_available);

  const { data: bookmarks = [] } = useBookmarks();
  const addBookmark = useAddBookmark();
  const removeBookmark = useRemoveBookmark();

  const isBookmarked = bookmarks?.some((b) => b.cafe_id === cafe?.cafe_id) ?? false;
  const isTogglingBookmark = addBookmark.isPending || removeBookmark.isPending;

  const toggleBookmark = () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to save cafes');
      return;
    }
    if (!cafe?.cafe_id || isTogglingBookmark) return;

    if (isBookmarked) {
      removeBookmark.mutate(cafe.cafe_id);
    } else {
      addBookmark.mutate(cafe.cafe_id);
    }
  };

  const images = [cafe?.cover_image, ...(cafe?.images ?? [])].filter(Boolean) as string[];

  const handleShare = async () => {
    const path = cafe?.slug ?? cafe?.cafe_id ?? params.slug;
    const url = `${window.location.origin}/cafes/${path}`;
    const title = cafe?.name ?? 'Krown Café';
    const text = `Check out ${title} on Krown!`;
    if (navigator.share) {
      await navigator.share({ title, text, url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard!');
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-[50vh] w-full bg-[#111]" />
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
          <div className="h-10 bg-[#222] w-2/3 rounded-xl" />
          <div className="h-6 bg-[#222] w-1/3 rounded-xl" />
          <div className="grid grid-cols-3 gap-4">
            <div className="h-16 bg-[#222] rounded-2xl" />
            <div className="h-16 bg-[#222] rounded-2xl" />
            <div className="h-16 bg-[#222] rounded-2xl" />
          </div>
          <div className="h-32 bg-[#222] w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!cafe) return null;

  return (
    <div className="min-h-screen bg-[#050505] pb-28">
      {/* Immersive Hero Header */}
      <div className="relative h-[45vh] md:h-[55vh] w-full bg-[#111]">
        <AnimatePresence mode="wait">
          <motion.div
            key={imgIndex}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0"
          >
            {images[imgIndex] && (
              <Image
                src={images[imgIndex]}
                alt={cafe.name}
                fill
                className="object-cover"
                priority
                sizes="100vw"
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Cinematic Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/60 to-transparent" />
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/80 to-transparent" />

        {/* Top Floating Controls */}
        <div className="absolute top-4 md:top-8 left-4 right-4 flex justify-between z-20 max-w-4xl mx-auto md:px-6">
          <button
            onClick={() => router.back()}
            className="h-10 w-10 flex items-center justify-center rounded-full bg-black/20 backdrop-blur-md border border-white/10 text-white hover:bg-white/20 transition-all hover:scale-105"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex gap-3">
            <button onClick={handleShare} className="h-10 w-10 flex items-center justify-center rounded-full bg-black/20 backdrop-blur-md border border-white/10 text-white hover:bg-white/20 transition-all hover:scale-105">
              <Share2 size={18} />
            </button>
            <button
              onClick={toggleBookmark}
              disabled={isTogglingBookmark}
              className={`h-10 w-10 flex items-center justify-center rounded-full bg-black/20 backdrop-blur-md border border-white/10 text-white hover:bg-white/20 transition-all hover:scale-105 ${isTogglingBookmark ? "opacity-50" : ""}`}
            >
              <Heart size={18} fill={isBookmarked ? '#800020' : 'none'} className={isBookmarked ? 'text-[#800020]' : ''} />
            </button>
          </div>
        </div>

        {/* Image nav arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={() => setImgIndex((i) => (i - 1 + images.length) % images.length)}
              className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 flex items-center justify-center rounded-full bg-black/20 backdrop-blur-md border border-white/10 text-white hover:bg-white/20 transition-all hover:scale-105 z-10"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => setImgIndex((i) => (i + 1) % images.length)}
              className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 flex items-center justify-center rounded-full bg-black/20 backdrop-blur-md border border-white/10 text-white hover:bg-white/20 transition-all hover:scale-105 z-10"
            >
              <ChevronRightIcon size={18} />
            </button>
          </>
        )}

        {/* Hero Content (Overlaid on Bottom of Image) */}
        <div className="absolute flex flex-col justify-end bottom-0 left-0 right-0 p-6 z-10 max-w-4xl mx-auto md:px-8">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {cafe.is_open !== undefined && (
              <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full backdrop-blur-md border ${cafe.is_open ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
                {cafe.is_open ? 'Open Now' : 'Closed'}
              </span>
            )}
            {cafe.price_range && (
              <span className="px-2.5 py-1 bg-white/10 backdrop-blur-md border border-white/10 text-[10px] font-bold uppercase tracking-widest text-white/80 rounded-full">
                {getPriceRange(cafe.price_range)}
              </span>
            )}
            {cafe.distance && (
              <span className="px-2.5 py-1 bg-white/10 backdrop-blur-md border border-white/10 text-[10px] font-bold uppercase tracking-widest text-white/80 rounded-full flex items-center gap-1">
                <Navigation size={10} /> {getDistance(cafe.distance)}
              </span>
            )}
          </div>
          
          <h1 className="font-playfair text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight mb-2 tracking-wide drop-shadow-lg">
            {cafe.name}
          </h1>
          
          <div className="flex items-center gap-4 text-sm mt-1">
            <RatingStars rating={cafe.rating ?? 0} showCount count={cafe.total_reviews} />
            <div className="w-1 h-1 rounded-full bg-white/30" />
            <div className="flex items-center gap-1.5 text-white/80 font-medium">
              <MapPin size={14} className="text-[#800020]" />
              {cafe.area ?? cafe.city}
            </div>
          </div>

          {/* Dots */}
          {images.length > 1 && (
            <div className="absolute bottom-6 right-6 flex gap-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setImgIndex(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${i === imgIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/30 hover:bg-white/50'}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-8 mt-6">
        
        {/* Quick Actions Grid */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {cafe.latitude && cafe.longitude ? (
            <a
              href={`https://maps.google.com/?q=${cafe.latitude},${cafe.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col items-center justify-center gap-2 py-4 bg-[#111] border border-white/5 rounded-2xl hover:bg-[#1a1a1a] hover:border-white/10 transition-all"
            >
              <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 group-hover:bg-[#800020]/20 group-hover:text-[#800020] transition-all">
                <MapPin size={18} />
              </div>
              <span className="text-xs font-semibold text-white/60 tracking-wide uppercase">Direction</span>
            </a>
          ) : <div />}
          
          {cafe.phone ? (
            <a
              href={`tel:${cafe.phone}`}
              className="group flex flex-col items-center justify-center gap-2 py-4 bg-[#111] border border-white/5 rounded-2xl hover:bg-[#1a1a1a] hover:border-white/10 transition-all"
            >
              <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 group-hover:bg-[#800020]/20 group-hover:text-[#800020] transition-all">
                <Phone size={18} />
              </div>
              <span className="text-xs font-semibold text-white/60 tracking-wide uppercase">Call Now</span>
            </a>
          ) : <div />}
          
          {cafe.email ? (
            <a
              href={`mailto:${cafe.email}`}
              className="group flex flex-col items-center justify-center gap-2 py-4 bg-[#111] border border-white/5 rounded-2xl hover:bg-[#1a1a1a] hover:border-white/10 transition-all"
            >
              <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 group-hover:bg-[#800020]/20 group-hover:text-[#800020] transition-all">
                <Mail size={18} />
              </div>
              <span className="text-xs font-semibold text-white/60 tracking-wide uppercase">Email</span>
            </a>
          ) : <div />}
        </div>

        {/* Premium Krown Pass Benefit Block (Moved up for visibility) */}
        {cafe.has_krown_pass_benefit && (
          <div className="relative mb-8 overflow-hidden rounded-2xl p-[1px] bg-gradient-to-r from-[#D4AF37]/40 via-[#FFDF73] to-[#D4AF37]/40 group">
            <div className="absolute inset-0 bg-gradient-to-r from-[#D4AF37]/20 to-transparent opacity-50 mix-blend-overlay" />
            <div className="relative bg-[#0A0A0A] rounded-[15px] p-5 flex items-start gap-4 h-full">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#997A15] flex items-center justify-center flex-shrink-0 shadow-[0_0_15px_rgba(212,175,55,0.3)]">
                <Crown size={24} className="text-black" />
              </div>
              <div className="flex-1">
                <h3 className="text-[#D4AF37] font-bold text-sm tracking-widest uppercase mb-1 flex items-center gap-2">
                  Krown Pass Exclusive
                </h3>
                <p className="text-white/90 text-sm leading-relaxed">
                  {cafe.discount_percent ? (
                    <span>Enjoy <strong className="text-white border-b border-[#D4AF37]/40 pb-0.5">{cafe.discount_percent}% off</strong> your entire bill with your Krown Pass membership.</span>
                  ) : (
                    'Unlock special curated benefits only for Krown Pass members.'
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Elegant Sub-navigation Tabs */}
        <div className="sticky top-0 z-30 bg-[#050505]/80 backdrop-blur-md pt-2 pb-4 mb-6">
          <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />
        </div>

        {/* Tab Content Area */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="min-h-[30vh]"
          >
            {activeTab === 'about' && (
              <div className="space-y-10">
                {/* Description */}
                {cafe.description && (
                  <div>
                    <h3 className="text-white font-playfair text-2xl font-semibold mb-4">The Story</h3>
                    <p className="text-white/70 text-[15px] leading-relaxed font-light">{cafe.description}</p>
                  </div>
                )}

                {/* Vibes / Atmosphere */}
                {cafe.vibes && cafe.vibes.length > 0 && (
                  <div>
                    <h3 className="text-white font-playfair text-2xl font-semibold mb-4">Atmosphere</h3>
                    <div className="flex flex-wrap gap-2.5">
                      {cafe.vibes.map((v) => (
                        <div key={v} className="px-4 py-2 rounded-full border border-white/10 bg-[#111] text-sm text-white/80 transition-all hover:bg-white/5 hover:border-white/20">
                          {v}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Special Offers Grid */}
                {cafe.special_offers && cafe.special_offers.length > 0 && (
                  <div>
                    <h3 className="text-white font-playfair text-2xl font-semibold mb-4">Offers</h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {cafe.special_offers.map((offer) => (
                        <div key={offer.offer_id} className="group relative overflow-hidden bg-[#111] border border-white/10 hover:border-[#800020]/50 rounded-2xl p-5 transition-all">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-[#800020]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-[#800020]/20 transition-all" />
                          <div className="relative z-10">
                            <div className="flex items-start justify-between gap-4 mb-2">
                              <h4 className="text-white font-semibold text-lg">{offer.title}</h4>
                              {offer.discount_percent && (
                                <span className="bg-[#800020] text-white text-xs font-bold px-2 py-1 rounded-md whitespace-nowrap">
                                  {offer.discount_percent}% OFF
                                </span>
                              )}
                            </div>
                            {offer.description && <p className="text-white/60 text-sm line-clamp-2">{offer.description}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'menu' && (
              <div className="space-y-12 pb-8">
                {/* KROWN Recommends */}
                {redeemableItems.length > 0 && (
                  <div>
                    <h3 className="text-white font-playfair text-2xl font-bold mb-4 tracking-wide flex items-center gap-2">
                       <Crown size={20} className="text-[#D4AF37]" /> KROWN Recommends
                    </h3>
                    <div className="flex overflow-x-auto gap-4 pb-4 snap-x hide-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
                      {redeemableItems.map((item: any) => (
                        <div key={item.item_id} className="snap-start flex-none w-[140px] md:w-[160px] group cursor-pointer">
                          <div className="relative aspect-square rounded-2xl overflow-hidden bg-[#111] border border-white/5 mb-3">
                             <Image 
                               src={item.image_url ?? "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=800&q=80"} 
                               alt={item.name}
                               fill
                               className="object-cover group-hover:scale-110 transition-transform duration-500"
                             />
                             <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          </div>
                          <h4 className="text-white font-medium text-[15px] leading-tight mb-1 truncate">{item.name}</h4>
                          <p className="text-[#D4AF37] font-semibold text-sm">{formatCurrency(item.price)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cafe Physical Menu Images */}
                {cafeImages?.menu && cafeImages.menu.length > 0 && (
                  <div>
                    <h3 className="text-white font-playfair text-2xl font-bold mb-4 tracking-wide">Menu</h3>
                    <div className="flex overflow-x-auto gap-4 pb-4 snap-x hide-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
                      {cafeImages.menu.map((imgUrl, idx) => (
                        <button 
                          key={idx} 
                          onClick={() => setExpandedMenuImg(imgUrl)}
                          className="snap-start flex-none w-[200px] md:w-[240px] aspect-[3/4] relative rounded-2xl overflow-hidden bg-[#111] border border-white/10 group shadow-lg"
                        >
                          <Image 
                            src={imgUrl} 
                            alt={`Menu page ${idx + 1}`} 
                            fill 
                            sizes="240px"
                            className="object-cover transition-transform duration-700 group-hover:scale-105" 
                          />
                          <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-all" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Fallback Text Menu if needed */}
                {menu.length === 0 && !cafeImages?.menu?.length ? (
                  <EmptyState icon="UtensilsCrossed" title="Menu styling..." subtitle="Check back soon for our culinary offerings." />
                ) : menu.length > 0 && (
                  <div className="space-y-8 mt-12 pt-8 border-t border-white/5">
                    <h3 className="text-white/60 font-medium text-sm tracking-widest uppercase text-center mb-6">Detailed Menu</h3>
                    {menu.map((cat) => (
                      <div key={cat.category} className="space-y-6">
                        <div className="flex items-center gap-4">
                          <h4 className="font-playfair text-xl text-white/90 font-semibold tracking-wide">{cat.category}</h4>
                          <div className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent" />
                        </div>
                        <div className="grid gap-6 md:grid-cols-2">
                          {cat.items.map((item) => (
                            <div key={item.item_id} className="relative group">
                              <div className="flex justify-between items-baseline gap-4">
                                <div className="flex-1 bg-[#050505] pr-2 z-10 inline-block overflow-hidden hidden sm:block">
                                  <span className="text-white/90 font-medium text-[15px]">{item.name}</span>
                                </div>
                                <div className="flex-1 sm:hidden">
                                  <span className="text-white/90 font-medium text-[15px]">{item.name}</span>
                                </div>
                                <div className="absolute bottom-1.5 left-0 right-0 border-b-2 border-dotted border-white/10 z-0 hidden sm:block" />
                                <div className="bg-[#050505] pl-2 z-10 flex-shrink-0">
                                  <span className="text-[#D4AF37] font-semibold text-[15px] tracking-wide">{formatCurrency(item.price)}</span>
                                </div>
                              </div>
                              {item.description && (
                                <p className="text-white/40 text-sm mt-1.5 leading-relaxed pr-8 max-w-sm">
                                  {item.description}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'gallery' && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                {(cafe.images ?? []).length === 0 ? (
                  <div className="col-span-full py-12">
                    <EmptyState icon="Image" title="No photos yet" subtitle="Photos from this venue will appear here." />
                  </div>
                ) : (
                  cafe.images?.map((img, i) => (
                    <div key={i} className={`relative ${i === 0 ? 'col-span-2 row-span-2 aspect-auto h-full' : 'aspect-square'} rounded-2xl overflow-hidden group`}>
                      <Image 
                        src={img} 
                        alt={`${cafe.name} ${i + 1}`} 
                        fill 
                        className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out" 
                        sizes="(max-width: 768px) 50vw, 33vw" 
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300" />
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-6">
                {isAuthenticated && (
                  <Link
                    href={`/cafes/${params.slug}/review`}
                    className="group flex items-center justify-between p-5 bg-[#111] border border-white/10 rounded-2xl hover:border-[#800020]/50 hover:bg-gradient-to-r hover:from-[#111] hover:to-[#800020]/10 transition-all duration-300"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-white/5 flex items-center justify-center shadow-inner group-hover:bg-[#D4AF37]/20 transition-all">
                        <Star size={20} className="text-[#D4AF37]" />
                      </div>
                      <div>
                        <h4 className="text-white font-medium text-base mb-1">Share your experience</h4>
                        <span className="text-white/50 text-sm block tracking-wide">Write a review</span>
                      </div>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 group-hover:translate-x-1 transition-all">
                      <ChevronRight size={20} className="text-white/70" />
                    </div>
                  </Link>
                )}
                
                <div className="h-px bg-white/10 my-8 w-full block" />

                {reviews.length === 0 ? (
                  <EmptyState icon="Star" title="No reviews yet" subtitle="Be the first to share your thoughts!" />
                ) : (
                  <div className="space-y-4">
                    <h3 className="text-white font-playfair text-2xl font-semibold mb-6">Guest Reviews</h3>
                    {reviews.map((review) => (
                      <ReviewCard key={review.review_id} review={review} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      

      {/* Full Screen Menu Image Expansion */}
      <AnimatePresence>
        {expandedMenuImg && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out"
            onClick={() => setExpandedMenuImg(null)}
          >
            <button 
              onClick={() => setExpandedMenuImg(null)}
              className="absolute top-6 right-6 h-12 w-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white backdrop-blur-md transition-all z-50"
            >
              <X size={24} />
            </button>
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl aspect-[3/4] max-h-[85vh] rounded-2xl overflow-hidden cursor-default shadow-2xl shadow-black"
              onClick={e => e.stopPropagation()}
            >
              <Image 
                src={expandedMenuImg} 
                alt="Expanded Menu" 
                fill 
                className="object-contain bg-black"
                sizes="(max-width: 768px) 100vw, 800px"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Bar (Sticky) */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        {/* Soft shadow overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent blur-[2px]" />
        
        <div className="relative max-w-4xl mx-auto px-4 pb-8 pt-6 flex items-center gap-3 md:gap-5">
          <Link
            href={`/cafes/${params.slug}/book`}
            className="flex-1 relative overflow-hidden group flex items-center justify-center gap-2 bg-white text-black py-4 md:py-5 rounded-2xl font-bold tracking-wide transition-all shadow-[0_4px_20px_rgba(255,255,255,0.15)] hover:shadow-[0_4px_25px_rgba(255,255,255,0.25)] active:scale-[0.98]"
          >
            <span className="relative z-10 flex items-center gap-2">Reserve Table</span>
            {/* Glossy light effect */}
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent group-hover:animate-shimmer" />
          </Link>
          
          <button
            disabled={redeemableItems.length === 0}
            onClick={() => router.push(`/cafes/${params.slug}/redeem`)}
            className="flex-1 relative overflow-hidden group flex items-center justify-center gap-2 bg-gradient-to-r from-[#800020] to-[#A00028] disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 md:py-5 rounded-2xl font-bold tracking-wide transition-all shadow-[0_4px_20px_rgba(128,0,32,0.3)] hover:shadow-[0_4px_25px_rgba(128,0,32,0.4)] active:scale-[0.98]"
          >
            <span className="relative z-10 flex items-center gap-2 drop-shadow-md">Redeem Drinks</span>
            {/* Glossy light effect */}
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-shimmer" />
          </button>
        </div>
      </div>
    </div>
  );
}
