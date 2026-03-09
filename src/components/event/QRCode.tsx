'use client';

import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { cn } from '@/lib/utils';

interface QRCodeProps {
  value: string;
  ticketNumber?: string;
  size?: number;
  className?: string;
}

export function QRCodeDisplay({ value, ticketNumber, size = 200, className }: QRCodeProps) {
  return (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      <div className="p-4 bg-white rounded-2xl shadow-lg">
        <QRCodeSVG
          value={value}
          size={size}
          bgColor="#FFFFFF"
          fgColor="#000000"
          level="H"
          includeMargin={false}
        />
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
