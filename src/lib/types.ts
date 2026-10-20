export interface PricingRule {
  id: string;
  startTime: string; // "HH:00", e.g. "15:00"
  endTime: string;   // "HH:00", e.g. "03:00"
  rate: number;      // rate in PHP
  label?: string;    // e.g. "Evening Rate"
}

export interface Court {
  id: string;
  name: string;
  description: string;
  surfaceType: string; // e.g. "Pro Cushion Indoor", "Outdoor Acrylic"
  hourlyRate: number; // in PHP
  pricingRules?: PricingRule[] | string;
  isActive: number; // 1 = active, 0 = inactive
  imageUrl?: string;
  createdAt: string;
}

export function parsePricingRules(rules: any): PricingRule[] {
  if (!rules) return [];
  if (Array.isArray(rules)) return rules;
  if (typeof rules === 'string') {
    try {
      const parsed = JSON.parse(rules);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

export function getSlotPricingRule(court: Court | null | undefined, slotHourStr: string): PricingRule | null {
  if (!court) return null;
  const rules = parsePricingRules(court.pricingRules);
  if (!rules || rules.length === 0) return null;

  const slotH = parseInt(slotHourStr.split(':')[0], 10);
  if (Number.isNaN(slotH)) return null;

  for (const rule of rules) {
    if (!rule.startTime || !rule.endTime || rule.rate === undefined || rule.rate === null) continue;
    const startH = parseInt(rule.startTime.split(':')[0], 10);
    const endH = parseInt(rule.endTime.split(':')[0], 10);
    if (Number.isNaN(startH) || Number.isNaN(endH)) continue;

    if (startH < endH) {
      if (slotH >= startH && slotH < endH) return rule;
    } else if (startH > endH) {
      if (slotH >= startH || slotH < endH) return rule;
    } else {
      return rule;
    }
  }
  return null;
}

export function getSlotRate(court: Court | null | undefined, slotHourStr: string): number {
  if (!court) return 0;
  const matchedRule = getSlotPricingRule(court, slotHourStr);
  if (matchedRule && matchedRule.rate !== undefined && matchedRule.rate !== null) {
    return Number(matchedRule.rate);
  }
  return Number(court.hourlyRate) || 0;
}

export interface Booking {
  id: string;
  bookingCode: string; // e.g. "PAD-8492"
  courtId: string;
  courtName?: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  bookingDate: string; // YYYY-MM-DD
  startTime: string; // HH:00 (e.g. "08:00")
  endTime: string; // HH:00 (e.g. "10:00")
  durationHours: number;
  totalAmount: number;
  paymentMethod: 'CASH' | 'GCASH';
  paymentStatus: 'UNPAID' | 'PAID' | 'VERIFICATION_PENDING';
  bookingStatus: 'CONFIRMED' | 'PENDING' | 'CANCELLED';
  gcashReference?: string;
  receiptUrl?: string;
  notes?: string;
  bookingType?: 'STANDARD' | 'OPEN_PLAY';
  createdAt: string;
}

export interface SystemSettings {
  id: string;
  gcashQrUrl: string;
  gcashAccountName: string;
  gcashNumber: string;
  courtOpenTime: string; // e.g. "06:00"
  courtCloseTime: string; // e.g. "22:00"
  adminPin: string;
  updatedAt: string;
  isBookingDisabled?: number;
  closureReason?: string;
  closureBannerText?: string;
  closureStartDate?: string;
  closureEndDate?: string;
  closureStartTime?: string; // e.g. "05:00"
  closureEndTime?: string;   // e.g. "13:00"
  openPlayEnabled?: number;   // 1 = enabled, 0 = disabled
  openPlayStartTime?: string; // e.g. "05:00"
  openPlayEndTime?: string;   // e.g. "11:00"
  openPlayPrice?: number;     // e.g. 130
  openPlayCapacity?: number;  // e.g. 16
  openPlayCourtIds?: string;  // "all" or JSON array e.g. '["court-1"]'
  openPlayDays?: string;      // JSON array e.g. '["MON","TUE","WED","THU","FRI","SAT","SUN"]'
  noticeBannerEnabled?: number; // 1 = enabled (visible on homepage), 0 = disabled (hidden)
}

export function parseOpenPlayCourtIds(courtIds?: string): string[] {
  if (!courtIds || courtIds === 'all') return ['all'];
  try {
    const parsed = JSON.parse(courtIds);
    return Array.isArray(parsed) ? parsed : ['all'];
  } catch {
    return ['all'];
  }
}

export function parseOpenPlayDays(days?: string): string[] {
  const defaultDays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  if (!days) return defaultDays;
  try {
    const parsed = JSON.parse(days);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : defaultDays;
  } catch {
    return defaultDays;
  }
}

export function isOpenPlayActiveOnDate(dateStr: string, settings?: Partial<SystemSettings> | null): boolean {
  if (!settings) return false;
  if (settings.openPlayEnabled === 0) return false;
  if (!dateStr) return false;

  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return false;
  const dateObj = new Date(y, m - 1, d);
  const dayIndex = dateObj.getDay(); // 0 = SUN, 1 = MON, ...
  const dayCodes = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const currentDayCode = dayCodes[dayIndex];

  const allowedDays = parseOpenPlayDays(settings.openPlayDays);
  return allowedDays.includes(currentDayCode);
}

export function isCourtParticipatingInOpenPlay(courtId: string, settings?: Partial<SystemSettings> | null): boolean {
  if (!settings || settings.openPlayEnabled === 0) return false;
  const courtIds = parseOpenPlayCourtIds(settings.openPlayCourtIds);
  if (courtIds.includes('all')) return true;
  return courtIds.includes(courtId);
}

export function isHourInOpenPlayWindow(slotHourStr: string, settings?: Partial<SystemSettings> | null): boolean {
  if (!settings || settings.openPlayEnabled === 0) return false;
  const startTime = settings.openPlayStartTime || '05:00';
  const endTime = settings.openPlayEndTime || '11:00';

  const slotH = parseInt(slotHourStr.split(':')[0], 10);
  const startH = parseInt(startTime.split(':')[0], 10);
  const endH = parseInt(endTime.split(':')[0], 10);
  if (Number.isNaN(slotH) || Number.isNaN(startH) || Number.isNaN(endH)) return false;

  if (startH < endH) {
    return slotH >= startH && slotH < endH;
  } else {
    // Crosses midnight if ever configured that way
    return slotH >= startH || slotH < endH;
  }
}

export function isHourInClosureRange(
  slotHourStr: string,
  closureStartTime?: string,
  closureEndTime?: string
): boolean {
  if (!closureStartTime || !closureEndTime) return true; // entire day closed if not set
  if (closureStartTime === closureEndTime) return true;

  const slotH = parseInt(slotHourStr.split(':')[0], 10);
  const startH = parseInt(closureStartTime.split(':')[0], 10);
  const endH = parseInt(closureEndTime.split(':')[0], 10);
  if (Number.isNaN(slotH) || Number.isNaN(startH) || Number.isNaN(endH)) return true;

  if (startH < endH) {
    return slotH >= startH && slotH < endH;
  } else {
    // Crosses midnight, e.g. 22:00 to 05:00
    return slotH >= startH || slotH < endH;
  }
}

export interface Product {
  id: string;
  name: string;
  category: 'DRINKS' | 'BALLS_GEAR' | 'RENTALS' | 'SNACKS' | 'OTHER';
  price: number; // Retail selling price PHP
  costPrice?: number; // Cost PHP
  stock: number;
  lowStockThreshold: number;
  imageUrl?: string;
  isActive: number;
  createdAt: string;
}

export interface PosOrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface PosOrder {
  id: string;
  orderNumber: string; // e.g. "POS-1042"
  totalAmount: number;
  paymentMethod: 'CASH' | 'GCASH';
  cashTendered?: number;
  changeGiven?: number;
  gcashReference?: string;
  bookingId?: string;
  notes?: string;
  createdAt: string;
  items?: PosOrderItem[];
}

export interface NoticeBannerParams {
  noticeBannerEnabled?: boolean | number;
  isBookingDisabled: boolean;
  closureBannerText?: string;
  closureStartDate?: string;
  closureEndDate?: string;
  closureStartTime?: string;
  closureEndTime?: string;
  todayStr?: string;
  inactiveCourtNames?: string[];
  activeCourtCount?: number;
}

export function computeNoticeBannerText({
  noticeBannerEnabled,
  isBookingDisabled,
  closureBannerText = '',
  closureStartDate = '',
  closureEndDate = '',
  closureStartTime = '',
  closureEndTime = '',
  todayStr = '',
  inactiveCourtNames = [],
  activeCourtCount = 0
}: NoticeBannerParams): string {
  if (noticeBannerEnabled !== undefined && !noticeBannerEnabled) {
    return '';
  }

  const customBanner = (closureBannerText || '').trim();
  const hasPartialTimeWindow = Boolean(closureStartTime && closureEndTime && closureStartTime !== closureEndTime);
  
  const isScheduledClosedToday = Boolean(
    todayStr && (
      (closureStartDate && closureEndDate && todayStr >= closureStartDate && todayStr <= closureEndDate) ||
      (closureStartDate && !closureEndDate && todayStr === closureStartDate)
    )
  );

  const isFacilityClosed = isBookingDisabled || isScheduledClosedToday;

  if (isFacilityClosed) {
    if (customBanner) return customBanner;
    if (hasPartialTimeWindow) {
      return `Notice: Closed from ${closureStartTime} to ${closureEndTime} for reservations today. Remaining hours are open for booking!`;
    }
    return 'Notice: The facility is temporarily closed for vacation or maintenance. Online bookings will resume shortly!';
  }

  if (closureStartDate && closureEndDate && todayStr && todayStr < closureStartDate) {
    if (customBanner) return `Upcoming Notice: ${customBanner}`;
    return `Upcoming Notice: The facility will be closed ${hasPartialTimeWindow ? `(${closureStartTime} to ${closureEndTime}) ` : ''}from ${closureStartDate} to ${closureEndDate}. Advance bookings outside these dates remain available.`;
  }

  // If admin provided custom banner text, always display it
  if (customBanner) {
    return customBanner;
  }

  // If a time window closure is configured without specific dates, it's a daily time window
  if (hasPartialTimeWindow) {
    return `Notice: Closed from ${closureStartTime} to ${closureEndTime}. Remaining hours are open for booking!`;
  }

  if (inactiveCourtNames.length > 0 && activeCourtCount > 0) {
    return `Court Notice: ${inactiveCourtNames.join(', ')} is currently closed for maintenance. Remaining courts are available and accepting bookings!`;
  }

  return '';
}

