import React from 'react';
import { BadgeCheck } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { RatingStars } from '@/components/shared/RatingStars';
import { formatRelativeTime } from '@/lib/utils';
import type { Review } from '@/types/review';

interface ReviewCardProps {
  review: Review;
}

export function ReviewCard({ review }: ReviewCardProps) {
  return (
    <div className="bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl p-4">
      <div className="flex items-start gap-3">
        <Avatar
          src={review.user?.profile_image}
          name={review.user?.name ?? 'User'}
          size="md"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-white">
              {review.user?.name ?? 'Anonymous'}
            </span>
            {review.is_verified_visit && (
              <span className="flex items-center gap-1 text-xs text-green-400">
                <BadgeCheck size={12} />
                Verified Visit
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mb-2">
            <RatingStars rating={review.rating} size={12} />
            <span className="text-xs text-white/30">
              {formatRelativeTime(review.created_at)}
            </span>
          </div>
          {review.comment && (
            <p className="text-sm text-white/70 leading-relaxed">{review.comment}</p>
          )}
        </div>
      </div>
    </div>
  );
}
