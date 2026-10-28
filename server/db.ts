/**
 * CHILL TREADS Database Module
 * Dual Persistent Architecture:
 * 1. Hosted PostgreSQL (Supabase, Neon, AWS RDS, Cloud SQL) via 'pg' connection pooling.
 * 2. Embedded SQLite (better-sqlite3) with Write-Ahead Logging (WAL) for local dev & offline testing.
 */
import Database from 'better-sqlite3';
import pg from 'pg';
import path from 'path';
import fs from 'fs';

export interface DbOrder {
  id: string;
  order_number: string;
  order_secret_key: string;
  customer_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  subtotal: number;
  discount: number;
  shipping_fee: number;
  total: number;
  payment_method: string;
  payment_status: 'unpaid' | 'pending_verification' | 'paid' | 'failed' | 'refunded';
  status: 'pending' | 'supplier_ordered' | 'dispatched' | 'delivered' | 'cancelled';
  supplier_name?: string | null;
  supplier_order_id?: string | null;
  carrier_name?: string | null;
  tracking_number?: string | null;
  notes?: string | null;
  is_demo_order: number; // 1 for true, 0 for false
  created_at: string;
  updated_at: string;
}

export interface DbOrderItem {
  id?: number;
  order_id: string;
  product_id: string;
  name: string;
  size: string;
  color: string;
  quantity: number;
  price: number;
  image?: string | null;
}

export interface DbPaymentTransaction {
  id: string;
  order_id: string;
  gateway: string;
  transaction_id: string;
  payment_method: string;
  amount: number;
  currency: string;
  status: 'initiated' | 'success' | 'signature_failed' | 'amount_mismatch' | 'failed';
  raw_webhook_payload?: string | null;
  signature_verified: number;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Engine Selection: PostgreSQL (if DATABASE_URL / POSTGRES_URL) or SQLite
// ---------------------------------------------------------------------------
const pgConnectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.SUPABASE_DB_URL;
export const isPostgres = Boolean(pgConnectionString);

let pgPool: pg.Pool | null = null;
let sqliteDb: Database.Database | null = null;

if (isPostgres && pgConnectionString) {
  const isLocalPg = pgConnectionString.includes('localhost') || pgConnectionString.includes('127.0.0.1');
  pgPool = new pg.Pool({
    connectionString: pgConnectionString,
    ssl: isLocalPg ? false : { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });
  console.log('[CHILL TREADS DB] Initialized PostgreSQL connection pool');
} else {
  // SQLite Local Fallback
  try {
    const DB_DIR = path.resolve(process.cwd(), 'data');
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    const DB_PATH = process.env.DATABASE_PATH || path.join(DB_DIR, 'chill_treads.db');
    sqliteDb = new Database(DB_PATH);
    sqliteDb.pragma('journal_mode = WAL');
    sqliteDb.pragma('synchronous = NORMAL');
    sqliteDb.pragma('foreign_keys = ON');
    console.log('[CHILL TREADS DB] Initialized local SQLite database at:', DB_PATH);
  } catch (err: any) {
    console.warn('[CHILL TREADS DB] SQLite initialization warning:', err.message);
  }
}

export const db = sqliteDb;

/**
 * Run Automated Database Migrations
 */
export async function runMigrations(): Promise<void> {
  if (isPostgres && pgPool) {
    try {
      const client = await pgPool.connect();
      try {
        await client.query(`
          CREATE TABLE IF NOT EXISTS migrations (
            id SERIAL PRIMARY KEY,
            name VARCHAR(120) UNIQUE NOT NULL,
            applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
          );

          CREATE TABLE IF NOT EXISTS orders (
            id VARCHAR(64) PRIMARY KEY,
            order_number VARCHAR(32) UNIQUE NOT NULL,
            order_secret_key VARCHAR(64) NOT NULL,
            customer_name VARCHAR(120) NOT NULL,
            email VARCHAR(160) NOT NULL,
            phone VARCHAR(20) NOT NULL,
            address VARCHAR(255) NOT NULL,
            city VARCHAR(80) NOT NULL,
            state VARCHAR(80) NOT NULL,
            pincode VARCHAR(10) NOT NULL,
            subtotal INTEGER NOT NULL,
            discount INTEGER NOT NULL DEFAULT 0,
            shipping_fee INTEGER NOT NULL DEFAULT 0,
            total INTEGER NOT NULL,
            payment_method VARCHAR(40) NOT NULL,
            payment_status VARCHAR(30) NOT NULL DEFAULT 'unpaid',
            status VARCHAR(30) NOT NULL DEFAULT 'pending',
            supplier_name VARCHAR(120),
            supplier_order_id VARCHAR(80),
            carrier_name VARCHAR(80),
            tracking_number VARCHAR(120),
            notes TEXT,
            is_demo_order SMALLINT NOT NULL DEFAULT 1,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
          );

          CREATE TABLE IF NOT EXISTS order_items (
            id SERIAL PRIMARY KEY,
            order_id VARCHAR(64) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
            product_id VARCHAR(80) NOT NULL,
            name VARCHAR(120) NOT NULL,
            size VARCHAR(10) NOT NULL,
            color VARCHAR(40) NOT NULL,
            quantity INTEGER NOT NULL,
            price INTEGER NOT NULL,
            image TEXT
          );

          CREATE TABLE IF NOT EXISTS payment_transactions (
            id VARCHAR(120) PRIMARY KEY,
            order_id VARCHAR(64) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
            gateway VARCHAR(40) NOT NULL,
            transaction_id VARCHAR(120) NOT NULL,
            payment_method VARCHAR(40) NOT NULL,
            amount INTEGER NOT NULL,
            currency VARCHAR(10) NOT NULL DEFAULT 'INR',
            status VARCHAR(40) NOT NULL,
            raw_webhook_payload TEXT,
            signature_verified SMALLINT NOT NULL DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
          );

          CREATE TABLE IF NOT EXISTS admin_sessions (
            token VARCHAR(255) PRIMARY KEY,
            role VARCHAR(40) NOT NULL DEFAULT 'admin',
            created_at BIGINT NOT NULL,
            expires_at BIGINT NOT NULL,
            revoked_at BIGINT
          );

          CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
          CREATE INDEX IF NOT EXISTS idx_orders_phone ON orders(phone);
          CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
          CREATE INDEX IF NOT EXISTS idx_payment_transactions_order_id ON payment_transactions(order_id);
          CREATE INDEX IF NOT EXISTS idx_payment_transactions_tx_id ON payment_transactions(transaction_id);
          CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(token);
        `);
      } finally {
        client.release();
      }
    } catch (err: any) {
      console.error('[CHILL TREADS DB] PostgreSQL migration check error:', err.message);
    }
    return;
  }

  // SQLite Migrations
  if (sqliteDb) {
    sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        applied_at TEXT NOT NULL
      );
    `);

    const appliedRows = sqliteDb.prepare('SELECT name FROM migrations').all() as { name: string }[];
    const applied = new Set(appliedRows.map((r) => r.name));

    const migrations: { name: string; sql: string }[] = [
      {
        name: '001_initial_schema',
        sql: `
          CREATE TABLE IF NOT EXISTS orders (
            id TEXT PRIMARY KEY,
            order_number TEXT UNIQUE NOT NULL,
            order_secret_key TEXT NOT NULL,
            customer_name TEXT NOT NULL,
            email TEXT NOT NULL,
            phone TEXT NOT NULL,
            address TEXT NOT NULL,
            city TEXT NOT NULL,
            state TEXT NOT NULL,
            pincode TEXT NOT NULL,
            subtotal INTEGER NOT NULL,
            discount INTEGER NOT NULL DEFAULT 0,
            shipping_fee INTEGER NOT NULL DEFAULT 0,
            total INTEGER NOT NULL,
            payment_method TEXT NOT NULL,
            payment_status TEXT NOT NULL DEFAULT 'unpaid',
            status TEXT NOT NULL DEFAULT 'pending',
            supplier_name TEXT,
            supplier_order_id TEXT,
            carrier_name TEXT,
            tracking_number TEXT,
            notes TEXT,
            is_demo_order INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
          );

          CREATE TABLE IF NOT EXISTS order_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
            product_id TEXT NOT NULL,
            name TEXT NOT NULL,
            size TEXT NOT NULL,
            color TEXT NOT NULL,
            quantity INTEGER NOT NULL,
            price INTEGER NOT NULL,
            image TEXT
          );

          CREATE TABLE IF NOT EXISTS payment_transactions (
            id TEXT PRIMARY KEY,
            order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
            gateway TEXT NOT NULL,
            transaction_id TEXT NOT NULL,
            payment_method TEXT NOT NULL,
            amount INTEGER NOT NULL,
            currency TEXT NOT NULL DEFAULT 'INR',
            status TEXT NOT NULL,
            raw_webhook_payload TEXT,
            signature_verified INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL
          );

          CREATE TABLE IF NOT EXISTS admin_sessions (
            token TEXT PRIMARY KEY,
            role TEXT NOT NULL DEFAULT 'admin',
            created_at INTEGER NOT NULL,
            expires_at INTEGER NOT NULL,
            revoked_at INTEGER
          );

          CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
          CREATE INDEX IF NOT EXISTS idx_orders_phone ON orders(phone);
          CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
          CREATE INDEX IF NOT EXISTS idx_payment_transactions_order_id ON payment_transactions(order_id);
        `,
      },
      {
        name: '002_seed_demo_orders',
        sql: `
          INSERT OR IGNORE INTO orders (
            id, order_number, order_secret_key, customer_name, email, phone,
            address, city, state, pincode, subtotal, discount, shipping_fee,
            total, payment_method, payment_status, status, supplier_name,
            supplier_order_id, carrier_name, tracking_number, notes, is_demo_order,
            created_at, updated_at
          ) VALUES (
            'ord-1001', 'CT-2601', 'demo_secret_key_1001', 'Demo Customer A', 'demo-user-a@example.com',
            '9999900001', 'Demo Address Line 1, Sector 4', 'Bengaluru', 'Karnataka', '560001',
            499, 0, 0, 499, 'upi_demo', 'paid', 'supplier_ordered', 'Qikink POD Partner',
            'SUPP-DEMO-9812', 'Delhivery Surface', 'DEL1983049182', 'Simulated demo order', 1,
            datetime('now', '-1 day'), datetime('now')
          );

          INSERT OR IGNORE INTO order_items (
            order_id, product_id, name, size, color, quantity, price, image
          ) VALUES (
            'ord-1001', 'shadow-oversized-tee', 'Shadow Oversized Tee', 'L', 'Black', 1, 499,
            '/images/tee-shadow-black.jpg'
          );

          INSERT OR IGNORE INTO orders (
            id, order_number, order_secret_key, customer_name, email, phone,
            address, city, state, pincode, subtotal, discount, shipping_fee,
            total, payment_method, payment_status, status, is_demo_order,
            created_at, updated_at
          ) VALUES (
            'ord-1002', 'CT-2602', 'demo_secret_key_1002', 'Demo Customer B', 'demo-user-b@example.com',
            '9999900002', 'Demo Street B, Block C', 'Pune', 'Maharashtra', '411001',
            499, 0, 0, 499, 'cod', 'unpaid', 'pending', 1,
            datetime('now', '-2 hours'), datetime('now')
          );

          INSERT OR IGNORE INTO order_items (
            order_id, product_id, name, size, color, quantity, price, image
          ) VALUES (
            'ord-1002', 'minimal-logo-tee', 'Minimal Logo Tee', 'M', 'White', 1, 499,
            '/images/tee-minimal-white.jpg'
          );
        `,
      },
      {
        name: '003_payment_idempotency_index',
        sql: `
          CREATE INDEX IF NOT EXISTS idx_payment_transactions_tx_id ON payment_transactions(transaction_id);
        `,
      },
    ];

    const insertMigration = sqliteDb.prepare('INSERT INTO migrations (name, applied_at) VALUES (?, ?)');

    for (const m of migrations) {
      if (!applied.has(m.name)) {
        const tx = sqliteDb.transaction(() => {
          sqliteDb!.exec(m.sql);
          insertMigration.run(m.name, new Date().toISOString());
        });
        tx();
      }
    }
  }
}

// Run migrations on module import
runMigrations().catch((err) => console.error('[CHILL TREADS DB] Migration failure:', err));

/**
 * Data Access Layer (Repository Pattern)
 * Fully compatible with both PostgreSQL and SQLite.
 */
export const OrderRepo = {
  async createOrder(order: DbOrder, items: DbOrderItem[]): Promise<void> {
    if (isPostgres && pgPool) {
      const client = await pgPool.connect();
      try {
        await client.query('BEGIN');
        await client.query(
          `INSERT INTO orders (
            id, order_number, order_secret_key, customer_name, email, phone,
            address, city, state, pincode, subtotal, discount, shipping_fee,
            total, payment_method, payment_status, status, supplier_name,
            supplier_order_id, carrier_name, tracking_number, notes, is_demo_order,
            created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25)`,
          [
            order.id,
            order.order_number,
            order.order_secret_key,
            order.customer_name,
            order.email,
            order.phone,
            order.address,
            order.city,
            order.state,
            order.pincode,
            order.subtotal,
            order.discount ?? 0,
            order.shipping_fee ?? 0,
            order.total,
            order.payment_method,
            order.payment_status ?? 'unpaid',
            order.status ?? 'pending',
            order.supplier_name ?? null,
            order.supplier_order_id ?? null,
            order.carrier_name ?? null,
            order.tracking_number ?? null,
            order.notes ?? null,
            order.is_demo_order ? 1 : 0,
            order.created_at,
            order.updated_at,
          ]
        );

        for (const it of items) {
          await client.query(
            `INSERT INTO order_items (
              order_id, product_id, name, size, color, quantity, price, image
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
              order.id,
              it.product_id,
              it.name,
              it.size,
              it.color,
              it.quantity,
              it.price,
              it.image ?? null,
            ]
          );
        }
        await client.query('COMMIT');
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      } finally {
        client.release();
      }
      return;
    }

    if (sqliteDb) {
      const insertOrder = sqliteDb.prepare(`
        INSERT INTO orders (
          id, order_number, order_secret_key, customer_name, email, phone,
          address, city, state, pincode, subtotal, discount, shipping_fee,
          total, payment_method, payment_status, status, supplier_name,
          supplier_order_id, carrier_name, tracking_number, notes, is_demo_order,
          created_at, updated_at
        ) VALUES (
          @id, @order_number, @order_secret_key, @customer_name, @email, @phone,
          @address, @city, @state, @pincode, @subtotal, @discount, @shipping_fee,
          @total, @payment_method, @payment_status, @status, @supplier_name,
          @supplier_order_id, @carrier_name, @tracking_number, @notes, @is_demo_order,
          @created_at, @updated_at
        )
      `);

      const insertItem = sqliteDb.prepare(`
        INSERT INTO order_items (
          order_id, product_id, name, size, color, quantity, price, image
        ) VALUES (
          @order_id, @product_id, @name, @size, @color, @quantity, @price, @image
        )
      `);

      const tx = sqliteDb.transaction(() => {
        insertOrder.run({
          id: order.id,
          order_number: order.order_number,
          order_secret_key: order.order_secret_key,
          customer_name: order.customer_name,
          email: order.email,
          phone: order.phone,
          address: order.address,
          city: order.city,
          state: order.state,
          pincode: order.pincode,
          subtotal: order.subtotal,
          discount: order.discount ?? 0,
          shipping_fee: order.shipping_fee ?? 0,
          total: order.total,
          payment_method: order.payment_method,
          payment_status: order.payment_status ?? 'unpaid',
          status: order.status ?? 'pending',
          supplier_name: order.supplier_name ?? null,
          supplier_order_id: order.supplier_order_id ?? null,
          carrier_name: order.carrier_name ?? null,
          tracking_number: order.tracking_number ?? null,
          notes: order.notes ?? null,
          is_demo_order: order.is_demo_order ? 1 : 0,
          created_at: order.created_at,
          updated_at: order.updated_at,
        });

        for (const it of items) {
          insertItem.run({
            order_id: order.id,
            product_id: it.product_id,
            name: it.name,
            size: it.size,
            color: it.color,
            quantity: it.quantity,
            price: it.price,
            image: it.image ?? null,
          });
        }
      });

      tx();
    }
  },

  async getOrderById(id: string): Promise<(DbOrder & { items: DbOrderItem[] }) | null> {
    if (isPostgres && pgPool) {
      const orderRes = await pgPool.query('SELECT * FROM orders WHERE id = $1', [id]);
      if (orderRes.rows.length === 0) return null;
      const order = orderRes.rows[0] as DbOrder;
      const itemsRes = await pgPool.query('SELECT * FROM order_items WHERE order_id = $1', [id]);
      return { ...order, items: itemsRes.rows as DbOrderItem[] };
    }

    if (sqliteDb) {
      const order = sqliteDb.prepare('SELECT * FROM orders WHERE id = ?').get(id) as DbOrder | undefined;
      if (!order) return null;
      const items = sqliteDb.prepare('SELECT * FROM order_items WHERE order_id = ?').all(id) as DbOrderItem[];
      return { ...order, items };
    }
    return null;
  },

  async getOrderByOrderNumber(orderNumber: string): Promise<(DbOrder & { items: DbOrderItem[] }) | null> {
    if (isPostgres && pgPool) {
      const orderRes = await pgPool.query('SELECT * FROM orders WHERE LOWER(order_number) = LOWER($1)', [orderNumber]);
      if (orderRes.rows.length === 0) return null;
      const order = orderRes.rows[0] as DbOrder;
      const itemsRes = await pgPool.query('SELECT * FROM order_items WHERE order_id = $1', [order.id]);
      return { ...order, items: itemsRes.rows as DbOrderItem[] };
    }

    if (sqliteDb) {
      const order = sqliteDb.prepare('SELECT * FROM orders WHERE order_number = ? COLLATE NOCASE').get(orderNumber) as DbOrder | undefined;
      if (!order) return null;
      const items = sqliteDb.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id) as DbOrderItem[];
      return { ...order, items };
    }
    return null;
  },

  async getAllOrders(): Promise<(DbOrder & { items: DbOrderItem[] })[]> {
    if (isPostgres && pgPool) {
      const ordersRes = await pgPool.query('SELECT * FROM orders ORDER BY created_at DESC');
      const orders = ordersRes.rows as DbOrder[];
      const itemsRes = await pgPool.query('SELECT * FROM order_items');
      const allItems = itemsRes.rows as DbOrderItem[];
      const itemMap = new Map<string, DbOrderItem[]>();
      for (const it of allItems) {
        if (!itemMap.has(it.order_id)) itemMap.set(it.order_id, []);
        itemMap.get(it.order_id)!.push(it);
      }
      return orders.map((o) => ({
        ...o,
        items: itemMap.get(o.id) || [],
      }));
    }

    if (sqliteDb) {
      const orders = sqliteDb.prepare('SELECT * FROM orders ORDER BY created_at DESC').all() as DbOrder[];
      const itemsStmt = sqliteDb.prepare('SELECT * FROM order_items WHERE order_id = ?');
      return orders.map((o) => ({
        ...o,
        items: itemsStmt.all(o.id) as DbOrderItem[],
      }));
    }
    return [];
  },

  async updateOrderStatus(
    id: string,
    updates: {
      status?: DbOrder['status'];
      supplier_name?: string;
      supplier_order_id?: string;
      carrier_name?: string;
      tracking_number?: string;
      notes?: string;
      payment_status?: DbOrder['payment_status'];
    }
  ): Promise<boolean> {
    if (isPostgres && pgPool) {
      const current = await pgPool.query('SELECT id FROM orders WHERE id = $1 OR order_number = $2', [id, id]);
      if (current.rows.length === 0) return false;
      const targetId = current.rows[0].id;

      const fields: string[] = ['updated_at = CURRENT_TIMESTAMP'];
      const values: any[] = [];
      let idx = 1;

      if (updates.status) {
        fields.push(`status = $${idx++}`);
        values.push(updates.status);
      }
      if (updates.supplier_name !== undefined) {
        fields.push(`supplier_name = $${idx++}`);
        values.push(updates.supplier_name);
      }
      if (updates.supplier_order_id !== undefined) {
        fields.push(`supplier_order_id = $${idx++}`);
        values.push(updates.supplier_order_id);
      }
      if (updates.carrier_name !== undefined) {
        fields.push(`carrier_name = $${idx++}`);
        values.push(updates.carrier_name);
      }
      if (updates.tracking_number !== undefined) {
        fields.push(`tracking_number = $${idx++}`);
        values.push(updates.tracking_number);
      }
      if (updates.notes !== undefined) {
        fields.push(`notes = $${idx++}`);
        values.push(updates.notes);
      }
      if (updates.payment_status) {
        fields.push(`payment_status = $${idx++}`);
        values.push(updates.payment_status);
      }

      values.push(targetId);
      const sql = `UPDATE orders SET ${fields.join(', ')} WHERE id = $${idx}`;
      const res = await pgPool.query(sql, values);
      return (res.rowCount ?? 0) > 0;
    }

    if (sqliteDb) {
      const current = sqliteDb.prepare('SELECT id FROM orders WHERE id = ? OR order_number = ?').get(id, id) as { id: string } | undefined;
      if (!current) return false;

      const fields: string[] = ['updated_at = ?'];
      const values: any[] = [new Date().toISOString()];

      if (updates.status) {
        fields.push('status = ?');
        values.push(updates.status);
      }
      if (updates.supplier_name !== undefined) {
        fields.push('supplier_name = ?');
        values.push(updates.supplier_name);
      }
      if (updates.supplier_order_id !== undefined) {
        fields.push('supplier_order_id = ?');
        values.push(updates.supplier_order_id);
      }
      if (updates.carrier_name !== undefined) {
        fields.push('carrier_name = ?');
        values.push(updates.carrier_name);
      }
      if (updates.tracking_number !== undefined) {
        fields.push('tracking_number = ?');
        values.push(updates.tracking_number);
      }
      if (updates.notes !== undefined) {
        fields.push('notes = ?');
        values.push(updates.notes);
      }
      if (updates.payment_status) {
        fields.push('payment_status = ?');
        values.push(updates.payment_status);
      }

      values.push(current.id);
      const sql = `UPDATE orders SET ${fields.join(', ')} WHERE id = ?`;
      const res = sqliteDb.prepare(sql).run(...values);
      return res.changes > 0;
    }
    return false;
  },

  async deleteOrder(id: string): Promise<boolean> {
    if (isPostgres && pgPool) {
      const res = await pgPool.query('DELETE FROM orders WHERE id = $1 OR order_number = $2', [id, id]);
      return (res.rowCount ?? 0) > 0;
    }

    if (sqliteDb) {
      const res = sqliteDb.prepare('DELETE FROM orders WHERE id = ? OR order_number = ?').run(id, id);
      return res.changes > 0;
    }
    return false;
  },

  async recordPaymentTransaction(txRecord: DbPaymentTransaction): Promise<void> {
    if (isPostgres && pgPool) {
      await pgPool.query(
        `INSERT INTO payment_transactions (
          id, order_id, gateway, transaction_id, payment_method, amount,
          currency, status, raw_webhook_payload, signature_verified, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (id) DO UPDATE SET
          status = EXCLUDED.status,
          raw_webhook_payload = EXCLUDED.raw_webhook_payload,
          signature_verified = EXCLUDED.signature_verified`,
        [
          txRecord.id,
          txRecord.order_id,
          txRecord.gateway,
          txRecord.transaction_id,
          txRecord.payment_method,
          txRecord.amount,
          txRecord.currency ?? 'INR',
          txRecord.status,
          txRecord.raw_webhook_payload ?? null,
          txRecord.signature_verified ? 1 : 0,
          txRecord.created_at,
        ]
      );
      return;
    }

    if (sqliteDb) {
      sqliteDb.prepare(`
        INSERT OR REPLACE INTO payment_transactions (
          id, order_id, gateway, transaction_id, payment_method, amount,
          currency, status, raw_webhook_payload, signature_verified, created_at
        ) VALUES (
          @id, @order_id, @gateway, @transaction_id, @payment_method, @amount,
          @currency, @status, @raw_webhook_payload, @signature_verified, @created_at
        )
      `).run({
        id: txRecord.id,
        order_id: txRecord.order_id,
        gateway: txRecord.gateway,
        transaction_id: txRecord.transaction_id,
        payment_method: txRecord.payment_method,
        amount: txRecord.amount,
        currency: txRecord.currency ?? 'INR',
        status: txRecord.status,
        raw_webhook_payload: txRecord.raw_webhook_payload ?? null,
        signature_verified: txRecord.signature_verified ? 1 : 0,
        created_at: txRecord.created_at,
      });
    }
  },

  async getPaymentTransactions(orderId: string): Promise<DbPaymentTransaction[]> {
    if (isPostgres && pgPool) {
      const res = await pgPool.query('SELECT * FROM payment_transactions WHERE order_id = $1 ORDER BY created_at DESC', [orderId]);
      return res.rows as DbPaymentTransaction[];
    }

    if (sqliteDb) {
      return sqliteDb.prepare('SELECT * FROM payment_transactions WHERE order_id = ? ORDER BY created_at DESC').all(orderId) as DbPaymentTransaction[];
    }
    return [];
  },

  async getTransactionByTransactionId(transactionId: string): Promise<DbPaymentTransaction | null> {
    if (isPostgres && pgPool) {
      const res = await pgPool.query('SELECT * FROM payment_transactions WHERE transaction_id = $1 ORDER BY created_at DESC LIMIT 1', [transactionId]);
      return (res.rows[0] as DbPaymentTransaction) || null;
    }

    if (sqliteDb) {
      const row = sqliteDb.prepare('SELECT * FROM payment_transactions WHERE transaction_id = ? ORDER BY created_at DESC LIMIT 1').get(transactionId) as DbPaymentTransaction | undefined;
      return row || null;
    }
    return null;
  },

  async saveAdminSession(token: string, role = 'admin', ttlMs = 12 * 3600 * 1000): Promise<void> {
    const now = Date.now();
    if (isPostgres && pgPool) {
      await pgPool.query(
        `INSERT INTO admin_sessions (token, role, created_at, expires_at, revoked_at)
         VALUES ($1, $2, $3, $4, NULL)
         ON CONFLICT (token) DO UPDATE SET revoked_at = NULL, expires_at = EXCLUDED.expires_at`,
        [token, role, now, now + ttlMs]
      );
      return;
    }

    if (sqliteDb) {
      sqliteDb.prepare(`
        INSERT INTO admin_sessions (token, role, created_at, expires_at, revoked_at)
        VALUES (?, ?, ?, ?, NULL)
        ON CONFLICT(token) DO UPDATE SET revoked_at = NULL, expires_at = excluded.expires_at
      `).run(token, role, now, now + ttlMs);
    }
  },

  async isSessionValid(token: string): Promise<boolean> {
    const now = Date.now();
    if (isPostgres && pgPool) {
      const res = await pgPool.query('SELECT * FROM admin_sessions WHERE token = $1 AND revoked_at IS NULL AND expires_at > $2', [token, now]);
      return res.rows.length > 0;
    }

    if (sqliteDb) {
      const row = sqliteDb.prepare('SELECT * FROM admin_sessions WHERE token = ? AND revoked_at IS NULL AND expires_at > ?').get(token, now) as any;
      return !!row;
    }
    return false;
  },

  async revokeSession(token: string): Promise<void> {
    const now = Date.now();
    if (isPostgres && pgPool) {
      await pgPool.query('UPDATE admin_sessions SET revoked_at = $1 WHERE token = $2', [now, token]);
      return;
    }

    if (sqliteDb) {
      sqliteDb.prepare('UPDATE admin_sessions SET revoked_at = ? WHERE token = ?').run(now, token);
    }
  },

  async resetDemoData(): Promise<void> {
    if (isPostgres && pgPool) {
      const client = await pgPool.connect();
      try {
        await client.query('BEGIN');
        await client.query('DELETE FROM order_items');
        await client.query('DELETE FROM payment_transactions');
        await client.query('DELETE FROM orders');
        await client.query('DELETE FROM admin_sessions');
        await client.query(`
          INSERT INTO orders (
            id, order_number, order_secret_key, customer_name, email, phone,
            address, city, state, pincode, subtotal, discount, shipping_fee,
            total, payment_method, payment_status, status, supplier_name,
            supplier_order_id, carrier_name, tracking_number, notes, is_demo_order,
            created_at, updated_at
          ) VALUES (
            'ord-1001', 'CT-2601', 'demo_secret_key_1001', 'Demo Customer A', 'demo-user-a@example.com',
            '9999900001', 'Demo Address Line 1, Sector 4', 'Bengaluru', 'Karnataka', '560001',
            499, 0, 0, 499, 'upi_demo', 'paid', 'supplier_ordered', 'Qikink POD Partner',
            'SUPP-DEMO-9812', 'Delhivery Surface', 'DEL1983049182', 'Simulated demo order', 1,
            CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP
          )
        `);
        await client.query(`
          INSERT INTO order_items (
            order_id, product_id, name, size, color, quantity, price, image
          ) VALUES (
            'ord-1001', 'shadow-oversized-tee', 'Shadow Oversized Tee', 'L', 'Black', 1, 499,
            '/images/tee-shadow-black.jpg'
          )
        `);
        await client.query('COMMIT');
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      } finally {
        client.release();
      }
      return;
    }

    if (sqliteDb) {
      const tx = sqliteDb.transaction(() => {
        sqliteDb!.prepare('DELETE FROM order_items').run();
        sqliteDb!.prepare('DELETE FROM payment_transactions').run();
        sqliteDb!.prepare('DELETE FROM orders').run();
        sqliteDb!.prepare('DELETE FROM admin_sessions').run();

        const seedOrders = sqliteDb!.prepare(`
          INSERT INTO orders (
            id, order_number, order_secret_key, customer_name, email, phone,
            address, city, state, pincode, subtotal, discount, shipping_fee,
            total, payment_method, payment_status, status, supplier_name,
            supplier_order_id, carrier_name, tracking_number, notes, is_demo_order,
            created_at, updated_at
          ) VALUES (
            'ord-1001', 'CT-2601', 'demo_secret_key_1001', 'Demo Customer A', 'demo-user-a@example.com',
            '9999900001', 'Demo Address Line 1, Sector 4', 'Bengaluru', 'Karnataka', '560001',
            499, 0, 0, 499, 'upi_demo', 'paid', 'supplier_ordered', 'Qikink POD Partner',
            'SUPP-DEMO-9812', 'Delhivery Surface', 'DEL1983049182', 'Simulated demo order', 1,
            datetime('now', '-1 day'), datetime('now')
          )
        `);
        seedOrders.run();

        sqliteDb!.prepare(`
          INSERT INTO order_items (
            order_id, product_id, name, size, color, quantity, price, image
          ) VALUES (
            'ord-1001', 'shadow-oversized-tee', 'Shadow Oversized Tee', 'L', 'Black', 1, 499,
            '/images/tee-shadow-black.jpg'
          )
        `).run();
      });
      tx();
    }
  },
};
