import React from 'react';
import Link from 'next/link';
import { Crown, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-full bg-[#800020]/10 flex items-center justify-center mx-auto mb-6">
          <Crown size={36} className="text-[#800020]" />
        </div>
        <h1 className="font-playfair text-6xl font-bold text-white mb-2">404</h1>
        <h2 className="font-playfair text-2xl font-bold text-white mb-3">Page Not Found</h2>
        <p className="text-white/50 text-sm mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-[#800020] hover:bg-[#C11E38] text-white px-6 py-3 rounded-xl font-medium text-sm transition-all"
        >
          <Home size={16} />
          Back to Home
        </Link>
      </div>
    </div>
  );
}
