'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface QRCodeProps {
  value: string;
  ticketNumber?: string;
  size?: number;
  className?: string;
}

export function QRCodeDisplay({ value, ticketNumber, size = 200, className }: QRCodeProps) {
  return (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      <div className="p-4 bg-white rounded-2xl shadow-lg flex items-center justify-center" style={{ width: size + 32, height: size + 32 }}>
        {value ? (
          /* Render base64 image coming from the server API natively */
          <img
            src={value}
            width={size}
            height={size}
            alt="Ticket QR Code"
            className="rounded-lg"
            style={{ width: size, height: size }}
          />
        ) : (
          <div className="text-center text-gray-400 text-sm flex flex-col items-center gap-2">
            <span className="block w-12 h-12 border-2 border-gray-200 rounded-lg flex items-center justify-center">QR</span>
            Generating...
          </div>
        )}
      </div>
      {ticketNumber && (
        <div className="text-center">
          <p className="text-xs text-white/30 mb-0.5">Ticket Number</p>
          <p className="text-sm font-mono font-bold text-white tracking-widest">{ticketNumber}</p>
        </div>
      )}
    </div>
  );
}

export const QRCode = QRCodeDisplay;
