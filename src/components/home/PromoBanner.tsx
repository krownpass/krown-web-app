'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Crown, ChevronRight } from 'lucide-react';

export function PromoBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <Link href="/krown-pass">
        <div className="relative overflow-hidden bg-gradient-to-r from-[#800020] via-[#9B0026] to-[#C11E38] rounded-2xl p-5 md:p-7 flex items-center justify-between group cursor-pointer hover:shadow-xl hover:shadow-[#800020]/30 transition-all duration-300">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
              <Crown size={22} className="text-[#D4AF37]" />
            </div>
            <div>
              <p className="text-[#D4AF37] text-xs font-semibold uppercase tracking-widest mb-0.5">Krown Pass</p>
              <h3 className="text-white font-bold text-lg font-playfair leading-tight">
                10% off on bill payments
              </h3>
              <p className="text-white/70 text-xs mt-0.5">Plus priority bookings & exclusive events</p>
            </div>
          </div>
          <ChevronRight
            size={20}
            className="text-white/60 group-hover:text-white group-hover:translate-x-1 transition-all flex-shrink-0"
          />

          {/* Decorative circles */}
          <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/5" />
          <div className="absolute -right-4 -bottom-6 w-24 h-24 rounded-full bg-white/5" />
        </div>
      </Link>
    </motion.div>
  );
}
