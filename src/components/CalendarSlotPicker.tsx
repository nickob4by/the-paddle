'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Court, Booking } from '@/lib/types';
import {
  Clock,
  Calendar as CalendarIcon,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Check
} from 'lucide-react';

interface CalendarSlotPickerProps {
  courts: Court[];
  selectedCourt: Court;
  onSelectCourt: (court: Court) => void;
  onProceedToBooking: (bookingDetails: {
    court: Court;
    date: string;
    startTime: string;
    endTime: string;
    durationHours: number;
    totalAmount: number;
  }) => void;
}

export default function CalendarSlotPicker({
  courts,
  selectedCourt,
  onSelectCourt,
  onProceedToBooking
}: CalendarSlotPickerProps) {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [existingBookings, setExistingBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');
  const [openTime, setOpenTime] = useState<string>('06:00');
  const [closeTime, setCloseTime] = useState<string>('22:00');

  // Initialize today's date safely in useEffect and fetch settings
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setSelectedDate(today);
    setLastRefreshed(new Date().toLocaleTimeString());

    fetch('/api/settings', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.settings) {
          if (data.settings.courtOpenTime) setOpenTime(data.settings.courtOpenTime);
          if (data.settings.courtCloseTime) setCloseTime(data.settings.courtCloseTime);
        }
      })
      .catch((err) => console.error('Failed to load settings:', err));
  }, []);

  // Compute operating hours slots dynamically from openTime to closeTime
  const timeSlots = useMemo(() => {
    const startH = parseInt(openTime.split(':')[0], 10) || 6;
    const endH = parseInt(closeTime.split(':')[0], 10) || 22;
    const slots: string[] = [];
    for (let h = startH; h < endH; h++) {
      slots.push(`${h.toString().padStart(2, '0')}:00`);
    }
    return slots.length > 0 ? slots : ['06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'];
  }, [openTime, closeTime]);

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
    if (selectedDate && selectedCourt?.id) {
      fetchBookings();
      setSelectedSlots([]); // reset selected slots on court or date switch
    }
  }, [fetchBookings, selectedDate, selectedCourt?.id]);

  // Auto-refresh every 6 seconds for live real-time synchronization
  useEffect(() => {
    if (!selectedDate || !selectedCourt?.id) return;
    const interval = setInterval(() => {
      fetchBookings();
    }, 6000);
    return () => clearInterval(interval);
  }, [fetchBookings, selectedDate, selectedCourt?.id]);

  // Date Navigation handlers
  const handlePrevDay = () => {
    if (!selectedDate) return;
    const current = new Date(selectedDate);
    current.setDate(current.getDate() - 1);
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    if (!selectedDate) return;
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + 1);
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  const handleSetToday = () => {
    const today = new Date().toISOString().split('T')[0];
    setSelectedDate(today);
  };

  // Formatted human-readable date
  const formattedDate = useMemo(() => {
    if (!selectedDate) return '';
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    return dateObj.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }, [selectedDate]);

  const isToday = useMemo(() => {
    if (!selectedDate) return false;
    const today = new Date().toISOString().split('T')[0];
    return selectedDate === today;
  }, [selectedDate]);

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
  const totalAmount = durationHours * (selectedCourt?.hourlyRate || 0);

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
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-xl relative transition-colors duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-5 sm:pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-lime-500 animate-pulse" />
            <h2 className="text-lg sm:text-2xl font-black text-slate-950 dark:text-white">
              Court Reservation
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Choose your court, select a date, and tap the available 1-hour time slots to book.
          </p>
        </div>

        {/* Live sync badge */}
        <div className="flex items-center justify-between sm:justify-end gap-2.5">
          {lastRefreshed && (
            <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1.5 rounded-full border border-slate-200 dark:border-slate-700/60">
              <RefreshCw className={`w-3 h-3 sm:w-3.5 sm:h-3.5 text-lime-600 dark:text-lime-400 ${loadingBookings ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Live Sync:</span>
              <span>{lastRefreshed}</span>
            </div>
          )}
          <button
            onClick={() => fetchBookings()}
            className="p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Refresh Slots"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* STEP 1: CONCISE COURTS SELECTOR */}
      <div className="mt-5 sm:mt-6">
        <label className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5 sm:mb-3 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-lime-600 dark:text-lime-400" />
          Step 1 • Select Court
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
          {courts.map((court) => {
            const isSelected = selectedCourt?.id === court.id;
            return (
              <button
                key={court.id}
                type="button"
                onClick={() => onSelectCourt(court)}
                className={`p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border text-left transition-all cursor-pointer relative flex flex-col justify-between ${
                  isSelected
                    ? 'bg-lime-50 dark:bg-slate-800/95 border-lime-500 ring-2 ring-lime-500/30 shadow-md'
                    : 'bg-slate-50/70 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-white dark:hover:bg-slate-850'
                }`}
              >
                {/* Header row */}
                <div className="flex items-center justify-between w-full mb-1.5">
                  <span className="font-black text-slate-900 dark:text-white text-sm sm:text-base">
                    {court.name}
                  </span>
                  {isSelected && (
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-lime-500 text-slate-950 text-[10px] font-black">
                      <Check className="w-3 h-3 stroke-[3]" />
                      <span>Active</span>
                    </div>
                  )}
                </div>

                {/* Pricing & description */}
                <div className="flex items-baseline justify-between w-full mt-1">
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg sm:text-xl font-black text-lime-600 dark:text-lime-400">₱{court.hourlyRate}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">/hr</span>
                  </div>
                  {court.description && (
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[140px]">
                      {court.description}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* STEP 2: DROPDOWN CALENDAR DATE PICKER */}
      <div className="mt-6 sm:mt-7">
        <label className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5 sm:mb-3 flex items-center gap-1.5">
          <CalendarIcon className="w-3.5 h-3.5 text-lime-600 dark:text-lime-400" />
          Step 2 • Choose Date
        </label>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-950/70 p-3 sm:p-3.5 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800/80">
          {/* Day Navigation */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={handlePrevDay}
              className="p-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white border border-slate-200 dark:border-slate-800 transition-colors cursor-pointer"
              title="Previous Day"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            <button
              onClick={handleSetToday}
              className={`px-3 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer border ${
                isToday
                  ? 'bg-lime-500/15 text-lime-700 dark:text-lime-400 border-lime-500/30'
                  : 'bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
              }`}
            >
              Today
            </button>

            <button
              onClick={handleNextDay}
              className="p-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white border border-slate-200 dark:border-slate-800 transition-colors cursor-pointer"
              title="Next Day"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            <div className="ml-1.5 sm:ml-2">
              <span className="text-sm sm:text-lg font-black text-slate-950 dark:text-white block leading-tight">
                {formattedDate}
              </span>
              <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400">
                {isToday ? 'Today\'s Schedule' : 'Selected Schedule'}
              </span>
            </div>
          </div>

          {/* Native Dropdown / Popover Calendar Button */}
          <div className="relative w-full sm:w-auto">
            <label className="flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2 sm:py-2.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 text-xs font-bold transition-all cursor-pointer shadow-sm">
              <CalendarIcon className="w-4 h-4 text-lime-600 dark:text-lime-400" />
              <span>Change Date</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  if (e.target.value) setSelectedDate(e.target.value);
                }}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-5 sm:mt-6 flex flex-wrap items-center gap-3 sm:gap-4 text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/40 p-2.5 sm:p-3 rounded-xl border border-slate-200 dark:border-slate-800/60">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-md bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-md bg-lime-500 border border-lime-500" />
          <span className="text-lime-700 dark:text-lime-300 font-semibold">Selected</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-md bg-rose-100 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 flex items-center justify-center">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          </div>
          <span className="text-rose-600 dark:text-rose-400">Reserved</span>
        </div>
      </div>

      {/* STEP 3: TIME SLOTS GRID */}
      <div className="mt-5 sm:mt-6">
        <label className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5 sm:mb-3 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-lime-600 dark:text-lime-400" />
          Step 3 • Available 1-Hour Time Slots ({selectedCourt?.name})
        </label>

        {/* Responsive grid: 2 cols on mobile, 3 on sm, 4 on md+ */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
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
                className={`relative group p-2.5 sm:p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between min-h-[66px] sm:min-h-[74px] ${
                  booked
                    ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/30 text-rose-400 dark:text-rose-300/40 cursor-not-allowed opacity-70'
                    : isSelected
                    ? 'bg-lime-500 border-lime-500 text-slate-950 font-bold shadow-md shadow-lime-500/20 scale-[1.02]'
                    : 'bg-white dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-lime-500/50 text-slate-800 dark:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className={`text-xs sm:text-sm font-bold ${isSelected ? 'text-slate-950' : booked ? 'text-rose-500/70 dark:text-rose-400/50 line-through' : 'text-slate-900 dark:text-white'}`}>
                    {formatTime(slot)}
                  </span>
                  {isSelected && <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-950 stroke-[2.5]" />}
                  {booked && (
                    <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-1 sm:px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50">
                      Booked
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between w-full mt-1">
                  <span className={`text-[10px] sm:text-[11px] ${isSelected ? 'text-slate-900 font-semibold' : 'text-slate-500 dark:text-slate-400'}`}>
                    until {formatTime(slotEndStr)}
                  </span>
                  {!booked && !isSelected && (
                    <span className="text-[10px] sm:text-[11px] text-lime-600 dark:text-lime-400 font-medium">Available</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Summary Bar */}
      {selectedSlots.length > 0 && selectedDate && selectedCourt && (
        <div className="mt-6 sm:mt-8 p-4 sm:p-5 bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-850 rounded-2xl border border-lime-500/50 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 animate-in fade-in slide-in-from-bottom-2">
          <div className="space-y-0.5 sm:space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] sm:text-xs uppercase font-extrabold tracking-wider px-2 py-0.5 rounded bg-lime-500 text-slate-950">
                {durationHours} Hour{durationHours > 1 ? 's' : ''} Selected
              </span>
              <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                {formatTime(startTime)} – {formatTime(endTime)}
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-400">
              {selectedDate} • {selectedCourt.name} (₱{selectedCourt.hourlyRate}/hr)
            </p>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto justify-between sm:justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-300 dark:border-slate-700">
            <div className="text-left sm:text-right">
              <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 block font-medium">Total Price</span>
              <span className="text-xl sm:text-2xl font-black text-lime-600 dark:text-lime-400">₱{totalAmount.toLocaleString()}</span>
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
              className="flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-lime-500 hover:bg-lime-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-lime-500/30 transition-all cursor-pointer hover:scale-105 active:scale-95"
            >
              <span>Continue Booking</span>
              <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
            </button>
          </div>
        </div>
      )}

      {selectedSlots.length === 0 && (
        <div className="mt-5 sm:mt-6 p-3 sm:p-4 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/80 flex items-center gap-2.5 text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
          <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 dark:text-amber-400 flex-shrink-0" />
          <span>Click on one or more available time slots above to select your play time.</span>
        </div>
      )}
    </div>
  );
}
