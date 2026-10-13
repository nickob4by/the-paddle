import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { name, category, price, costPrice, stock, lowStockThreshold, imageUrl, isActive } = body;

    const existing = await db.execute({ sql: 'SELECT * FROM products WHERE id = ?', args: [id] });
    if (existing.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }

    await db.execute({
      sql: `UPDATE products
            SET name = COALESCE(?, name),
                category = COALESCE(?, category),
                price = COALESCE(?, price),
                costPrice = COALESCE(?, costPrice),
                stock = COALESCE(?, stock),
                lowStockThreshold = COALESCE(?, lowStockThreshold),
                imageUrl = COALESCE(?, imageUrl),
                isActive = COALESCE(?, isActive)
            WHERE id = ?`,
      args: [
        name !== undefined ? name.trim() : null,
        category !== undefined ? category : null,
        price !== undefined ? Number(price) : null,
        costPrice !== undefined ? Number(costPrice) : null,
        stock !== undefined ? Number(stock) : null,
        lowStockThreshold !== undefined ? Number(lowStockThreshold) : null,
        imageUrl !== undefined ? imageUrl : null,
        isActive !== undefined ? Number(isActive) : null,
        id
      ]
    });

    const updated = await db.execute({ sql: 'SELECT * FROM products WHERE id = ?', args: [id] });
    return NextResponse.json({ success: true, product: updated.rows[0] });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json({ success: false, error: 'Failed to update product' }, { status: 500 });
  }
}

export const PATCH = PUT;

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    await db.execute({ sql: 'DELETE FROM products WHERE id = ?', args: [id] });
    return NextResponse.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete product' }, { status: 500 });
  }
}
