import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // Simple timestamp & uptime health check
  return NextResponse.json({
    status: 'ok',
    service: 'The Paddle Pickleball Booking API',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
  });
}
