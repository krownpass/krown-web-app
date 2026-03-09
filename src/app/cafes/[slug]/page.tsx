'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft, Heart, Share2, MapPin, Phone, Mail, Star,
  ChevronRight, Clock, Crown, ExternalLink, ChevronLeft, ChevronRight as ChevronRightIcon,
} from 'lucide-react';
import { useCafeDetail, useCafeMenu, useCafeReviews } from '@/queries/useCafeDetail';
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
  { label: 'About', value: 'about' },
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
  const [isBookmarked, setIsBookmarked] = useState(false);

  const { data: cafe, isLoading } = useCafeDetail(params.slug);
  const { data: menu = [] } = useCafeMenu(cafe?.cafe_id ?? '');
  const { data: reviews = [] } = useCafeReviews(cafe?.cafe_id ?? '');

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
      <div>
        <Skeleton className="h-[300px] w-full" />
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    );
  }

  if (!cafe) return null;

  return (
    <div className="max-w-4xl mx-auto pb-24">
      {/* Hero image carousel */}
      <div className="relative h-[300px] md:h-[400px] overflow-hidden bg-[#1E1E1E]">
        <AnimatePresence mode="wait">
          <motion.div
            key={imgIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
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
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent" />

        {/* Controls */}
        <div className="absolute top-4 left-4 right-4 flex justify-between">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 transition-all"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => setIsBookmarked(!isBookmarked)}
              className="p-2 rounded-full bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 transition-all"
            >
              <Heart size={18} fill={isBookmarked ? '#800020' : 'none'} className={isBookmarked ? 'text-[#800020]' : ''} />
            </button>
            <button onClick={handleShare} className="p-2 rounded-full bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 transition-all">
              <Share2 size={18} />
            </button>
          </div>
        </div>

        {/* Image nav arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={() => setImgIndex((i) => (i - 1 + images.length) % images.length)}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/40 text-white"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setImgIndex((i) => (i + 1) % images.length)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/40 text-white"
            >
              <ChevronRightIcon size={16} />
            </button>
          </>
        )}

        {/* Dots */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setImgIndex(i)}
                className={`h-1.5 rounded-full transition-all ${i === imgIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/40'}`}
              />
            ))}
          </div>
        )}
      </div>

      <div className="px-4 md:px-6 pt-5">
        {/* Name & Rating */}
        <div className="mb-4">
          <div className="flex items-start justify-between gap-3 mb-1">
            <h1 className="font-playfair text-2xl md:text-3xl font-bold text-white leading-tight flex-1">{cafe.name}</h1>
            {cafe.is_open !== undefined && (
              <Badge variant={cafe.is_open ? 'success' : 'error'} className="mt-1 flex-shrink-0">
                {cafe.is_open ? 'Open' : 'Closed'}
              </Badge>
            )}
          </div>
          <RatingStars rating={cafe.rating ?? 0} showCount count={cafe.total_reviews} />
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-sm text-white/50">
            <span className="flex items-center gap-1"><MapPin size={13} />{cafe.area ?? cafe.city}</span>
            {cafe.distance && <span>{getDistance(cafe.distance)} away</span>}
            {cafe.price_range && <span>{getPriceRange(cafe.price_range)}</span>}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 mb-6">
          {cafe.latitude && cafe.longitude && (
            <a
              href={`https://maps.google.com/?q=${cafe.latitude},${cafe.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs px-3 py-2 bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl text-white/60 hover:border-[#800020] hover:text-white transition-all"
            >
              <MapPin size={13} />Directions
            </a>
          )}
          {cafe.phone && (
            <a
              href={`tel:${cafe.phone}`}
              className="flex items-center gap-1.5 text-xs px-3 py-2 bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl text-white/60 hover:border-[#800020] hover:text-white transition-all"
            >
              <Phone size={13} />Call Now
            </a>
          )}
          {cafe.email && (
            <a
              href={`mailto:${cafe.email}`}
              className="flex items-center gap-1.5 text-xs px-3 py-2 bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl text-white/60 hover:border-[#800020] hover:text-white transition-all"
            >
              <Mail size={13} />Email
            </a>
          )}
        </div>

        {/* Tabs */}
        <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} className="mb-5" />

        {/* Tab content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'about' && (
              <div className="space-y-5">
                {cafe.description && (
                  <p className="text-white/60 text-sm leading-relaxed">{cafe.description}</p>
                )}

                {cafe.has_krown_pass_benefit && (
                  <div className="bg-[#800020]/10 border border-[#800020]/20 rounded-xl p-4 flex items-center gap-3">
                    <Crown size={20} className="text-[#D4AF37] flex-shrink-0" />
                    <div>
                      <p className="text-[#D4AF37] text-xs font-semibold mb-0.5">KROWN PASS BENEFIT</p>
                      <p className="text-white/70 text-sm">
                        {cafe.discount_percent ? `${cafe.discount_percent}% off your bill` : 'Exclusive member benefits'}
                      </p>
                    </div>
                  </div>
                )}

                {cafe.special_offers && cafe.special_offers.length > 0 && (
                  <div>
                    <h3 className="text-white font-semibold mb-3">Special Offers</h3>
                    {cafe.special_offers.map((offer) => (
                      <div key={offer.offer_id} className="bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl p-4 mb-2">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-white font-medium text-sm">{offer.title}</p>
                          {offer.discount_percent && (
                            <Badge variant="gold">{offer.discount_percent}% OFF</Badge>
                          )}
                        </div>
                        {offer.description && <p className="text-white/50 text-xs">{offer.description}</p>}
                      </div>
                    ))}
                  </div>
                )}

                {cafe.vibes && cafe.vibes.length > 0 && (
                  <div>
                    <h3 className="text-white font-semibold mb-2 text-sm">Vibes</h3>
                    <div className="flex flex-wrap gap-2">
                      {cafe.vibes.map((v) => (
                        <Badge key={v} variant="default">{v}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'menu' && (
              <div className="space-y-6">
                {menu.length === 0 ? (
                  <EmptyState icon="UtensilsCrossed" title="Menu not available" subtitle="Check back later" />
                ) : (
                  menu.map((cat) => (
                    <div key={cat.category}>
                      <h3 className="text-white font-semibold mb-3">{cat.category}</h3>
                      <div className="space-y-2">
                        {cat.items.map((item) => (
                          <div key={item.item_id} className="flex items-center justify-between py-2 border-b border-[#2A2A2A]">
                            <div className="flex-1">
                              <p className="text-white text-sm font-medium">{item.name}</p>
                              {item.description && <p className="text-white/40 text-xs mt-0.5">{item.description}</p>}
                            </div>
                            <span className="text-[#D4AF37] text-sm font-semibold ml-4">
                              {formatCurrency(item.price)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'gallery' && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {(cafe.images ?? []).length === 0 ? (
                  <div className="col-span-full">
                    <EmptyState icon="Image" title="No photos yet" subtitle="Be the first to share!" />
                  </div>
                ) : (
                  cafe.images?.map((img, i) => (
                    <div key={i} className="relative aspect-square rounded-xl overflow-hidden">
                      <Image src={img} alt={`${cafe.name} ${i + 1}`} fill className="object-cover hover:scale-105 transition-transform duration-300" sizes="33vw" />
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-4">
                {isAuthenticated && (
                  <Link
                    href={`/cafes/${params.slug}/review`}
                    className="flex items-center justify-between p-4 bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl hover:border-[#800020] transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <Star size={16} className="text-[#D4AF37]" />
                      <span className="text-white/60 text-sm">Write a review</span>
                    </div>
                    <ChevronRight size={16} className="text-white/30" />
                  </Link>
                )}
                {reviews.length === 0 ? (
                  <EmptyState icon="Star" title="No reviews yet" subtitle="Be the first to review!" />
                ) : (
                  reviews.map((review) => <ReviewCard key={review.review_id} review={review} />)
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Sticky Book Button */}
      <div className="fixed bottom-16 md:bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#0A0A0A] to-transparent pointer-events-none">
        <div className="max-w-4xl mx-auto pointer-events-auto">
          <Link
            href={`/cafes/${params.slug}/book`}
            className="w-full flex items-center justify-center gap-2 bg-[#800020] hover:bg-[#C11E38] text-white py-3.5 rounded-xl font-semibold transition-all hover:shadow-lg hover:shadow-[#800020]/30 active:scale-95"
          >
            Book a Table
          </Link>
        </div>
      </div>
    </div>
  );
}
