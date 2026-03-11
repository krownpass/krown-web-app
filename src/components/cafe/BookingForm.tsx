'use client';

import React, { useState, useEffect } from 'react';
import { Minus, Plus, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { bookingService } from '@/services/booking.service';

interface SlotCategory {
  name: string;
  hours: string[];
}

interface BookingFormProps {
  cafeId: string;
  onSubmit: (data: BookingFormData) => void;
  isLoading?: boolean;
}

export interface BookingFormData {
  bookingType: 'standard' | 'priority';
  guestCount: number;
  date: string;
  timeSlot: string;
  specialRequests: string;
}

function getDates(count = 7) {
  const today = new Date();
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return {
      label: d.getDate().toString(),
      dayName: d.toLocaleDateString('en-IN', { weekday: 'short' }),
      value: d.toISOString().split('T')[0],
    };
  });
}

function isPast(hour: string, selectedDate: string): boolean {
  const today = new Date().toISOString().split('T')[0];
  if (selectedDate !== today) return false;
  const [h, m] = hour.split(':').map(Number);
  const now = new Date();
  return h < now.getHours() || (h === now.getHours() && m <= now.getMinutes());
}

export function BookingForm({ cafeId, onSubmit, isLoading }: BookingFormProps) {
  const dates = getDates(7);
  const [bookingType, setBookingType] = useState<'standard' | 'priority'>('standard');
  const [guestCount, setGuestCount] = useState(2);
  const [selectedDate, setSelectedDate] = useState(dates[0].value);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [categories, setCategories] = useState<SlotCategory[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  useEffect(() => {
    setSlotsLoading(true);
    setSelectedCategory('');
    setSelectedSlot('');
    bookingService
      .getSlotCategories(cafeId, selectedDate)
      .then((cats) => {
        setCategories(cats);
        if (cats.length > 0) setSelectedCategory(cats[0].name);
      })
      .catch(() => setCategories([]))
      .finally(() => setSlotsLoading(false));
  }, [cafeId, selectedDate]);

  const activeCategoryHours =
    categories.find((c) => c.name === selectedCategory)?.hours ?? [];

  const canSubmit = !!selectedSlot;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({ bookingType, guestCount, date: selectedDate, timeSlot: selectedSlot, specialRequests });
  };

  return (
    <div className="space-y-6">


      {/* Guest counter */}
      <div>
        <p className="text-sm font-medium text-white/70 mb-3">Guests</p>
        <div className="flex items-center gap-4 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-3 w-fit">
          <button
            onClick={() => setGuestCount((n) => Math.max(1, n - 1))}
            className="w-8 h-8 rounded-lg bg-[#2A2A2A] hover:bg-[#3A3A3A] flex items-center justify-center text-white transition-colors"
          >
            <Minus size={14} />
          </button>
          <span className="text-lg font-semibold text-white w-6 text-center">{guestCount}</span>
          <button
            onClick={() => setGuestCount((n) => Math.min(20, n + 1))}
            className="w-8 h-8 rounded-lg bg-[#2A2A2A] hover:bg-[#3A3A3A] flex items-center justify-center text-white transition-colors"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      {/* Date picker */}
      <div>
        <p className="text-sm font-medium text-white/70 mb-3">Select Date</p>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {dates.map((date) => (
            <button
              key={date.value}
              onClick={() => setSelectedDate(date.value)}
              className={cn(
                'flex flex-col items-center p-3 rounded-xl border min-w-[56px] transition-all',
                selectedDate === date.value
                  ? 'bg-[#800020] border-[#800020] text-white'
                  : 'bg-[#1A1A1A] border-[#2A2A2A] text-white/60 hover:border-[#3A3A3A]'
              )}
            >
              <span className="text-[10px] uppercase tracking-wide">{date.dayName}</span>
              <span className="text-lg font-bold mt-0.5">{date.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Category chips + time grid */}
      <div>
        <p className="text-sm font-medium text-white/70 mb-3">Select Time</p>

        {slotsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={20} className="animate-spin text-white/40" />
          </div>
        ) : categories.length === 0 ? (
          <p className="text-white/40 text-sm text-center py-6">No slots available for this date.</p>
        ) : (
          <>
            {/* Category chips */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mb-4">
              {categories.map((cat) => (
                <button
                  key={cat.name}
                  onClick={() => { setSelectedCategory(cat.name); setSelectedSlot(''); }}
                  className={cn(
                    'px-4 py-1.5 rounded-full border text-sm font-medium whitespace-nowrap transition-all',
                    selectedCategory === cat.name
                      ? 'bg-[#800020] border-[#800020] text-white'
                      : 'bg-[#1A1A1A] border-[#2A2A2A] text-white/60 hover:border-[#3A3A3A]'
                  )}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Time grid */}
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {activeCategoryHours.map((hour, i) => {
                const past = isPast(hour, selectedDate);
                return (
                  <button
                    key={`${hour}-${i}`}
                    disabled={past}
                    onClick={() => setSelectedSlot(hour)}
                    className={cn(
                      'py-2.5 px-1 rounded-xl border text-xs font-medium transition-all',
                      selectedSlot === hour
                        ? 'bg-[#800020] border-[#800020] text-white'
                        : past
                        ? 'bg-[#111] border-[#1E1E1E] text-white/20 cursor-not-allowed'
                        : 'bg-[#1A1A1A] border-[#2A2A2A] text-white/70 hover:border-[#3A3A3A]'
                    )}
                  >
                    {hour}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Special requests */}
      <div>
        <p className="text-sm font-medium text-white/70 mb-3">Special Requests (optional)</p>
        <textarea
          value={specialRequests}
          onChange={(e) => setSpecialRequests(e.target.value)}
          placeholder="Birthday celebration, dietary restrictions, seating preference..."
          rows={3}
          className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white placeholder:text-white/25 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-[#800020] focus:ring-2 focus:ring-[#800020]/20 transition-all"
        />
      </div>

      {/* Submit */}
      <Button fullWidth size="lg" loading={isLoading} disabled={!canSubmit} onClick={handleSubmit}>
        {'Book Table'}
      </Button>
    </div>
  );
}
