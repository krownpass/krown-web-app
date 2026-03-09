'use client';

import React, { useState } from 'react';
import { Share2, Check, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ShareButtonProps {
  title: string;
  text: string;
  url: string;
  className?: string;
  children?: React.ReactNode;
}

export function ShareButton({ title, text, url, className, children }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch {
        // User cancelled or error — fall through to clipboard
        if (!copied) copyToClipboard();
      }
    } else {
      copyToClipboard();
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy link.');
    }
  };

  return (
    <button
      onClick={handleShare}
      className={cn(
        'flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-sm font-medium transition-all',
        className
      )}
    >
      {copied ? <Check size={16} className="text-green-400" /> : children ? <Share2 size={16} /> : null}
      {children ?? (copied ? 'Copied!' : 'Share')}
    </button>
  );
}
