'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface StoryMedia {
  media_id: string;
  type: 'image' | 'video';
  uri: string;
}

interface Story {
  id: string;
  label: string;
  image: string;
  viewed?: boolean;
  media?: StoryMedia[];
}

const defaultStories: Story[] = [
  { id: '1', label: 'Brew Works', image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=200&q=80' },
  { id: '2', label: 'Filter Kaapi', image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=200&q=80' },
  { id: '3', label: 'Soul Café', image: 'https://images.unsplash.com/photo-1445116572660-236099ec97a0?w=200&q=80' },
  { id: '4', label: 'The Roost', image: 'https://images.unsplash.com/photo-1507914997468-6a1f3b7a0ade?w=200&q=80' },
  { id: '5', label: 'Amadora', image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=200&q=80' },
  { id: '6', label: 'Stir', image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=200&q=80' },
];

function StoryViewer({ story, onClose }: { story: Story; onClose: () => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  const mediaList = story.media && story.media.length > 0 
    ? story.media 
    : [{ media_id: 'default', type: 'image' as const, uri: story.image }];
  
  const currentMedia = mediaList[currentIndex];
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    setProgress(0);
    let animationFrame: number;
    let startTime: number;
    // default 5s for image
    const duration = 5000; 

    const updateProgress = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      
      if (currentMedia.type === 'image') {
        const p = Math.min((elapsed / duration) * 100, 100);
        setProgress(p);
        if (p < 100) {
          animationFrame = requestAnimationFrame(updateProgress);
        } else {
          handleNext();
        }
      }
    };

    if (currentMedia.type === 'image') {
      animationFrame = requestAnimationFrame(updateProgress);
    }

    return () => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
    };
  }, [currentIndex, currentMedia]);

  const handleNext = () => {
    if (currentIndex < mediaList.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  return (
    <div className="relative w-full h-full bg-black flex flex-col">
      {/* Media Content */}
      <div className="absolute inset-0 w-full h-full">
        {currentMedia.type === 'video' ? (
          <video
            ref={videoRef}
            src={currentMedia.uri}
            className="w-full h-full object-cover"
            autoPlay
            playsInline
            controls={false}
            onTimeUpdate={(e) => {
              const el = e.currentTarget;
              if (el.duration) {
                setProgress((el.currentTime / el.duration) * 100);
              }
            }}
            onEnded={handleNext}
          />
        ) : (
          <Image quality={90} src={currentMedia.uri} alt="Story" fill className="object-cover" />
        )}
      </div>

      {/* Subtle overlay for header unreadability */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/80 to-transparent z-10 pointer-events-none" />

      {/* Progress Bars */}
      <div className="absolute top-4 left-0 right-0 z-20 flex gap-1 px-4">
        {mediaList.map((_, i) => (
          <div key={i} className="h-[3px] flex-1 bg-white/30 rounded-full overflow-hidden backdrop-blur-sm">
            <div 
              className="h-full bg-white transition-all duration-100 ease-linear"
              style={{ 
                width: i === currentIndex 
                  ? `${progress}%` 
                  : (i < currentIndex ? '100%' : '0%')
              }} 
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-8 left-4 right-12 z-20 flex items-center gap-3">
        <div className="relative w-8 h-8 rounded-full overflow-hidden border border-white/50">
          <Image src={story.image} alt={story.label} fill className="object-cover" />
        </div>
        <span className="text-white font-semibold text-sm drop-shadow-md">{story.label}</span>
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        className="absolute top-8 right-4 z-30 p-1.5 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors backdrop-blur-md"
      >
        <X size={18} />
      </button>

      {/* Navigation Overlays */}
      <div className="absolute inset-0 z-10 flex pt-24">
        <div className="w-1/3 h-full cursor-pointer" onClick={(e) => { e.stopPropagation(); handlePrev(); }} />
        <div className="w-2/3 h-full cursor-pointer" onClick={(e) => { e.stopPropagation(); handleNext(); }} />
      </div>
    </div>
  );
}

export function StoriesRow({ stories = defaultStories }: { stories?: Story[] }) {
  const [activeStory, setActiveStory] = useState<Story | null>(null);
  const [viewed, setViewed] = useState<Set<string>>(new Set());

  const openStory = (story: Story) => {
    setActiveStory(story);
    setViewed((prev) => new Set([...prev, story.id]));
  };

  return (
    <>
      <div className="flex gap-6 overflow-x-auto scrollbar-hide pb-2">
        {stories.map((story) => (
          <motion.button
            key={story.id}
            whileTap={{ scale: 0.95 }}
            onClick={() => openStory(story)}
            className="flex flex-col items-center gap-2.5 flex-shrink-0"
          >
            <div
              className={`p-1 rounded-full ${
                viewed.has(story.id)
                  ? 'bg-white/20'
                  : 'bg-gradient-to-tr from-[#800020] via-[#C11E38] to-[#D4AF37]'
              }`}
            >
              <div className="relative w-20 h-20 rounded-full overflow-hidden border-[3px] border-[#0A0A0A]">
                <Image quality={90} src={story.image} alt={story.label} fill className="object-cover" sizes="80px" />
              </div>
            </div>
            <span className="text-[12px] font-medium text-white/80 max-w-[80px] text-center truncate">
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A0A0A]"
            onClick={() => setActiveStory(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative w-full max-w-md h-full md:h-[90vh] md:rounded-2xl overflow-hidden bg-[#1A1A1A]"
              onClick={(e) => e.stopPropagation()}
            >
              <StoryViewer story={activeStory} onClose={() => setActiveStory(null)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
