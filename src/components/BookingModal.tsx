'use client';

import React, { useState, useEffect } from 'react';
import { Court, Booking, SystemSettings } from '@/lib/types';
import { siteConfig } from '@/lib/config';
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
    bookingType?: 'STANDARD' | 'OPEN_PLAY';
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
    gcashAccountName: siteConfig.brandName,
    gcashNumber: siteConfig.contactPhone,
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
            setQrImgError(false);
          }
        })
        .catch((err) => console.error('Failed to load settings:', err));
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
    if (hour === 24 || hour === 0) return '12:00 AM';
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
        setErrorMsg(data.error || 'Failed to upload receipt image.');
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
    const a = document.createElement('a');
    a.href = settings.gcashQrUrl;
    a.download = `ThePaddle-GCash-QR.png`;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!clientName.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (!clientPhone.trim()) {
      setErrorMsg('Please enter your contact number.');
      return;
    }
    if (uploadingReceipt) {
      setErrorMsg('Your receipt screenshot is still uploading. Please wait a moment.');
      return;
    }
    if (paymentMethod === 'GCASH' && !receiptUrl) {
      setErrorMsg('Please upload your GCash payment screenshot receipt to confirm your reservation.');
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
          notes: notes.trim(),
          bookingType: bookingDetails.bookingType || 'STANDARD'
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

  const isOpenPlay = bookingDetails.bookingType === 'OPEN_PLAY';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/75 dark:bg-slate-950/85 backdrop-blur-sm overflow-hidden transition-colors">
      {/* Modal Container */}
      <div className="relative w-full max-w-2xl max-h-[94dvh] sm:max-h-[90dvh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 transition-colors">
        
        {/* Sticky Header */}
        <div className="flex-shrink-0 px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm z-10">
          <div>
            <h3 className="text-base sm:text-xl font-black text-slate-950 dark:text-white">
              {confirmedBooking
                ? isOpenPlay ? 'Open Play Pass Confirmed!' : 'Reservation Confirmed!'
                : isOpenPlay ? 'Morning Open Play Pass' : 'Complete Your Reservation'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-[220px] sm:max-w-none">
              {siteConfig.brandName} • {isOpenPlay ? 'Unlimited Morning Play (5:00 AM – 11:00 AM)' : bookingDetails.court.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* If booking is confirmed, show Ticket view inside scrollable area */}
        {confirmedBooking ? (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
            <BookingTicket booking={confirmedBooking} onClose={onClose} />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Scrollable Form Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 overscroll-contain">
              
              {/* Booking Summary Box */}
              <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 text-xs">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block mb-0.5 flex items-center gap-1 text-[11px]">
                    <MapPin className="w-3 h-3 text-lime-600 dark:text-lime-400" /> {isOpenPlay ? 'Pass' : 'Court'}
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm truncate block">
                    {isOpenPlay ? 'All Courts (Open Play)' : bookingDetails.court.name}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block mb-0.5 flex items-center gap-1 text-[11px]">
                    <Calendar className="w-3 h-3 text-lime-600 dark:text-lime-400" /> Date
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                    {new Date(bookingDetails.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block mb-0.5 flex items-center gap-1 text-[11px]">
                    <Clock className="w-3 h-3 text-lime-600 dark:text-lime-400" /> Time
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                    {isOpenPlay ? '5:00 AM – 11:00 AM' : `${formatTime(bookingDetails.startTime)} – ${formatTime(bookingDetails.endTime)}`}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block mb-0.5 text-[11px]">Total Amount</span>
                  <span className="font-black text-lime-600 dark:text-lime-400 text-sm sm:text-base">
                    ₱{bookingDetails.totalAmount.toLocaleString()} {isOpenPlay ? '(1 Pass)' : ''}
                  </span>
                </div>
              </div>

              {/* Error banner */}
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/80 text-rose-700 dark:text-rose-200 text-xs sm:text-sm flex items-center gap-2.5 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Client Details Form */}
              <div className="space-y-3 sm:space-y-3.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Player Information</h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Alex Santos"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-lime-500 text-xs sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Mobile / Contact Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 0917 123 4567"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-lime-500 text-xs sm:text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Email Address <span className="text-slate-400 text-[10px]">(Optional)</span>
                    </label>
                    <input
                      type="email"
                      placeholder="alex@example.com"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-lime-500 text-xs sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Special Requests <span className="text-slate-400 text-[10px]">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Need 2 rental paddles"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-lime-500 text-xs sm:text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-3 sm:space-y-3.5 pt-2 border-t border-slate-200 dark:border-slate-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Payment Option</h4>

                <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('GCASH')}
                    className={`p-3 sm:p-3.5 rounded-xl border flex items-center gap-2 sm:gap-3 transition-all cursor-pointer ${
                      paymentMethod === 'GCASH'
                        ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 ring-2 ring-blue-500/30'
                        : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-xs flex-shrink-0">
                      G
                    </div>
                    <div className="text-left min-w-0">
                      <span className="block text-xs sm:text-sm font-bold text-slate-900 dark:text-white">GCash</span>
                      <span className="block text-[10px] text-slate-500 dark:text-slate-400">Scan QR Code</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CASH')}
                    className={`p-3 sm:p-3.5 rounded-xl border flex items-center gap-2 sm:gap-3 transition-all cursor-pointer ${
                      paymentMethod === 'CASH'
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/30'
                        : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white flex-shrink-0">
                      <Banknote className="w-4 h-4" />
                    </div>
                    <div className="text-left min-w-0">
                      <span className="block text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Cash</span>
                      <span className="block text-[10px] text-slate-500 dark:text-slate-400">Pay at Desk</span>
                    </div>
                  </button>
                </div>

                {/* GCash Details Container */}
                {paymentMethod === 'GCASH' && (
                  <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 space-y-3.5 animate-in fade-in">
                    <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
                      {/* QR Code Container */}
                      <div className="flex flex-col items-center flex-shrink-0">
                        <div className="w-32 h-32 sm:w-36 sm:h-36 bg-white rounded-xl p-2 flex items-center justify-center shadow-md border border-blue-300">
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

                        {settings.gcashQrUrl && (
                          <button
                            type="button"
                            onClick={handleSaveQr}
                            className="mt-2 w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[11px] font-bold shadow-sm transition-colors cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Save QR</span>
                          </button>
                        )}
                      </div>

                      {/* Account Details */}
                      <div className="space-y-2 w-full text-xs text-center sm:text-left">
                        <div>
                          <span className="text-slate-500 dark:text-slate-400 block text-[11px]">GCash Account Name</span>
                          <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">{settings.gcashAccountName || siteConfig.brandName}</span>
                        </div>

                        <div>
                          <span className="text-slate-500 dark:text-slate-400 block text-[11px]">GCash Mobile Number</span>
                          <div className="flex items-center justify-center sm:justify-start gap-2 mt-0.5">
                            <span className="font-mono font-bold text-blue-700 dark:text-blue-400 text-xs sm:text-sm bg-white dark:bg-slate-900/80 px-2 py-0.5 rounded-lg border border-slate-300 dark:border-slate-700">
                              {settings.gcashNumber || '0917-888-7235'}
                            </span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(settings.gcashNumber || '0917-888-7235')}
                              className="p-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer border border-slate-300 dark:border-slate-700"
                            >
                              {copiedNumber ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>

                        <div className="p-2 sm:p-2.5 rounded-lg bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400">
                          Scan QR or send <strong>₱{bookingDetails.totalAmount.toLocaleString()}</strong> to the number above, then upload your receipt below.
                        </div>
                      </div>
                    </div>

                    {/* Receipt Screenshot Upload */}
                    <div className="pt-2">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                          Payment Screenshot Receipt <span className="text-rose-500 font-black">*</span>
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          receiptUrl
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800'
                            : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border-rose-300 dark:border-rose-800'
                        }`}>
                          {receiptUrl ? '✓ Attached' : 'Required'}
                        </span>
                      </div>
                      <label className={`block w-full border-2 border-dashed rounded-xl p-3 cursor-pointer transition-all ${
                        receiptUrl
                          ? 'border-emerald-500/80 bg-emerald-50/30 dark:bg-emerald-950/20'
                          : errorMsg.includes('receipt')
                            ? 'border-rose-500 bg-rose-50/60 dark:bg-rose-950/30 ring-2 ring-rose-500/30'
                            : 'border-blue-400/80 dark:border-blue-700/80 hover:border-blue-500 bg-white dark:bg-slate-900/60'
                      }`}>
                        <input
                          type="file"
                          accept="image/*"
                          disabled={uploadingReceipt}
                          onChange={handleReceiptUpload}
                          className="hidden"
                        />
                        {uploadingReceipt ? (
                          <div className="flex items-center justify-center gap-2 text-xs text-blue-600 dark:text-blue-300 py-2">
                            <Upload className="w-4 h-4 animate-bounce" />
                            <span className="font-semibold">Uploading screenshot proof...</span>
                          </div>
                        ) : receiptUrl ? (
                          <div className="flex items-center gap-3 w-full">
                            <img
                              src={receiptUrl}
                              alt="Payment proof preview"
                              className="w-12 h-12 object-cover rounded-lg border border-emerald-400 flex-shrink-0 shadow-sm"
                            />
                            <div className="text-left flex-1 min-w-0">
                              <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                <Check className="w-4 h-4 text-emerald-500" /> Receipt Proof Attached
                              </span>
                              <span className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline block mt-0.5 font-medium">
                                Tap here to replace image
                              </span>
                            </div>
                            <span className="text-xs px-2.5 py-1 rounded-lg bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 font-semibold border border-blue-300 dark:border-blue-500/30 flex-shrink-0">
                              Change
                            </span>
                          </div>
                        ) : (
                          <div className="text-center py-2">
                            <div className="w-9 h-9 mx-auto rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-1.5">
                              <Upload className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-bold text-slate-900 dark:text-white block">
                              Upload Payment Screenshot <span className="text-rose-500">*</span>
                            </span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                              Tap to select the confirmation or transaction receipt from your GCash app
                            </span>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>
                )}

                {/* Cash Notice */}
                {paymentMethod === 'CASH' && (
                  <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/60 text-xs text-slate-700 dark:text-slate-300 space-y-1.5 animate-in fade-in">
                    <div className="flex items-center gap-2 font-bold text-emerald-700 dark:text-emerald-400 text-xs sm:text-sm">
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
            <div className="flex-shrink-0 p-3 sm:p-4 md:px-6 bg-white/95 dark:bg-slate-900/95 border-t border-slate-200 dark:border-slate-800 z-10">
              <button
                type="submit"
                disabled={submitting || uploadingReceipt}
                className={`w-full py-3 sm:py-3.5 rounded-xl font-black text-xs sm:text-sm md:text-base shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  uploadingReceipt
                    ? 'bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-300 cursor-wait shadow-none'
                    : paymentMethod === 'GCASH' && !receiptUrl
                      ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20'
                      : 'bg-lime-500 hover:bg-lime-400 text-slate-950 shadow-lime-500/25'
                }`}
              >
                {submitting ? (
                  <span>Reserving Court...</span>
                ) : uploadingReceipt ? (
                  <span>Uploading Receipt Proof...</span>
                ) : paymentMethod === 'GCASH' && !receiptUrl ? (
                  <span className="flex items-center gap-1.5">
                    <Upload className="w-4 h-4" /> Upload Receipt to Confirm Reservation
                  </span>
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
