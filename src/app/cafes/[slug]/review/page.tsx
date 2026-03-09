'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Star, Loader2 } from 'lucide-react';
import { useCafeDetail, useCreateReview } from '@/queries/useCafeDetail';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { toast } from 'sonner';

export default function ReviewPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const { data: cafe } = useCafeDetail(params.slug);
  const createReview = useCreateReview();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) { toast.error('Please select a rating'); return; }
    if (comment.length < 10) { toast.error('Comment must be at least 10 characters'); return; }
    if (!cafe) return;

    try {
      await createReview.mutateAsync({ cafe_id: cafe.cafe_id, rating, comment });
      toast.success('Review submitted!');
      router.back();
    } catch {
      toast.error('Failed to submit review.');
    }
  };

  return (
    <ProtectedRoute>
      <div className="max-w-2xl mx-auto px-4 md:px-6 py-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="p-2 rounded-xl bg-[#1E1E1E] border border-[#2A2A2A] text-white/60 hover:text-white transition-colors">
            <ArrowLeft size={18} />
          </button>
          <h1 className="font-playfair text-xl font-bold text-white">Write a Review</h1>
        </div>

        {cafe && (
          <p className="text-white/40 text-sm mb-6">
            Sharing your experience at <span className="text-white">{cafe.name}</span>
          </p>
        )}

        <motion.form
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          {/* Star rating */}
          <div className="bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl p-5">
            <p className="text-white/60 text-sm mb-3">Overall Rating</p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHover(star)}
                  onMouseLeave={() => setHover(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    size={32}
                    className={`transition-colors ${
                      star <= (hover || rating) ? 'text-[#D4AF37] fill-[#D4AF37]' : 'text-white/20'
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-white/40 text-xs mt-2">
              {rating === 0 ? 'Tap to rate' : ['Terrible', 'Poor', 'Average', 'Good', 'Excellent'][rating - 1]}
            </p>
          </div>

          {/* Comment */}
          <div className="bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl p-5">
            <p className="text-white/60 text-sm mb-3">Your Review</p>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience... (min 10 characters)"
              rows={5}
              maxLength={500}
              className="w-full bg-transparent text-white text-sm placeholder:text-white/20 outline-none resize-none"
            />
            <p className="text-white/30 text-xs text-right mt-2">{comment.length}/500</p>
          </div>

          <button
            type="submit"
            disabled={createReview.isPending}
            className="w-full flex items-center justify-center gap-2 bg-[#800020] hover:bg-[#C11E38] disabled:opacity-50 text-white py-3 rounded-xl font-semibold text-sm transition-all"
          >
            {createReview.isPending ? <Loader2 size={16} className="animate-spin" /> : null}
            {createReview.isPending ? 'Submitting...' : 'Submit Review'}
          </button>
        </motion.form>
      </div>
    </ProtectedRoute>
  );
}
