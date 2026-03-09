import React from 'react';

export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-4 space-y-10">
      {/* Hero skeleton */}
      <div className="shimmer h-[360px] md:h-[480px] rounded-2xl" />

      {/* Search skeleton */}
      <div className="shimmer h-12 rounded-2xl" />

      {/* Vibes skeleton */}
      <div className="space-y-3">
        <div className="shimmer h-6 w-48 rounded-lg" />
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="shimmer h-20 w-24 rounded-xl flex-shrink-0" />
          ))}
        </div>
      </div>

      {/* Cards skeleton */}
      <div className="space-y-3">
        <div className="shimmer h-6 w-40 rounded-lg" />
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex-shrink-0 w-56 space-y-2">
              <div className="shimmer h-40 rounded-xl" />
              <div className="shimmer h-4 w-3/4 rounded" />
              <div className="shimmer h-3 w-1/2 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
