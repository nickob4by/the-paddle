'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import CalendarSlotPicker from '@/components/CalendarSlotPicker';
import BookingModal from '@/components/BookingModal';
import LookupModal from '@/components/LookupModal';
import { Court, Booking } from '@/lib/types';
import { Sparkles, Shield, Clock, Award, ArrowDown, Users, Phone, MapPin, Zap } from 'lucide-react';

export default function HomePage() {
  const [courts, setCourts] = useState<Court[]>([]);
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(null);
  const [loadingCourts, setLoadingCourts] = useState(true);

  // Modals state
  const [isLookupOpen, setIsLookupOpen] = useState(false);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [currentBookingDetails, setCurrentBookingDetails] = useState<{
    court: Court;
    date: string;
    startTime: string;
    endTime: string;
    durationHours: number;
    totalAmount: number;
  } | null>(null);

  const [operatingHoursText, setOperatingHoursText] = useState<string>('');
  const [courtOpenTime, setCourtOpenTime] = useState<string>('');
  const [courtCloseTime, setCourtCloseTime] = useState<string>('');

  // Fetch active courts and facility settings
  const fetchCourts = async () => {
    try {
      setLoadingCourts(true);
      const res = await fetch('/api/courts');
      const data = await res.json();
      if (data.success && data.courts) {
        setCourts(data.courts);
        if (data.courts.length > 0 && !selectedCourt) {
          setSelectedCourt(data.courts[0]);
        }
      }

      const settingsRes = await fetch('/api/settings', { cache: 'no-store' });
      const settingsData = await settingsRes.json();
      if (settingsData.success && settingsData.settings) {
        const { courtOpenTime: open = '06:00', courtCloseTime: close = '22:00' } = settingsData.settings;
        setCourtOpenTime(open);
        setCourtCloseTime(close);
        const formatBadgeTime = (t: string) => {
          const h = parseInt(t.split(':')[0], 10);
          if (h === 24 || h === 0) return '12:00 AM';
          const ampm = h >= 12 ? 'PM' : 'AM';
          const dh = h % 12 === 0 ? 12 : h % 12;
          return `${dh}:00 ${ampm}`;
        };
        setOperatingHoursText(`Open Daily • ${formatBadgeTime(open)} – ${formatBadgeTime(close)}`);
      }
    } catch (err) {
      console.error('Error fetching courts/settings:', err);
    } finally {
      setLoadingCourts(false);
    }
  };

  useEffect(() => {
    fetchCourts();
  }, []);

  const handleProceedToBooking = (details: {
    court: Court;
    date: string;
    startTime: string;
    endTime: string;
    durationHours: number;
    totalAmount: number;
  }) => {
    setCurrentBookingDetails(details);
    setIsBookingOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col selection:bg-lime-500 selection:text-slate-950 transition-colors duration-200">
      {/* Header */}
      <Navbar onOpenLookup={() => setIsLookupOpen(true)} />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-8 pb-14 sm:pt-16 sm:pb-24 md:pt-20 md:pb-28 border-b border-slate-200 dark:border-slate-900">
        {/* Glow ambient backgrounds */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[320px] sm:w-[600px] h-[200px] sm:h-[300px] bg-gradient-to-tr from-lime-500/15 to-emerald-500/15 blur-[90px] sm:blur-[120px] pointer-events-none rounded-full" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {/* Badge */}
          {operatingHoursText ? (
            <div className="inline-flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] sm:text-xs font-semibold text-lime-600 dark:text-lime-400 mb-5 sm:mb-6 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-lime-500 animate-ping" />
              <span>{operatingHoursText}</span>
            </div>
          ) : (
            <div className="h-8 mb-5 sm:mb-6" />
          )}

          {/* Official Emblem Logo */}
          <div className="flex justify-center mb-6">
            <div className="relative h-14 sm:h-20 md:h-24 w-auto flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/the-paddle-logo-light.png"
                alt="The Paddle - Recreational Hub"
                className="h-14 sm:h-20 md:h-24 w-auto object-contain dark:hidden drop-shadow-sm"
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/the-paddle-logo-dark.png"
                alt="The Paddle - Recreational Hub"
                className="h-14 sm:h-20 md:h-24 w-auto object-contain hidden dark:block drop-shadow-md"
              />
            </div>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight text-slate-950 dark:text-white max-w-4xl mx-auto leading-[1.12] sm:leading-[1.08]">
            PLAY LIKE A PRO AT <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-500 via-emerald-500 to-teal-500 dark:from-lime-400 dark:via-emerald-300 dark:to-teal-400">
              THE PADDLE
            </span>
          </h1>

          <p className="mt-4 sm:mt-6 text-sm sm:text-base md:text-lg lg:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed px-2">
            Book tournament-grade pickleball courts in seconds. Choose your court, pick your time slot, and pay seamlessly via GCash or Cash on site.
          </p>

          {/* CTA Buttons */}
          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 px-2">
            <a
              href="#courts-section"
              className="w-full sm:w-auto px-7 py-3.5 sm:px-8 sm:py-4 rounded-xl bg-lime-500 hover:bg-lime-400 text-slate-950 font-black text-sm sm:text-base shadow-xl shadow-lime-500/25 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Book a Court</span>
              <ArrowDown className="w-4 h-4 stroke-[3]" />
            </a>

            <button
              onClick={() => setIsLookupOpen(true)}
              className="w-full sm:w-auto px-6 py-3.5 sm:px-7 sm:py-4 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 font-bold text-sm sm:text-base transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <span>Find My Reservation</span>
            </button>
          </div>

          {/* Feature Badges */}
          <div className="mt-10 sm:mt-14 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto text-left">
            <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 shadow-sm flex items-center gap-2.5 sm:gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-lime-500/10 flex items-center justify-center text-lime-600 dark:text-lime-400 flex-shrink-0">
                <Award className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <span className="block text-xs font-bold text-slate-900 dark:text-white truncate">Championship Surface</span>
                <span className="block text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 truncate">Pro-cushioned court</span>
              </div>
            </div>

            <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 shadow-sm flex items-center gap-2.5 sm:gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <span className="block text-xs font-bold text-slate-900 dark:text-white truncate">Live Calendar</span>
                <span className="block text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 truncate">Real-time slot locking</span>
              </div>
            </div>

            <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 shadow-sm flex items-center gap-2.5 sm:gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 flex-shrink-0">
                <Zap className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <span className="block text-xs font-bold text-slate-900 dark:text-white truncate">GCash & Cash</span>
                <span className="block text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 truncate">Instant QR scan & pay</span>
              </div>
            </div>

            <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 shadow-sm flex items-center gap-2.5 sm:gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-600 dark:text-teal-400 flex-shrink-0">
                <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <span className="block text-xs font-bold text-slate-900 dark:text-white truncate">Zero Double Booking</span>
                <span className="block text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 truncate">Conflict-free system</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Courts & Booking Section */}
      <section id="courts-section" className="py-10 sm:py-16 md:py-24 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 w-full">
        <div className="text-center max-w-2xl mx-auto mb-6 sm:mb-10 px-2">
          <span className="text-xs font-extrabold uppercase tracking-wider text-lime-600 dark:text-lime-400 bg-lime-500/10 px-3 py-1 rounded-full border border-lime-500/20">
            Online Booking System
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-950 dark:text-white mt-3">
            Reserve Your Court & Time Slot
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-2">
            Select your court, pick your date, and tap the available hours to reserve instantly.
          </p>
        </div>

        {/* Unified Booking Panel */}
        {loadingCourts ? (
          <div className="h-80 sm:h-96 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse flex items-center justify-center">
            <span className="text-slate-400 font-medium text-sm">Loading courts & calendar...</span>
          </div>
        ) : courts.length === 0 ? (
          <div className="text-center p-8 sm:p-12 bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800">
            <p className="text-slate-500 dark:text-slate-400">No active courts currently available. Please check back shortly.</p>
          </div>
        ) : (
          <div id="calendar-view" className="scroll-mt-20 sm:scroll-mt-24">
            {selectedCourt && (
              <CalendarSlotPicker
                courts={courts}
                selectedCourt={selectedCourt}
                initialOpenTime={courtOpenTime || undefined}
                initialCloseTime={courtCloseTime || undefined}
                onSelectCourt={(c) => setSelectedCourt(c)}
                onProceedToBooking={handleProceedToBooking}
              />
            )}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="mt-auto py-8 sm:py-10 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-900 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <span className="font-bold text-slate-700 dark:text-slate-300">The Paddle Pickleball Club</span>
            <span>•</span>
            <span>All rights reserved © 2026</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsLookupOpen(true)}
              className="hover:text-slate-800 dark:hover:text-slate-300 transition-colors cursor-pointer"
            >
              Check Reservation
            </button>
            <span>•</span>
            <a href="/admin" className="hover:text-lime-600 dark:hover:text-lime-400 transition-colors">
              Admin Portal
            </a>
          </div>
        </div>
      </footer>

      {/* Booking Form Modal */}
      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => {
          setIsBookingOpen(false);
          fetchCourts();
        }}
        bookingDetails={currentBookingDetails}
        onBookingSuccess={() => {
          fetchCourts();
        }}
      />

      {/* Lookup Reservation Modal */}
      <LookupModal
        isOpen={isLookupOpen}
        onClose={() => setIsLookupOpen(false)}
      />
    </div>
  );
}
