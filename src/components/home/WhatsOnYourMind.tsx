'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

const moods = [
  { emoji: '🤝', label: 'Meet New People', href: '/events?mood=social' },
  { emoji: '🎲', label: 'Try Something New', href: '/cafes?vibe=fun-wild' },
  { emoji: '🎉', label: 'Celebrate', href: '/cafes?vibe=date-night' },
  { emoji: '😌', label: 'Just Chill', href: '/cafes?vibe=cozy-comfy' },
  { emoji: '💕', label: 'Date Night', href: '/cafes?vibe=date-night' },
  { emoji: '💻', label: 'Work & Study', href: '/cafes?vibe=work-study' },
];

export function WhatsOnYourMind() {
  return (
    <section>
      <h2 className="font-playfair text-xl font-bold text-white mb-4">What&apos;s on your mind?</h2>
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {moods.map((mood, i) => (
          <motion.div
            key={mood.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ scale: 1.05 }}
          >
            <Link href={mood.href}>
              <div className="flex flex-col items-center gap-2 p-3 bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl hover:border-[#800020]/30 hover:bg-[#242424] transition-all group cursor-pointer">
                <span className="text-2xl group-hover:scale-110 transition-transform">{mood.emoji}</span>
                <span className="text-[11px] text-white/60 text-center leading-tight">{mood.label}</span>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
