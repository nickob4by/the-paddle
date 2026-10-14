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

