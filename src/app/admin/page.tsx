'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Court, Booking, SystemSettings } from '@/lib/types';
import {
  ShieldCheck,
  Calendar,
  Layers,
  Settings,
  LogOut,
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  QrCode,
  Upload,
  Copy,
  Check,
  Eye,
  RefreshCw,
  Search,
  Filter,
  DollarSign,
  TrendingUp,
  Clock,
  MapPin,
  X,
  Edit2
} from 'lucide-react';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Active Tab: 'bookings' | 'courts' | 'settings'
  const [activeTab, setActiveTab] = useState<'bookings' | 'courts' | 'settings'>('bookings');

  // Data states
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);

  // Filter states for bookings
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourtFilter, setSelectedCourtFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');
  const [selectedDateFilter, setSelectedDateFilter] = useState('');

  // Modals
  const [isAddCourtOpen, setIsAddCourtOpen] = useState(false);
  const [newCourtName, setNewCourtName] = useState('');
  const [newCourtRate, setNewCourtRate] = useState('400');
  const [newCourtSurface, setNewCourtSurface] = useState('Pro Cushion Indoor');
  const [newCourtDesc, setNewCourtDesc] = useState('');
  const [courtSubmitting, setCourtSubmitting] = useState(false);

  // View Receipt Modal
  const [viewReceiptUrl, setViewReceiptUrl] = useState<string | null>(null);

  // Settings form states
  const [settingsQrUrl, setSettingsQrUrl] = useState('');
  const [settingsAccountName, setSettingsAccountName] = useState('');
  const [settingsNumber, setSettingsNumber] = useState('');
  const [settingsPin, setSettingsPin] = useState('');
  const [settingsSavedMsg, setSettingsSavedMsg] = useState('');
  const [uploadingQr, setUploadingQr] = useState(false);
  const [qrImgError, setQrImgError] = useState(false);

  // Check auth cookie/local storage
  const [todayStr, setTodayStr] = useState('');

  useEffect(() => {
    setTodayStr(new Date().toISOString().split('T')[0]);
    const saved = localStorage.getItem('paddle_admin_logged_in');
    if (saved === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  // Fetch data
  const fetchData = async () => {
    try {
      // Fetch courts (all, including inactive)
      const courtsRes = await fetch('/api/courts?all=true');
      const courtsData = await courtsRes.json();
      if (courtsData.success) {
        setCourts(courtsData.courts);
      }

      // Fetch bookings
      const bookingsRes = await fetch('/api/bookings');
      const bookingsData = await bookingsRes.json();
      if (bookingsData.success) {
        setBookings(bookingsData.bookings);
      }

      // Fetch settings
      const settingsRes = await fetch('/api/settings', { cache: 'no-store' });
      const settingsData = await settingsRes.json();
      if (settingsData.success && settingsData.settings) {
        setSettings(settingsData.settings);
        setSettingsQrUrl(settingsData.settings.gcashQrUrl || '');
        setSettingsAccountName(settingsData.settings.gcashAccountName || '');
        setSettingsNumber(settingsData.settings.gcashNumber || '');
      }
    } catch (err) {
      console.error('Failed to fetch admin data:', err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pinInput })
      });
      const data = await res.json();

      if (data.success) {
        setIsAuthenticated(true);
        localStorage.setItem('paddle_admin_logged_in', 'true');
      } else {
        setAuthError(data.error || 'Invalid Admin PIN.');
      }
    } catch (err) {
      console.error(err);
      setAuthError('Connection error. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('paddle_admin_logged_in');
    setPinInput('');
  };

  // Status updates for booking
  const updateBookingStatus = async (
    bookingId: string,
    updates: { bookingStatus?: string; paymentStatus?: string }
  ) => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const data = await res.json();
      if (data.success) {
        setBookings((prev) =>
          prev.map((b) => (b.id === bookingId ? data.booking : b))
        );
      }
    } catch (err) {
      console.error('Failed to update booking status:', err);
    }
  };

  // Delete booking
  const deleteBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel and remove this booking?')) return;
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setBookings((prev) => prev.filter((b) => b.id !== bookingId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Add court
  const handleAddCourt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourtName.trim() || !newCourtRate) return;

    try {
      setCourtSubmitting(true);
      const res = await fetch('/api/courts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCourtName.trim(),
          hourlyRate: Number(newCourtRate),
          surfaceType: newCourtSurface.trim(),
          description: newCourtDesc.trim(),
          isActive: 1
        })
      });
      const data = await res.json();
      if (data.success) {
        setCourts((prev) => [...prev, data.court]);
        setIsAddCourtOpen(false);
        setNewCourtName('');
        setNewCourtRate('400');
        setNewCourtDesc('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCourtSubmitting(false);
    }
  };

  // Delete / Toggle Court
  const handleDeleteCourt = async (courtId: string) => {
    if (!confirm('Are you sure you want to delete this court?')) return;
    try {
      const res = await fetch(`/api/courts/${courtId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setCourts((prev) => prev.filter((c) => c.id !== courtId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleCourtActive = async (court: Court) => {
    const newStatus = court.isActive === 1 ? 0 : 1;
    try {
      const res = await fetch(`/api/courts/${court.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        setCourts((prev) =>
          prev.map((c) => (c.id === court.id ? data.court : c))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Upload Admin QR Code
  const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingQr(true);
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setSettingsQrUrl(data.url);
        setQrImgError(false);
        // Automatically save to database immediately so it is live right away
        const saveRes = await fetch('/api/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gcashQrUrl: data.url })
        });
        const saveData = await saveRes.json();
        if (saveData.success) {
          setSettings(saveData.settings);
          setSettingsSavedMsg('QR Code uploaded and immediately activated on the booking site!');
          setTimeout(() => setSettingsSavedMsg(''), 4000);
        }
      } else {
        alert(data.error || 'Failed to upload QR image.');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to upload image.');
    } finally {
      setUploadingQr(false);
    }
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSavedMsg('');

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gcashQrUrl: settingsQrUrl,
          gcashAccountName: settingsAccountName.trim(),
          gcashNumber: settingsNumber.trim(),
          ...(settingsPin.trim() ? { adminPin: settingsPin.trim() } : {})
        })
      });
      const data = await res.json();
      if (data.success) {
        setSettings(data.settings);
        setSettingsPin('');
        setSettingsSavedMsg('Settings saved successfully!');
        setTimeout(() => setSettingsSavedMsg(''), 3000);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to update settings');
    }
  };

  // Format 24h to 12h
  const formatTime = (time: string) => {
    if (!time) return '';
    const [h] = time.split(':');
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    return `${displayHour}:00 ${ampm}`;
  };

  // Filtered Bookings
  const filteredBookings = bookings.filter((b) => {
    const matchesSearch =
      !searchQuery ||
      b.bookingCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.clientPhone.includes(searchQuery) ||
      (b.gcashReference && b.gcashReference.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCourt = selectedCourtFilter === 'ALL' || b.courtId === selectedCourtFilter;
    const matchesStatus = selectedStatusFilter === 'ALL' || b.bookingStatus === selectedStatusFilter;
    const matchesDate = !selectedDateFilter || b.bookingDate === selectedDateFilter;

    return matchesSearch && matchesCourt && matchesStatus && matchesDate;
  });

  // Calculate statistics
  const todayBookingsCount = todayStr ? bookings.filter((b) => b.bookingDate === todayStr).length : 0;
  const pendingPaymentCount = bookings.filter((b) => b.paymentStatus === 'VERIFICATION_PENDING' || b.paymentStatus === 'UNPAID').length;
  const totalRevenue = bookings
    .filter((b) => b.bookingStatus !== 'CANCELLED')
    .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

  // If Not Authenticated, show Login Form
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl animate-in fade-in zoom-in-95">
          <div className="w-12 h-12 bg-lime-500/10 border border-lime-500/30 text-lime-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-6 h-6" />
          </div>

          <h2 className="text-2xl font-black text-white text-center">Admin Portal</h2>
          <p className="text-xs text-slate-400 text-center mt-1">
            The Paddle Management Dashboard
          </p>

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Admin Passcode / PIN
              </label>
              <input
                type="password"
                required
                autoFocus
                placeholder="Enter PIN (Default: admin123)"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-lime-400 text-center tracking-widest text-base"
              />
            </div>

            {authError && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-3.5 rounded-xl bg-lime-500 hover:bg-lime-400 text-slate-950 font-black text-sm shadow-lg shadow-lime-500/20 transition-all cursor-pointer"
            >
              {authLoading ? 'Verifying...' : 'Unlock Dashboard'}
            </button>

            <div className="text-center pt-2">
              <Link href="/" className="text-xs text-slate-400 hover:text-white transition-colors">
                ← Back to Booking Page
              </Link>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Admin Dashboard
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Admin Bar */}
      <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 text-white hover:text-lime-400 transition-colors">
              <div className="w-9 h-9 rounded-lg bg-lime-500 flex items-center justify-center text-slate-950 font-black">
                P
              </div>
              <span className="font-extrabold text-lg tracking-tight">The Paddle Admin</span>
            </Link>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold hidden sm:inline-block">
              Authorized
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            >
              View Client Site
            </Link>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-400 hover:text-rose-300 bg-rose-950/20 hover:bg-rose-950/40 rounded-lg border border-rose-900/40 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Total Bookings</span>
              <Calendar className="w-4 h-4 text-lime-400" />
            </div>
            <span className="text-2xl font-black text-white mt-2 block">{bookings.length}</span>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Today&apos;s Bookings</span>
              <Clock className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-2xl font-black text-white mt-2 block">{todayBookingsCount}</span>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Pending Payments</span>
              <AlertCircle className="w-4 h-4 text-amber-400" />
            </div>
            <span className="text-2xl font-black text-amber-400 mt-2 block">{pendingPaymentCount}</span>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Total Revenue</span>
              <DollarSign className="w-4 h-4 text-teal-400" />
            </div>
            <span className="text-2xl font-black text-lime-400 mt-2 block">
              ₱{totalRevenue.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 gap-2 mb-6">
          <button
            onClick={() => setActiveTab('bookings')}
            className={`px-5 py-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'bookings'
                ? 'border-lime-400 text-lime-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Bookings & Calendar ({bookings.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('courts')}
            className={`px-5 py-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'courts'
                ? 'border-lime-400 text-lime-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Manage Courts ({courts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-5 py-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'settings'
                ? 'border-lime-400 text-lime-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>GCash QR & Settings</span>
          </button>
        </div>

        {/* TAB 1: BOOKINGS */}
        {activeTab === 'bookings' && (
          <div className="space-y-4">
            {/* Filter toolbar */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap gap-3 items-center justify-between">
              <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
                {/* Search query */}
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search Code, Name, Phone, Ref..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-lime-400"
                  />
                </div>

                {/* Court filter */}
                <select
                  value={selectedCourtFilter}
                  onChange={(e) => setSelectedCourtFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-lime-400"
                >
                  <option value="ALL">All Courts</option>
                  {courts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>

                {/* Status filter */}
                <select
                  value={selectedStatusFilter}
                  onChange={(e) => setSelectedStatusFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-lime-400"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="PENDING">Pending</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>

                {/* Date filter */}
                <input
                  type="date"
                  value={selectedDateFilter}
                  onChange={(e) => setSelectedDateFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-lime-400"
                />

                {selectedDateFilter && (
                  <button
                    onClick={() => setSelectedDateFilter('')}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    Clear Date
                  </button>
                )}
              </div>

              <button
                onClick={fetchData}
                className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors cursor-pointer"
                title="Refresh Table"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {/* Bookings Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-850 border-b border-slate-800 text-slate-400 uppercase font-bold tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">Booking Code</th>
                      <th className="py-3.5 px-4">Player Details</th>
                      <th className="py-3.5 px-4">Court</th>
                      <th className="py-3.5 px-4">Date & Time</th>
                      <th className="py-3.5 px-4">Amount</th>
                      <th className="py-3.5 px-4">Payment</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filteredBookings.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-500">
                          No bookings found matching current filters.
                        </td>
                      </tr>
                    ) : (
                      filteredBookings.map((b) => (
                        <tr key={b.id} className="hover:bg-slate-850/50 transition-colors">
                          {/* Code */}
                          <td className="py-3.5 px-4 font-mono font-bold text-lime-400 whitespace-nowrap">
                            {b.bookingCode}
                          </td>

                          {/* Player */}
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-white block">{b.clientName}</span>
                            <span className="text-slate-400 block text-[11px]">{b.clientPhone}</span>
                            {b.clientEmail && (
                              <span className="text-slate-500 block text-[10px]">{b.clientEmail}</span>
                            )}
                          </td>

                          {/* Court */}
                          <td className="py-3.5 px-4 font-medium text-slate-200">
                            {b.courtName || b.courtId}
                          </td>

                          {/* Date & Time */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="font-semibold text-white block">
                              {new Date(b.bookingDate).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </span>
                            <span className="text-slate-400 block text-[11px]">
                              {formatTime(b.startTime)} – {formatTime(b.endTime)}
                            </span>
                          </td>

                          {/* Amount */}
                          <td className="py-3.5 px-4 font-black text-lime-400 whitespace-nowrap">
                            ₱{b.totalAmount.toLocaleString()}
                          </td>

                          {/* Payment */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              b.paymentMethod === 'GCASH' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            }`}>
                              {b.paymentMethod}
                            </span>
                            {b.gcashReference && (
                              <span className="block font-mono text-[10px] text-slate-400 mt-0.5">
                                Ref: {b.gcashReference}
                              </span>
                            )}
                            {b.receiptUrl && (
                              <button
                                onClick={() => setViewReceiptUrl(b.receiptUrl || null)}
                                className="mt-1 flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
                              >
                                <Eye className="w-3 h-3" /> View Proof
                              </button>
                            )}
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              b.bookingStatus === 'CONFIRMED'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : b.bookingStatus === 'CANCELLED'
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            }`}>
                              {b.bookingStatus}
                            </span>
                            <span className="block text-[10px] text-slate-500 mt-0.5">
                              {b.paymentStatus === 'PAID' ? 'Paid' : b.paymentStatus === 'VERIFICATION_PENDING' ? 'Pending Verif.' : 'Unpaid'}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {b.bookingStatus !== 'CONFIRMED' && (
                                <button
                                  onClick={() => updateBookingStatus(b.id, { bookingStatus: 'CONFIRMED' })}
                                  className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 text-[10px] font-bold transition-colors cursor-pointer"
                                  title="Confirm Reservation"
                                >
                                  Confirm
                                </button>
                              )}

                              {b.paymentStatus !== 'PAID' && (
                                <button
                                  onClick={() => updateBookingStatus(b.id, { paymentStatus: 'PAID' })}
                                  className="px-2 py-1 rounded bg-lime-500/20 text-lime-400 hover:bg-lime-500 hover:text-slate-950 text-[10px] font-bold transition-colors cursor-pointer"
                                  title="Mark Payment as Received"
                                >
                                  Mark Paid
                                </button>
                              )}

                              <button
                                onClick={() => deleteBooking(b.id)}
                                className="p-1 rounded text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 transition-colors cursor-pointer"
                                title="Remove Booking"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: COURTS MANAGEMENT */}
        {activeTab === 'courts' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Pickleball Courts</h3>
                <p className="text-xs text-slate-400">Add, edit pricing, or remove courts from the booking schedule.</p>
              </div>

              <button
                onClick={() => setIsAddCourtOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-lime-500 hover:bg-lime-400 text-slate-950 font-bold text-xs shadow-md shadow-lime-500/20 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Add New Court</span>
              </button>
            </div>

            {/* Courts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {courts.map((court) => (
                <div
                  key={court.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                        {court.surfaceType}
                      </span>

                      <button
                        onClick={() => handleToggleCourtActive(court)}
                        className={`text-xs px-2.5 py-0.5 rounded-full font-bold cursor-pointer transition-colors ${
                          court.isActive === 1
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}
                        title="Click to toggle availability"
                      >
                        {court.isActive === 1 ? 'Active' : 'Disabled'}
                      </button>
                    </div>

                    <h4 className="text-lg font-bold text-white">{court.name}</h4>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{court.description}</p>

                    <div className="mt-4 pt-4 border-t border-slate-800 flex items-baseline justify-between">
                      <span className="text-xs text-slate-400">Hourly Rate</span>
                      <span className="text-xl font-black text-lime-400">₱{court.hourlyRate}/hr</span>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
                    <button
                      onClick={() => handleToggleCourtActive(court)}
                      className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
                    >
                      {court.isActive === 1 ? 'Disable from booking' : 'Enable court'}
                    </button>

                    <button
                      onClick={() => handleDeleteCourt(court.id)}
                      className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 px-2 py-1 rounded bg-rose-950/20 hover:bg-rose-950/40 border border-rose-900/40 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: GCASH QR & SETTINGS */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
            <h3 className="text-xl font-bold text-white">Payment & Facility Settings</h3>
            <p className="text-xs text-slate-400 mt-1 mb-6">
              Upload your official GCash QR Code image so players can easily scan to pay online.
            </p>

            <form onSubmit={handleSaveSettings} className="space-y-6">
              {/* QR Code Upload Section */}
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                  GCash QR Code Image
                </label>

                <div className="flex flex-col sm:flex-row items-center gap-6">
                  {/* QR Preview Box */}
                  <div className="w-40 h-40 bg-white rounded-2xl p-2 flex items-center justify-center flex-shrink-0 shadow-lg border border-slate-700">
                    {settingsQrUrl && !qrImgError ? (
                      <img
                        src={settingsQrUrl}
                        alt="Admin GCash QR"
                        onError={() => setQrImgError(true)}
                        className="w-full h-full object-contain rounded-xl"
                      />
                    ) : (
                      <div className="text-center p-2 text-slate-700">
                        <QrCode className="w-12 h-12 mx-auto text-blue-600 mb-1" />
                        <span className="text-[11px] font-bold block">{qrImgError ? 'Image Not Found' : 'No QR Uploaded'}</span>
                        <span className="text-[9px] text-slate-500 block">Click upload below</span>
                      </div>
                    )}
                  </div>

                  {/* Upload button and tips */}
                  <div className="space-y-3 w-full">
                    <label className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/20 cursor-pointer transition-colors w-full sm:w-auto">
                      <Upload className="w-4 h-4" />
                      <span>{uploadingQr ? 'Uploading QR...' : 'Upload QR Code'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={uploadingQr}
                        onChange={handleQrUpload}
                        className="hidden"
                      />
                    </label>

                    <p className="text-xs text-slate-400 leading-relaxed">
                      Download your merchant QR code from your GCash app and upload it here (JPG, PNG, or WebP). Clients will see this exact QR code during checkout.
                    </p>
                  </div>
                </div>
              </div>

              {/* GCash Account Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    GCash Account Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. The Paddle Pickleball Club"
                    value={settingsAccountName}
                    onChange={(e) => setSettingsAccountName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-lime-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    GCash Mobile Number
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 0917-888-7235"
                    value={settingsNumber}
                    onChange={(e) => setSettingsNumber(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-lime-400 font-mono"
                  />
                </div>
              </div>

              {/* Admin Security */}
              <div className="pt-4 border-t border-slate-800">
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Change Admin PIN <span className="text-slate-500 text-[10px]">(Leave blank to keep current PIN)</span>
                </label>
                <input
                  type="password"
                  placeholder="New Admin PIN"
                  value={settingsPin}
                  onChange={(e) => setSettingsPin(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-lime-400 tracking-wider"
                />
              </div>

              {settingsSavedMsg && (
                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>{settingsSavedMsg}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-lime-500 hover:bg-lime-400 text-slate-950 font-black text-sm shadow-xl shadow-lime-500/25 transition-all cursor-pointer"
              >
                Save Settings
              </button>
            </form>
          </div>
        )}
      </main>

      {/* Add Court Modal */}
      {isAddCourtOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-sm overflow-hidden">
          <div className="relative w-full max-w-md max-h-[92dvh] bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex-shrink-0 flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-800">
              <h3 className="text-base sm:text-lg font-bold text-white">Add New Pickleball Court</h3>
              <button
                onClick={() => setIsAddCourtOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCourt} className="flex-1 overflow-y-auto mt-4 space-y-4 pr-1 scrollbar-thin scrollbar-thumb-slate-700">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Court Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Court 4 (Indoor Blue)"
                  value={newCourtName}
                  onChange={(e) => setNewCourtName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-lime-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Hourly Rate (₱)</label>
                <input
                  type="number"
                  required
                  min="0"
                  placeholder="400"
                  value={newCourtRate}
                  onChange={(e) => setNewCourtRate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-lime-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Surface Type</label>
                <input
                  type="text"
                  placeholder="e.g. Championship Acrylic, Indoor Cushion"
                  value={newCourtSurface}
                  onChange={(e) => setNewCourtSurface(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-lime-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Court details, lighting, or special features..."
                  value={newCourtDesc}
                  onChange={(e) => setNewCourtDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-lime-400"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddCourtOpen(false)}
                  className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-750 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={courtSubmitting}
                  className="flex-1 py-3 rounded-xl bg-lime-500 hover:bg-lime-400 text-slate-950 font-black text-xs shadow-lg shadow-lime-500/20 transition-all cursor-pointer"
                >
                  {courtSubmitting ? 'Creating...' : 'Create Court'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Receipt Screenshot Modal */}
      {viewReceiptUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="relative max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white">GCash Payment Proof</h3>
              <button
                onClick={() => setViewReceiptUrl(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mt-4 max-h-[70vh] overflow-y-auto rounded-xl bg-black p-2 flex items-center justify-center">
              <img
                src={viewReceiptUrl}
                alt="Payment receipt proof"
                className="max-h-[65vh] w-auto object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
