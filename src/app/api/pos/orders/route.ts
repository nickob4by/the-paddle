import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { PosOrder, PosOrderItem } from '@/lib/types';
import crypto from 'crypto';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const limit = limitParam === 'all' ? 2000 : Math.min(Math.max(Number(limitParam) || 100, 1), 2000);
    const offset = Math.max(Number(searchParams.get('offset')) || 0, 0);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const paymentMethod = searchParams.get('paymentMethod');
    const search = searchParams.get('search')?.trim();

    const whereClauses: string[] = [];
    const args: any[] = [];

    if (startDate) {
      const startIso = startDate.length === 10 ? `${startDate}T00:00:00` : startDate;
      whereClauses.push(`createdAt >= ?`);
      args.push(startIso);
    }

    if (endDate) {
      const endIso = endDate.length === 10 ? `${endDate}T23:59:59.999` : endDate;
      whereClauses.push(`createdAt <= ?`);
      args.push(endIso);
    }

    if (paymentMethod && paymentMethod !== 'ALL') {
      whereClauses.push(`paymentMethod = ?`);
      args.push(paymentMethod.toUpperCase());
    }

    if (search) {
      whereClauses.push(`(
        orderNumber LIKE ? OR 
        gcashReference LIKE ? OR 
        notes LIKE ? OR 
        bookingId LIKE ? OR
        id IN (SELECT orderId FROM pos_order_items WHERE productName LIKE ?)
      )`);
      const searchPattern = `%${search}%`;
      args.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Total count matching current filters
    const countRes = await db.execute({
      sql: `SELECT COUNT(*) as count FROM pos_orders ${whereSql}`,
      args
    });
    const totalCount = Number(countRes.rows[0]?.count || 0);

    // Fetch orders
    const ordersRes = await db.execute({
      sql: `SELECT * FROM pos_orders ${whereSql} ORDER BY createdAt DESC LIMIT ? OFFSET ?`,
      args: [...args, limit, offset]
    });

    const orders = ordersRes.rows as unknown as PosOrder[];

    if (orders.length > 0) {
      const orderIds = orders.map((o) => `'${String(o.id).replace(/'/g, "''")}'`).join(',');
      const itemsRes = await db.execute(`SELECT * FROM pos_order_items WHERE orderId IN (${orderIds})`);
      const allItems = itemsRes.rows as unknown as PosOrderItem[];

      orders.forEach((o) => {
        o.items = allItems.filter((item) => item.orderId === o.id);
      });
    }

    return NextResponse.json(
      {
        success: true,
        orders,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + orders.length < totalCount
        }
      },
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
