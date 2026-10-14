'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Court, Booking, getSlotRate, getSlotPricingRule, parsePricingRules } from '@/lib/types';
import {
  Clock,
  Calendar as CalendarIcon,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Check,
  Moon,
  Sun
} from 'lucide-react';

interface CalendarSlotPickerProps {
  courts: Court[];
  selectedCourt: Court;
  initialOpenTime?: string;
  initialCloseTime?: string;
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
  initialOpenTime,
  initialCloseTime,
  onSelectCourt,
  onProceedToBooking
}: CalendarSlotPickerProps) {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [existingBookings, setExistingBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');
  const [openTime, setOpenTime] = useState<string>(initialOpenTime || '06:00');
  const [closeTime, setCloseTime] = useState<string>(initialCloseTime || '22:00');

  const dateInputRef = useRef<HTMLInputElement>(null);

  const handleOpenDatePicker = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
    }
    if (dateInputRef.current) {
      try {
        if ('showPicker' in HTMLInputElement.prototype) {
          dateInputRef.current.showPicker();
          return;
        }
      } catch (err) {
        // Fallback if showPicker throws
      }
      dateInputRef.current.focus();
    }
  };

  // Helper to get local date string YYYY-MM-DD
  const getTodayStr = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper to check if a specific hour on today has already elapsed
  const isSlotInPast = (slotHourStr: string) => {
    if (!selectedDate) return false;
    const today = getTodayStr();
    if (selectedDate < today) return true; // entire date is in the past
    if (selectedDate > today) return false; // future date

    // For today:
    const now = new Date();
    const currentHour = now.getHours();
    const startH = parseInt(openTime.split(':')[0], 10) || 5;

    // If early morning before the facility opens for the day, nothing today has passed yet
    if (currentHour < startH) {
      return false;
    }

    const slotH = parseInt(slotHourStr.split(':')[0], 10);
    const slotOffset = (slotH - startH + 24) % 24;
    const currentOffset = (currentHour - startH + 24) % 24;

    return slotOffset < currentOffset;
  };

  // Sync props if provided
  useEffect(() => {
    if (initialOpenTime) setOpenTime(initialOpenTime);
    if (initialCloseTime) setCloseTime(initialCloseTime);
  }, [initialOpenTime, initialCloseTime]);

  // Initialize today's date safely in useEffect and fetch settings
  useEffect(() => {
    const today = getTodayStr();
    setSelectedDate(today);
    setLastRefreshed(new Date().toLocaleTimeString());

    if (!initialOpenTime || !initialCloseTime) {
      fetch('/api/settings', { cache: 'no-store' })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.settings) {
            if (data.settings.courtOpenTime) setOpenTime(data.settings.courtOpenTime);
            if (data.settings.courtCloseTime) setCloseTime(data.settings.courtCloseTime);
          }
        })
        .catch((err) => console.error('Failed to load settings:', err));
    }
  }, [initialOpenTime, initialCloseTime]);

  // Compute operating hours slots dynamically from openTime to closeTime
  const timeSlots = useMemo(() => {
    const startH = parseInt(openTime.split(':')[0], 10);
    let endH = parseInt(closeTime.split(':')[0], 10);

    // If closeTime is 24:00, or closeTime is 00:00 (end of day midnight)
    if (closeTime === '24:00' || (closeTime === '00:00' && startH > 0)) {
      endH = 24;
    }

    const validStart = Number.isNaN(startH) ? 5 : startH;
    const validEnd = Number.isNaN(endH) ? 3 : endH;

    const slots: string[] = [];

    if (validStart < validEnd) {
      // Standard daytime schedule (e.g. 06:00 to 22:00)
      for (let h = validStart; h < validEnd; h++) {
        slots.push(`${h.toString().padStart(2, '0')}:00`);
      }
    } else {
      // Continuous overnight operating schedule (e.g. 05:00 to 03:00 next morning)
      // Part 1: from opening hour until midnight (e.g. 05:00 through 23:00)
      for (let h = validStart; h < 24; h++) {
        slots.push(`${h.toString().padStart(2, '0')}:00`);
      }
      // Part 2: from midnight until closing hour (e.g. 00:00, 01:00, 02:00)
      for (let h = 0; h < validEnd; h++) {
        slots.push(`${h.toString().padStart(2, '0')}:00`);
      }
    }

    return slots.length > 0 ? slots : ['05:00', '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00', '00:00', '01:00', '02:00'];
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
    const today = getTodayStr();
    if (selectedDate <= today) return; // Prevent going before today

    const [y, m, d] = selectedDate.split('-').map(Number);
    const current = new Date(y, m - 1, d);
    current.setDate(current.getDate() - 1);
    const newY = current.getFullYear();
    const newM = String(current.getMonth() + 1).padStart(2, '0');
    const newD = String(current.getDate()).padStart(2, '0');
    setSelectedDate(`${newY}-${newM}-${newD}`);
  };

  const handleNextDay = () => {
    if (!selectedDate) return;
    const [y, m, d] = selectedDate.split('-').map(Number);
    const current = new Date(y, m - 1, d);
    current.setDate(current.getDate() + 1);
    const newY = current.getFullYear();
    const newM = String(current.getMonth() + 1).padStart(2, '0');
    const newD = String(current.getDate()).padStart(2, '0');
    setSelectedDate(`${newY}-${newM}-${newD}`);
  };

  const handleSetToday = () => {
    setSelectedDate(getTodayStr());
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
    return selectedDate === getTodayStr();
  }, [selectedDate]);

  // Check if a specific hour slot is already booked
  const isSlotBooked = (slotHourStr: string) => {
    const slotH = parseInt(slotHourStr.split(':')[0], 10);

    return existingBookings.some((b) => {
      if (b.bookingStatus === 'CANCELLED') return false;
      const bStartH = parseInt(b.startTime.split(':')[0], 10);
      let bEndH = parseInt(b.endTime.split(':')[0], 10);
      if (b.endTime === '24:00') bEndH = 24;

      if (bStartH < bEndH) {
        return slotH >= bStartH && slotH < bEndH;
      } else {
        // Overnight booking crossing midnight (e.g. 23:00 to 02:00)
        return slotH >= bStartH || slotH < bEndH;
      }
    });
  };

  // Toggle slot selection
  const handleSlotToggle = (slot: string) => {
    if (isSlotBooked(slot) || isSlotInPast(slot)) return;

    if (selectedSlots.includes(slot)) {
      setSelectedSlots(selectedSlots.filter((s) => s !== slot));
    } else {
      const newSlots = [...selectedSlots, slot].sort(
        (a, b) => timeSlots.indexOf(a) - timeSlots.indexOf(b)
      );
      setSelectedSlots(newSlots);
    }
  };

  // Calculate start time, end time, and duration
  const sortedSlots = [...selectedSlots].sort(
    (a, b) => timeSlots.indexOf(a) - timeSlots.indexOf(b)
  );
  const startTime = sortedSlots[0] || '';
  const lastSlot = sortedSlots[sortedSlots.length - 1] || '';
  const lastSlotIndex = timeSlots.indexOf(lastSlot);
  let endTime = '';
  if (lastSlot) {
    if (lastSlotIndex >= 0 && lastSlotIndex + 1 < timeSlots.length) {
      endTime = timeSlots[lastSlotIndex + 1];
    } else {
      endTime = closeTime === '24:00' ? '24:00' : closeTime;
    }
  }
  const durationHours = sortedSlots.length;
  const totalAmount = sortedSlots.reduce((sum, slot) => sum + getSlotRate(selectedCourt, slot), 0);

  // Format 24h to 12h AM/PM
  const formatTime = (time: string) => {
    if (!time) return '';
    const [h] = time.split(':');
    const hour = parseInt(h, 10);
    if (hour === 24 || hour === 0) return '12:00 AM';
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
                    : 'bg-slate-50/70 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-white dark:hover:bg-slate-800'
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

                {parsePricingRules(court.pricingRules).length > 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex flex-wrap gap-1">
                    {parsePricingRules(court.pricingRules).map((r) => (
                      <span
                        key={r.id || r.startTime}
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/50"
                      >
                        <Moon className="w-2.5 h-2.5" />
                        <span>{r.label || 'Evening'}: ₱{r.rate}/hr</span>
                      </span>
                    ))}
                  </div>
                )}
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
              disabled={isToday}
              className={`p-2 rounded-xl border transition-colors ${
                isToday
                  ? 'bg-slate-100 dark:bg-slate-800/50 text-slate-300 dark:text-slate-600 border-slate-200 dark:border-slate-800/50 cursor-not-allowed opacity-50'
                  : 'bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white border border-slate-200 dark:border-slate-800 cursor-pointer'
              }`}
              title={isToday ? 'Cannot view past dates' : 'Previous Day'}
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

            <button
              type="button"
              onClick={handleOpenDatePicker}
              className="ml-1.5 sm:ml-2 text-left cursor-pointer group"
              title="Click to change date"
            >
              <span className="text-sm sm:text-lg font-black text-slate-950 dark:text-white block leading-tight group-hover:text-lime-600 dark:group-hover:text-lime-400 transition-colors">
                {formattedDate}
              </span>
              <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400">
                {isToday ? "Today's Schedule" : 'Selected Schedule'}
              </span>
            </button>
          </div>

          {/* Native Dropdown / Popover Calendar Button */}
          <div className="relative flex items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-2 w-full sm:w-auto px-3.5 py-2 sm:py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 shadow-sm hover:border-lime-500/50 transition-all">
              <button
                type="button"
                onClick={handleOpenDatePicker}
                className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300 hover:text-lime-600 dark:hover:text-lime-400 transition-colors"
                title="Click to open calendar"
              >
                <CalendarIcon className="w-4 h-4 text-lime-600 dark:text-lime-400 flex-shrink-0" />
                <span className="whitespace-nowrap">Change Date:</span>
              </button>
              <input
                ref={dateInputRef}
                type="date"
                min={getTodayStr()}
                value={selectedDate}
                onChange={(e) => {
                  if (e.target.value) {
                    const today = getTodayStr();
                    setSelectedDate(e.target.value < today ? today : e.target.value);
                  }
                }}
                onClick={(e) => {
                  try {
                    (e.target as HTMLInputElement).showPicker?.();
                  } catch {}
                }}
                className="bg-transparent text-slate-900 dark:text-white font-bold text-xs focus:outline-none cursor-pointer [color-scheme:light] dark:[color-scheme:dark] w-full sm:w-auto"
              />
            </div>
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
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-md bg-slate-200 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 opacity-60" />
          <span className="text-slate-400 dark:text-slate-500">Passed Hour</span>
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
          {timeSlots.map((slot, idx) => {
            const booked = isSlotBooked(slot);
            const inPast = isSlotInPast(slot);
            const isSelected = selectedSlots.includes(slot);
            const slotIndex = timeSlots.indexOf(slot);
            const slotEndStr = slotIndex + 1 < timeSlots.length ? timeSlots[slotIndex + 1] : closeTime;
            const slotRate = getSlotRate(selectedCourt, slot);
            const slotRule = getSlotPricingRule(selectedCourt, slot);
            const hasPricingRules = parsePricingRules(selectedCourt?.pricingRules).length > 0;

            const prevSlot = idx > 0 ? timeSlots[idx - 1] : null;
            const prevRule = prevSlot ? getSlotPricingRule(selectedCourt, prevSlot) : null;
            const isRuleStart = slotRule && (!prevRule || prevRule.id !== slotRule.id);
            const isReturnToBase = !slotRule && prevRule && hasPricingRules;

            const isDisabled = booked || inPast;

            return (
              <React.Fragment key={slot}>
                {/* Daytime Header (if court has evening rules configured) */}
                {idx === 0 && hasPricingRules && !slotRule && (
                  <div className="col-span-full mb-1 flex items-center justify-between pb-1.5 border-b border-slate-200/80 dark:border-slate-800/80">
                    <div className="flex items-center gap-1.5">
                      <Sun className="w-3.5 h-3.5 text-amber-500" />
                      <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Standard Daytime Hours
                      </span>
                    </div>
                    <span className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-slate-400">
                      ₱{selectedCourt?.hourlyRate}/hr
                    </span>
                  </div>
                )}

                {/* Evening Rates Separator */}
                {isRuleStart && (
                  <div className="col-span-full my-2.5 pt-3 sm:pt-4 pb-1.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 animate-in fade-in">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
                        <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </div>
                      <div className="flex flex-wrap items-center gap-x-2">
                        <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                          {slotRule?.label || 'Evening Rates'}
                        </span>
                        <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400">
                          (From {formatTime(slot)} onwards)
                        </span>
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-black border border-indigo-200/50 dark:border-indigo-800/50">
                      ₱{slotRate}/hr
                    </span>
                  </div>
                )}

                {/* Daytime Return Separator (if returning from overnight to base) */}
                {isReturnToBase && (
                  <div className="col-span-full my-2.5 pt-3 sm:pt-4 pb-1.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 animate-in fade-in">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-lime-500/15 text-lime-600 dark:text-lime-400 flex items-center justify-center flex-shrink-0">
                        <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </div>
                      <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                        Standard Base Hours (From {formatTime(slot)})
                      </span>
                    </div>
                    <span className="text-xs font-black text-lime-600 dark:text-lime-400">
                      ₱{selectedCourt?.hourlyRate}/hr
                    </span>
                  </div>
                )}

                <button
                  disabled={isDisabled}
                  onClick={() => handleSlotToggle(slot)}
                  className={`relative group p-2.5 sm:p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between min-h-[66px] sm:min-h-[74px] ${
                    isSelected
                      ? 'bg-lime-500 border-lime-500 text-slate-950 font-bold shadow-md shadow-lime-500/20 scale-[1.02] cursor-pointer'
                      : booked
                      ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/30 text-rose-400 dark:text-rose-300/40 cursor-not-allowed opacity-75'
                      : inPast
                      ? 'bg-slate-100/70 dark:bg-slate-950/40 border-slate-200/80 dark:border-slate-900/80 text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-60'
                      : 'bg-white dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-lime-500/50 text-slate-800 dark:text-slate-200 cursor-pointer'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className={`text-xs sm:text-sm font-bold ${
                      isSelected
                        ? 'text-slate-950'
                        : booked
                        ? 'text-rose-500/70 dark:text-rose-400/50 line-through'
                        : inPast
                        ? 'text-slate-400 dark:text-slate-600'
                        : 'text-slate-900 dark:text-white'
                    }`}>
                      {formatTime(slot)}
                    </span>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-950 stroke-[2.5]" />}
                    {booked && (
                      <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-1 sm:px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50">
                        Booked
                      </span>
                    )}
                    {inPast && !booked && (
                      <span className="text-[9px] sm:text-[10px] font-semibold tracking-wider px-1 sm:px-1.5 py-0.5 rounded bg-slate-200/60 dark:bg-slate-900/60 text-slate-400 dark:text-slate-500 border border-slate-300/60 dark:border-slate-800/60">
                        Passed
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between w-full mt-1.5">
                    <span className={`text-[10px] sm:text-[11px] ${
                      isSelected
                        ? 'text-slate-900 font-semibold'
                        : inPast
                        ? 'text-slate-400 dark:text-slate-600'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}>
                      until {formatTime(slotEndStr)}
                    </span>
                    {!booked && !inPast && (
                      <span className={`text-[11px] sm:text-xs font-black ${
                        isSelected
                          ? 'text-slate-950'
                          : slotRule
                          ? 'text-indigo-600 dark:text-indigo-400'
                          : 'text-lime-600 dark:text-lime-400'
                      }`}>
                        ₱{slotRate}
                      </span>
                    )}
                  </div>
                </button>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Bottom Summary Bar */}
      {selectedSlots.length > 0 && selectedDate && selectedCourt && (
        <div className="mt-6 sm:mt-8 p-4 sm:p-5 bg-slate-100 dark:bg-slate-800/90 rounded-2xl border border-lime-500/50 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 animate-in fade-in slide-in-from-bottom-2">
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
              {selectedDate} • {selectedCourt.name}
              {sortedSlots.length > 0 && (() => {
                const uniqueRates = Array.from(new Set(sortedSlots.map((s) => getSlotRate(selectedCourt, s))));
                if (uniqueRates.length === 1) {
                  return ` • ₱${uniqueRates[0]}/hr`;
                }
                return ` • Multi-rate applied (₱${Math.min(...uniqueRates)} – ₱${Math.max(...uniqueRates)}/hr)`;
              })()}
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
