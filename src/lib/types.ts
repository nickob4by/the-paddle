export interface Court {
  id: string;
  name: string;
  description: string;
  surfaceType: string; // e.g. "Pro Cushion Indoor", "Outdoor Acrylic"
  hourlyRate: number; // in PHP
  isActive: number; // 1 = active, 0 = inactive
  imageUrl?: string;
  createdAt: string;
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
}
