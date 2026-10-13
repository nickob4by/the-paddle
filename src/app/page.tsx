'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import CourtCard from '@/components/CourtCard';
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

  // Fetch active courts
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
    } catch (err) {
      console.error('Error fetching courts:', err);
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-lime-500 selection:text-slate-950">
      {/* Header */}
      <Navbar onOpenLookup={() => setIsLookupOpen(true)} />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 border-b border-slate-900">
        {/* Glow ambient backgrounds */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-tr from-lime-500/10 to-emerald-500/10 blur-[120px] pointer-events-none rounded-full" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-semibold text-lime-400 mb-6 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-lime-400 animate-ping" />
            <span>Open Daily • 6:00 AM – 10:00 PM</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-white max-w-4xl mx-auto leading-[1.08]">
            PLAY LIKE A PRO AT <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-400 via-emerald-300 to-teal-400">
              THE PADDLE
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Book tournament-grade pickleball courts in seconds. Choose your court, pick your time slot, and pay seamlessly via GCash or Cash on site.
          </p>

          {/* CTA Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="#courts-section"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-lime-500 hover:bg-lime-400 text-slate-950 font-black text-base shadow-xl shadow-lime-500/25 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Book a Court</span>
              <ArrowDown className="w-4 h-4 stroke-[3]" />
            </a>

            <button
              onClick={() => setIsLookupOpen(true)}
              className="w-full sm:w-auto px-7 py-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-slate-700 font-bold text-base transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Find My Reservation</span>
            </button>
          </div>

          {/* Feature Badges */}
          <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-lime-500/10 flex items-center justify-center text-lime-400 flex-shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-xs font-bold text-white">Championship Surface</span>
                <span className="block text-[11px] text-slate-400">Pro-cushioned court</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 flex-shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-xs font-bold text-white">Live Calendar</span>
                <span className="block text-[11px] text-slate-400">Real-time slot locking</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 flex-shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-xs font-bold text-white">GCash & Cash</span>
                <span className="block text-[11px] text-slate-400">Instant QR scan & pay</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-400 flex-shrink-0">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-xs font-bold text-white">Zero Double Booking</span>
                <span className="block text-[11px] text-slate-400">Conflict-free system</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Courts & Booking Section */}
      <section id="courts-section" className="py-16 md:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-extrabold uppercase tracking-wider text-lime-400 bg-lime-500/10 px-3 py-1 rounded-full border border-lime-500/20">
            Real-Time Availability
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white mt-3">
            Book Court & Play Time
          </h2>
          <p className="text-sm text-slate-400 mt-2">
            Select your preferred date and time slot below. All courts are displayed with live availability.
          </p>
        </div>

        {/* Live Multi-Court Schedule & Slot Picker */}
        {loadingCourts ? (
          <div className="h-96 rounded-3xl bg-slate-900 border border-slate-800 animate-pulse flex items-center justify-center">
            <span className="text-slate-500 font-medium">Loading schedule...</span>
          </div>
        ) : courts.length === 0 ? (
          <div className="text-center p-12 bg-slate-900 rounded-3xl border border-slate-800">
            <p className="text-slate-400">No active courts currently available. Please check back shortly.</p>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Unified Calendar & Slot Picker */}
            <div id="calendar-view" className="scroll-mt-24">
              <CalendarSlotPicker
                courts={courts}
                selectedCourt={selectedCourt}
                onCourtChange={(c) => setSelectedCourt(c)}
                onProceedToBooking={handleProceedToBooking}
              />
            </div>

            {/* Court Showcase Cards */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-black text-white">Our Courts</h3>
                  <p className="text-xs text-slate-400">Tournament standard specs and pro-cushioning</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {courts.map((court) => (
                  <CourtCard
                    key={court.id}
                    court={court}
                    isSelected={selectedCourt?.id === court.id}
                    onSelect={(c) => {
                      setSelectedCourt(c);
                      document.getElementById('calendar-view')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Facility & Policy Info Section */}
      <section className="py-16 bg-slate-900/50 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-lime-500/10 flex items-center justify-center text-lime-400 mb-4">
                <MapPin className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg text-white mb-2">Facility & Amenities</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Includes spectator seating, pro-shop paddle rentals (₱50/paddle), locker rooms, shower facilities, and tournament grade lighting.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-4">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg text-white mb-2">GCash & Cash Options</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Scan our official GCash QR code for cashless reservations or opt for Cash payment at the reception desk before your match begins.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-4">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg text-white mb-2">Cancellation Policy</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Need to reschedule? Please inform our desk at least 4 hours before your booked time slot with your Booking Reference code.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-10 bg-slate-950 border-t border-slate-900 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">The Paddle Pickleball Club</span>
            <span>•</span>
            <span>All rights reserved © 2026</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsLookupOpen(true)}
              className="hover:text-slate-300 transition-colors cursor-pointer"
            >
              Check Reservation
            </button>
            <span>•</span>
            <a href="/admin" className="hover:text-lime-400 transition-colors">
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
          // Refetch courts to update any slot states
          fetchCourts();
        }}
        bookingDetails={currentBookingDetails}
        onBookingSuccess={() => {
          // Trigger refresh
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
