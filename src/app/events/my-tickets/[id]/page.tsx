'use client';

import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Download, Share2 } from 'lucide-react';
import { useTicketDetail } from '@/queries/useEventDetail';
import { QRCode } from '@/components/event/QRCode';
import { Skeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { formatDate, formatTime } from '@/lib/utils';
import { getStatusColor } from '@/lib/utils';
import Image from 'next/image';
import { toPng } from 'html-to-image';
import { toast } from 'sonner';

export default function TicketDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: ticket, isLoading } = useTicketDetail(params.id);
  const ticketRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (!ticketRef.current) return;
    try {
      // Adding a small delay or ensuring images are loaded before generating might help,
      // but toPng usually handles it.
      const dataUrl = await toPng(ticketRef.current, { 
        cacheBust: true, 
        skipFonts: true, // Bypass html-to-image trying to parse/download webfonts and crashing on modern CSS properties
        style: { transform: 'scale(1)', margin: '0' } // prevent weird scaling issues on zoom
      });
      const link = document.createElement('a');
      link.download = `ticket_${(ticket as any)?.event_title?.replace(/\s+/g, '_') || 'event'}.png`;
      link.href = dataUrl;
      link.click();
      toast.success('Ticket downloaded successfully!');
    } catch (err) {
      console.error('Failed to download ticket', err);
      toast.error('Could not download ticket');
    }
  };

  const handleShare = async () => {
    try {
      const shareData = {
        title: 'My Event Ticket',
        text: `Join me at ${(ticket as any)?.event_title || 'this event'}!`,
        url: window.location.href,
      };
      
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard!');
      }
    } catch (err) {
      console.error('Error sharing', err);
    }
  };

  return (
    <ProtectedRoute>
      <div className="max-w-md mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => router.back()} className="p-2 rounded-xl bg-[#1E1E1E] border border-[#2A2A2A] text-white/60">
            <ArrowLeft size={18} />
          </button>
          <h1 className="font-playfair text-xl font-bold text-white">Your Ticket</h1>
          <button onClick={handleShare} className="p-2 rounded-xl bg-[#1E1E1E] border border-[#2A2A2A] text-white/60 hover:text-white transition-colors">
            <Share2 size={18} />
          </button>
        </div>

        {isLoading ? (
          <Skeleton className="h-96 rounded-2xl" />
        ) : !ticket ? null : (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            {/* Ticket card */}
            <div ref={ticketRef} className="bg-[#1E1E1E] border border-[#2A2A2A] rounded-2xl overflow-hidden p-0 m-0">
                {(ticket as any).event_cover_image && (
                  <div className="relative h-40">
                    <Image src={(ticket as any).event_cover_image} alt={(ticket as any).event_title ?? ''} fill className="object-cover" sizes="448px" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1E1E1E] to-transparent" />
                  </div>
                )}

                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h2 className="font-playfair font-bold text-white text-lg leading-tight">{(ticket as any).event_title}</h2>
                      <p className="text-white/50 text-sm">{(ticket as any).venue_name}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${getStatusColor(ticket.status)}`}>
                      {ticket.status}
                    </span>
                  </div>

                  {(ticket as any).start_time && (
                    <div className="text-sm text-white/60 mb-4">
                      {formatDate((ticket as any).start_time)} · {formatTime((ticket as any).start_time)}
                    </div>
                  )}

                  {/* Perforated divider */}
                  <div className="relative my-4">
                    <div className="border-t-2 border-dashed border-[#2A2A2A]" />
                    <div className="absolute -left-8 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[#0A0A0A]" />
                    <div className="absolute -right-8 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[#0A0A0A]" />
                  </div>

                  {/* QR Code */}
                  <div className="flex flex-col items-center py-4">
                    <QRCode value={ticket.qr_code} size={180} />
                    <h3 className="text-white font-bold text-lg mt-4">{(ticket as any).user_name}</h3>
                    {(ticket as any).user_mobile_no && <p className="text-white/60 text-sm mt-1">{(ticket as any).user_mobile_no}</p>}
                    <p className="text-white/40 text-xs mt-4 font-mono uppercase">ID: {(ticket as any).registration_id?.slice(0,8) || (ticket as any).ticket_number}</p>                    </div>
                  </div>            </div>

            <button onClick={handleDownload} className="w-full mt-4 flex items-center justify-center gap-2 py-3 bg-[#1E1E1E] border border-[#2A2A2A] text-white/60 rounded-xl text-sm hover:border-[#800020] hover:text-white transition-all">
              <Download size={16} />
              Download Ticket
            </button>
          </motion.div>
        )}
      </div>
    </ProtectedRoute>
  );
}
