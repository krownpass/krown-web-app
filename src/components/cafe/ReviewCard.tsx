import React from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { Star } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';
import type { Review } from '@/types/review';

interface ReviewCardProps {
  review: any; // Using any or an extended type here to accept real API keys
}

export function ReviewCard({ review }: ReviewCardProps) {
  // Mapping the API response to handle both the idealized type and the actual raw API data
  const userName = review.user?.name ?? review.user_name ?? 'Anonymous';
  const userAvatar = review.user?.profile_image ?? review.avatar_url;
  const ratingValue = review.rating ?? review.ratings ?? 0;
  const reviewComment = review.comment ?? review.description;

  return (
    <div className="bg-[#212121] border border-[#333333] rounded-xl p-4 mb-4">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-center">
          <div className="w-[43px] h-[43px] rounded-full mr-3 overflow-hidden shrink-0">
            <Avatar
              src={userAvatar}
              name={userName}
              className="w-full h-full !max-w-full !max-h-full"
            />
          </div>

          <div>
            <span className="text-white text-[16px] font-semibold font-general-sans block leading-tight">
              {userName}
            </span>

            <div className="flex items-center mt-0.5">
              <span className="text-white text-[14px] mr-1 leading-none">
                {Number(ratingValue).toFixed(1)}
              </span>
              <Star size={17} className="text-[#FFD700] fill-[#FFD700]" />
            </div>
          </div>
        </div>

        <span className="text-[14px] md:text-[16px] text-[#A0A0A0] font-general-sans whitespace-nowrap ml-2">
          {formatRelativeTime(review.created_at)}
        </span>
      </div>

      {/* Comment */}
      {reviewComment && (
        <p className="text-gray-300 mt-3 text-[15px] md:text-[16px] leading-relaxed font-general-sans">
          {reviewComment}
        </p>
      )}
    </div>
  );
}
