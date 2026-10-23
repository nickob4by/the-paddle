import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const { adminPin } = body;

    // 1. Authenticate with Admin PIN
    const settingsRes = await db.execute({
      sql: 'SELECT adminPin FROM settings WHERE id = ?',
      args: ['default']
    });
    const validPin = (settingsRes.rows[0] as { adminPin?: string })?.adminPin || 'admin123';

    if (!adminPin || String(adminPin).trim() !== validPin) {
      return NextResponse.json(
        { success: false, error: 'Incorrect Admin PIN. Only authorized administrators can void orders.' },
        { status: 401 }
      );
    }

    // 2. Verify order exists
    const orderRes = await db.execute({
      sql: 'SELECT * FROM pos_orders WHERE id = ?',
      args: [id]
    });

    if (orderRes.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'POS Order not found' }, { status: 404 });
    }

    const order = orderRes.rows[0] as any;

    // 3. Fetch purchased items to restore stock
    const itemsRes = await db.execute({
      sql: 'SELECT productId, quantity FROM pos_order_items WHERE orderId = ?',
      args: [id]
    });
    const items = itemsRes.rows as Array<{ productId: string; quantity: number }>;

    // 4. Build atomic batch statements
    const batchStatements: Array<{ sql: string; args?: any[] }> = [];

    // Increment stock back into products table
    for (const item of items) {
      if (item.productId && item.quantity > 0) {
        batchStatements.push({
          sql: 'UPDATE products SET stock = stock + ? WHERE id = ?',
          args: [Number(item.quantity), item.productId]
        });
      }
    }

    // Delete order items
    batchStatements.push({
      sql: 'DELETE FROM pos_order_items WHERE orderId = ?',
      args: [id]
    });

    // Delete order record
    batchStatements.push({
      sql: 'DELETE FROM pos_orders WHERE id = ?',
      args: [id]
    });

    // Execute atomic batch
    await db.executeBatch(batchStatements);

    return NextResponse.json({
      success: true,
      message: `Order ${order.orderNumber || id} has been successfully voided. Items have been restored to inventory.`
    });
  } catch (error) {
    console.error('Error voiding POS order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to void POS order' },
      { status: 500 }
    );
  }
}
