'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Court, Booking } from '@/lib/types';
import {
  Clock,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Sun,
  Sunset,
  Moon,
  LayoutGrid,
  List
} from 'lucide-react';

interface CalendarSlotPickerProps {
  courts: Court[];
  selectedCourt?: Court | null;
  onCourtChange?: (court: Court) => void;
  onProceedToBooking: (bookingDetails: {
    court: Court;
    date: string;
    startTime: string;
    endTime: string;
    durationHours: number;
    totalAmount: number;
  }) => void;
}

type TimeWindowFilter = 'ALL' | 'MORNING' | 'AFTERNOON' | 'EVENING';
type ViewMode = 'AGENDA' | 'GRID';

export default function CalendarSlotPicker({
  courts,
  selectedCourt,
  onCourtChange,
  onProceedToBooking
}: CalendarSlotPickerProps) {
  // Current chosen date in YYYY-MM-DD
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [existingBookings, setExistingBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');

  // Filters
  const [playDuration, setPlayDuration] = useState<number>(1); // 1h, 2h, 3h
  const [timeWindow, setTimeWindow] = useState<TimeWindowFilter>('ALL');
  const [viewMode, setViewMode] = useState<ViewMode>('AGENDA');

  // Initialize today's date safely in client
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setSelectedDate(today);
    setLastRefreshed(new Date().toLocaleTimeString());
  }, []);

  // Fetch all bookings for the active date across all courts
  const fetchBookings = useCallback(async () => {
    if (!selectedDate) return;
    try {
      setLoadingBookings(true);
      const res = await fetch(`/api/bookings?date=${selectedDate}`);
      const data = await res.json();
      if (data.success) {
        setExistingBookings(data.bookings || []);
      }
      setLastRefreshed(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
    } finally {
      setLoadingBookings(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    if (selectedDate) {
      fetchBookings();
    }
  }, [fetchBookings, selectedDate]);

  // Live synchronizer every 6s to prevent double bookings
  useEffect(() => {
    if (!selectedDate) return;
    const interval = setInterval(() => {
      fetchBookings();
    }, 6000);
    return () => clearInterval(interval);
  }, [fetchBookings, selectedDate]);

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

  // Human-readable formatted date string (e.g. "Tuesday, Oct 14, 2026")
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

  // Operating hours: 06:00 to 22:00 (slots start from 06:00 up to 21:00)
  const allTimeSlots = useMemo(() => {
    const slots = [];
    for (let h = 6; h <= 21; h++) {
      slots.push(`${h.toString().padStart(2, '0')}:00`);
    }
    return slots;
  }, []);

  // Filter slots based on Morning (6-12), Afternoon (12-17), Evening (17-22)
  const filteredTimeSlots = useMemo(() => {
    return allTimeSlots.filter((slot) => {
      const h = parseInt(slot.split(':')[0], 10);
      // Ensure the slot + duration doesn't exceed 22:00 closing time
      if (h + playDuration > 22) return false;

      if (timeWindow === 'MORNING') return h >= 6 && h < 12;
      if (timeWindow === 'AFTERNOON') return h >= 12 && h < 17;
      if (timeWindow === 'EVENING') return h >= 17 && h < 22;
      return true;
    });
  }, [allTimeSlots, timeWindow, playDuration]);

  // Check if a court is occupied for a specific slot and duration
  const isCourtSlotOccupied = useCallback(
    (courtId: string, startHourStr: string, duration: number) => {
      const startH = parseInt(startHourStr.split(':')[0], 10);
      const endH = startH + duration;
      const endHourStr = `${endH.toString().padStart(2, '0')}:00`;

      return existingBookings.some((b) => {
        if (b.courtId !== courtId) return false;
        if (b.bookingStatus === 'CANCELLED') return false;
        // Overlap condition: start < otherEnd && otherStart < end
        return b.startTime < endHourStr && b.endTime > startHourStr;
      });
    },
    [existingBookings]
  );

  // Time formatter helper
  const formatTimeStr = (time: string) => {
    if (!time) return '';
    const [h] = time.split(':');
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    return `${displayHour}:00 ${ampm}`;
  };

  const formatSlotRange = (startStr: string, duration: number) => {
    const startH = parseInt(startStr.split(':')[0], 10);
    const endH = startH + duration;
    const endStr = `${endH.toString().padStart(2, '0')}:00`;
    return `${formatTimeStr(startStr)} - ${formatTimeStr(endStr)}`;
  };

  // Direct 1-Click Booking
  const handleSelectSlot = (court: Court, startSlot: string) => {
    const startH = parseInt(startSlot.split(':')[0], 10);
    const endH = startH + playDuration;
    const endSlot = `${endH.toString().padStart(2, '0')}:00`;
    const totalAmount = court.hourlyRate * playDuration;

    onProceedToBooking({
      court,
      date: selectedDate,
      startTime: startSlot,
      endTime: endSlot,
      durationHours: playDuration,
      totalAmount
    });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 md:p-8 shadow-2xl relative overflow-hidden">
      {/* Glow highlight */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-lime-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* TOP BAR: Title & Real-Time Sync */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-lime-400 animate-pulse" />
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Live Court Schedule & Booking
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Pick your date & hour. All courts shown side-by-side with real-time availability.
          </p>
        </div>

        {/* View Switcher & Sync */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {/* View toggle */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setViewMode('AGENDA')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'AGENDA'
                  ? 'bg-lime-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="PickleCourts Agenda View"
            >
              <List className="w-3.5 h-3.5" />
              <span>Agenda</span>
            </button>
            <button
              onClick={() => setViewMode('GRID')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'GRID'
                  ? 'bg-lime-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Google Calendar Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Grid</span>
            </button>
          </div>

          {/* Refresh button */}
          <button
            onClick={() => fetchBookings()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700/60 text-xs font-semibold transition-colors cursor-pointer"
            title="Refresh availability"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-lime-400 ${loadingBookings ? 'animate-spin' : ''}`} />
            <span className="hidden md:inline">Sync</span>
          </button>
        </div>
      </div>

      {/* DATE NAVIGATOR & PICKER */}
      <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950/70 p-4 rounded-2xl border border-slate-800/80">
        <div className="flex items-center gap-2">
          {/* Prev Day */}
          <button
            onClick={handlePrevDay}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer"
            title="Previous Day"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Today Button */}
          <button
            onClick={handleSetToday}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer border ${
              isToday
                ? 'bg-lime-500/15 text-lime-400 border-lime-500/30'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800 hover:border-slate-700'
            }`}
          >
            Today
          </button>

          {/* Next Day */}
          <button
            onClick={handleNextDay}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer"
            title="Next Day"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Formatted Date Display */}
          <div className="ml-2">
            <span className="text-base sm:text-lg font-black text-white block leading-tight">
              {formattedDate}
            </span>
            <span className="text-[11px] text-slate-400">
              {isToday ? 'Today\'s Schedule' : 'Selected Schedule'}
            </span>
          </div>
        </div>

        {/* Quick Date Input picker */}
        <div className="flex items-center gap-2">
          <label className="relative flex items-center bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-300 cursor-pointer transition-colors">
            <CalendarIcon className="w-4 h-4 text-lime-400 mr-2" />
            <span>Choose Date</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                if (e.target.value) setSelectedDate(e.target.value);
              }}
              className="absolute inset-0 opacity-0 cursor-pointer w-full"
            />
          </label>
        </div>
      </div>

      {/* FILTER DOCK: DURATION & TIME OF DAY */}
      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4 pb-2">
        {/* Play Duration */}
        <div className="flex items-center gap-2 bg-slate-950/40 p-2.5 rounded-2xl border border-slate-800/60">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2">
            Duration:
          </span>
          <div className="flex items-center gap-1.5 flex-1">
            {[1, 2, 3].map((dur) => (
              <button
                key={dur}
                onClick={() => setPlayDuration(dur)}
                className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  playDuration === dur
                    ? 'bg-lime-500 text-slate-950 shadow-md shadow-lime-500/20'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
                }`}
              >
                {dur}h play
              </button>
            ))}
          </div>
        </div>

        {/* Time of Day Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-950/40 p-2.5 rounded-2xl border border-slate-800/60 overflow-x-auto">
          <button
            onClick={() => setTimeWindow('ALL')}
            className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              timeWindow === 'ALL'
                ? 'bg-lime-500 text-slate-950 shadow-sm'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            All Hours
          </button>
          <button
            onClick={() => setTimeWindow('MORNING')}
            className={`flex items-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              timeWindow === 'MORNING'
                ? 'bg-lime-500 text-slate-950 shadow-sm'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <Sun className="w-3.5 h-3.5 text-amber-400" />
            <span>Morning</span>
          </button>
          <button
            onClick={() => setTimeWindow('AFTERNOON')}
            className={`flex items-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              timeWindow === 'AFTERNOON'
                ? 'bg-lime-500 text-slate-950 shadow-sm'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <Sunset className="w-3.5 h-3.5 text-orange-400" />
            <span>Afternoon</span>
          </button>
          <button
            onClick={() => setTimeWindow('EVENING')}
            className={`flex items-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              timeWindow === 'EVENING'
                ? 'bg-lime-500 text-slate-950 shadow-sm'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <Moon className="w-3.5 h-3.5 text-indigo-400" />
            <span>Evening</span>
          </button>
        </div>
      </div>

      {/* SCHEDULE CONTENT */}
      {viewMode === 'AGENDA' ? (
        /* ============================================================ */
        /* VIEW 1: AGENDA LIST (Inspired by PickleCourts)              */
        /* ============================================================ */
        <div className="mt-6 space-y-3.5">
          {filteredTimeSlots.length === 0 ? (
            <div className="p-8 text-center bg-slate-950/40 rounded-2xl border border-slate-800 text-slate-400 text-sm">
              No slots available for the selected filters.
            </div>
          ) : (
            filteredTimeSlots.map((slot) => {
              // Calculate court availability for this hour
              const courtAvailability = courts.map((court) => {
                const occupied = isCourtSlotOccupied(court.id, slot, playDuration);
                return { court, occupied };
              });
              const freeCourtsCount = courtAvailability.filter((c) => !c.occupied).length;
              const isAllFull = freeCourtsCount === 0;

              return (
                <div
                  key={slot}
                  className="bg-slate-950/60 border border-slate-800/90 rounded-2xl p-4 sm:p-5 transition-all hover:border-slate-700/80"
                >
                  {/* Slot Header Row */}
                  <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-slate-850">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-lime-500/10 flex items-center justify-center text-lime-400">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-base sm:text-lg font-black text-white">
                          {formatSlotRange(slot, playDuration)}
                        </span>
                        <span className="block text-[11px] text-slate-400">
                          {playDuration} hour{playDuration > 1 ? 's' : ''} window
                        </span>
                      </div>
                    </div>

                    {/* Summary badge */}
                    <div>
                      {isAllFull ? (
                        <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-rose-950/60 text-rose-400 border border-rose-900/60">
                          Fully Booked
                        </span>
                      ) : (
                        <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-lime-500/15 text-lime-400 border border-lime-500/30">
                          {freeCourtsCount} {freeCourtsCount === 1 ? 'Court' : 'Courts'} Free
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Individual Courts Grid for this hour */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {courtAvailability.map(({ court, occupied }) => {
                      const totalAmount = court.hourlyRate * playDuration;
                      return (
                        <div
                          key={court.id}
                          className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                            occupied
                              ? 'bg-slate-900/40 border-slate-800/60 text-slate-500 opacity-60'
                              : 'bg-slate-900/90 hover:bg-slate-850 border-slate-800 hover:border-lime-500/50'
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-white">
                                {court.name}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                                {court.surfaceType}
                              </span>
                            </div>
                            <div className="text-xs text-lime-400 font-semibold mt-1">
                              ₱{totalAmount.toLocaleString()} <span className="text-[11px] text-slate-400">({playDuration}h)</span>
                            </div>
                          </div>

                          {occupied ? (
                            <span className="text-[11px] font-bold uppercase px-2.5 py-1 rounded-lg bg-rose-950/40 text-rose-400/80 border border-rose-900/40">
                              Booked
                            </span>
                          ) : (
                            <button
                              onClick={() => handleSelectSlot(court, slot)}
                              className="px-3.5 py-2 rounded-xl bg-lime-500 hover:bg-lime-400 text-slate-950 font-black text-xs shadow-md shadow-lime-500/20 transition-all cursor-pointer hover:scale-105 active:scale-95 whitespace-nowrap"
                            >
                              Book Now
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* ============================================================ */
        /* VIEW 2: GOOGLE CALENDAR TIMELINE GRID                        */
        /* ============================================================ */
        <div className="mt-6 overflow-x-auto pb-4">
          <div className="min-w-[680px] bg-slate-950/70 border border-slate-800 rounded-2xl overflow-hidden">
            {/* Table Header: Courts */}
            <div className="grid grid-cols-[100px_repeat(auto-fit,minmax(180px,1fr))] border-b border-slate-800 bg-slate-900/80">
              <div className="p-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider border-r border-slate-800 flex items-center justify-center">
                Time
              </div>
              {courts.map((court) => (
                <div key={court.id} className="p-3.5 border-r border-slate-800 last:border-r-0 text-center">
                  <div className="text-sm font-bold text-white">{court.name}</div>
                  <div className="text-[11px] text-lime-400 font-semibold">
                    ₱{court.hourlyRate * playDuration} / {playDuration}h
                  </div>
                </div>
              ))}
            </div>

            {/* Time Slot Rows */}
            <div className="divide-y divide-slate-850">
              {filteredTimeSlots.map((slot) => (
                <div
                  key={slot}
                  className="grid grid-cols-[100px_repeat(auto-fit,minmax(180px,1fr))] hover:bg-slate-900/30 transition-colors"
                >
                  {/* Time Axis */}
                  <div className="p-3 text-xs font-bold text-slate-300 border-r border-slate-800 flex items-center justify-center bg-slate-900/40">
                    {formatTimeStr(slot)}
                  </div>

                  {/* Court Columns */}
                  {courts.map((court) => {
                    const occupied = isCourtSlotOccupied(court.id, slot, playDuration);
                    return (
                      <div
                        key={court.id}
                        className="p-2 border-r border-slate-800/80 last:border-r-0 flex items-center justify-center"
                      >
                        {occupied ? (
                          <div className="w-full py-2 px-3 rounded-xl bg-rose-950/30 border border-rose-900/40 text-center">
                            <span className="text-[11px] font-bold text-rose-400/80 uppercase">
                              Reserved
                            </span>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleSelectSlot(court, slot)}
                            className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-lime-500 text-slate-300 hover:text-slate-950 border border-slate-800 hover:border-lime-400 font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer group shadow-sm hover:scale-[1.02]"
                          >
                            <span className="group-hover:hidden text-lime-400 font-semibold">Available</span>
                            <span className="hidden group-hover:inline font-black">Book {court.name}</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Legend & Instructions */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400 pt-4 border-t border-slate-800/80">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-md bg-lime-500" />
            <span className="text-slate-300 font-medium">Available to Book</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-md bg-rose-950/70 border border-rose-900" />
            <span className="text-slate-400">Reserved / Unavailable</span>
          </div>
        </div>

        {lastRefreshed && (
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Synced at {lastRefreshed}</span>
          </div>
        )}
      </div>
    </div>
  );
}
