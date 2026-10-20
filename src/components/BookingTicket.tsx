'use client';

import React, { useState } from 'react';
import { Booking } from '@/lib/types';
import { siteConfig } from '@/lib/config';
import { CheckCircle2, Copy, Check, Printer, Calendar, Clock, MapPin, User, Phone, CreditCard, XCircle } from 'lucide-react';

interface BookingTicketProps {
  booking: Booking;
  onClose: () => void;
}

export default function BookingTicket({ booking, onClose }: BookingTicketProps) {
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(booking.bookingCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

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
    <div className="space-y-4 sm:space-y-6">
      {/* Dynamic Status banner */}
      <div className="text-center py-1 sm:py-2">
        <div className={`w-12 h-12 sm:w-14 sm:h-14 border rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 shadow-lg ${
          booking.bookingStatus === 'CONFIRMED'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 shadow-emerald-500/10'
            : booking.bookingStatus === 'CANCELLED'
            ? 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400 shadow-rose-500/10'
            : 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 shadow-amber-500/10'
        }`}>
          {booking.bookingStatus === 'CONFIRMED' ? (
            <CheckCircle2 className="w-7 h-7 sm:w-8 sm:h-8" />
          ) : booking.bookingStatus === 'CANCELLED' ? (
            <XCircle className="w-7 h-7 sm:w-8 sm:h-8" />
          ) : (
            <Clock className="w-7 h-7 sm:w-8 sm:h-8" />
          )}
        </div>
        <h3 className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white">
          {booking.bookingStatus === 'CONFIRMED'
            ? 'Reservation Confirmed!'
            : booking.bookingStatus === 'CANCELLED'
            ? 'Reservation Cancelled'
            : 'Reservation Submitted (Pending Verification)'}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
          {booking.bookingStatus === 'CONFIRMED'
            ? 'Your payment has been verified. Your court slot is guaranteed.'
            : booking.bookingStatus === 'CANCELLED'
            ? 'This booking was cancelled or the payment proof was rejected. Slot released.'
            : 'Your payment screenshot is awaiting front-desk verification. Your court slot is held.'}
        </p>
      </div>

      {/* Ticket Card */}
      <div className="relative bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl overflow-hidden transition-colors">
        {/* Brand Banner on Ticket */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="relative h-8 sm:h-9 w-auto flex items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={siteConfig.logoLight}
              alt={siteConfig.brandName}
              className="h-8 sm:h-9 w-auto object-contain dark:hidden"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={siteConfig.logoDark}
              alt={siteConfig.brandName}
              className="h-8 sm:h-9 w-auto object-contain hidden dark:block"
            />
          </div>
          <span className={`text-[10px] font-mono tracking-wider uppercase px-2 py-0.5 rounded font-semibold ${
            booking.bookingType === 'OPEN_PLAY'
              ? 'bg-lime-500/20 text-lime-800 dark:text-lime-300 border border-lime-500/30'
              : 'bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
          }`}>
            {booking.bookingType === 'OPEN_PLAY' ? 'MORNING OPEN PLAY PASS' : 'OFFICIAL PASS'}
          </span>
        </div>

        {/* Top bar with Booking Code */}
        <div className="flex items-center justify-between py-3 sm:py-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              Booking Reference
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="font-mono text-xl sm:text-2xl font-black text-lime-600 dark:text-lime-400 tracking-wider">
                {booking.bookingCode}
              </span>
              <button
                type="button"
                onClick={copyCode}
                className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Copy Code"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              Status
            </span>
            <span className={`inline-block mt-0.5 px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider border ${
              booking.bookingStatus === 'CONFIRMED'
                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                : booking.bookingStatus === 'CANCELLED'
                ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30'
                : 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30'
            }`}>
              {booking.bookingStatus === 'PENDING' ? 'PENDING VERIFICATION' : booking.bookingStatus}
            </span>
          </div>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 py-3 sm:py-4 text-xs">
          <div>
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-1">
              <MapPin className="w-3.5 h-3.5 text-lime-600 dark:text-lime-400" /> {booking.bookingType === 'OPEN_PLAY' ? 'Pass Type' : 'Court'}
            </span>
            <span className="text-slate-900 dark:text-white font-bold text-xs sm:text-sm">
              {booking.bookingType === 'OPEN_PLAY' ? 'All Courts (Open Play)' : (booking.courtName || 'Pickleball Court')}
            </span>
          </div>

          <div>
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-1">
              <Calendar className="w-3.5 h-3.5 text-lime-600 dark:text-lime-400" /> Date
            </span>
            <span className="text-slate-900 dark:text-white font-bold text-xs sm:text-sm">
              {new Date(booking.bookingDate).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </span>
          </div>

          <div>
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-1">
              <Clock className="w-3.5 h-3.5 text-lime-600 dark:text-lime-400" /> Play Time
            </span>
            <span className="text-slate-900 dark:text-white font-bold text-xs sm:text-sm">
              {booking.bookingType === 'OPEN_PLAY'
                ? `${formatTime(booking.startTime)} – ${formatTime(booking.endTime)} (Unlimited)`
                : `${formatTime(booking.startTime)} – ${formatTime(booking.endTime)} (${booking.durationHours} hr${booking.durationHours > 1 ? 's' : ''})`}
            </span>
          </div>

          <div>
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-1">
              <CreditCard className="w-3.5 h-3.5 text-lime-600 dark:text-lime-400" /> Payment
            </span>
            <span className="text-slate-900 dark:text-white font-bold text-xs sm:text-sm">
              ₱{booking.totalAmount.toLocaleString()} via {booking.paymentMethod} {booking.bookingType === 'OPEN_PLAY' ? '(Pass)' : ''}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
              {booking.paymentMethod === 'GCASH'
                ? 'Payment screenshot submitted'
                : 'Pay at front desk upon arrival'}
            </span>
          </div>

          <div>
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-1">
              <User className="w-3.5 h-3.5 text-lime-600 dark:text-lime-400" /> Booked By
            </span>
            <span className="text-slate-900 dark:text-white font-semibold text-xs">{booking.clientName}</span>
          </div>

          <div>
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-1">
              <Phone className="w-3.5 h-3.5 text-lime-600 dark:text-lime-400" /> Contact
            </span>
            <span className="text-slate-900 dark:text-white font-semibold text-xs">{booking.clientPhone}</span>
          </div>
        </div>

        {/* Footer tip */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
          <span>Present this reference upon arrival</span>
          <span className="font-semibold text-lime-600 dark:text-lime-400">{siteConfig.brandName}</span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
        <button
          type="button"
          onClick={handlePrint}
          className="flex-1 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs sm:text-sm transition-colors cursor-pointer flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700"
        >
          <Printer className="w-4 h-4" />
          <span>Save / Print Ticket</span>
        </button>

        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-3 px-4 rounded-xl bg-lime-500 hover:bg-lime-400 text-slate-950 font-black text-xs sm:text-sm shadow-md shadow-lime-500/20 transition-all cursor-pointer"
        >
          Done
        </button>
      </div>
    </div>
  );
}
