'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { X } from 'lucide-react';

interface Story {
  id: string;
  label: string;
  image: string;
  viewed?: boolean;
}

const defaultStories: Story[] = [
  { id: '1', label: 'Brew Works', image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=200&q=80' },
  { id: '2', label: 'Filter Kaapi', image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=200&q=80' },
  { id: '3', label: 'Soul Café', image: 'https://images.unsplash.com/photo-1445116572660-236099ec97a0?w=200&q=80' },
  { id: '4', label: 'The Roost', image: 'https://images.unsplash.com/photo-1507914997468-6a1f3b7a0ade?w=200&q=80' },
  { id: '5', label: 'Amadora', image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=200&q=80' },
  { id: '6', label: 'Stir', image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=200&q=80' },
];

export function StoriesRow({ stories = defaultStories }: { stories?: Story[] }) {
  const [activeStory, setActiveStory] = useState<Story | null>(null);
  const [viewed, setViewed] = useState<Set<string>>(new Set());

  const openStory = (story: Story) => {
    setActiveStory(story);
    setViewed((prev) => new Set([...prev, story.id]));
  };

  return (
    <>
      <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-1">
        {stories.map((story) => (
          <motion.button
            key={story.id}
            whileTap={{ scale: 0.95 }}
            onClick={() => openStory(story)}
            className="flex flex-col items-center gap-1.5 flex-shrink-0"
          >
            <div
              className={`p-0.5 rounded-full ${
                viewed.has(story.id)
                  ? 'bg-white/20'
                  : 'bg-gradient-to-tr from-[#800020] via-[#C11E38] to-[#D4AF37]'
              }`}
            >
              <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-[#0A0A0A]">
                <Image src={story.image} alt={story.label} fill className="object-cover" sizes="56px" />
              </div>
            </div>
            <span className="text-[10px] text-white/60 max-w-[56px] text-center truncate">
              {story.label}
            </span>
          </motion.button>
        ))}
      </div>

      {/* Story modal */}
      <AnimatePresence>
        {activeStory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
            onClick={() => setActiveStory(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative w-full max-w-sm aspect-[9/16] rounded-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <Image src={activeStory.image} alt={activeStory.label} fill className="object-cover" sizes="384px" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <button
                onClick={() => setActiveStory(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/40 text-white"
              >
                <X size={18} />
              </button>
              <div className="absolute bottom-6 left-6">
                <p className="font-semibold text-white text-lg">{activeStory.label}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
