import { NextResponse } from 'next/server';
import { siteConfig } from '@/lib/config';

export async function GET(request: Request) {
  // Simple timestamp & uptime health check
  return NextResponse.json({
    status: 'ok',
    service: `${siteConfig.brandName} Booking API`,
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
  });
}
