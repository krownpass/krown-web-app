'use client';

import { AlertTriangle } from 'lucide-react';

export default function BookingsError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <AlertTriangle size={40} className="text-[#800020] mb-4" />
      <h2 className="text-white font-semibold text-lg mb-2">Something went wrong</h2>
      <p className="text-white/50 text-sm mb-6">Failed to load bookings. Please try again.</p>
      <button onClick={reset} className="px-6 py-2.5 bg-[#800020] text-white rounded-xl text-sm font-medium hover:bg-[#C11E38] transition-colors">
        Try again
      </button>
    </div>
  );
}
