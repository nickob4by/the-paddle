'use client';

import React, { useState } from 'react';
import { Booking } from '@/lib/types';
import { X, Search, AlertCircle } from 'lucide-react';
import BookingTicket from './BookingTicket';

interface LookupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LookupModal({ isOpen, onClose }: LookupModalProps) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [booking, setBooking] = useState<Booking | null>(null);

  if (!isOpen) return null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    try {
      setLoading(true);
      setErrorMsg('');
      setBooking(null);

      const res = await fetch(`/api/bookings/${encodeURIComponent(query.trim())}`);
      const data = await res.json();

      if (data.success && data.booking) {
        setBooking(data.booking);
      } else {
        setErrorMsg('No booking found with this Reference Code. Please verify and try again.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to lookup reservation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-sm overflow-hidden">
      <div className="relative w-full max-w-lg max-h-[92dvh] sm:max-h-[90dvh] bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
        <div className="flex-shrink-0 px-5 sm:px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/95">
          <div>
            <h3 className="text-lg font-black text-white">Check Your Reservation</h3>
            <p className="text-xs text-slate-400 mt-0.5">Enter your Booking Reference (e.g. PAD-1234)</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 scrollbar-thin scrollbar-thumb-slate-700">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                required
                placeholder="e.g. PAD-8492"
                value={query}
                onChange={(e) => setQuery(e.target.value.toUpperCase())}
                className="flex-1 px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 font-mono text-xs sm:text-sm uppercase focus:outline-none focus:border-lime-400"
              />
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 rounded-xl bg-lime-500 hover:bg-lime-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Search className="w-4 h-4" />
                <span>{loading ? 'Finding...' : 'Find'}</span>
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
          </form>

          {booking && (
            <div className="mt-4 pt-4 border-t border-slate-800">
              <BookingTicket booking={booking} onClose={onClose} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
