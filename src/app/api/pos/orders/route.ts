import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { PosOrder, PosOrderItem } from '@/lib/types';
import crypto from 'crypto';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get('limit')) || 100;

    // Fetch latest orders
    const ordersRes = await db.execute({
      sql: `SELECT * FROM pos_orders ORDER BY createdAt DESC LIMIT ?`,
      args: [limit]
    });

    const orders = ordersRes.rows as unknown as PosOrder[];

    if (orders.length > 0) {
      const orderIds = orders.map((o) => `'${o.id}'`).join(',');
      const itemsRes = await db.execute(`SELECT * FROM pos_order_items WHERE orderId IN (${orderIds})`);
      const allItems = itemsRes.rows as unknown as PosOrderItem[];

      orders.forEach((o) => {
        o.items = allItems.filter((item) => item.orderId === o.id);
      });
    }

    return NextResponse.json(
      { success: true, orders },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  } catch (error) {
    console.error('Error fetching POS orders:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch POS orders' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      items, // array of { productId, productName, unitPrice, quantity, subtotal }
      paymentMethod = 'CASH', // 'CASH' | 'GCASH'
      cashTendered,
      changeGiven,
      gcashReference,
      bookingId,
      notes
    } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, error: 'Cart is empty. Please add items.' }, { status: 400 });
    }

    // Calculate total amount
    const totalAmount = items.reduce((sum: number, it: any) => sum + (Number(it.unitPrice) * Number(it.quantity)), 0);
    const orderId = 'pos-' + crypto.randomUUID().slice(0, 8);
    const orderNumber = 'POS-' + Math.floor(1000 + Math.random() * 9000);
    const createdAt = new Date().toISOString();

    const batchRequests: Array<{ sql: string; args?: any[] }> = [];

    // 1. Insert order record
    batchRequests.push({
      sql: `INSERT INTO pos_orders (id, orderNumber, totalAmount, paymentMethod, cashTendered, changeGiven, gcashReference, bookingId, notes, createdAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        orderId,
        orderNumber,
        totalAmount,
        paymentMethod,
        cashTendered ? Number(cashTendered) : null,
        changeGiven ? Number(changeGiven) : null,
        gcashReference || null,
        bookingId || null,
        notes || null,
        createdAt
      ]
    });

    // 2. Insert items and decrement stock
    for (const item of items) {
      const itemId = 'item-' + crypto.randomUUID().slice(0, 8);
      const subtotal = Number(item.unitPrice) * Number(item.quantity);

      batchRequests.push({
        sql: `INSERT INTO pos_order_items (id, orderId, productId, productName, unitPrice, quantity, subtotal)
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [
          itemId,
          orderId,
          item.productId,
          item.productName,
          Number(item.unitPrice),
          Number(item.quantity),
          subtotal
        ]
      });

      // Decrement stock in products table
      batchRequests.push({
        sql: `UPDATE products SET stock = MAX(0, stock - ?) WHERE id = ?`,
        args: [Number(item.quantity), item.productId]
      });
    }

    // Execute atomic batch
    await db.executeBatch(batchRequests);

    return NextResponse.json({
      success: true,
      order: {
        id: orderId,
        orderNumber,
        totalAmount,
        paymentMethod,
        cashTendered,
        changeGiven,
        gcashReference,
        items,
        createdAt
      }
    });
  } catch (error) {
    console.error('Error processing POS checkout:', error);
    return NextResponse.json({ success: false, error: 'Failed to process POS checkout' }, { status: 500 });
  }
}
