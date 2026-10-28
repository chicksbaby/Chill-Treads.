-- ==============================================================================
-- CHILL TREADS: PostgreSQL Production Database Schema
-- Compatible with Supabase, Neon, AWS RDS, and Google Cloud SQL
-- ==============================================================================

-- 1. Automated Migrations Tracker
CREATE TABLE IF NOT EXISTS migrations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) UNIQUE NOT NULL,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 2. Orders Table (Customer PII and Authoritative Financials)
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

-- 3. Order Items Table (With cascading deletion upon parent order removal)
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

-- 4. Payment Transactions Table (Audit trail, idempotency, fraud detection)
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

-- 5. Admin Sessions Table (Server-side token validation and revocation)
CREATE TABLE IF NOT EXISTS admin_sessions (
  token VARCHAR(255) PRIMARY KEY,
  role VARCHAR(40) NOT NULL DEFAULT 'admin',
  created_at BIGINT NOT NULL,
  expires_at BIGINT NOT NULL,
  revoked_at BIGINT
);

-- Performance & Security Indexes
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_phone ON orders(phone);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_order_id ON payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_tx_id ON payment_transactions(transaction_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(token);

-- Seed Baseline Demo Data (Safely skip if records already exist)
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
) ON CONFLICT (id) DO NOTHING;

INSERT INTO order_items (
  order_id, product_id, name, size, color, quantity, price, image
) VALUES (
  'ord-1001', 'shadow-oversized-tee', 'Shadow Oversized Tee', 'L', 'Black', 1, 499,
  '/images/tee-shadow-black.jpg'
) ON CONFLICT DO NOTHING;
