'use client';

import React, { useState, useEffect } from 'react';
import { Court, Booking, SystemSettings } from '@/lib/types';
import {
  X,
  CreditCard,
  Banknote,
  Copy,
  Check,
  Upload,
  AlertCircle,
  Calendar,
  Clock,
  MapPin,
  CheckCircle,
  QrCode,
  Download,
  Eye,
  ImageIcon
} from 'lucide-react';
import BookingTicket from './BookingTicket';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingDetails: {
    court: Court;
    date: string;
    startTime: string;
    endTime: string;
    durationHours: number;
    totalAmount: number;
  } | null;
  onBookingSuccess: (booking: Booking) => void;
}

export default function BookingModal({
  isOpen,
  onClose,
  bookingDetails,
  onBookingSuccess
}: BookingModalProps) {
  // Form fields
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'GCASH'>('GCASH');
  const [receiptUrl, setReceiptUrl] = useState('');

  // Settings for GCash
  const [settings, setSettings] = useState<Partial<SystemSettings>>({
    gcashAccountName: 'The Paddle Pickleball Club',
    gcashNumber: '0917-888-7235',
    gcashQrUrl: ''
  });

  // UI state
  const [copiedNumber, setCopiedNumber] = useState(false);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);
  const [qrImgError, setQrImgError] = useState(false);

  // Fetch admin GCash settings with cache-busting
  useEffect(() => {
    if (isOpen) {
      fetch(`/api/settings?t=${Date.now()}`, { cache: 'no-store' })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.settings) {
            setSettings(data.settings);
          }
        })
        .catch((err) => console.error('Error fetching settings:', err));
    }
  }, [isOpen]);

  // Reset state when opened with new booking
  useEffect(() => {
    if (isOpen) {
      setConfirmedBooking(null);
      setErrorMsg('');
      setReceiptUrl('');
    }
  }, [isOpen, bookingDetails]);

  if (!isOpen || !bookingDetails) return null;

  // Format 24h to 12h AM/PM
  const formatTime = (time: string) => {
    if (!time) return '';
    const [h] = time.split(':');
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    return `${displayHour}:00 ${ampm}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedNumber(true);
    setTimeout(() => setCopiedNumber(false), 2000);
  };

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingReceipt(true);
      setErrorMsg('');
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setReceiptUrl(data.url);
      } else {
        setErrorMsg(data.error || 'Failed to upload receipt screenshot.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to upload receipt screenshot.');
    } finally {
      setUploadingReceipt(false);
    }
  };

  const handleSaveQr = () => {
    if (!settings.gcashQrUrl) return;
    // Create a temporary anchor to trigger native download
    const link = document.createElement('a');
    link.href = settings.gcashQrUrl;
    link.download = 'ThePaddle-GCash-QR.png';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!clientName.trim() || !clientPhone.trim()) {
      setErrorMsg('Please enter your Name and Phone Number.');
      return;
    }

    if (paymentMethod === 'GCASH' && !receiptUrl) {
      setErrorMsg('Please upload your GCash payment screenshot to confirm your reservation.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courtId: bookingDetails.court.id,
          clientName: clientName.trim(),
          clientEmail: clientEmail.trim(),
          clientPhone: clientPhone.trim(),
          bookingDate: bookingDetails.date,
          startTime: bookingDetails.startTime,
          endTime: bookingDetails.endTime,
          paymentMethod,
          receiptUrl,
          notes: notes.trim()
        })
      });

      const data = await res.json();
      if (data.success) {
        setConfirmedBooking(data.booking);
        onBookingSuccess(data.booking);
      } else {
        setErrorMsg(data.error || 'Could not complete booking.');
      }
    } catch (err) {
      console.error('Submission error:', err);
      setErrorMsg('A network error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/85 backdrop-blur-sm overflow-hidden">
      {/* Modal Container with strict max-height constraint */}
      <div className="relative w-full max-w-2xl max-h-[94dvh] sm:max-h-[90dvh] bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
        
        {/* Sticky Header */}
        <div className="flex-shrink-0 px-5 sm:px-6 py-3.5 sm:py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/95 backdrop-blur-sm z-10">
          <div>
            <h3 className="text-lg sm:text-xl font-black text-white">
              {confirmedBooking ? 'Reservation Confirmed!' : 'Complete Your Reservation'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[240px] sm:max-w-none">
              The Paddle • {bookingDetails.court.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* If booking is confirmed, show Ticket view inside scrollable area */}
        {confirmedBooking ? (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-thin scrollbar-thumb-slate-700">
            <BookingTicket booking={confirmedBooking} onClose={onClose} />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Scrollable Form Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 scrollbar-thin scrollbar-thumb-slate-700 overscroll-contain">
              
              {/* Booking Summary Box */}
              <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-800/60 border border-slate-700/80 grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5 flex items-center gap-1 text-[11px]">
                    <MapPin className="w-3 h-3 text-lime-400" /> Court
                  </span>
                  <span className="font-bold text-white text-xs sm:text-sm truncate block">{bookingDetails.court.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5 flex items-center gap-1 text-[11px]">
                    <Calendar className="w-3 h-3 text-lime-400" /> Date
                  </span>
                  <span className="font-bold text-white text-xs sm:text-sm">
                    {new Date(bookingDetails.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5 flex items-center gap-1 text-[11px]">
                    <Clock className="w-3 h-3 text-lime-400" /> Time
                  </span>
                  <span className="font-bold text-white text-xs sm:text-sm">
                    {formatTime(bookingDetails.startTime)} – {formatTime(bookingDetails.endTime)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5 text-[11px]">Total Amount</span>
                  <span className="font-black text-lime-400 text-sm sm:text-base">₱{bookingDetails.totalAmount.toLocaleString()}</span>
                </div>
              </div>

              {/* Error banner */}
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-200 text-xs sm:text-sm flex items-center gap-2.5 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Client Details Form */}
              <div className="space-y-3.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Player Information</h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Full Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Alex Santos"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-lime-400 text-xs sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Mobile / Contact Number <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 0917 123 4567"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-lime-400 text-xs sm:text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Email Address <span className="text-slate-500 text-[10px]">(Optional)</span>
                    </label>
                    <input
                      type="email"
                      placeholder="alex@example.com"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-lime-400 text-xs sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Special Requests / Equipment <span className="text-slate-500 text-[10px]">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Need 2 rental paddles"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-lime-400 text-xs sm:text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-3.5 pt-2 border-t border-slate-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Payment Option</h4>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('GCASH')}
                    className={`p-3 sm:p-3.5 rounded-xl border flex items-center gap-2.5 sm:gap-3 transition-all cursor-pointer ${
                      paymentMethod === 'GCASH'
                        ? 'bg-blue-950/40 border-blue-500 text-white shadow-lg shadow-blue-500/10'
                        : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-black text-xs flex-shrink-0 ${
                      paymentMethod === 'GCASH' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'
                    }`}>
                      G
                    </div>
                    <div className="text-left min-w-0">
                      <span className="block text-xs sm:text-sm font-bold truncate">GCash QR</span>
                      <span className="block text-[10px] sm:text-[11px] text-slate-400 truncate">Scan & Pay</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CASH')}
                    className={`p-3 sm:p-3.5 rounded-xl border flex items-center gap-2.5 sm:gap-3 transition-all cursor-pointer ${
                      paymentMethod === 'CASH'
                        ? 'bg-emerald-950/40 border-emerald-500 text-white shadow-lg shadow-emerald-500/10'
                        : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      paymentMethod === 'CASH' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-700 text-slate-300'
                    }`}>
                      <Banknote className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                    <div className="text-left min-w-0">
                      <span className="block text-xs sm:text-sm font-bold truncate">Cash</span>
                      <span className="block text-[10px] sm:text-[11px] text-slate-400 truncate">Pay on Venue</span>
                    </div>
                  </button>
                </div>

                {/* GCash Details Box */}
                {paymentMethod === 'GCASH' && (
                  <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-blue-950/20 border border-blue-900/60 space-y-4 animate-in fade-in">
                    <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
                      {/* QR Code Container with Save Option */}
                      <div className="flex flex-col items-center flex-shrink-0">
                        <div className="w-36 h-36 bg-white rounded-xl p-2 flex items-center justify-center shadow-md border border-blue-400/40">
                          {settings.gcashQrUrl && !qrImgError ? (
                            <img
                              src={settings.gcashQrUrl}
                              alt="GCash QR Code"
                              onError={() => setQrImgError(true)}
                              className="w-full h-full object-contain rounded-lg"
                            />
                          ) : (
                            <div className="text-center p-2 text-slate-700">
                              <QrCode className="w-10 h-10 mx-auto text-blue-600 mb-1" />
                              <span className="text-[10px] font-bold block uppercase">{qrImgError ? 'Image Offline' : 'Admin QR'}</span>
                              <span className="text-[9px] text-slate-500 block">Scan to Pay</span>
                            </div>
                          )}
                        </div>

                        {/* Save / Download QR Button */}
                        {settings.gcashQrUrl && (
                          <button
                            type="button"
                            onClick={handleSaveQr}
                            className="mt-2 w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[11px] font-bold shadow-sm transition-colors cursor-pointer"
                            title="Download or save QR to your phone"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Save QR Code</span>
                          </button>
                        )}
                      </div>

                      {/* Account Details & 1-Click Copy */}
                      <div className="space-y-2 w-full text-xs text-center sm:text-left">
                        <div>
                          <span className="text-slate-400 block text-[11px]">GCash Account Name</span>
                          <span className="font-bold text-white text-xs sm:text-sm">{settings.gcashAccountName || 'The Paddle Club'}</span>
                        </div>

                        <div>
                          <span className="text-slate-400 block text-[11px]">GCash Mobile Number</span>
                          <div className="flex items-center justify-center sm:justify-start gap-2 mt-0.5">
                            <span className="font-mono font-bold text-blue-400 text-xs sm:text-sm bg-slate-900/80 px-2 py-0.5 rounded-lg border border-slate-700">
                              {settings.gcashNumber || '0917-888-7235'}
                            </span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(settings.gcashNumber || '0917-888-7235')}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                              title="Copy Number"
                            >
                              {copiedNumber ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>

                        <div>
                          <span className="text-slate-400 block text-[11px]">Amount to Send</span>
                          <span className="font-black text-lime-400 text-base sm:text-lg">₱{bookingDetails.totalAmount.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Mandatory Payment Screenshot Section */}
                    <div className="pt-3 border-t border-blue-900/40 space-y-2">
                      <label className="block text-xs font-semibold text-slate-200">
                        Payment Screenshot / Receipt Proof <span className="text-rose-400">*</span>
                      </label>

                      <label className={`flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-xl transition-all cursor-pointer ${
                        receiptUrl
                          ? 'bg-blue-950/40 border-blue-400/60'
                          : 'bg-slate-900 border-slate-700 hover:border-blue-400/60 hover:bg-slate-850'
                      }`}>
                        <input
                          type="file"
                          accept="image/*"
                          disabled={uploadingReceipt}
                          onChange={handleReceiptUpload}
                          className="hidden"
                        />
                        {uploadingReceipt ? (
                          <div className="flex items-center gap-2 text-xs text-blue-300 py-3">
                            <Upload className="w-4 h-4 animate-bounce" />
                            <span>Uploading screenshot proof...</span>
                          </div>
                        ) : receiptUrl ? (
                          <div className="flex items-center gap-3 w-full">
                            <img
                              src={receiptUrl}
                              alt="Payment proof preview"
                              className="w-14 h-14 object-cover rounded-lg border border-blue-400/40 flex-shrink-0"
                            />
                            <div className="text-left flex-1 min-w-0">
                              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                                <Check className="w-4 h-4 text-emerald-400" /> Screenshot Attached
                              </span>
                              <span className="text-[11px] text-blue-400 hover:underline block mt-0.5">
                                Tap to select a different screenshot
                              </span>
                            </div>
                            <span className="text-xs px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-400 font-semibold border border-blue-500/30 flex-shrink-0">
                              Replace
                            </span>
                          </div>
                        ) : (
                          <div className="text-center py-2">
                            <Upload className="w-6 h-6 mx-auto text-blue-400 mb-1.5" />
                            <span className="text-xs font-bold text-white block">Upload GCash Payment Screenshot</span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              Upload the receipt or confirmation screenshot from your GCash app
                            </span>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>
                )}

                {/* Cash Notice */}
                {paymentMethod === 'CASH' && (
                  <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-emerald-950/20 border border-emerald-900/60 text-xs text-slate-300 space-y-1.5 animate-in fade-in">
                    <div className="flex items-center gap-2 font-bold text-emerald-400 text-xs sm:text-sm">
                      <CheckCircle className="w-4 h-4" /> Instant Slot Reservation
                    </div>
                    <p className="leading-relaxed text-[11px] sm:text-xs">
                      Your court slot will be immediately reserved and guaranteed. Please present your booking confirmation code and pay <strong>₱{bookingDetails.totalAmount.toLocaleString()}</strong> at the court reception desk before starting your match.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Pinned Bottom Submit Button Footer */}
            <div className="flex-shrink-0 p-3.5 sm:p-4 md:px-6 bg-slate-900/95 border-t border-slate-800 z-10">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 sm:py-4 rounded-xl bg-lime-500 hover:bg-lime-400 disabled:opacity-50 text-slate-950 font-black text-sm sm:text-base shadow-xl shadow-lime-500/25 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <span>Reserving Court...</span>
                ) : (
                  <span>Confirm Booking for ₱{bookingDetails.totalAmount.toLocaleString()}</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
