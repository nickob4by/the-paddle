import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { Product } from '@/lib/types';
import crypto from 'crypto';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const includeInactive = searchParams.get('all') === 'true';

    let sql = 'SELECT * FROM products WHERE 1=1';
    const args: any[] = [];

    if (!includeInactive) {
      sql += ' AND isActive = 1';
    }

    if (category && category !== 'ALL') {
      sql += ' AND category = ?';
      args.push(category);
    }

    sql += ' ORDER BY category ASC, name ASC';

    const res = await db.execute({ sql, args });
    const products = res.rows as unknown as Product[];

    return NextResponse.json(
      { success: true, products },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      category = 'DRINKS',
      price,
      costPrice = 0,
      stock = 0,
      lowStockThreshold = 5,
      imageUrl = ''
    } = body;

    if (!name || price === undefined || price === null) {
      return NextResponse.json(
        { success: false, error: 'Product name and retail price are required' },
        { status: 400 }
      );
    }

    const id = 'prod-' + crypto.randomUUID().slice(0, 8);
    const createdAt = new Date().toISOString();

    await db.execute({
      sql: `INSERT INTO products (id, name, category, price, costPrice, stock, lowStockThreshold, imageUrl, isActive, createdAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
      args: [
        id,
        name.trim(),
        category,
        Number(price),
        Number(costPrice || 0),
        Number(stock || 0),
        Number(lowStockThreshold || 5),
        imageUrl || '',
        createdAt
      ]
    });

    const res = await db.execute({ sql: 'SELECT * FROM products WHERE id = ?', args: [id] });
    return NextResponse.json({ success: true, product: res.rows[0] });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ success: false, error: 'Failed to create product' }, { status: 500 });
  }
}
