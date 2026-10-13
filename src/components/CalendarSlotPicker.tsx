'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Court, Booking } from '@/lib/types';
import { Clock, Calendar as CalendarIcon, CheckCircle2, AlertCircle, RefreshCw, ChevronRight } from 'lucide-react';

interface CalendarSlotPickerProps {
  selectedCourt: Court;
  onProceedToBooking: (bookingDetails: {
    court: Court;
    date: string;
    startTime: string;
    endTime: string;
    durationHours: number;
    totalAmount: number;
  }) => void;
}

interface DateOption {
  dateStr: string;
  dayName: string;
  dayNum: number;
  monthName: string;
  isToday: boolean;
}

export default function CalendarSlotPicker({
  selectedCourt,
  onProceedToBooking
}: CalendarSlotPickerProps) {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [dateOptions, setDateOptions] = useState<DateOption[]>([]);
  const [existingBookings, setExistingBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');

  // Initialize dates safely in useEffect to satisfy Next.js 16 prerender checks
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setSelectedDate(today);

    const options = Array.from({ length: 14 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dayNum = d.getDate();
      const monthName = d.toLocaleDateString('en-US', { month: 'short' });
      return { dateStr, dayName, dayNum, monthName, isToday: i === 0 };
    });
    setDateOptions(options);
    setLastRefreshed(new Date().toLocaleTimeString());
  }, []);

  // Operating hours: 06:00 to 22:00 (1-hour slots)
  const timeSlots = [
    '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
    '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
    '18:00', '19:00', '20:00', '21:00'
  ];

  // Fetch bookings for the selected court and date
  const fetchBookings = useCallback(async () => {
    if (!selectedCourt?.id || !selectedDate) return;
    try {
      setLoadingBookings(true);
      const res = await fetch(`/api/bookings?courtId=${selectedCourt.id}&date=${selectedDate}`);
      const data = await res.json();
      if (data.success) {
        setExistingBookings(data.bookings || []);
      }
      setLastRefreshed(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
    } finally {
      setLoadingBookings(false);
    }
  }, [selectedCourt?.id, selectedDate]);

  // Initial and reactive fetch
  useEffect(() => {
    if (selectedDate) {
      fetchBookings();
      setSelectedSlots([]); // reset selected slots on court or date switch
    }
  }, [fetchBookings, selectedDate]);

  // Auto-refresh every 6 seconds for live real-time synchronization
  useEffect(() => {
    if (!selectedDate) return;
    const interval = setInterval(() => {
      fetchBookings();
    }, 6000);
    return () => clearInterval(interval);
  }, [fetchBookings, selectedDate]);

  // Check if a specific hour slot is already booked
  const isSlotBooked = (slotHourStr: string) => {
    const slotHour = parseInt(slotHourStr.split(':')[0], 10);
    const nextHour = slotHour + 1;
    const nextHourStr = `${nextHour.toString().padStart(2, '0')}:00`;

    return existingBookings.some((b) => {
      if (b.bookingStatus === 'CANCELLED') return false;
      return b.startTime < nextHourStr && b.endTime > slotHourStr;
    });
  };

  // Toggle slot selection
  const handleSlotToggle = (slot: string) => {
    if (isSlotBooked(slot)) return;

    if (selectedSlots.includes(slot)) {
      setSelectedSlots(selectedSlots.filter((s) => s !== slot));
    } else {
      const newSlots = [...selectedSlots, slot].sort();
      setSelectedSlots(newSlots);
    }
  };

  // Calculate start time, end time, and duration
  const sortedSlots = [...selectedSlots].sort();
  const startTime = sortedSlots[0] || '';
  const lastSlot = sortedSlots[sortedSlots.length - 1] || '';
  const endHour = lastSlot ? parseInt(lastSlot.split(':')[0], 10) + 1 : 0;
  const endTime = lastSlot ? `${endHour.toString().padStart(2, '0')}:00` : '';
  const durationHours = sortedSlots.length;
  const totalAmount = durationHours * selectedCourt.hourlyRate;

  // Format 24h to 12h AM/PM
  const formatTime = (time: string) => {
    if (!time) return '';
    const [h] = time.split(':');
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    return `${displayHour}:00 ${ampm}`;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h2 className="text-xl md:text-2xl font-black text-white">Select Date & Time</h2>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Reserving for <span className="font-semibold text-lime-400">{selectedCourt.name}</span> (₱{selectedCourt.hourlyRate}/hr)
          </p>
        </div>

        {/* Live status badge */}
        <div className="flex items-center gap-3">
          {lastRefreshed && (
            <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-700/60">
              <RefreshCw className={`w-3.5 h-3.5 text-lime-400 ${loadingBookings ? 'animate-spin' : ''}`} />
              <span>Live Sync: {lastRefreshed}</span>
            </div>
          )}
          <button
            onClick={() => fetchBookings()}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Refresh Slots"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Date Carousel */}
      <div className="mt-6">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-lime-400" />
          Choose Date
        </label>
        <div className="flex gap-2.5 overflow-x-auto pb-3 pt-1 scrollbar-thin scrollbar-thumb-slate-700">
          {dateOptions.map((opt) => {
            const isSelected = selectedDate === opt.dateStr;
            return (
              <button
                key={opt.dateStr}
                onClick={() => setSelectedDate(opt.dateStr)}
                className={`flex-shrink-0 flex flex-col items-center justify-center w-20 py-3 px-2 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-lime-500 text-slate-950 border-lime-400 font-bold shadow-lg shadow-lime-500/20 scale-105'
                    : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300 border-slate-700/60 hover:border-slate-600'
                }`}
              >
                <span className={`text-[11px] font-semibold uppercase ${isSelected ? 'text-slate-900' : 'text-slate-400'}`}>
                  {opt.isToday ? 'Today' : opt.dayName}
                </span>
                <span className="text-xl font-black my-0.5">{opt.dayNum}</span>
                <span className={`text-[10px] ${isSelected ? 'text-slate-900' : 'text-slate-400'}`}>
                  {opt.monthName}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-slate-400 bg-slate-950/40 p-3 rounded-xl border border-slate-800/60">
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 rounded-md bg-slate-800 border border-slate-700" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 rounded-md bg-lime-500 border border-lime-400" />
          <span className="text-lime-300 font-semibold">Your Selection</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 rounded-md bg-rose-950/60 border border-rose-900/60 flex items-center justify-center">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          </div>
          <span className="text-rose-400">Reserved / Unavailable</span>
        </div>
      </div>

      {/* Time Slots Grid */}
      <div className="mt-6">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-lime-400" />
          Available 1-Hour Time Slots
        </label>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-3">
          {timeSlots.map((slot) => {
            const booked = isSlotBooked(slot);
            const isSelected = selectedSlots.includes(slot);
            const nextH = parseInt(slot.split(':')[0], 10) + 1;
            const slotEndStr = `${nextH.toString().padStart(2, '0')}:00`;

            return (
              <button
                key={slot}
                disabled={booked}
                onClick={() => handleSlotToggle(slot)}
                className={`relative group p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between min-h-[74px] ${
                  booked
                    ? 'bg-rose-950/20 border-rose-900/30 text-rose-300/40 cursor-not-allowed opacity-65'
                    : isSelected
                    ? 'bg-lime-500 border-lime-400 text-slate-950 font-bold shadow-md shadow-lime-500/25 scale-[1.02]'
                    : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 hover:border-lime-500/50 text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className={`text-sm font-bold ${isSelected ? 'text-slate-950' : booked ? 'text-rose-400/50 line-through' : 'text-white'}`}>
                    {formatTime(slot)}
                  </span>
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-slate-950 stroke-[2.5]" />}
                  {booked && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-rose-900/40 text-rose-400 border border-rose-800/50">
                      Booked
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between w-full mt-1">
                  <span className={`text-[11px] ${isSelected ? 'text-slate-900 font-semibold' : 'text-slate-400'}`}>
                    until {formatTime(slotEndStr)}
                  </span>
                  {!booked && !isSelected && (
                    <span className="text-[11px] text-lime-400/90 font-medium">Available</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Summary Bar */}
      {selectedSlots.length > 0 && selectedDate && (
        <div className="mt-8 p-5 bg-gradient-to-r from-slate-800 to-slate-850 rounded-2xl border border-lime-500/40 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-extrabold tracking-wider px-2 py-0.5 rounded bg-lime-500 text-slate-950">
                {durationHours} Hour{durationHours > 1 ? 's' : ''} Selected
              </span>
              <span className="text-sm font-semibold text-white">
                {formatTime(startTime)} – {formatTime(endTime)}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {selectedDate} • {selectedCourt.name}
            </p>
          </div>

          <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
            <div className="text-right">
              <span className="text-xs text-slate-400 block font-medium">Total Price</span>
              <span className="text-2xl font-black text-lime-400">₱{totalAmount.toLocaleString()}</span>
            </div>

            <button
              onClick={() => {
                onProceedToBooking({
                  court: selectedCourt,
                  date: selectedDate,
                  startTime,
                  endTime,
                  durationHours,
                  totalAmount
                });
              }}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-lime-500 hover:bg-lime-400 text-slate-950 font-black text-sm shadow-lg shadow-lime-500/30 transition-all cursor-pointer hover:scale-105 active:scale-95"
            >
              <span>Continue Booking</span>
              <ChevronRight className="w-4 h-4 stroke-[3]" />
            </button>
          </div>
        </div>
      )}

      {selectedSlots.length === 0 && (
        <div className="mt-6 p-4 rounded-xl bg-slate-950/40 border border-slate-800/80 flex items-center gap-3 text-slate-400 text-sm">
          <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
          <span>Click on one or more available time slots above to select your play time.</span>
        </div>
      )}
    </div>
  );
}
