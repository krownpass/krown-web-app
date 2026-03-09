'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Crown, Check, ExternalLink, Percent, Star, Coffee, Zap, Headphones } from 'lucide-react';
import { KROWN_PASS_BENEFITS } from '@/lib/constants';

const iconMap: Record<string, React.ReactNode> = {
  Percent: <Percent size={20} />,
  Crown: <Crown size={20} />,
  Star: <Star size={20} />,
  Coffee: <Coffee size={20} />,
  Zap: <Zap size={20} />,
  Headphones: <Headphones size={20} />,
};

export default function KrownPassPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 md:px-6 py-8">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden bg-gradient-to-br from-[#800020] via-[#9B0026] to-[#1A1A1A] rounded-3xl p-8 mb-8 text-center"
      >
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/5 -translate-y-10 translate-x-10" />
        <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-white/5 translate-y-8 -translate-x-8" />

        <div className="relative z-10">
          <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-4">
            <Crown size={36} className="text-[#D4AF37]" />
          </div>
          <p className="text-[#D4AF37] text-xs font-bold uppercase tracking-[0.3em] mb-2">Premium Membership</p>
          <h1 className="font-playfair text-4xl font-bold text-white mb-3">KROWN PASS</h1>
          <p className="text-white/70 text-sm leading-relaxed max-w-xs mx-auto">
            Unlock exclusive benefits at Chennai&apos;s finest cafés and events
          </p>
        </div>
      </motion.div>

      {/* Benefits */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mb-8"
      >
        <h2 className="font-playfair text-xl font-bold text-white mb-4">Member Benefits</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {KROWN_PASS_BENEFITS.map((benefit, i) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.07 }}
              className="flex items-start gap-3 bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl p-4"
            >
              <div className="w-10 h-10 rounded-xl bg-[#800020]/10 flex items-center justify-center text-[#800020] flex-shrink-0">
                {iconMap[benefit.icon] ?? <Check size={20} />}
              </div>
              <div>
                <p className="text-white font-semibold text-sm mb-0.5">{benefit.title}</p>
                <p className="text-white/50 text-xs leading-relaxed">{benefit.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Note about pricing */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl p-4 mb-6 text-center"
      >
        <p className="text-white/50 text-sm">
          To purchase Krown Pass and view pricing, visit our website
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        <a
          href="https://krownpass.com"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2 bg-[#800020] hover:bg-[#C11E38] text-white py-4 rounded-xl font-semibold transition-all hover:shadow-lg hover:shadow-[#800020]/30"
        >
          Learn More <ExternalLink size={16} />
        </a>
      </motion.div>
    </div>
  );
}
