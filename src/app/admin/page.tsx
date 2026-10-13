'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Court, Booking, SystemSettings, Product, PosOrder, PricingRule, parsePricingRules } from '@/lib/types';

const HOUR_OPTIONS = [
  { value: '06:00', label: '6:00 AM' },
  { value: '07:00', label: '7:00 AM' },
  { value: '08:00', label: '8:00 AM' },
  { value: '09:00', label: '9:00 AM' },
  { value: '10:00', label: '10:00 AM' },
  { value: '11:00', label: '11:00 AM' },
  { value: '12:00', label: '12:00 PM (Noon)' },
  { value: '13:00', label: '1:00 PM' },
  { value: '14:00', label: '2:00 PM' },
  { value: '15:00', label: '3:00 PM' },
  { value: '16:00', label: '4:00 PM' },
  { value: '17:00', label: '5:00 PM' },
  { value: '18:00', label: '6:00 PM' },
  { value: '19:00', label: '7:00 PM' },
  { value: '20:00', label: '8:00 PM' },
  { value: '21:00', label: '9:00 PM' },
  { value: '22:00', label: '10:00 PM' },
  { value: '23:00', label: '11:00 PM' },
  { value: '00:00', label: '12:00 AM (Midnight)' },
  { value: '01:00', label: '1:00 AM' },
  { value: '02:00', label: '2:00 AM' },
  { value: '03:00', label: '3:00 AM' },
  { value: '04:00', label: '4:00 AM' },
  { value: '05:00', label: '5:00 AM' },
];
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
  Edit2,
  Sun,
  Moon,
  Bell,
  Volume2,
  VolumeX,
  FileCheck,
  Receipt,
  ExternalLink,
  ZoomIn,
  Info,
  ShoppingBag,
  BarChart3,
  Minus,
  ShoppingCart,
  Package,
  ArrowUpRight,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

export default function AdminPage() {
  const { theme, toggleTheme } = useTheme();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Active Tab: 'bookings' | 'proofs' | 'store' | 'courts' | 'settings'
  const [activeTab, setActiveTab] = useState<'bookings' | 'proofs' | 'store' | 'courts' | 'settings'>('bookings');

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
  const [newCourtPricingRules, setNewCourtPricingRules] = useState<PricingRule[]>([]);
  const [courtSubmitting, setCourtSubmitting] = useState(false);

  // Edit Court Modal
  const [editingCourt, setEditingCourt] = useState<Court | null>(null);
  const [editCourtName, setEditCourtName] = useState('');
  const [editCourtRate, setEditCourtRate] = useState('');
  const [editCourtSurface, setEditCourtSurface] = useState('');
  const [editCourtDesc, setEditCourtDesc] = useState('');
  const [editCourtPricingRules, setEditCourtPricingRules] = useState<PricingRule[]>([]);
  const [editCourtSubmitting, setEditCourtSubmitting] = useState(false);

  // View Receipt Modal
  const [viewReceiptUrl, setViewReceiptUrl] = useState<string | null>(null);

  // Dedicated Payment Proof Verification Center states
  const [proofFilter, setProofFilter] = useState<'ALL' | 'PENDING' | 'PAID' | 'CANCELLED'>('PENDING');
  const [verifyingBooking, setVerifyingBooking] = useState<Booking | null>(null);
  const [proofActionLoading, setProofActionLoading] = useState(false);
  const [proofNotes, setProofNotes] = useState('');
  const [copiedRef, setCopiedRef] = useState(false);

  // Store, POS & Inventory states
  const [products, setProducts] = useState<Product[]>([]);
  const [posOrders, setPosOrders] = useState<PosOrder[]>([]);
  const [storeSubTab, setStoreSubTab] = useState<'pos' | 'inventory' | 'history'>('pos');
  const [posCategoryFilter, setPosCategoryFilter] = useState<string>('ALL');
  const [posSearchQuery, setPosSearchQuery] = useState('');
  
  // POS Cart State
  const [cart, setCart] = useState<Array<{ product: Product; quantity: number }>>([]);
  const [posPaymentMethod, setPosPaymentMethod] = useState<'CASH' | 'GCASH'>('CASH');
  const [posCashTendered, setPosCashTendered] = useState<string>('');
  const [posGcashRef, setPosGcashRef] = useState('');
  const [posSelectedBookingId, setPosSelectedBookingId] = useState('');
  const [posCheckoutLoading, setPosCheckoutLoading] = useState(false);
  const [lastCheckoutOrder, setLastCheckoutOrder] = useState<PosOrder | null>(null);

  // Product Add / Edit Modal states
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [prodFormName, setProdFormName] = useState('');
  const [prodFormCategory, setProdFormCategory] = useState<'DRINKS' | 'BALLS_GEAR' | 'RENTALS' | 'SNACKS' | 'OTHER'>('DRINKS');
  const [prodFormPrice, setProdFormPrice] = useState('');
  const [prodFormCostPrice, setProdFormCostPrice] = useState('');
  const [prodFormStock, setProdFormStock] = useState('20');
  const [prodFormLowStock, setProdFormLowStock] = useState('5');
  const [productSubmitting, setProductSubmitting] = useState(false);

  // Settings form states
  const [settingsQrUrl, setSettingsQrUrl] = useState('');
  const [settingsAccountName, setSettingsAccountName] = useState('');
  const [settingsNumber, setSettingsNumber] = useState('');
  const [settingsOpenTime, setSettingsOpenTime] = useState('06:00');
  const [settingsCloseTime, setSettingsCloseTime] = useState('22:00');
  const [settingsPin, setSettingsPin] = useState('');
  const [settingsSavedMsg, setSettingsSavedMsg] = useState('');
  const [uploadingQr, setUploadingQr] = useState(false);
  const [qrImgError, setQrImgError] = useState(false);

  // Financial Analytics & Reporting states
  const [timeFilter, setTimeFilter] = useState<'TODAY' | 'WEEK' | 'MONTH' | 'ALL'>('TODAY');
  const [isAnalyticsExpanded, setIsAnalyticsExpanded] = useState<boolean>(true);
  const [currentDate, setCurrentDate] = useState<Date | null>(null);

  // Check auth cookie/local storage
  const [todayStr, setTodayStr] = useState('');
  const [lastSynced, setLastSynced] = useState<string>('');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [newBookingAlert, setNewBookingAlert] = useState<Booking | null>(null);

  // Play subtle chime using Web Audio API (zero external assets needed)
  const playChime = () => {
    try {
      if (typeof window === 'undefined') return;
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      const now = ctx.currentTime;
      // High chime tone
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now); // D5
      osc1.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5
      gain1.gain.setValueAtTime(0.18, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.5);

      // Harmony tone
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.1);
      osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.3); // D6
      gain2.gain.setValueAtTime(0.15, now + 0.1);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.1);
      osc2.stop(now + 0.6);
    } catch (e) {
      console.warn('Audio chime note failed:', e);
    }
  };

  // Helper to format local date YYYY-MM-DD (immune to UTC date shift)
  const getLocalDateStr = (d: Date = new Date()) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    const today = new Date();
    setCurrentDate(today);
    setTodayStr(getLocalDateStr(today));
    const saved = localStorage.getItem('paddle_admin_logged_in');
    if (saved === 'true') {
      setIsAuthenticated(true);
    }
    const savedSound = localStorage.getItem('paddle_admin_sound');
    if (savedSound !== null) {
      setSoundEnabled(savedSound === 'true');
    }
  }, []);

  const toggleSound = () => {
    setSoundEnabled((prev) => {
      const next = !prev;
      localStorage.setItem('paddle_admin_sound', String(next));
      if (next) playChime();
      return next;
    });
  };

  // Fetch data with silent auto-refresh capability
  const fetchData = async (isBackground = false) => {
    try {
      if (!isBackground) setIsSyncing(true);

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
        setBookings((prevBookings) => {
          const freshList: Booking[] = bookingsData.bookings || [];
          
          // If running in background and we have previous bookings, detect brand-new bookings
          if (isBackground && prevBookings.length > 0) {
            const prevIds = new Set(prevBookings.map((b) => b.id));
            const newArrivals = freshList.filter((b) => !prevIds.has(b.id) && b.bookingStatus !== 'CANCELLED');

            if (newArrivals.length > 0) {
              const latest = newArrivals[0];
              setNewBookingAlert(latest);
              if (soundEnabled) {
                playChime();
              }
              // Automatically hide toast after 8 seconds
              setTimeout(() => {
                setNewBookingAlert((curr) => (curr?.id === latest.id ? null : curr));
              }, 8000);
            }
          }
          return freshList;
        });
      }

      // Fetch settings (only update editable input state if NOT background polling, so user inputs are never overwritten/reverted while typing or selecting)
      if (!isBackground) {
        const settingsRes = await fetch('/api/settings', { cache: 'no-store' });
        const settingsData = await settingsRes.json();
        if (settingsData.success && settingsData.settings) {
          setSettings(settingsData.settings);
          setSettingsQrUrl(settingsData.settings.gcashQrUrl || '');
          setSettingsAccountName(settingsData.settings.gcashAccountName || '');
          setSettingsNumber(settingsData.settings.gcashNumber || '');
          setSettingsOpenTime(settingsData.settings.courtOpenTime || '06:00');
          setSettingsCloseTime(settingsData.settings.courtCloseTime || '22:00');
        }
      }

      // Fetch products
      const productsRes = await fetch('/api/products?all=true');
      const productsData = await productsRes.json();
      if (productsData.success) {
        setProducts(productsData.products || []);
      }

      // Fetch POS orders
      const posRes = await fetch('/api/pos/orders');
      const posData = await posRes.json();
      if (posData.success) {
        setPosOrders(posData.orders || []);
      }

      setLastSynced(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Failed to fetch admin data:', err);
    } finally {
      if (!isBackground) setIsSyncing(false);
    }
  };

  // Initial fetch on login
  useEffect(() => {
    if (isAuthenticated) {
      fetchData(false);
    }
  }, [isAuthenticated]);

  // Real-Time Background Polling: auto-refresh bookings every 4.5 seconds
  useEffect(() => {
    if (!isAuthenticated) return;

    const intervalId = setInterval(() => {
      // Don't poll aggressively if the window/tab is completely hidden
      if (typeof document !== 'undefined' && document.hidden) return;
      fetchData(true);
    }, 4500);

    // Refresh immediately whenever user tabs back to the Admin dashboard
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchData(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAuthenticated, soundEnabled]);

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

  // Handle Logout
  const handleLogout = () => {
    localStorage.removeItem('paddle_admin_logged_in');
    setIsAuthenticated(false);
  };

  // Update Booking Status
  const updateBookingStatus = async (
    bookingId: string,
    updates: {
      bookingStatus?: 'CONFIRMED' | 'CANCELLED';
      paymentStatus?: 'PAID' | 'UNPAID' | 'VERIFICATION_PENDING';
      notes?: string;
      gcashReference?: string;
    }
  ) => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const data = await res.json();
      if (data.success && data.booking) {
        setBookings((prev) =>
          prev.map((b) => (b.id === bookingId ? data.booking : b))
        );
        if (verifyingBooking && verifyingBooking.id === bookingId) {
          setVerifyingBooking(data.booking);
        }
        // Re-sync all state and financial totals
        fetchData(true);
        return data.booking;
      }
    } catch (err) {
      console.error('Failed to update booking:', err);
    }
    return null;
  };

  // Open Verification Modal for a Booking
  const openVerificationModal = (booking: Booking) => {
    setVerifyingBooking(booking);
    setProofNotes(booking.notes || '');
    setCopiedRef(false);
  };

  // Quick Action in Verification Modal: Approve
  const handleApproveProof = async (booking: Booking) => {
    try {
      setProofActionLoading(true);
      await updateBookingStatus(booking.id, {
        paymentStatus: 'PAID',
        bookingStatus: 'CONFIRMED',
        notes: proofNotes.trim() || booking.notes
      });
      setVerifyingBooking(null);
      await fetchData(true);
    } catch (err) {
      console.error(err);
    } finally {
      setProofActionLoading(false);
    }
  };

  // Quick Action in Verification Modal: Reject & Release Slots
  const handleRejectProof = async (booking: Booking) => {
    if (!confirm(`Are you sure you want to REJECT payment proof for ${booking.bookingCode}? This will cancel the booking and immediately release the court slot for other players.`)) {
      return;
    }
    try {
      setProofActionLoading(true);
      await updateBookingStatus(booking.id, {
        paymentStatus: 'UNPAID',
        bookingStatus: 'CANCELLED',
        notes: proofNotes.trim() ? `[REJECTED]: ${proofNotes.trim()}` : '[REJECTED]: Payment proof invalid'
      });
      setVerifyingBooking(null);
      await fetchData(true);
    } catch (err) {
      console.error(err);
    } finally {
      setProofActionLoading(false);
    }
  };

  // Save admin notes without changing status
  const handleSaveProofNotes = async (booking: Booking) => {
    try {
      setProofActionLoading(true);
      await updateBookingStatus(booking.id, {
        notes: proofNotes.trim()
      });
      alert('Verification notes saved!');
    } catch (err) {
      console.error(err);
    } finally {
      setProofActionLoading(false);
    }
  };

  // --- POS CART ACTIONS ---
  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      alert(`${product.name} is currently out of stock!`);
      return;
    }
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          alert(`Cannot add more than available stock (${product.stock})`);
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateCartQuantity = (productId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.product.id === productId) {
            const nextQty = item.quantity + delta;
            if (nextQty > item.product.stock) {
              alert(`Cannot exceed available stock (${item.product.stock})`);
              return item;
            }
            return { ...item, quantity: nextQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0);
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setPosCashTendered('');
    setPosGcashRef('');
    setPosSelectedBookingId('');
  };

  const cartTotal = cart.reduce((sum, it) => sum + it.product.price * it.quantity, 0);
  const changeDue = posPaymentMethod === 'CASH' && posCashTendered
    ? Math.max(0, Number(posCashTendered) - cartTotal)
    : 0;

  // Submit POS Checkout
  const handlePosCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    if (posPaymentMethod === 'CASH') {
      const tendered = Number(posCashTendered);
      if (isNaN(tendered) || tendered < cartTotal) {
        alert(`Insufficient cash tendered. Total is ₱${cartTotal.toLocaleString()}.`);
        return;
      }
    }

    try {
      setPosCheckoutLoading(true);
      const itemsPayload = cart.map((it) => ({
        productId: it.product.id,
        productName: it.product.name,
        unitPrice: it.product.price,
        quantity: it.quantity,
        subtotal: it.product.price * it.quantity
      }));

      const res = await fetch('/api/pos/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: itemsPayload,
          paymentMethod: posPaymentMethod,
          cashTendered: posPaymentMethod === 'CASH' ? Number(posCashTendered) : null,
          changeGiven: posPaymentMethod === 'CASH' ? changeDue : null,
          gcashReference: posPaymentMethod === 'GCASH' ? posGcashRef.trim() : null,
          bookingId: posSelectedBookingId || null
        })
      });

      const data = await res.json();
      if (data.success && data.order) {
        setLastCheckoutOrder(data.order);
        // Refresh product stock and order list
        setPosOrders((prev) => [data.order, ...prev]);
        setProducts((prev) =>
          prev.map((p) => {
            const bought = cart.find((c) => c.product.id === p.id);
            return bought ? { ...p, stock: Math.max(0, p.stock - bought.quantity) } : p;
          })
        );
        clearCart();
        if (soundEnabled) playChime();
      } else {
        alert(data.error || 'Failed to complete checkout');
      }
    } catch (err) {
      console.error('POS Checkout failed:', err);
      alert('Checkout failed. Please try again.');
    } finally {
      setPosCheckoutLoading(false);
    }
  };

  // --- PRODUCT INVENTORY ACTIONS ---
  const openNewProductModal = () => {
    setEditingProduct(null);
    setProdFormName('');
    setProdFormCategory('DRINKS');
    setProdFormPrice('');
    setProdFormCostPrice('');
    setProdFormStock('20');
    setProdFormLowStock('5');
    setIsProductModalOpen(true);
  };

  const openEditProductModal = (product: Product) => {
    setEditingProduct(product);
    setProdFormName(product.name);
    setProdFormCategory(product.category);
    setProdFormPrice(product.price.toString());
    setProdFormCostPrice((product.costPrice || 0).toString());
    setProdFormStock(product.stock.toString());
    setProdFormLowStock(product.lowStockThreshold.toString());
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodFormName.trim() || !prodFormPrice) return;

    try {
      setProductSubmitting(true);
      if (editingProduct) {
        // Update product
        const res = await fetch(`/api/products/${editingProduct.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: prodFormName.trim(),
            category: prodFormCategory,
            price: Number(prodFormPrice),
            costPrice: Number(prodFormCostPrice || 0),
            stock: Number(prodFormStock),
            lowStockThreshold: Number(prodFormLowStock)
          })
        });
        const data = await res.json();
        if (data.success && data.product) {
          setProducts((prev) => prev.map((p) => (p.id === editingProduct.id ? data.product : p)));
          setIsProductModalOpen(false);
        }
      } else {
        // Create product
        const res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: prodFormName.trim(),
            category: prodFormCategory,
            price: Number(prodFormPrice),
            costPrice: Number(prodFormCostPrice || 0),
            stock: Number(prodFormStock),
            lowStockThreshold: Number(prodFormLowStock)
          })
        });
        const data = await res.json();
        if (data.success && data.product) {
          setProducts((prev) => [...prev, data.product]);
          setIsProductModalOpen(false);
        }
      }
    } catch (err) {
      console.error('Error saving product:', err);
    } finally {
      setProductSubmitting(false);
    }
  };

  const handleQuickRestock = async (product: Product, amount: number) => {
    try {
      const newStock = product.stock + amount;
      const res = await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock: newStock })
      });
      const data = await res.json();
      if (data.success) {
        setProducts((prev) =>
          prev.map((p) => (p.id === product.id ? { ...p, stock: newStock } : p))
        );
      }
    } catch (err) {
      console.error('Failed to restock:', err);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      const res = await fetch(`/api/products/${productId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setProducts((prev) => prev.filter((p) => p.id !== productId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Booking
  const deleteBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to permanently delete this booking?')) return;
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
          surfaceType: 'Regulation Court',
          description: newCourtDesc.trim(),
          pricingRules: newCourtPricingRules,
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
        setNewCourtPricingRules([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCourtSubmitting(false);
    }
  };

  // Open Edit Court Modal
  const openEditCourtModal = (court: Court) => {
    setEditingCourt(court);
    setEditCourtName(court.name);
    setEditCourtRate(court.hourlyRate.toString());
    setEditCourtSurface(court.surfaceType || 'Regulation Court');
    setEditCourtDesc(court.description || '');
    setEditCourtPricingRules(parsePricingRules(court.pricingRules));
  };

  // Submit Court Edit
  const handleUpdateCourt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourt || !editCourtName.trim() || !editCourtRate) return;

    try {
      setEditCourtSubmitting(true);
      const res = await fetch(`/api/courts/${editingCourt.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editCourtName.trim(),
          hourlyRate: Number(editCourtRate),
          description: editCourtDesc.trim(),
          pricingRules: editCourtPricingRules
        })
      });
      const data = await res.json();
      if (data.success && data.court) {
        setCourts((prev) =>
          prev.map((c) => (c.id === editingCourt.id ? data.court : c))
        );
        setEditingCourt(null);
      } else {
        alert(data.error || 'Failed to update court');
      }
    } catch (err) {
      console.error('Error updating court:', err);
      alert('Failed to update court');
    } finally {
      setEditCourtSubmitting(false);
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
        const saveRes = await fetch('/api/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gcashQrUrl: data.url })
        });
        const saveData = await saveRes.json();
        if (saveData.success) {
          setSettings(saveData.settings);
          setSettingsSavedMsg('QR Code uploaded and activated on the booking site!');
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
          courtOpenTime: settingsOpenTime,
          courtCloseTime: settingsCloseTime,
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
    if (hour === 24 || hour === 0) return '12:00 AM';
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
  const todayBookingsCount = todayStr ? bookings.filter((b) => b.bookingStatus !== 'CANCELLED' && b.bookingDate === todayStr).length : 0;
  const pendingPaymentCount = bookings.filter((b) => b.bookingStatus !== 'CANCELLED' && (b.paymentStatus === 'VERIFICATION_PENDING' || b.paymentStatus === 'UNPAID')).length;
  const pendingProofsCount = bookings.filter((b) => b.bookingStatus !== 'CANCELLED' && (b.paymentStatus === 'VERIFICATION_PENDING' || (b.paymentMethod === 'GCASH' && b.paymentStatus !== 'PAID' && b.receiptUrl))).length;
  
  // --- DYNAMIC FINANCIAL ANALYTICS (Day / Week / Month / All) ---
  const getFilterStartDate = () => {
    if (!currentDate) return '1970-01-01';
    const d = new Date(currentDate.getTime());
    if (timeFilter === 'TODAY') {
      return todayStr || getLocalDateStr(d);
    }
    if (timeFilter === 'WEEK') {
      d.setDate(d.getDate() - 6); // Last 7 days
      return getLocalDateStr(d);
    }
    if (timeFilter === 'MONTH') {
      d.setDate(1); // Start of current month
      return getLocalDateStr(d);
    }
    return '1970-01-01'; // ALL
  };

  const filterStartDateStr = getFilterStartDate();

  // Filtered Bookings for the selected timeframe - ONLY verified & paid bookings reflect in income
  const analyticsBookings = bookings.filter((b) => {
    if (b.bookingStatus === 'CANCELLED') return false;
    
    // Requirement: Income only reflects after payment is verified/paid
    if (b.paymentStatus !== 'PAID') return false;
    
    // Check both reservation slot date and transaction created date in local time
    const bDate = b.bookingDate || '';
    const cDate = (b.createdAt || '').split('T')[0] || '';

    if (timeFilter === 'TODAY') {
      return todayStr ? (bDate === todayStr || cDate === todayStr) : true;
    }
    if (timeFilter === 'ALL') return true;
    return (bDate >= filterStartDateStr || cDate >= filterStartDateStr);
  });

  // Filtered Store Orders for the selected timeframe
  const analyticsOrders = posOrders.filter((o) => {
    if (!o.createdAt) return false;
    const orderDate = o.createdAt.split('T')[0];
    if (timeFilter === 'TODAY') return todayStr ? orderDate === todayStr : true;
    if (timeFilter === 'ALL') return true;
    return orderDate >= filterStartDateStr;
  });

  // Aggregated Revenues for the timeframe
  const analyticsCourtRev = analyticsBookings.reduce((sum, b) => sum + Number(b.totalAmount || 0), 0);
  const analyticsStoreRev = analyticsOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
  const analyticsTotalRev = analyticsCourtRev + analyticsStoreRev;

  // Payment method breakdowns (Cash vs GCash)
  const analyticsCashCourt = analyticsBookings.filter((b) => b.paymentMethod === 'CASH').reduce((sum, b) => sum + Number(b.totalAmount || 0), 0);
  const analyticsCashStore = analyticsOrders.filter((o) => o.paymentMethod === 'CASH').reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
  const analyticsCashTotal = analyticsCashCourt + analyticsCashStore;

  const analyticsGcashCourt = analyticsBookings.filter((b) => b.paymentMethod === 'GCASH').reduce((sum, b) => sum + Number(b.totalAmount || 0), 0);
  const analyticsGcashStore = analyticsOrders.filter((o) => o.paymentMethod === 'GCASH').reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
  const analyticsGcashTotal = analyticsGcashCourt + analyticsGcashStore;

  // Chart Series generator (Responsive for mobile screens)
  const chartDays: Array<{ label: string; mobileLabel: string; dateStr: string; courtRev: number; storeRev: number; total: number }> = [];
  if (timeFilter === 'TODAY') {
    // 5 intervals for today
    const intervals = [
      { label: '6AM-9AM', mobileLabel: '6-9a', startH: 6, endH: 9 },
      { label: '10AM-1PM', mobileLabel: '10-1p', startH: 10, endH: 13 },
      { label: '2PM-5PM', mobileLabel: '2-5p', startH: 14, endH: 17 },
      { label: '6PM-9PM', mobileLabel: '6-9p', startH: 18, endH: 21 },
      { label: '10PM-12AM', mobileLabel: '10-12a', startH: 22, endH: 24 }
    ];
    intervals.forEach(({ label, mobileLabel, startH, endH }) => {
      const cRev = analyticsBookings
        .filter((b) => {
          const h = parseInt((b.startTime || '0').split(':')[0], 10);
          return h >= startH && h <= endH;
        })
        .reduce((sum, b) => sum + Number(b.totalAmount || 0), 0);

      const sRev = analyticsOrders
        .filter((o) => {
          if (!o.createdAt) return false;
          const timePart = o.createdAt.split('T')[1] || '';
          const h = parseInt(timePart.split(':')[0] || '0', 10);
          return h >= startH && h <= endH;
        })
        .reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);

      chartDays.push({ label, mobileLabel, dateStr: label, courtRev: cRev, storeRev: sRev, total: cRev + sRev });
    });
  } else if (timeFilter === 'MONTH' && currentDate) {
    // 4 Weeks of the current month (fits mobile screen perfectly)
    const curYear = currentDate.getFullYear();
    const curMonth = currentDate.getMonth();
    const lastDayOfMonth = new Date(curYear, curMonth + 1, 0).getDate();

    const weeks = [
      { label: 'Days 1-7', mobileLabel: 'Wk 1', startDay: 1, endDay: 7 },
      { label: 'Days 8-14', mobileLabel: 'Wk 2', startDay: 8, endDay: 14 },
      { label: 'Days 15-21', mobileLabel: 'Wk 3', startDay: 15, endDay: 21 },
      { label: `Days 22-${lastDayOfMonth}`, mobileLabel: 'Wk 4', startDay: 22, endDay: lastDayOfMonth }
    ];

    weeks.forEach(({ label, mobileLabel, startDay, endDay }) => {
      const cRev = bookings
        .filter((b) => {
          if (b.bookingStatus === 'CANCELLED' || b.paymentStatus !== 'PAID') return false;
          const targetDate = b.bookingDate || (b.createdAt || '').split('T')[0];
          if (!targetDate) return false;
          const [by, bm, bd] = targetDate.split('-').map(Number);
          return by === curYear && bm === curMonth + 1 && bd >= startDay && bd <= endDay;
        })
        .reduce((sum, b) => sum + Number(b.totalAmount || 0), 0);

      const sRev = posOrders
        .filter((o) => {
          if (!o.createdAt) return false;
          const targetDate = o.createdAt.split('T')[0];
          const [oy, om, od] = targetDate.split('-').map(Number);
          return oy === curYear && om === curMonth + 1 && od >= startDay && od <= endDay;
        })
        .reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);

      chartDays.push({ label, mobileLabel, dateStr: label, courtRev: cRev, storeRev: sRev, total: cRev + sRev });
    });
  } else if (currentDate) {
    // Past 7 days (WEEK and ALL)
    for (let i = 6; i >= 0; i--) {
      const d = new Date(currentDate.getTime());
      d.setDate(d.getDate() - i);
      const dStr = getLocalDateStr(d);
      const shortLabel = d.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });
      const mobileLabel = `${d.toLocaleDateString('en-US', { weekday: 'narrow' })} ${d.getDate()}`;

      const cRev = bookings
        .filter((b) => {
          if (b.bookingStatus === 'CANCELLED' || b.paymentStatus !== 'PAID') return false;
          const bDate = b.bookingDate;
          const cDate = (b.createdAt || '').split('T')[0];
          return bDate === dStr || cDate === dStr;
        })
        .reduce((sum, b) => sum + Number(b.totalAmount || 0), 0);

      const sRev = posOrders
        .filter((o) => o.createdAt && o.createdAt.startsWith(dStr))
        .reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);

      chartDays.push({ label: shortLabel, mobileLabel, dateStr: dStr, courtRev: cRev, storeRev: sRev, total: cRev + sRev });
    }
  }

  const maxChartBar = Math.max(...chartDays.map((c) => c.total), 100);

  // All-time Grand Total Revenues (ONLY verified & paid bookings count as income)
  const courtRevenue = bookings
    .filter((b) => b.bookingStatus !== 'CANCELLED' && b.paymentStatus === 'PAID')
    .reduce((sum, b) => sum + Number(b.totalAmount || 0), 0);
  const storeRevenue = posOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
  const combinedTotalRevenue = courtRevenue + storeRevenue;

  // Inventory stats
  const lowStockProducts = products.filter((p) => p.isActive === 1 && p.stock <= p.lowStockThreshold);
  const lowStockCount = lowStockProducts.length;

  // Filtered Proofs for Payment Proof Center
  const filteredProofs = bookings.filter((b) => {
    // Only bookings that paid via GCASH or have a receipt uploaded or are pending verification
    const hasProofOrGcash = b.paymentMethod === 'GCASH' || Boolean(b.receiptUrl) || b.paymentStatus === 'VERIFICATION_PENDING';
    if (!hasProofOrGcash) return false;

    if (proofFilter === 'PENDING') {
      return b.bookingStatus !== 'CANCELLED' && (b.paymentStatus === 'VERIFICATION_PENDING' || (b.paymentStatus !== 'PAID' && b.paymentMethod === 'GCASH'));
    }
    if (proofFilter === 'PAID') {
      return b.paymentStatus === 'PAID';
    }
    if (proofFilter === 'CANCELLED') {
      return b.bookingStatus === 'CANCELLED';
    }
    return true; // 'ALL'
  });

  // If Not Authenticated, show Login Form
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 transition-colors">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in-95">
          <div className="flex justify-between items-center mb-6">
            <div className="relative h-10 w-auto flex items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/the-paddle-logo-light.png"
                alt="The Paddle"
                className="h-10 w-auto object-contain dark:hidden"
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/the-paddle-logo-dark.png"
                alt="The Paddle"
                className="h-10 w-auto object-contain hidden dark:block"
              />
            </div>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
            </button>
          </div>

          <h2 className="text-2xl font-black text-slate-950 dark:text-white">Admin Portal</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            The Paddle Management Dashboard
          </p>

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Admin Passcode / PIN
              </label>
              <input
                type="password"
                required
                autoFocus
                placeholder="Enter Admin PIN"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-950 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-lime-500 text-center tracking-widest text-base"
              />
            </div>

            {authError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
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
              <Link href="/" className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      {/* Top Admin Bar */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Link href="/" className="flex items-center gap-2 text-slate-900 dark:text-white hover:opacity-85 transition-opacity">
              <div className="relative h-8 sm:h-9 w-auto flex items-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/the-paddle-logo-light.png"
                  alt="The Paddle"
                  className="h-8 sm:h-9 w-auto object-contain dark:hidden"
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/the-paddle-logo-dark.png"
                  alt="The Paddle"
                  className="h-8 sm:h-9 w-auto object-contain hidden dark:block"
                />
              </div>
              <span className="font-extrabold text-xs sm:text-sm tracking-tight uppercase px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                Admin
              </span>
            </Link>
            <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 font-semibold hidden md:inline-block">
              Authorized
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
            {/* Live Sync Status Indicator */}
            {lastSynced && (
              <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                <span className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-amber-500 animate-ping' : 'bg-lime-500'}`} />
                <span>Live Sync: {lastSynced}</span>
              </div>
            )}

            {/* Sound Chime Toggle Button */}
            <button
              onClick={toggleSound}
              className={`p-2 sm:px-2.5 sm:py-2 rounded-xl border transition-colors cursor-pointer ${
                soundEnabled
                  ? 'bg-lime-500/10 text-lime-600 dark:text-lime-400 border-lime-500/30 hover:bg-lime-500/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700'
              }`}
              title={soundEnabled ? 'Chime sound is ON for new bookings' : 'Chime sound is MUTED'}
              aria-label="Toggle Sound"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 sm:px-2.5 sm:py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700/60 transition-colors cursor-pointer"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400 animate-in spin-in-90 duration-300" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-600 animate-in spin-in-90 duration-300" />
              )}
            </button>

            <Link
              href="/"
              className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-800"
            >
              <span className="hidden sm:inline">View Client Site</span>
              <span className="sm:hidden">Site</span>
            </Link>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-900/40 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Log Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Floating Real-Time Toast for New Booking */}
      {newBookingAlert && (
        <div className="fixed top-20 right-4 z-50 max-w-sm w-full bg-white dark:bg-slate-900 border-2 border-lime-500 rounded-2xl shadow-2xl p-4 animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-lime-500 text-slate-950 flex items-center justify-center flex-shrink-0 shadow-md">
                <Bell className="w-5 h-5 animate-bounce" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-lime-600 dark:text-lime-400 uppercase tracking-wide">
                    New Booking Received!
                  </span>
                  <span className="w-2 h-2 rounded-full bg-lime-500 animate-ping" />
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate mt-0.5">
                  {newBookingAlert.clientName}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  {newBookingAlert.bookingDate} • {newBookingAlert.startTime} ({newBookingAlert.bookingCode})
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold">
                    ₱{newBookingAlert.totalAmount}
                  </span>
                  <button
                    onClick={() => {
                      setActiveTab('bookings');
                      setSearchQuery(newBookingAlert.bookingCode);
                      setNewBookingAlert(null);
                    }}
                    className="text-[11px] font-bold text-lime-600 dark:text-lime-400 hover:underline cursor-pointer"
                  >
                    View in Table →
                  </button>
                </div>
              </div>
            </div>
            <button
              onClick={() => setNewBookingAlert(null)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Admin Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 w-full flex-1">
        {/* Consolidated Executive Financial & Analytics Command Center */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-sm mb-6 sm:mb-8 transition-colors">
          {/* Top Row: Title, Timeframe Filter Chips, & Collapse Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-lime-500/15 text-lime-600 dark:text-lime-400">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-950 dark:text-white flex items-center gap-2">
                  <span>Revenue & Operations Intelligence</span>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-lime-500/15 text-lime-700 dark:text-lime-400 border border-lime-500/30">
                    Live
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Real-time court bookings, mini store retail sales, and cash flow reconciliation.
                </p>
              </div>
            </div>

            {/* Timeframe Filter Controls & Expand/Collapse */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
                {(['TODAY', 'WEEK', 'MONTH', 'ALL'] as const).map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setTimeFilter(tf)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      timeFilter === tf
                        ? 'bg-white dark:bg-slate-900 text-lime-600 dark:text-lime-400 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
                    }`}
                  >
                    {tf === 'TODAY' ? 'Today' : tf === 'WEEK' ? '7 Days' : tf === 'MONTH' ? 'Month' : 'All Time'}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setIsAnalyticsExpanded(!isAnalyticsExpanded)}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-colors cursor-pointer"
                title={isAnalyticsExpanded ? 'Collapse Chart' : 'Expand Chart'}
              >
                {isAnalyticsExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* KPI Metrics Cards (Recalculates based on Timeframe Filter) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Total Filtered Revenue */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-lime-500/10 via-white to-white dark:from-lime-500/10 dark:via-slate-900 dark:to-slate-900 border border-lime-500/30 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px]">
                <span className="font-bold text-lime-700 dark:text-lime-400 uppercase tracking-wide">
                  {timeFilter === 'TODAY' ? "Today's Revenue" : timeFilter === 'WEEK' ? '7-Day Revenue' : timeFilter === 'MONTH' ? 'Monthly Revenue' : 'All-Time Revenue'}
                </span>
                <DollarSign className="w-3.5 h-3.5 text-lime-600 dark:text-lime-400" />
              </div>
              <span className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white mt-1.5 block">
                ₱{analyticsTotalRev.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
                Courts: ₱{analyticsCourtRev.toLocaleString()} • Store: ₱{analyticsStoreRev.toLocaleString()}
              </span>
            </div>

            {/* Court Rentals Revenue */}
            <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px]">
                <span className="font-semibold uppercase tracking-wide">Court Rentals</span>
                <Calendar className="w-3.5 h-3.5 text-lime-600 dark:text-lime-400" />
              </div>
              <span className="text-2xl sm:text-3xl font-black text-lime-600 dark:text-lime-400 mt-1.5 block">
                ₱{analyticsCourtRev.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
                {analyticsBookings.length} bookings confirmed
              </span>
            </div>

            {/* Mini Store Sales */}
            <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px]">
                <span className="font-semibold uppercase tracking-wide">Mini Store Sales</span>
                <ShoppingBag className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              </div>
              <span className="text-2xl sm:text-3xl font-black text-teal-600 dark:text-teal-400 mt-1.5 block">
                ₱{analyticsStoreRev.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
                {analyticsOrders.length} retail orders processed
              </span>
            </div>

            {/* Cash vs GCash Flow */}
            <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px]">
                <span className="font-semibold uppercase tracking-wide">Payment Mix</span>
                <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
              </div>
              <div className="flex items-baseline gap-2 mt-1.5">
                <span className="text-lg sm:text-xl font-black text-emerald-600">
                  ₱{analyticsCashTotal.toLocaleString()}
                </span>
                <span className="text-xs text-slate-400 font-normal">Cash</span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-blue-600 dark:text-blue-400 mt-1 font-semibold">
                <span>GCash: ₱{analyticsGcashTotal.toLocaleString()}</span>
                {pendingProofsCount > 0 && (
                  <span
                    onClick={() => setActiveTab('proofs')}
                    className="text-amber-500 hover:underline cursor-pointer font-bold"
                  >
                    {pendingProofsCount} to review →
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Collapsible Visual Graphs & Breakdown Row */}
          {isAnalyticsExpanded && (
            <div className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 lg:grid-cols-12 gap-5 animate-in fade-in duration-300">
              {/* Dual-Series Bar Graph (Lime for Courts, Teal for Store) - 8 Columns */}
              <div className="lg:col-span-8 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {timeFilter === 'TODAY' ? "Today's Revenue by Time Window" : 'Daily Revenue Trends'}
                    </span>
                    <span className="text-[11px] text-slate-400 font-normal">
                      (Court Rentals + Mini Store)
                    </span>
                  </div>

                  {/* Graph Legend */}
                  <div className="flex items-center gap-3 text-[11px] font-semibold">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-sm bg-lime-500" />
                      <span className="text-slate-600 dark:text-slate-400">Courts</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-sm bg-teal-500" />
                      <span className="text-slate-600 dark:text-slate-400">Store</span>
                    </div>
                  </div>
                </div>

                {/* Bar Graph Canvas with mobile containment */}
                <div className="w-full overflow-x-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 pb-1">
                  <div className="h-44 sm:h-48 min-w-[280px] w-full rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 p-2 sm:p-4 flex items-end justify-between gap-1 sm:gap-4">
                    {chartDays.map((bar, idx) => {
                      const courtHeight = maxChartBar > 0 ? (bar.courtRev / maxChartBar) * 100 : 0;
                      const storeHeight = maxChartBar > 0 ? (bar.storeRev / maxChartBar) * 100 : 0;

                      return (
                        <div key={idx} className="flex-1 min-w-0 flex flex-col items-center h-full justify-end group px-0.5">
                          {/* Hover Tooltip */}
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950 text-white text-[10px] rounded-lg px-1.5 py-0.5 mb-1 pointer-events-none whitespace-nowrap shadow-lg z-10 font-mono">
                            ₱{bar.total.toLocaleString()}
                          </div>

                          {/* Stacked / Grouped Bars */}
                          <div className="w-full max-w-[26px] sm:max-w-[34px] flex items-end justify-center gap-0.5 sm:gap-1 h-[75%]">
                            {/* Court Bar */}
                            <div
                              style={{ height: `${Math.max(courtHeight, 4)}%` }}
                              className="w-1/2 bg-lime-500 rounded-t-md transition-all duration-300 group-hover:brightness-110"
                              title={`Courts: ₱${bar.courtRev}`}
                            />
                            {/* Store Bar */}
                            <div
                              style={{ height: `${Math.max(storeHeight, 4)}%` }}
                              className="w-1/2 bg-teal-500 rounded-t-md transition-all duration-300 group-hover:brightness-110"
                              title={`Store: ₱${bar.storeRev}`}
                            />
                          </div>

                          {/* X-Axis Label */}
                          <span className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-1.5 sm:mt-2 truncate w-full text-center block">
                            <span className="inline sm:hidden">{bar.mobileLabel}</span>
                            <span className="hidden sm:inline">{bar.label}</span>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Stream Share & Quick Inventory Alerts - 4 Columns */}
              <div className="lg:col-span-4 flex flex-col justify-between space-y-4">
                {/* Revenue Share Progress Bar */}
                <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-2.5">
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    Income Distribution
                  </span>

                  <div className="h-4 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 flex">
                    <div
                      style={{ width: `${analyticsTotalRev > 0 ? (analyticsCourtRev / analyticsTotalRev) * 100 : 50}%` }}
                      className="bg-lime-500 transition-all duration-500"
                    />
                    <div
                      style={{ width: `${analyticsTotalRev > 0 ? (analyticsStoreRev / analyticsTotalRev) * 100 : 50}%` }}
                      className="bg-teal-500 transition-all duration-500"
                    />
                  </div>

                  <div className="flex justify-between text-xs pt-1">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-lime-500" />
                      <span className="text-slate-600 dark:text-slate-400">Courts:</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {analyticsTotalRev > 0 ? Math.round((analyticsCourtRev / analyticsTotalRev) * 100) : 0}%
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-teal-500" />
                      <span className="text-slate-600 dark:text-slate-400">Store:</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {analyticsTotalRev > 0 ? Math.round((analyticsStoreRev / analyticsTotalRev) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Low Stock Warning or All Stocked Status */}
                <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      Store Inventory Status
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {lowStockCount > 0 ? `${lowStockCount} items at low stock` : 'All items sufficiently stocked'}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setActiveTab('store');
                      setStoreSubTab('inventory');
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      lowStockCount > 0
                        ? 'bg-rose-500 text-white hover:bg-rose-600 shadow-sm animate-pulse'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300'
                    }`}
                  >
                    {lowStockCount > 0 ? 'Restock Now' : 'View Store'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tab Navigation - Scrollable on mobile */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 gap-1 sm:gap-2 mb-5 sm:mb-6 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('bookings')}
            className={`px-3 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-bold flex items-center gap-1.5 sm:gap-2 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'bookings'
                ? 'border-lime-500 text-lime-600 dark:text-lime-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Bookings ({bookings.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('proofs')}
            className={`px-3 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-bold flex items-center gap-1.5 sm:gap-2 border-b-2 whitespace-nowrap transition-colors cursor-pointer relative ${
              activeTab === 'proofs'
                ? 'border-lime-500 text-lime-600 dark:text-lime-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Receipt className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Payment Proofs</span>
            {pendingProofsCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-black bg-amber-500 text-slate-950 animate-pulse">
                {pendingProofsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('store')}
            className={`px-3 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-bold flex items-center gap-1.5 sm:gap-2 border-b-2 whitespace-nowrap transition-colors cursor-pointer relative ${
              activeTab === 'store'
                ? 'border-lime-500 text-lime-600 dark:text-lime-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Store & POS</span>
            {lowStockCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-500 text-white" title={`${lowStockCount} items low on stock`}>
                {lowStockCount}
              </span>
            )}
          </button>


          <button
            onClick={() => setActiveTab('courts')}
            className={`px-3 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-bold flex items-center gap-1.5 sm:gap-2 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'courts'
                ? 'border-lime-500 text-lime-600 dark:text-lime-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Manage Courts ({courts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-bold flex items-center gap-1.5 sm:gap-2 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'settings'
                ? 'border-lime-500 text-lime-600 dark:text-lime-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <QrCode className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>GCash & Settings</span>
          </button>
        </div>

        {/* TAB 1: BOOKINGS */}
        {activeTab === 'bookings' && (
          <div className="space-y-4">
            {/* Filter toolbar */}
            <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-2.5 sm:gap-3 items-stretch sm:items-center justify-between shadow-sm">
              <div className="grid grid-cols-1 sm:flex sm:flex-wrap items-center gap-2 sm:gap-3 flex-1">
                {/* Search query */}
                <div className="relative flex-1 min-w-[180px]">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search Code, Name, Phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-lime-500"
                  />
                </div>

                <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
                  {/* Court filter */}
                  <select
                    value={selectedCourtFilter}
                    onChange={(e) => setSelectedCourtFilter(e.target.value)}
                    className="w-full sm:w-auto px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-lime-500"
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
                    className="w-full sm:w-auto px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-lime-500"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="PENDING">Pending</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  {/* Date filter */}
                  <input
                    type="date"
                    value={selectedDateFilter}
                    onChange={(e) => setSelectedDateFilter(e.target.value)}
                    className="flex-1 sm:flex-none px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-lime-500"
                  />

                  {selectedDateFilter && (
                    <button
                      onClick={() => setSelectedDateFilter('')}
                      className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white whitespace-nowrap"
                    >
                      Clear Date
                    </button>
                  )}
                </div>
              </div>

              <button
                onClick={() => fetchData(false)}
                className="self-end sm:self-auto p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                title="Refresh Table"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {/* Bookings Table with fluid mobile horizontal scroll */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl sm:rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[700px]">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">
                    <tr>
                      <th className="py-3 px-3.5">Booking Code</th>
                      <th className="py-3 px-3.5">Player Details</th>
                      <th className="py-3 px-3.5">Court</th>
                      <th className="py-3 px-3.5">Date & Time</th>
                      <th className="py-3 px-3.5">Amount</th>
                      <th className="py-3 px-3.5">Payment</th>
                      <th className="py-3 px-3.5">Status</th>
                      <th className="py-3 px-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {filteredBookings.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-400 dark:text-slate-500">
                          No bookings found matching current filters.
                        </td>
                      </tr>
                    ) : (
                      filteredBookings.map((b) => (
                        <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          {/* Code */}
                          <td className="py-3 px-3.5 font-mono font-bold text-lime-600 dark:text-lime-400 whitespace-nowrap">
                            {b.bookingCode}
                          </td>

                          {/* Player */}
                          <td className="py-3 px-3.5">
                            <span className="font-bold text-slate-900 dark:text-white block">{b.clientName}</span>
                            <span className="text-slate-500 dark:text-slate-400 block text-[11px]">{b.clientPhone}</span>
                            {b.clientEmail && (
                              <span className="text-slate-400 dark:text-slate-500 block text-[10px]">{b.clientEmail}</span>
                            )}
                          </td>

                          {/* Court */}
                          <td className="py-3 px-3.5 font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">
                            {b.courtName || b.courtId}
                          </td>

                          {/* Date & Time */}
                          <td className="py-3 px-3.5 whitespace-nowrap">
                            <span className="font-semibold text-slate-900 dark:text-white block">
                              {new Date(b.bookingDate).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </span>
                            <span className="text-slate-500 dark:text-slate-400 block text-[11px]">
                              {formatTime(b.startTime)} – {formatTime(b.endTime)}
                            </span>
                          </td>

                          {/* Amount */}
                          <td className="py-3 px-3.5 font-black text-lime-600 dark:text-lime-400 whitespace-nowrap">
                            ₱{b.totalAmount.toLocaleString()}
                          </td>

                          {/* Payment */}
                          <td className="py-3 px-3.5 whitespace-nowrap">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              b.paymentMethod === 'GCASH' ? 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/30' : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                            }`}>
                              {b.paymentMethod}
                            </span>
                            {b.gcashReference && (
                              <span className="block font-mono text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                                Ref: {b.gcashReference}
                              </span>
                            )}
                            {b.receiptUrl && (
                              <button
                                onClick={() => setViewReceiptUrl(b.receiptUrl || null)}
                                className="mt-1 flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer"
                              >
                                <Eye className="w-3 h-3" /> View Proof
                              </button>
                            )}
                          </td>

                          {/* Status */}
                          <td className="py-3 px-3.5 whitespace-nowrap">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              b.bookingStatus === 'CONFIRMED'
                                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                                : b.bookingStatus === 'CANCELLED'
                                ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30'
                                : 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                            }`}>
                              {b.bookingStatus}
                            </span>
                            <span className="block text-[10px] text-slate-500 mt-0.5">
                              {b.paymentStatus === 'PAID' ? 'Paid' : b.paymentStatus === 'VERIFICATION_PENDING' ? 'Pending Verif.' : 'Unpaid'}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-3.5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {b.bookingStatus !== 'CONFIRMED' && (
                                <button
                                  onClick={() => updateBookingStatus(b.id, { bookingStatus: 'CONFIRMED' })}
                                  className="px-2 py-1 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 text-[10px] font-bold transition-colors cursor-pointer"
                                  title="Confirm Reservation"
                                >
                                  Confirm
                                </button>
                              )}

                              {b.paymentStatus !== 'PAID' && (
                                <button
                                  onClick={() => updateBookingStatus(b.id, { paymentStatus: 'PAID' })}
                                  className="px-2 py-1 rounded bg-lime-500/15 text-lime-700 dark:text-lime-400 hover:bg-lime-500 hover:text-slate-950 text-[10px] font-bold transition-colors cursor-pointer"
                                  title="Mark Payment as Received"
                                >
                                  Mark Paid
                                </button>
                              )}

                              <button
                                onClick={() => deleteBooking(b.id)}
                                className="p-1 rounded text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 hover:text-rose-700 dark:hover:text-rose-300 transition-colors cursor-pointer"
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

        {/* TAB 1.5: PAYMENT PROOFS & VERIFICATION CENTER */}
        {activeTab === 'proofs' && (
          <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-200">
            {/* Header & Filter Bar */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-lime-500/15 text-lime-600 dark:text-lime-400">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-950 dark:text-white">
                    Payment Proof & Verification Center
                  </h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Inspect GCash transaction receipts side-by-side, match reference numbers, and approve or release reserved court slots with 1 click.
                </p>
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl self-start md:self-auto overflow-x-auto">
                <button
                  onClick={() => setProofFilter('PENDING')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    proofFilter === 'PENDING'
                      ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
                  }`}
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Pending ({pendingProofsCount})</span>
                </button>

                <button
                  onClick={() => setProofFilter('PAID')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    proofFilter === 'PAID'
                      ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
                  }`}
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Verified & Paid</span>
                </button>

                <button
                  onClick={() => setProofFilter('CANCELLED')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    proofFilter === 'CANCELLED'
                      ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
                  }`}
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Rejected / Cancelled</span>
                </button>

                <button
                  onClick={() => setProofFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    proofFilter === 'ALL'
                      ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
                  }`}
                >
                  All ({bookings.filter(b => b.paymentMethod === 'GCASH' || Boolean(b.receiptUrl)).length})
                </button>
              </div>
            </div>

            {/* Proofs Grid / List */}
            {filteredProofs.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center shadow-sm">
                <Receipt className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700 mb-3" />
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  No payment proofs in this queue
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                  {proofFilter === 'PENDING'
                    ? 'Great news! All submitted GCash payments have been reviewed and verified.'
                    : 'No receipts match the selected filter category.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {filteredProofs.map((booking) => {
                  const isPending = booking.paymentStatus === 'VERIFICATION_PENDING' || (booking.paymentStatus !== 'PAID' && booking.bookingStatus !== 'CANCELLED');
                  const isPaid = booking.paymentStatus === 'PAID';
                  const isCancelled = booking.bookingStatus === 'CANCELLED';

                  return (
                    <div
                      key={booking.id}
                      className={`bg-white dark:bg-slate-900 border rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between transition-all hover:shadow-md ${
                        isPending
                          ? 'border-amber-400/60 dark:border-amber-500/40 ring-1 ring-amber-400/20'
                          : isPaid
                          ? 'border-emerald-300 dark:border-emerald-800/60'
                          : 'border-slate-200 dark:border-slate-800 opacity-80'
                      }`}
                    >
                      {/* Card Header */}
                      <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700">
                              {booking.bookingCode}
                            </span>
                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                              isPaid
                                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                                : isCancelled
                                ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30'
                                : 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 animate-pulse'
                            }`}>
                              {isPaid ? 'Verified Paid' : isCancelled ? 'Rejected' : 'Action Needed'}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-slate-950 dark:text-white mt-2">
                            {booking.clientName}
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {booking.clientPhone}
                          </p>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Total Due</span>
                          <span className="text-base sm:text-lg font-black text-lime-600 dark:text-lime-400">
                            ₱{booking.totalAmount.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Card Content & Receipt Preview */}
                      <div className="p-4 sm:p-5 flex-1 flex flex-col gap-3.5">
                        {/* Court & Schedule Details */}
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 text-xs space-y-1.5">
                          <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                            <span>Court:</span>
                            <span className="font-bold text-slate-900 dark:text-white">{booking.courtName || 'Court'}</span>
                          </div>
                          <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                            <span>Schedule:</span>
                            <span className="font-semibold text-slate-900 dark:text-white">
                              {booking.bookingDate} ({formatTime(booking.startTime)} - {formatTime(booking.endTime)})
                            </span>
                          </div>
                          {booking.gcashReference && (
                            <div className="flex justify-between items-center pt-1 border-t border-slate-200 dark:border-slate-700/60">
                              <span className="text-slate-500">Ref #:</span>
                              <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                                {booking.gcashReference}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Receipt Thumbnail */}
                        {booking.receiptUrl ? (
                          <div
                            onClick={() => openVerificationModal(booking)}
                            className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-black h-40 cursor-pointer flex items-center justify-center"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={booking.receiptUrl}
                              alt={`Receipt proof for ${booking.bookingCode}`}
                              className="h-full w-full object-contain group-hover:scale-105 transition-transform duration-200"
                            />
                            <div className="absolute inset-0 bg-slate-950/40 group-hover:bg-slate-950/20 transition-colors flex items-center justify-center">
                              <span className="px-3 py-1.5 rounded-xl bg-slate-900/90 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg backdrop-blur-sm">
                                <ZoomIn className="w-3.5 h-3.5" />
                                Inspect Proof
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="rounded-xl border border-dashed border-amber-300 dark:border-amber-800/80 bg-amber-50/50 dark:bg-amber-950/20 p-4 text-center">
                            <AlertCircle className="w-6 h-6 mx-auto text-amber-500 mb-1" />
                            <p className="text-xs font-bold text-amber-800 dark:text-amber-300">
                              No Receipt Uploaded
                            </p>
                            <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5">
                              {booking.gcashReference ? `Customer submitted Ref: ${booking.gcashReference}` : 'Customer chosen GCash without screenshot'}
                            </p>
                          </div>
                        )}

                        {booking.notes && (
                          <div className="text-[11px] text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 p-2.5 rounded-xl">
                            <span className="font-bold block text-slate-800 dark:text-slate-300 mb-0.5">Admin Note:</span>
                            {booking.notes}
                          </div>
                        )}
                      </div>

                      {/* Card Footer Actions */}
                      <div className="p-4 sm:p-5 pt-0 flex gap-2">
                        {isPending ? (
                          <>
                            <button
                              onClick={() => openVerificationModal(booking)}
                              className="flex-1 py-2.5 rounded-xl bg-lime-500 hover:bg-lime-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-lime-500/20 transition-all cursor-pointer"
                            >
                              <CheckCircle className="w-4 h-4 stroke-[2.5]" />
                              <span>Verify & Review</span>
                            </button>
                            <button
                              onClick={() => handleRejectProof(booking)}
                              className="p-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40 transition-colors cursor-pointer"
                              title="Reject & Release Slot"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => openVerificationModal(booking)}
                            className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Full Details</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 1.7: COURT STORE & POS */}
        {activeTab === 'store' && (
          <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-200">
            {/* Top Store Sub-navigation & Header */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-lime-500/15 text-lime-600 dark:text-lime-400">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-950 dark:text-white">
                      Court Store & POS System
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Front-desk point-of-sale register, inventory controls, and retail orders.
                    </p>
                  </div>
                </div>
              </div>

              {/* Sub-Tabs: POS Register | Inventory | Sales History */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl self-start md:self-auto">
                <button
                  onClick={() => setStoreSubTab('pos')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    storeSubTab === 'pos'
                      ? 'bg-white dark:bg-slate-900 text-lime-600 dark:text-lime-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
                  }`}
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>POS Register</span>
                </button>

                <button
                  onClick={() => setStoreSubTab('inventory')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    storeSubTab === 'inventory'
                      ? 'bg-white dark:bg-slate-900 text-lime-600 dark:text-lime-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
                  }`}
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>Inventory ({products.length})</span>
                  {lowStockCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white font-black">
                      {lowStockCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setStoreSubTab('history')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    storeSubTab === 'history'
                      ? 'bg-white dark:bg-slate-900 text-lime-600 dark:text-lime-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
                  }`}
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>Order History ({posOrders.length})</span>
                </button>
              </div>
            </div>

            {/* SUB-VIEW 1: POS REGISTER */}
            {storeSubTab === 'pos' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
                {/* Product Catalog & Selector (8 Columns) */}
                <div className="lg:col-span-7 xl:col-span-8 space-y-4">
                  {/* Category Filter Chips & Search */}
                  <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                      {['ALL', 'DRINKS', 'BALLS_GEAR', 'RENTALS', 'SNACKS'].map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setPosCategoryFilter(cat)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                            posCategoryFilter === cat
                              ? 'bg-lime-500 text-slate-950 shadow-sm'
                              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-slate-300'
                          }`}
                        >
                          {cat === 'ALL' ? 'All Items' : cat.replace('_', ' & ')}
                        </button>
                      ))}
                    </div>

                    <div className="relative min-w-[180px]">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search product..."
                        value={posSearchQuery}
                        onChange={(e) => setPosSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-lime-500"
                      />
                    </div>
                  </div>

                  {/* Product Cards Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                    {products
                      .filter((p) => p.isActive === 1)
                      .filter((p) => posCategoryFilter === 'ALL' || p.category === posCategoryFilter)
                      .filter((p) => !posSearchQuery || p.name.toLowerCase().includes(posSearchQuery.toLowerCase()))
                      .map((product) => {
                        const inCart = cart.find((it) => it.product.id === product.id);
                        const isOutOfStock = product.stock <= 0;

                        return (
                          <div
                            key={product.id}
                            onClick={() => !isOutOfStock && addToCart(product)}
                            className={`p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border transition-all cursor-pointer flex flex-col justify-between shadow-sm relative group ${
                              isOutOfStock
                                ? 'opacity-50 cursor-not-allowed border-slate-200 dark:border-slate-800'
                                : inCart
                                ? 'border-lime-500 ring-2 ring-lime-500/20 hover:shadow-md'
                                : 'border-slate-200 dark:border-slate-800 hover:border-lime-500/50 hover:shadow-md'
                            }`}
                          >
                            {inCart && (
                              <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-lime-500 text-slate-950 font-black text-xs flex items-center justify-center shadow-md">
                                {inCart.quantity}
                              </span>
                            )}

                            <div>
                              <div className="flex items-center justify-between gap-1 mb-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate">
                                  {product.category.replace('_', ' ')}
                                </span>
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                                  product.stock <= 0
                                    ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                                    : product.stock <= product.lowStockThreshold
                                    ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                }`}>
                                  {product.stock <= 0 ? 'Out' : `${product.stock} left`}
                                </span>
                              </div>

                              <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white line-clamp-2">
                                {product.name}
                              </h4>
                            </div>

                            <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                              <span className="text-sm sm:text-base font-black text-lime-600 dark:text-lime-400">
                                ₱{product.price}
                              </span>
                              <span className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover:bg-lime-500 group-hover:text-slate-950 transition-colors">
                                <Plus className="w-3.5 h-3.5" />
                              </span>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* POS Register Cart & Checkout Sidebar (4 Columns) */}
                <div className="lg:col-span-5 xl:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl flex flex-col justify-between self-start sticky top-20">
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
                      <div className="flex items-center gap-2">
                        <ShoppingCart className="w-4 h-4 text-lime-600 dark:text-lime-400" />
                        <h4 className="font-bold text-sm text-slate-950 dark:text-white">Current Order</h4>
                      </div>
                      {cart.length > 0 && (
                        <button
                          onClick={clearCart}
                          className="text-[11px] font-semibold text-rose-500 hover:underline cursor-pointer"
                        >
                          Clear Cart
                        </button>
                      )}
                    </div>

                    {/* Cart Items List */}
                    {cart.length === 0 ? (
                      <div className="py-12 text-center text-slate-400">
                        <ShoppingBag className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                        <p className="text-xs font-semibold">Order cart is empty</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Click products on the left to add items</p>
                      </div>
                    ) : (
                      <div className="space-y-2.5 max-h-[30vh] overflow-y-auto pr-1 scrollbar-thin">
                        {cart.map(({ product, quantity }) => (
                          <div
                            key={product.id}
                            className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between gap-2"
                          >
                            <div className="min-w-0 flex-1">
                              <h5 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                {product.name}
                              </h5>
                              <span className="text-[11px] font-mono text-lime-600 dark:text-lime-400 font-semibold">
                                ₱{product.price} each
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <button
                                onClick={() => updateCartQuantity(product.id, -1)}
                                className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 flex items-center justify-center text-slate-700 dark:text-slate-200 cursor-pointer"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-6 text-center text-xs font-bold text-slate-900 dark:text-white">
                                {quantity}
                              </span>
                              <button
                                onClick={() => updateCartQuantity(product.id, 1)}
                                className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 flex items-center justify-center text-slate-700 dark:text-slate-200 cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => removeFromCart(product.id)}
                                className="p-1 text-slate-400 hover:text-rose-500 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Checkout Summary Form */}
                  {cart.length > 0 && (
                    <form onSubmit={handlePosCheckout} className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3.5">
                      {/* Total Amount Due */}
                      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Total Due</span>
                        <span className="text-xl font-black text-lime-600 dark:text-lime-400 font-mono">
                          ₱{cartTotal.toLocaleString()}
                        </span>
                      </div>

                      {/* Payment Method Selector */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                          Payment Method
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setPosPaymentMethod('CASH')}
                            className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                              posPaymentMethod === 'CASH'
                                ? 'bg-emerald-500 text-slate-950 border-emerald-500 shadow-sm'
                                : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            Cash Register
                          </button>
                          <button
                            type="button"
                            onClick={() => setPosPaymentMethod('GCASH')}
                            className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                              posPaymentMethod === 'GCASH'
                                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            GCash QR
                          </button>
                        </div>
                      </div>

                      {/* Cash Breakdown (Tendered & Change) */}
                      {posPaymentMethod === 'CASH' && (
                        <div className="space-y-2 p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60">
                          <div>
                            <label className="block text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase">
                              Cash Received (₱)
                            </label>
                            <input
                              type="number"
                              required
                              min={cartTotal}
                              placeholder={`Min ₱${cartTotal}`}
                              value={posCashTendered}
                              onChange={(e) => setPosCashTendered(e.target.value)}
                              className="w-full mt-1 px-3 py-2 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 rounded-lg text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                            />
                          </div>

                          <div className="flex justify-between items-center pt-1 text-xs font-semibold text-emerald-900 dark:text-emerald-200">
                            <span>Change Due:</span>
                            <span className="font-mono font-black text-sm text-emerald-600 dark:text-emerald-400">
                              ₱{changeDue.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* GCash Reference */}
                      {posPaymentMethod === 'GCASH' && (
                        <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/60">
                          <label className="block text-[10px] font-bold text-blue-800 dark:text-blue-300 uppercase mb-1">
                            GCash Transaction Ref #
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. 90248271049"
                            value={posGcashRef}
                            onChange={(e) => setPosGcashRef(e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-700 rounded-lg text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      )}

                      {/* Optional Link to Court Booking */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Link to Active Court Booking (Optional)
                        </label>
                        <select
                          value={posSelectedBookingId}
                          onChange={(e) => setPosSelectedBookingId(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
                        >
                          <option value="">No Court Tag (Walk-in Customer)</option>
                          {bookings
                            .filter((b) => b.bookingDate === todayStr && b.bookingStatus === 'CONFIRMED')
                            .map((b) => (
                              <option key={b.id} value={b.id}>
                                {b.bookingCode} - {b.clientName} ({b.courtName})
                              </option>
                            ))}
                        </select>
                      </div>

                      {/* Complete Checkout Button */}
                      <button
                        type="submit"
                        disabled={posCheckoutLoading}
                        className="w-full py-3.5 rounded-2xl bg-lime-500 hover:bg-lime-400 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-lime-500/25 transition-all cursor-pointer flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4 stroke-[3]" />
                        <span>{posCheckoutLoading ? 'Processing Sale...' : `Charge ₱${cartTotal.toLocaleString()}`}</span>
                      </button>
                    </form>
                  )}
                </div>
              </div>
            )}

            {/* SUB-VIEW 2: INVENTORY & STOCK MANAGEMENT */}
            {storeSubTab === 'inventory' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white">Store Inventory Catalog</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Track stock counts, unit costs, and profit margins.</p>
                  </div>

                  <button
                    onClick={openNewProductModal}
                    className="self-start sm:self-auto flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-lime-500 hover:bg-lime-400 text-slate-950 font-bold text-xs shadow-md shadow-lime-500/20 transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>Add New Product</span>
                  </button>
                </div>

                {/* Products Table Card */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto scrollbar-thin">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold tracking-wider uppercase text-[10px]">
                          <th className="py-3 px-4">Product Name</th>
                          <th className="py-3 px-4">Category</th>
                          <th className="py-3 px-4">Retail Price</th>
                          <th className="py-3 px-4">Cost Price</th>
                          <th className="py-3 px-4">Stock Level</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                        {products.map((product) => {
                          const isLowStock = product.stock <= product.lowStockThreshold && product.stock > 0;
                          const isOut = product.stock <= 0;

                          return (
                            <tr key={product.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                              <td className="py-3 px-4 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                                {product.name}
                              </td>
                              <td className="py-3 px-4 whitespace-nowrap">
                                <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-bold">
                                  {product.category.replace('_', ' ')}
                                </span>
                              </td>
                              <td className="py-3 px-4 font-black text-lime-600 dark:text-lime-400 whitespace-nowrap">
                                ₱{product.price}
                              </td>
                              <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                                ₱{product.costPrice || 0}
                              </td>
                              <td className="py-3 px-4 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <span className={`font-mono font-bold text-sm ${
                                    isOut ? 'text-rose-500' : isLowStock ? 'text-amber-500' : 'text-slate-900 dark:text-white'
                                  }`}>
                                    {product.stock}
                                  </span>
                                  {/* Quick Restock Buttons */}
                                  <button
                                    onClick={() => handleQuickRestock(product, 12)}
                                    className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-[10px] font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
                                    title="Quick add +12 units"
                                  >
                                    +12
                                  </button>
                                  <button
                                    onClick={() => handleQuickRestock(product, 24)}
                                    className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-[10px] font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
                                    title="Quick add +24 units"
                                  >
                                    +24
                                  </button>
                                </div>
                              </td>
                              <td className="py-3 px-4 whitespace-nowrap">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                  isOut
                                    ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                                    : isLowStock
                                    ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 animate-pulse'
                                    : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                                }`}>
                                  {isOut ? 'Out of Stock' : isLowStock ? 'Low Stock' : 'In Stock'}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right whitespace-nowrap">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => openEditProductModal(product)}
                                    className="p-1.5 rounded-lg text-lime-600 dark:text-lime-400 hover:bg-lime-500/10 cursor-pointer"
                                    title="Edit product"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteProduct(product.id)}
                                    className="p-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                                    title="Delete product"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* SUB-VIEW 3: SALES / ORDERS HISTORY */}
            {storeSubTab === 'history' && (
              <div className="space-y-4">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto scrollbar-thin">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold tracking-wider uppercase text-[10px]">
                          <th className="py-3 px-4">Order #</th>
                          <th className="py-3 px-4">Date & Time</th>
                          <th className="py-3 px-4">Items Purchased</th>
                          <th className="py-3 px-4">Total Amount</th>
                          <th className="py-3 px-4">Payment</th>
                          <th className="py-3 px-4">Ref / Court</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                        {posOrders.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-12 text-center text-slate-400">
                              No store POS orders recorded yet.
                            </td>
                          </tr>
                        ) : (
                          posOrders.map((order) => (
                            <tr key={order.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                              <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                                {order.orderNumber}
                              </td>
                              <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                                {new Date(order.createdAt).toLocaleString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </td>
                              <td className="py-3 px-4">
                                <div className="space-y-0.5">
                                  {(order.items || []).map((it, idx) => (
                                    <div key={idx} className="text-[11px]">
                                      <span className="font-bold text-slate-900 dark:text-white">{it.quantity}x</span> {it.productName}
                                    </div>
                                  ))}
                                </div>
                              </td>
                              <td className="py-3 px-4 font-black text-lime-600 dark:text-lime-400 whitespace-nowrap">
                                ₱{order.totalAmount.toLocaleString()}
                              </td>
                              <td className="py-3 px-4 whitespace-nowrap">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  order.paymentMethod === 'GCASH'
                                    ? 'bg-blue-500/15 text-blue-600 border border-blue-500/30'
                                    : 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/30'
                                }`}>
                                  {order.paymentMethod}
                                </span>
                              </td>
                              <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                                {order.gcashReference || order.bookingId || '—'}
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
          </div>
        )}



        {/* TAB 2: COURTS MANAGEMENT */}
        {activeTab === 'courts' && (
          <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-950 dark:text-white">Pickleball Courts</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Add, edit pricing, or remove courts from the booking schedule.</p>
              </div>

              <button
                onClick={() => setIsAddCourtOpen(true)}
                className="self-start sm:self-auto flex items-center gap-1.5 sm:gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-lime-500 hover:bg-lime-400 text-slate-950 font-bold text-xs shadow-md shadow-lime-500/20 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Add New Court</span>
              </button>
            </div>

            {/* Courts Grid - 1 col on mobile, 2 on sm, 3 on lg */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-6">
              {courts.map((court) => (
                <div
                  key={court.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 flex flex-col justify-between shadow-sm transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2 sm:mb-3">
                      <span className="text-sm font-bold text-slate-950 dark:text-white">
                        {court.name}
                      </span>

                      <button
                        onClick={() => handleToggleCourtActive(court)}
                        className={`text-xs px-2.5 py-0.5 rounded-full font-bold cursor-pointer transition-colors ${
                          court.isActive === 1
                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30'
                        }`}
                        title="Click to toggle availability"
                      >
                        {court.isActive === 1 ? 'Active' : 'Disabled'}
                      </button>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{court.description || 'Pickleball court ready for play.'}</p>

                    <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-slate-200 dark:border-slate-800">
                      <div className="flex items-baseline justify-between">
                        <span className="text-xs text-slate-500 dark:text-slate-400">Base Hourly Rate</span>
                        <span className="text-lg sm:text-xl font-black text-lime-600 dark:text-lime-400">₱{court.hourlyRate}/hr</span>
                      </div>

                      {parsePricingRules(court.pricingRules).length > 0 && (
                        <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/60 space-y-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                            Time-Range Rates
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {parsePricingRules(court.pricingRules).map((r) => (
                              <div
                                key={r.id || r.startTime}
                                className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold"
                              >
                                <Moon className="w-3 h-3 text-indigo-500" />
                                <span>{r.label || 'Evening'}: {r.startTime} – {r.endTime}</span>
                                <span className="font-black text-indigo-900 dark:text-indigo-200">₱{r.rate}/hr</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleToggleCourtActive(court)}
                      className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                    >
                      {court.isActive === 1 ? 'Disable' : 'Enable'}
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditCourtModal(court)}
                        className="flex items-center gap-1 text-xs text-lime-700 dark:text-lime-400 hover:text-lime-800 dark:hover:text-lime-300 px-2.5 py-1.5 rounded-lg bg-lime-500/10 hover:bg-lime-500/20 border border-lime-500/30 transition-colors cursor-pointer font-bold"
                        title="Edit court details and price"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => handleDeleteCourt(court.id)}
                        className="flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 px-2.5 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 transition-colors cursor-pointer"
                        title="Delete court"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: GCASH QR & SETTINGS */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-xl transition-colors">
            <h3 className="text-lg sm:text-xl font-bold text-slate-950 dark:text-white">Payment & Facility Settings</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-5 sm:mb-6">
              Upload your official GCash QR Code image so players can easily scan to pay online.
            </p>

            <form onSubmit={handleSaveSettings} className="space-y-5 sm:space-y-6">
              {/* QR Code Upload Section */}
              <div className="p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3.5 sm:space-y-4">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  GCash QR Code Image
                </label>

                <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                  {/* QR Preview Box */}
                  <div className="w-32 h-32 sm:w-40 sm:h-40 bg-white rounded-2xl p-2 flex items-center justify-center flex-shrink-0 shadow-md border border-slate-300 dark:border-slate-700">
                    {settingsQrUrl && !qrImgError ? (
                      <img
                        src={settingsQrUrl}
                        alt="Admin GCash QR"
                        onError={() => setQrImgError(true)}
                        className="w-full h-full object-contain rounded-xl"
                      />
                    ) : (
                      <div className="text-center p-2 text-slate-700">
                        <QrCode className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-blue-600 mb-1" />
                        <span className="text-[10px] sm:text-[11px] font-bold block">{qrImgError ? 'Image Not Found' : 'No QR Uploaded'}</span>
                        <span className="text-[9px] text-slate-500 block">Click upload below</span>
                      </div>
                    )}
                  </div>

                  {/* Upload button and tips */}
                  <div className="space-y-2.5 sm:space-y-3 w-full text-center sm:text-left">
                    <label className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 cursor-pointer transition-colors w-full sm:w-auto">
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

                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      Download your merchant QR code from your GCash app and upload it here (JPG, PNG, or WebP). Clients will see this exact QR code during checkout.
                    </p>
                  </div>
                </div>
              </div>

              {/* GCash Account Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    GCash Account Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. The Paddle Pickleball Club"
                    value={settingsAccountName}
                    onChange={(e) => setSettingsAccountName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:border-lime-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    GCash Mobile Number
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 0917-888-7235"
                    value={settingsNumber}
                    onChange={(e) => setSettingsNumber(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:border-lime-500 font-mono"
                  />
                </div>
              </div>

              {/* Operating Hours Configuration */}
              <div className="p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3.5 sm:space-y-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-lime-600 dark:text-lime-400" />
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Facility Operating Hours
                  </label>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Configure the earliest opening time and latest closing time for court reservations.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Opening Time
                    </label>
                    <select
                      value={settingsOpenTime}
                      onChange={(e) => setSettingsOpenTime(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:border-lime-500"
                    >
                      {Array.from({ length: 24 }).map((_, i) => {
                        const val = `${i.toString().padStart(2, '0')}:00`;
                        const hour = i % 12 === 0 ? 12 : i % 12;
                        const ampm = i >= 12 ? 'PM' : 'AM';
                        return (
                          <option key={val} value={val}>
                            {val} ({hour}:00 {ampm})
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Closing Time
                    </label>
                    <select
                      value={settingsCloseTime}
                      onChange={(e) => setSettingsCloseTime(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:border-lime-500"
                    >
                      {/* Hours 01:00 to 23:00 */}
                      {Array.from({ length: 23 }).map((_, idx) => {
                        const i = idx + 1;
                        const val = `${i.toString().padStart(2, '0')}:00`;
                        const hour = i % 12 === 0 ? 12 : i % 12;
                        const ampm = i >= 12 ? 'PM' : 'AM';
                        return (
                          <option key={val} value={val}>
                            {val} ({hour}:00 {ampm})
                          </option>
                        );
                      })}
                      {/* Explicit Midnight options */}
                      <option value="24:00">24:00 (12:00 AM Midnight)</option>
                      <option value="00:00">00:00 (12:00 AM Midnight)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Admin Security */}
              <div className="pt-3 sm:pt-4 border-t border-slate-200 dark:border-slate-800">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Change Admin PIN <span className="text-slate-400 text-[10px]">(Leave blank to keep current PIN)</span>
                </label>
                <input
                  type="password"
                  placeholder="New Admin PIN"
                  value={settingsPin}
                  onChange={(e) => setSettingsPin(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:border-lime-500 tracking-wider"
                />
              </div>

              {settingsSavedMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>{settingsSavedMsg}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-lime-500 hover:bg-lime-400 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-lime-500/25 transition-all cursor-pointer"
              >
                Save Settings
              </button>
            </form>
          </div>
        )}
      </main>

      {/* Add Court Modal */}
      {isAddCourtOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 dark:bg-slate-950/85 backdrop-blur-sm overflow-hidden transition-colors">
          <div className="relative w-full max-w-md max-h-[92dvh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex-shrink-0 flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base sm:text-lg font-bold text-slate-950 dark:text-white">Add New Pickleball Court</h3>
              <button
                onClick={() => setIsAddCourtOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCourt} className="flex-1 overflow-y-auto mt-4 space-y-4 pr-1 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Court Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Court 4 (Indoor Blue)"
                  value={newCourtName}
                  onChange={(e) => setNewCourtName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:border-lime-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Standard Base Rate (₱/hr)</label>
                <input
                  type="number"
                  required
                  min="0"
                  placeholder="210"
                  value={newCourtRate}
                  onChange={(e) => setNewCourtRate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:border-lime-500 font-mono"
                />
              </div>

              {/* Dynamic Time-Range Pricing Rules */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Moon className="w-4 h-4 text-indigo-500" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Time-Range Pricing (Evening/Peak)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setNewCourtPricingRules([
                        ...newCourtPricingRules,
                        {
                          id: 'rule-' + Math.random().toString(36).slice(2, 7),
                          startTime: '15:00',
                          endTime: '03:00',
                          rate: 260,
                          label: 'Evening Rate'
                        }
                      ]);
                    }}
                    className="flex items-center gap-1 text-[11px] font-bold text-lime-700 dark:text-lime-400 hover:text-lime-800 dark:hover:text-lime-300 px-2 py-1 rounded-lg bg-lime-500/10 hover:bg-lime-500/20 border border-lime-500/30 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Time Range</span>
                  </button>
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                  Set custom rates for specific hours (e.g. 3:00 PM to 3:00 AM). Standard hours outside this range will automatically use the base rate.
                </p>

                {newCourtPricingRules.length === 0 ? (
                  <div className="py-2.5 px-3 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 text-center">
                    <p className="text-[11px] text-slate-400 dark:text-slate-500">No custom time-range rates yet. Base rate applies all day.</p>
                    <button
                      type="button"
                      onClick={() => {
                        setNewCourtPricingRules([
                          {
                            id: 'rule-' + Math.random().toString(36).slice(2, 7),
                            startTime: '15:00',
                            endTime: '03:00',
                            rate: 260,
                            label: 'Evening Rate'
                          }
                        ]);
                      }}
                      className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                      <span>+ Quick Add: Evening Rate (3 PM – 3 AM @ ₱260)</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {newCourtPricingRules.map((rule, idx) => (
                      <div
                        key={rule.id || idx}
                        className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-2 shadow-sm"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <input
                            type="text"
                            placeholder="Rate Name (e.g. Evening Rate)"
                            value={rule.label || ''}
                            onChange={(e) => {
                              const updated = [...newCourtPricingRules];
                              updated[idx] = { ...updated[idx], label: e.target.value };
                              setNewCourtPricingRules(updated);
                            }}
                            className="px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-xs text-slate-900 dark:text-white flex-1 focus:outline-none focus:border-lime-500"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setNewCourtPricingRules(newCourtPricingRules.filter((_, i) => i !== idx));
                            }}
                            className="p-1 text-rose-500 hover:text-rose-700 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                            title="Remove rate rule"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="block text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-0.5">Start Time</label>
                            <select
                              value={rule.startTime}
                              onChange={(e) => {
                                const updated = [...newCourtPricingRules];
                                updated[idx] = { ...updated[idx], startTime: e.target.value };
                                setNewCourtPricingRules(updated);
                              }}
                              className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-[11px] text-slate-900 dark:text-white focus:outline-none focus:border-lime-500"
                            >
                              {HOUR_OPTIONS.map((h) => (
                                <option key={h.value} value={h.value}>{h.label}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-0.5">End Time</label>
                            <select
                              value={rule.endTime}
                              onChange={(e) => {
                                const updated = [...newCourtPricingRules];
                                updated[idx] = { ...updated[idx], endTime: e.target.value };
                                setNewCourtPricingRules(updated);
                              }}
                              className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-[11px] text-slate-900 dark:text-white focus:outline-none focus:border-lime-500"
                            >
                              {HOUR_OPTIONS.map((h) => (
                                <option key={h.value} value={h.value}>{h.label}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-0.5">Rate (₱/hr)</label>
                            <input
                              type="number"
                              min="0"
                              value={rule.rate}
                              onChange={(e) => {
                                const updated = [...newCourtPricingRules];
                                updated[idx] = { ...updated[idx], rate: Number(e.target.value) };
                                setNewCourtPricingRules(updated);
                              }}
                              className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-lime-500 font-bold"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Court details, lighting, or special features..."
                  value={newCourtDesc}
                  onChange={(e) => setNewCourtDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:border-lime-500"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddCourtOpen(false)}
                  className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
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
          <div className="relative max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">GCash Payment Proof</h3>
              <button
                onClick={() => setViewReceiptUrl(null)}
                className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
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

      {/* Edit Court Modal */}
      {editingCourt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 dark:bg-slate-950/85 backdrop-blur-sm overflow-hidden transition-colors">
          <div className="relative w-full max-w-md max-h-[92dvh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex-shrink-0 flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-lime-600 dark:text-lime-400" />
                <h3 className="text-base sm:text-lg font-bold text-slate-950 dark:text-white">Edit Court Details</h3>
              </div>
              <button
                onClick={() => setEditingCourt(null)}
                className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateCourt} className="flex-1 overflow-y-auto mt-4 space-y-4 pr-1 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Court Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Court 1 (Indoor Pro)"
                  value={editCourtName}
                  onChange={(e) => setEditCourtName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:border-lime-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Standard Base Rate (₱/hr)</label>
                <input
                  type="number"
                  required
                  min="0"
                  placeholder="e.g. 210"
                  value={editCourtRate}
                  onChange={(e) => setEditCourtRate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:border-lime-500 font-mono"
                />
              </div>

              {/* Dynamic Time-Range Pricing Rules for Editing */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Moon className="w-4 h-4 text-indigo-500" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Time-Range Pricing (Evening/Peak)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditCourtPricingRules([
                        ...editCourtPricingRules,
                        {
                          id: 'rule-' + Math.random().toString(36).slice(2, 7),
                          startTime: '15:00',
                          endTime: '03:00',
                          rate: 260,
                          label: 'Evening Rate'
                        }
                      ]);
                    }}
                    className="flex items-center gap-1 text-[11px] font-bold text-lime-700 dark:text-lime-400 hover:text-lime-800 dark:hover:text-lime-300 px-2 py-1 rounded-lg bg-lime-500/10 hover:bg-lime-500/20 border border-lime-500/30 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Time Range</span>
                  </button>
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                  Set custom rates for specific hours (e.g. 3:00 PM to 3:00 AM). Standard hours outside this range will automatically use the base rate.
                </p>

                {editCourtPricingRules.length === 0 ? (
                  <div className="py-2.5 px-3 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 text-center">
                    <p className="text-[11px] text-slate-400 dark:text-slate-500">No custom time-range rates. Base rate applies all day.</p>
                    <button
                      type="button"
                      onClick={() => {
                        setEditCourtPricingRules([
                          {
                            id: 'rule-' + Math.random().toString(36).slice(2, 7),
                            startTime: '15:00',
                            endTime: '03:00',
                            rate: 260,
                            label: 'Evening Rate'
                          }
                        ]);
                      }}
                      className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                      <span>+ Quick Add: Evening Rate (3 PM – 3 AM @ ₱260)</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {editCourtPricingRules.map((rule, idx) => (
                      <div
                        key={rule.id || idx}
                        className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-2 shadow-sm"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <input
                            type="text"
                            placeholder="Rate Name (e.g. Evening Rate)"
                            value={rule.label || ''}
                            onChange={(e) => {
                              const updated = [...editCourtPricingRules];
                              updated[idx] = { ...updated[idx], label: e.target.value };
                              setEditCourtPricingRules(updated);
                            }}
                            className="px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-xs text-slate-900 dark:text-white flex-1 focus:outline-none focus:border-lime-500"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setEditCourtPricingRules(editCourtPricingRules.filter((_, i) => i !== idx));
                            }}
                            className="p-1 text-rose-500 hover:text-rose-700 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                            title="Remove rate rule"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="block text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-0.5">Start Time</label>
                            <select
                              value={rule.startTime}
                              onChange={(e) => {
                                const updated = [...editCourtPricingRules];
                                updated[idx] = { ...updated[idx], startTime: e.target.value };
                                setEditCourtPricingRules(updated);
                              }}
                              className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-[11px] text-slate-900 dark:text-white focus:outline-none focus:border-lime-500"
                            >
                              {HOUR_OPTIONS.map((h) => (
                                <option key={h.value} value={h.value}>{h.label}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-0.5">End Time</label>
                            <select
                              value={rule.endTime}
                              onChange={(e) => {
                                const updated = [...editCourtPricingRules];
                                updated[idx] = { ...updated[idx], endTime: e.target.value };
                                setEditCourtPricingRules(updated);
                              }}
                              className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-[11px] text-slate-900 dark:text-white focus:outline-none focus:border-lime-500"
                            >
                              {HOUR_OPTIONS.map((h) => (
                                <option key={h.value} value={h.value}>{h.label}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-0.5">Rate (₱/hr)</label>
                            <input
                              type="number"
                              min="0"
                              value={rule.rate}
                              onChange={(e) => {
                                const updated = [...editCourtPricingRules];
                                updated[idx] = { ...updated[idx], rate: Number(e.target.value) };
                                setEditCourtPricingRules(updated);
                              }}
                              className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-lime-500 font-bold"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Court details, lighting, or special features..."
                  value={editCourtDesc}
                  onChange={(e) => setEditCourtDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:border-lime-500"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditingCourt(null)}
                  className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editCourtSubmitting}
                  className="flex-1 py-3 rounded-xl bg-lime-500 hover:bg-lime-400 text-slate-950 font-black text-xs shadow-lg shadow-lime-500/20 transition-all cursor-pointer"
                >
                  {editCourtSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dedicated Payment Proof Verification Split-Screen Modal */}
      {verifyingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-hidden animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl max-h-[94vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex-shrink-0 flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-lime-500/15 text-lime-600 dark:text-lime-400">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-950 dark:text-white">
                      Payment Verification
                    </h3>
                    <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700">
                      {verifyingBooking.bookingCode}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Review player payment receipt against reservation details
                  </p>
                </div>
              </div>

              <button
                onClick={() => setVerifyingBooking(null)}
                className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body - 2 Columns on desktop */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
              {/* LEFT COLUMN: High-Res Zoomable Receipt Screenshot */}
              <div className="flex flex-col">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center justify-between">
                  <span>GCash Receipt Screenshot</span>
                  {verifyingBooking.receiptUrl && (
                    <a
                      href={verifyingBooking.receiptUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <ExternalLink className="w-3 h-3" /> Full View
                    </a>
                  )}
                </span>

                <div className="flex-1 min-h-[300px] sm:min-h-[380px] rounded-2xl bg-black border border-slate-200 dark:border-slate-800 p-2 flex items-center justify-center overflow-hidden relative">
                  {verifyingBooking.receiptUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={verifyingBooking.receiptUrl}
                      alt="GCash Payment Receipt"
                      className="max-h-[50vh] sm:max-h-[55vh] w-auto object-contain rounded-xl hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="text-center p-6 text-slate-400">
                      <AlertCircle className="w-10 h-10 mx-auto mb-2 text-amber-500" />
                      <p className="font-bold text-sm text-white">No Image Receipt Uploaded</p>
                      <p className="text-xs text-slate-400 mt-1 max-w-xs">
                        The player chose GCash at checkout but did not attach an image receipt screenshot.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT COLUMN: Reservation & Payment Details, Reference Matching, Notes */}
              <div className="flex flex-col justify-between space-y-4">
                <div className="space-y-4">
                  {/* Amount Breakdown Box */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200/80 dark:border-slate-700/60">
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Expected Total</span>
                      <span className="text-2xl font-black text-lime-600 dark:text-lime-400 font-mono">
                        ₱{verifyingBooking.totalAmount.toLocaleString()}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[11px] text-slate-400 block">Payment Method</span>
                        <span className="font-bold text-slate-900 dark:text-white uppercase">{verifyingBooking.paymentMethod}</span>
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-400 block">Current Status</span>
                        <span className={`font-black uppercase text-[11px] ${
                          verifyingBooking.paymentStatus === 'PAID'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-amber-500'
                        }`}>
                          {verifyingBooking.paymentStatus}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* GCash Reference Number Matcher */}
                  <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-950 dark:text-blue-300">
                        Player&apos;s Submitted GCash Ref #
                      </span>
                      {verifyingBooking.gcashReference && (
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(verifyingBooking.gcashReference || '');
                            setCopiedRef(true);
                            setTimeout(() => setCopiedRef(false), 2000);
                          }}
                          className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-bold cursor-pointer"
                        >
                          {copiedRef ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedRef ? 'Copied!' : 'Copy Ref'}</span>
                        </button>
                      )}
                    </div>

                    {verifyingBooking.gcashReference ? (
                      <div className="font-mono text-base font-black text-slate-900 dark:text-white tracking-wider bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-blue-200 dark:border-blue-800">
                        {verifyingBooking.gcashReference}
                      </div>
                    ) : (
                      <p className="text-xs italic text-slate-500">
                        No reference number typed by customer (inspect receipt screenshot directly).
                      </p>
                    )}
                  </div>

                  {/* Reservation Details */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Player Name:</span>
                      <span className="font-bold text-slate-900 dark:text-white">{verifyingBooking.clientName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Contact Number:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{verifyingBooking.clientPhone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Court:</span>
                      <span className="font-bold text-slate-900 dark:text-white">{verifyingBooking.courtName || 'Court'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Date & Slot:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {verifyingBooking.bookingDate} • {formatTime(verifyingBooking.startTime)} - {formatTime(verifyingBooking.endTime)} ({verifyingBooking.durationHours} hr)
                      </span>
                    </div>
                  </div>

                  {/* Verification Notes Input */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Admin Audit Notes / Memo
                      </label>
                      <button
                        type="button"
                        onClick={() => handleSaveProofNotes(verifyingBooking)}
                        disabled={proofActionLoading}
                        className="text-[10px] text-lime-600 dark:text-lime-400 hover:underline font-bold cursor-pointer"
                      >
                        Save Note Only
                      </button>
                    </div>
                    <textarea
                      rows={2}
                      value={proofNotes}
                      onChange={(e) => setProofNotes(e.target.value)}
                      placeholder="e.g. Verified on GCash app at 3:15 PM, Ref matched."
                      className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-lime-500"
                    />
                  </div>
                </div>

                {/* Primary Action Buttons */}
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex gap-2.5">
                    {/* Approve Button */}
                    <button
                      type="button"
                      disabled={proofActionLoading}
                      onClick={() => handleApproveProof(verifyingBooking)}
                      className="flex-1 py-3 rounded-xl bg-lime-500 hover:bg-lime-400 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-lime-500/25 transition-all cursor-pointer"
                    >
                      <CheckCircle className="w-4 h-4 stroke-[3]" />
                      <span>{proofActionLoading ? 'Processing...' : 'Approve & Confirm'}</span>
                    </button>

                    {/* Reject & Release Button */}
                    <button
                      type="button"
                      disabled={proofActionLoading}
                      onClick={() => handleRejectProof(verifyingBooking)}
                      className="py-3 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/50 text-rose-600 dark:text-rose-400 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 border border-rose-200 dark:border-rose-900/40 transition-colors cursor-pointer"
                      title="Reject proof, mark CANCELLED, and immediately release court slots"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Reject & Release Slot</span>
                    </button>
                  </div>

                  <p className="text-[10px] text-center text-slate-400">
                    💡 Approving marks payment as <strong>PAID</strong> & booking as <strong>CONFIRMED</strong>. Rejecting immediately releases court slot availability for other customers.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 dark:bg-slate-950/85 backdrop-blur-sm overflow-hidden transition-colors">
          <div className="relative w-full max-w-md max-h-[92dvh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex-shrink-0 flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-lime-600 dark:text-lime-400" />
                <h3 className="text-base sm:text-lg font-bold text-slate-950 dark:text-white">
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h3>
              </div>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="flex-1 overflow-y-auto mt-4 space-y-3.5 pr-1 scrollbar-thin">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Product Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pocari Sweat 500ml"
                  value={prodFormName}
                  onChange={(e) => setProdFormName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:border-lime-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Category</label>
                <select
                  value={prodFormCategory}
                  onChange={(e) => setProdFormCategory(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:border-lime-500"
                >
                  <option value="DRINKS">Drinks & Hydration</option>
                  <option value="BALLS_GEAR">Balls & Gear</option>
                  <option value="RENTALS">Equipment Rentals</option>
                  <option value="SNACKS">Snacks & Bars</option>
                  <option value="OTHER">Other Merchandise</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Selling Price (₱)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="e.g. 65"
                    value={prodFormPrice}
                    onChange={(e) => setProdFormPrice(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs sm:text-sm font-mono focus:outline-none focus:border-lime-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Cost Price (₱)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 45"
                    value={prodFormCostPrice}
                    onChange={(e) => setProdFormCostPrice(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs sm:text-sm font-mono focus:outline-none focus:border-lime-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Stock Count</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={prodFormStock}
                    onChange={(e) => setProdFormStock(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs sm:text-sm font-mono focus:outline-none focus:border-lime-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Low Stock Alert</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={prodFormLowStock}
                    onChange={(e) => setProdFormLowStock(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs sm:text-sm font-mono focus:outline-none focus:border-lime-500"
                  />
                </div>
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={productSubmitting}
                  className="flex-1 py-3 rounded-xl bg-lime-500 hover:bg-lime-400 text-slate-950 font-black text-xs shadow-lg shadow-lime-500/20 transition-all cursor-pointer"
                >
                  {productSubmitting ? 'Saving...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POS Receipt / Sale Completed Modal */}
      {lastCheckoutOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl text-center animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-6 h-6 stroke-[3]" />
            </div>

            <h3 className="text-lg font-black text-slate-950 dark:text-white">Sale Completed!</h3>
            <p className="text-xs font-mono text-slate-500 mt-0.5">{lastCheckoutOrder.orderNumber}</p>

            <div className="my-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 text-left space-y-2 border border-slate-200 dark:border-slate-700">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Total Charged:</span>
                <span className="font-mono font-black text-lime-600 dark:text-lime-400">
                  ₱{lastCheckoutOrder.totalAmount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Payment:</span>
                <span className="font-bold uppercase text-slate-900 dark:text-white">
                  {lastCheckoutOrder.paymentMethod}
                </span>
              </div>
              {lastCheckoutOrder.cashTendered !== null && lastCheckoutOrder.cashTendered !== undefined && (
                <>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Cash Received:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      ₱{lastCheckoutOrder.cashTendered}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Change Given:</span>
                    <span className="font-mono font-black text-emerald-600">
                      ₱{lastCheckoutOrder.changeGiven || 0}
                    </span>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={() => setLastCheckoutOrder(null)}
              className="w-full py-3 rounded-xl bg-lime-500 hover:bg-lime-400 text-slate-950 font-black text-xs cursor-pointer shadow-md shadow-lime-500/20"
            >
              Done & Next Order
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


