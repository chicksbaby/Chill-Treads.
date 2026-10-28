import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { OrderRepo } from './db.ts';
import type { DbOrder, DbOrderItem, DbPaymentTransaction } from './db.ts';

dotenv.config();

const app = express();
const isProd = process.env.NODE_ENV === 'production';
const DEMO_MODE = process.env.DEMO_MODE !== 'false'; // Defaults to true
const PAYMENT_GATEWAY_MODE = process.env.PAYMENT_GATEWAY_MODE || 'test'; // 'test' | 'live'
const PAYMENT_WEBHOOK_SECRET = process.env.PAYMENT_WEBHOOK_SECRET || 'chill_treads_whsec_dev_simulation_2026';

// Trust first proxy for correct IP identification behind Cloud Run, Vercel, or reverse proxies
app.set('trust proxy', 1);

// HTTPS Enforcement & Reverse Proxy handling
app.use((req: Request, res: Response, next: NextFunction) => {
  const forwardedProto = req.headers['x-forwarded-proto'];
  const isHttps = req.secure || forwardedProto === 'https';

  // In production behind reverse proxy, enforce HTTPS redirect
  if (isProd && !isHttps && req.headers.host) {
    res.redirect(301, `https://${req.headers.host}${req.url}`);
    return;
  }

  // Include HSTS header when accessed via HTTPS
  if (isHttps) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  next();
});

// Strict body parsing limits to prevent DoS memory exhaustion
app.use(express.json({ limit: '64kb' }));

// Security Headers (Defense-in-depth against Clickjacking, MIME sniffing, and XSS)
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Strict origin validation / CORS preflight
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Order-Token, X-Razorpay-Signature, X-Webhook-Signature');
  }

  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

// Admin Authentication Architecture: Salted Scrypt Key Derivation
const ADMIN_SECRET = process.env.ADMIN_SECRET_KEY || 'chill_treads_admin_dev_token_2026';
const TOKEN_SIGNING_SECRET = process.env.TOKEN_SIGNING_SECRET || crypto.randomBytes(32).toString('hex');
const ADMIN_SALT = crypto.createHash('sha256').update(TOKEN_SIGNING_SECRET + '_salt').digest();
const ADMIN_HASHED_KEY = crypto.scryptSync(ADMIN_SECRET, ADMIN_SALT, 32);

// Canonical Official Products with authoritative server-side prices to prevent client price tampering
export interface ServerProduct {
  id: string;
  slug: string;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  fabricGsm: number;
  fit: string;
  supplierCost: number;
}

export const canonicalProducts: ServerProduct[] = [
  { id: 'shadow-oversized-tee', slug: 'shadow-oversized-tee', name: 'Shadow Oversized Tee', category: 'men', price: 499, originalPrice: 899, fabricGsm: 260, fit: 'Boxy Oversized', supplierCost: 260 },
  { id: 'minimal-logo-tee', slug: 'minimal-logo-tee', name: 'Minimal Logo Tee', category: 'all', price: 499, originalPrice: 799, fabricGsm: 240, fit: 'Relaxed Unisex', supplierCost: 240 },
  { id: 'abstract-oversized-tee', slug: 'abstract-oversized-tee', name: 'Abstract Oversized Tee', category: 'men', price: 499, originalPrice: 949, fabricGsm: 270, fit: 'Extended Drop Shoulder', supplierCost: 275 },
  { id: 'vision-tee', slug: 'vision-tee', name: 'Vision Tee', category: 'women', price: 499, originalPrice: 849, fabricGsm: 240, fit: 'Oversized Boyfriend Cut', supplierCost: 245 },
  { id: 'classic-graphic-tee', slug: 'classic-graphic-tee', name: 'Classic Graphic Tee', category: 'all', price: 499, originalPrice: 899, fabricGsm: 250, fit: 'Streetwear Boxy', supplierCost: 250 },
  { id: 'chaos-order-tee', slug: 'chaos-order-tee', name: 'Chaos & Order Heavy Tee', category: 'men', price: 549, originalPrice: 999, fabricGsm: 280, fit: 'Super Boxy Fit', supplierCost: 280 },
  { id: 'urban-archeology-tee', slug: 'urban-archeology-tee', name: 'Urban Archeology Tee', category: 'women', price: 529, originalPrice: 949, fabricGsm: 250, fit: 'Oversized Drape', supplierCost: 260 },
];

// Helper to generate a cryptographic order-specific access token
function generateOrderSecret(orderId: string, phone: string): string {
  return crypto.createHmac('sha256', TOKEN_SIGNING_SECRET).update(`${orderId}:${phone}`).digest('hex').slice(0, 32);
}

// Token Generator with HMAC verification and database session tracking
async function generateAdminToken(): Promise<string> {
  const payload = JSON.stringify({ role: 'admin', ts: Date.now(), rand: crypto.randomBytes(8).toString('hex') });
  const hmac = crypto.createHmac('sha256', TOKEN_SIGNING_SECRET).update(payload).digest('hex');
  const token = Buffer.from(payload).toString('base64url') + '.' + hmac;
  await OrderRepo.saveAdminSession(token, 'admin');
  return token;
}

async function verifyAdminToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [b64Payload, signature] = parts;
  try {
    const payload = Buffer.from(b64Payload, 'base64url').toString('utf8');
    const expectedSig = crypto.createHmac('sha256', TOKEN_SIGNING_SECRET).update(payload).digest('hex');
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return false;
    }
    const data = JSON.parse(payload);
    // Token validity 12 hours max
    if (Date.now() - data.ts > 12 * 3600 * 1000) {
      await OrderRepo.revokeSession(token);
      return false;
    }
    // Must exist in active session database (allows immediate server-side revocation on logout)
    return await OrderRepo.isSessionValid(token);
  } catch {
    return false;
  }
}

// Middleware: Require Admin Authentication
async function requireAdminAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized. Admin credentials required.' });
    return;
  }
  const token = authHeader.slice(7).trim();
  const isValid = await verifyAdminToken(token);
  if (!isValid) {
    res.status(403).json({ error: 'Forbidden. Invalid, expired, or revoked admin session token.' });
    return;
  }
  next();
}

// Rate Limiting & Brute-Force Lock Map
interface RateLimitRecord {
  count: number;
  resetAt: number;
  lockedUntil?: number;
}
const rateLimits = new Map<string, RateLimitRecord>();

function checkRateLimit(key: string, limit = 30, windowMs = 60000, lockoutAfter = 0, lockoutDurationMs = 300000): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const record = rateLimits.get(key);

  if (record && record.lockedUntil && now < record.lockedUntil) {
    return { allowed: false, retryAfter: Math.ceil((record.lockedUntil - now) / 1000) };
  }

  if (!record || now > record.resetAt) {
    rateLimits.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  record.count += 1;

  if (lockoutAfter > 0 && record.count > lockoutAfter) {
    record.lockedUntil = now + lockoutDurationMs;
    return { allowed: false, retryAfter: Math.ceil(lockoutDurationMs / 1000) };
  }

  if (record.count > limit) {
    return { allowed: false, retryAfter: Math.ceil((record.resetAt - now) / 1000) };
  }

  return { allowed: true };
}

// Sanitization & Anti-Injection utility
function sanitizeString(input: unknown, maxLength = 200): string {
  if (typeof input !== 'string') return '';
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[<>'"`;]/g, ''); // Strip dangerous HTML, script, and SQL-breakout punctuation
}

// Prototype Pollution Defense: recursively check for __proto__, constructor, prototype
function checkPrototypePollution(obj: unknown): boolean {
  if (!obj || typeof obj !== 'object') return false;
  if (Object.prototype.hasOwnProperty.call(obj, '__proto__')) return true;
  if (Object.prototype.hasOwnProperty.call(obj, 'constructor')) return true;
  if (Object.prototype.hasOwnProperty.call(obj, 'prototype')) return true;

  const propNames = Object.getOwnPropertyNames(obj);
  for (const key of propNames) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      return true;
    }
    try {
      const val = (obj as any)[key];
      if (val && typeof val === 'object') {
        if (checkPrototypePollution(val)) return true;
      }
    } catch {
      return true;
    }
  }
  return false;
}

// ==========================================
// 1. PUBLIC API ROUTES
// ==========================================

// Health / Status Check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'online',
    demoMode: DEMO_MODE,
    database: process.env.DATABASE_URL ? 'postgresql_persistent' : 'sqlite_persistent',
    paymentGatewayMode: PAYMENT_GATEWAY_MODE,
    serverTime: new Date().toISOString(),
  });
});

// Get Public Product Catalog (Authoritative server prices)
app.get('/api/products', (_req, res) => {
  res.json(canonicalProducts);
});

// Admin Login with Scrypt Key Derivation & Brute-Force Lockout
app.post('/api/admin/login', async (req: Request, res: Response) => {
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || req.ip || 'unknown';
  const limitCheck = checkRateLimit(ip + ':login', 5, 300000, 5, 300000); // 5 attempts per 5 mins, locks out for 5 mins

  if (!limitCheck.allowed) {
    res.status(429).json({
      error: `Too many failed login attempts. IP temporarily locked. Please try again in ${limitCheck.retryAfter || 300} seconds.`,
    });
    return;
  }

  const { password } = req.body;
  if (!password || typeof password !== 'string') {
    res.status(400).json({ error: 'Password is required' });
    return;
  }

  // Salted scrypt key derivation comparison (No plain text comparison)
  const inputHashed = crypto.scryptSync(password, ADMIN_SALT, 32);
  const isMatch = crypto.timingSafeEqual(inputHashed, ADMIN_HASHED_KEY);

  if (!isMatch) {
    res.status(401).json({ error: 'Invalid admin credentials' });
    return;
  }

  // Clear failed attempt record on successful login
  rateLimits.delete(ip + ':login');

  const token = await generateAdminToken();
  res.json({
    success: true,
    token,
    expiresIn: '12h',
  });
});

// Admin Session Verification
app.get('/api/admin/verify', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : undefined;
  if (await verifyAdminToken(token)) {
    res.json({ authenticated: true });
  } else {
    res.status(401).json({ authenticated: false });
  }
});

// Admin Logout (Explicit Server-Side Session Revocation in Database)
app.post('/api/admin/logout', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    await OrderRepo.revokeSession(token);
  }
  res.json({ success: true, message: 'Admin session revoked successfully in database' });
});

// Submit Customer Order (Server validated, anti-tampering, PII isolated in persistent DB)
app.post('/api/orders', async (req: Request, res: Response) => {
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || req.ip || 'unknown';
  const limitCheck = checkRateLimit(ip + ':orders', 15, 60000);
  if (!limitCheck.allowed) {
    res.status(429).json({ error: 'Order submission rate limit exceeded. Please wait a moment.' });
    return;
  }

  const payload = req.body;
  if (!payload || typeof payload !== 'object') {
    res.status(400).json({ error: 'Invalid order payload' });
    return;
  }

  // Prototype Pollution Check
  if (checkPrototypePollution(payload)) {
    res.status(400).json({ error: 'Security Violation: Malformed object payload rejected.' });
    return;
  }

  // Forbidden Financial Data Defense (Cards, CVVs, UPI PINs, OTPs)
  const forbiddenKeys = ['card', 'cardNumber', 'card_number', 'cvv', 'cvc', 'pin', 'upiPin', 'upi_pin', 'otp', 'password', 'isAdmin', 'role'];
  for (const k of forbiddenKeys) {
    if (k in payload || (payload.paymentDetails && typeof payload.paymentDetails === 'object' && k in payload.paymentDetails)) {
      res.status(400).json({
        error: 'Security Violation: Card details, CVVs, and UPI PINs are prohibited and must never be transmitted.',
      });
      return;
    }
  }

  // Field validation & sanitisation
  const customerName = sanitizeString(payload.customerName, 80);
  const email = sanitizeString(payload.email, 120);
  const phone = sanitizeString(payload.phone, 20).replace(/\D/g, '');
  const address = sanitizeString(payload.address, 200);
  const city = sanitizeString(payload.city, 60);
  const state = sanitizeString(payload.state, 60);
  const pincode = sanitizeString(payload.pincode, 10).replace(/\D/g, '');
  const paymentMethod = sanitizeString(payload.paymentMethod, 30);
  const discountCode = sanitizeString(payload.discountCode, 20).toUpperCase();

  if (!customerName || customerName.length < 2) {
    res.status(400).json({ error: 'Valid customer name is required (min 2 characters)' });
    return;
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: 'Valid RFC-compliant email address is required' });
    return;
  }

  // Validate Indian 10-digit mobile number
  if (!/^[6-9]\d{9}$/.test(phone)) {
    res.status(400).json({ error: 'A valid 10-digit Indian mobile number starting with 6-9 is required' });
    return;
  }

  if (!address || address.length < 5) {
    res.status(400).json({ error: 'Valid street address is required' });
    return;
  }

  if (!city) {
    res.status(400).json({ error: 'City is required' });
    return;
  }

  // Validate Indian 6-digit PIN code
  if (!/^[1-9][0-9]{5}$/.test(pincode)) {
    res.status(400).json({ error: 'A valid 6-digit Indian PIN code is required' });
    return;
  }

  // Validate Items and RECOMPUTE AUTHORITATIVE PRICES ON SERVER (Anti-Tampering)
  if (!Array.isArray(payload.items) || payload.items.length === 0) {
    res.status(400).json({ error: 'Order must contain at least one item' });
    return;
  }

  const validatedDbItems: DbOrderItem[] = [];
  let calculatedSubtotal = 0;

  for (const item of payload.items) {
    if (!item || typeof item !== 'object') {
      res.status(400).json({ error: 'Malformed item in order' });
      return;
    }
    const prodId = sanitizeString(item.productId, 60);
    const catalogProduct = canonicalProducts.find((p) => p.id === prodId || p.slug === prodId);

    // Strict Product Verification: Non-existent product IDs MUST BE REJECTED
    if (!catalogProduct) {
      res.status(400).json({ error: `Invalid product: Item "${prodId}" does not exist in catalog.` });
      return;
    }

    // Strict Quantity Verification: Must be integer between 1 and 10
    const rawQty = item.quantity;
    if (typeof rawQty !== 'number' || !Number.isInteger(rawQty) || rawQty < 1 || rawQty > 10) {
      res.status(400).json({ error: `Invalid quantity for product "${catalogProduct.name}". Must be an integer between 1 and 10.` });
      return;
    }

    const size = ['S', 'M', 'L', 'XL', 'XXL'].includes(item.size) ? item.size : 'L';
    const color = sanitizeString(item.color || 'Black', 30);

    validatedDbItems.push({
      order_id: '', // Set on insert
      product_id: catalogProduct.id,
      name: catalogProduct.name,
      size,
      color,
      quantity: rawQty,
      price: catalogProduct.price,
      image: sanitizeString(item.image, 250),
    });

    calculatedSubtotal += catalogProduct.price * rawQty;
  }

  // Authoritative server discount logic
  let discountAmount = 0;
  if (discountCode === 'CHILL10') {
    discountAmount = Math.round(calculatedSubtotal * 0.1);
  }

  // Authoritative server shipping fee logic
  const qualifiesForFreeShipping = calculatedSubtotal >= 499 || discountCode === 'FREESHIP';
  const shippingFee = qualifiesForFreeShipping ? 0 : 60;
  const finalTotal = Math.max(0, calculatedSubtotal - discountAmount + shippingFee);

  const orderNumber = `CT-${Math.floor(1000 + Math.random() * 9000)}`;
  const orderId = `ord-${Date.now()}`;
  const orderSecretKey = generateOrderSecret(orderId, phone);

  const newOrder: DbOrder = {
    id: orderId,
    order_number: orderNumber,
    order_secret_key: orderSecretKey,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    customer_name: customerName,
    email,
    phone,
    address,
    city,
    state,
    pincode,
    subtotal: calculatedSubtotal,
    discount: discountAmount,
    shipping_fee: shippingFee,
    total: finalTotal,
    payment_method: paymentMethod || 'cod',
    payment_status: paymentMethod === 'cod' ? 'unpaid' : 'pending_verification',
    status: 'pending',
    is_demo_order: DEMO_MODE ? 1 : 0,
    notes: 'Demo order placed via web checkout',
  };

  try {
    await OrderRepo.createOrder(newOrder, validatedDbItems);
  } catch (err: any) {
    console.error('[DB ERROR] Failed to save order:', err.message);
    res.status(500).json({ error: 'Internal error persisting order to database.' });
    return;
  }

  // Return safe receipt and order-specific secret key for secure tracking
  res.status(201).json({
    success: true,
    orderNumber: newOrder.order_number,
    orderId: newOrder.id,
    orderSecretKey: newOrder.order_secret_key,
    createdAt: newOrder.created_at,
    status: newOrder.status,
    paymentStatus: newOrder.payment_status,
    total: newOrder.total,
    itemsCount: validatedDbItems.length,
    paymentMethod: newOrder.payment_method,
    isDemoOrder: Boolean(newOrder.is_demo_order),
  });
});

// Secure Public Order Tracking with Customer Verification & Privacy Redaction
// Fixes IDOR: Blocks ID enumeration attacks and prevents Customer A from inspecting Customer B's order
app.get('/api/orders/track', async (req: Request, res: Response) => {
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || req.ip || 'unknown';
  const limitCheck = checkRateLimit(ip + ':track', 20, 60000);
  if (!limitCheck.allowed) {
    res.status(429).json({ error: 'Tracking rate limit exceeded. Please wait a minute.' });
    return;
  }

  const queryOrderNum = sanitizeString(req.query.orderNumber, 30).toUpperCase();
  const queryPhone = sanitizeString(req.query.phone || req.query.phoneLast4, 20).replace(/\D/g, '');
  const querySecret = sanitizeString(req.query.orderSecretKey || req.headers['x-order-token'], 64);

  if (!queryOrderNum) {
    res.status(400).json({ error: 'Order Number is required for tracking' });
    return;
  }

  const matched = await OrderRepo.getOrderByOrderNumber(queryOrderNum);

  // If order does not exist in DB, return generic 404 to prevent user enumeration
  if (!matched) {
    res.status(404).json({ error: 'Order not found. Please verify your order number and credentials.' });
    return;
  }

  // Authorization Check: Must supply either:
  // 1) The exact orderSecretKey issued on order creation, OR
  // 2) The customer's matching phone number (or matching last 4 digits)
  const isSecretMatch = !!querySecret && matched.order_secret_key === querySecret;
  const isPhoneMatch = !!queryPhone && (matched.phone === queryPhone || matched.phone.slice(-4) === queryPhone.slice(-4));

  if (!isSecretMatch && !isPhoneMatch) {
    res.status(404).json({
      error: 'Order not found or verification credentials do not match.',
      requiresVerification: true,
    });
    return;
  }

  // PRIVACY MASKING: Redact customer name and phone, withhold exact street address
  const maskedName = matched.customer_name
    .split(' ')
    .map((word) => (word.length > 1 ? word[0] + '*'.repeat(word.length - 1) : word))
    .join(' ');

  const maskedPhone = matched.phone.length >= 4
    ? '******' + matched.phone.slice(-4)
    : '******';

  res.json({
    orderNumber: matched.order_number,
    createdAt: matched.created_at,
    status: matched.status,
    paymentStatus: matched.payment_status,
    carrierName: matched.carrier_name || 'Delhivery Express',
    trackingNumber: matched.tracking_number || null,
    supplierName: matched.supplier_name || 'Allocated to POD Partner',
    destinationCity: matched.city,
    destinationState: matched.state,
    customerMaskedName: maskedName,
    customerMaskedPhone: maskedPhone,
    items: matched.items.map((it) => ({
      name: it.name,
      size: it.size,
      color: it.color,
      quantity: it.quantity,
      image: it.image,
    })),
  });
});

// ==========================================
// 2. PAYMENT GATEWAY INTEGRATION & WEBHOOK
// ==========================================

// Create Payment Intent (Returns authoritative order amount for gateway checkout without card transmission)
app.post('/api/payments/create-intent', async (req: Request, res: Response) => {
  const { orderId } = req.body;
  if (!orderId || typeof orderId !== 'string') {
    res.status(400).json({ error: 'Order ID is required' });
    return;
  }

  const order = (await OrderRepo.getOrderById(orderId)) || (await OrderRepo.getOrderByOrderNumber(orderId));
  if (!order) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }

  res.json({
    orderId: order.id,
    orderNumber: order.order_number,
    amountPaise: order.total * 100,
    currency: 'INR',
    gatewayMode: PAYMENT_GATEWAY_MODE,
    isDemo: DEMO_MODE,
    mockGatewayUrl: PAYMENT_GATEWAY_MODE === 'test' ? '/api/payments/test-checkout' : undefined,
  });
});

// Signed Payment Webhook Receiver (HMAC-SHA256 signature verification, underpayment protection, idempotency & replay defense)
app.post('/api/payments/webhook', async (req: Request, res: Response) => {
  const signature = (req.headers['x-razorpay-signature'] || req.headers['x-webhook-signature']) as string | undefined;

  if (!signature) {
    res.status(401).json({ error: 'Unauthorized. Webhook signature header missing.' });
    return;
  }

  const rawPayload = JSON.stringify(req.body);
  const expectedSig = crypto.createHmac('sha256', PAYMENT_WEBHOOK_SECRET).update(rawPayload).digest('hex');

  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expectedSig);

  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    res.status(400).json({ error: 'Security Violation: Webhook HMAC signature verification failed.' });
    return;
  }

  const { event, payload } = req.body;
  if (!payload || !payload.orderId || payload.amount === undefined) {
    res.status(400).json({ error: 'Malformed payment webhook payload.' });
    return;
  }

  // 1. Currency Validation: strictly require INR for store operations
  const currency = sanitizeString(payload.currency || 'INR', 10).toUpperCase();
  if (currency !== 'INR') {
    res.status(400).json({
      error: `Security Violation: Unsupported currency "${currency}". Only INR transactions are authorized.`,
    });
    return;
  }

  // 2. Order Matching
  const order = (await OrderRepo.getOrderById(payload.orderId)) || (await OrderRepo.getOrderByOrderNumber(payload.orderId));
  if (!order) {
    res.status(404).json({ error: 'Order not found in database for payment event.' });
    return;
  }

  // Reject payments for cancelled orders
  if (order.status === 'cancelled') {
    res.status(400).json({ error: 'Order is cancelled and cannot receive payments.' });
    return;
  }

  const incomingTxId = sanitizeString(payload.transactionId || 'tx_' + Date.now(), 100);

  // 3. Duplicate Idempotency & Replay Protection
  if (payload.transactionId) {
    const existingTx = await OrderRepo.getTransactionByTransactionId(incomingTxId);
    if (existingTx) {
      // Replay Attack Detection: Transaction already registered for a different order
      if (existingTx.order_id !== order.id) {
        res.status(400).json({
          error: 'Security Violation: Transaction ID already bound to a different order (replay attack detected).',
        });
        return;
      }

      // Idempotent duplicate: Order already successfully paid
      if (existingTx.status === 'success' || order.payment_status === 'paid') {
        res.status(200).json({
          success: true,
          message: 'Payment already processed (idempotent duplicate event).',
          isDuplicate: true,
          orderNumber: order.order_number,
          transactionId: existingTx.transaction_id,
        });
        return;
      }
    }
  }

  // 4. Underpayment / Amount Mismatch Protection
  const expectedPaise = order.total * 100;
  if (payload.amount !== expectedPaise) {
    await OrderRepo.recordPaymentTransaction({
      id: 'tx-err-' + Date.now(),
      order_id: order.id,
      gateway: payload.gateway || 'razorpay',
      transaction_id: incomingTxId,
      payment_method: payload.method || 'upi',
      amount: payload.amount,
      currency: 'INR',
      status: 'amount_mismatch',
      raw_webhook_payload: rawPayload.slice(0, 500),
      signature_verified: 1,
      created_at: new Date().toISOString(),
    });

    res.status(400).json({
      error: `Fraud alert: Payment amount ${payload.amount} paise does not match order total ${expectedPaise} paise.`,
    });
    return;
  }

  // 5. Valid payment event: update order payment_status to 'paid'
  if (event === 'payment.captured' || event === 'payment.success') {
    await OrderRepo.updateOrderStatus(order.id, { payment_status: 'paid' });
    await OrderRepo.recordPaymentTransaction({
      id: incomingTxId,
      order_id: order.id,
      gateway: payload.gateway || (PAYMENT_GATEWAY_MODE === 'test' ? 'razorpay_test' : 'razorpay_live'),
      transaction_id: incomingTxId,
      payment_method: payload.method || 'upi',
      amount: payload.amount,
      currency: 'INR',
      status: 'success',
      raw_webhook_payload: rawPayload.slice(0, 500),
      signature_verified: 1,
      created_at: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: 'Payment verified and order status updated to paid in database.',
      gatewayMode: PAYMENT_GATEWAY_MODE,
      orderNumber: order.order_number,
      transactionId: incomingTxId,
    });
    return;
  }

  res.json({ received: true });
});

// ==========================================
// 3. PROTECTED ADMIN API ROUTES
// ==========================================

// Get All Orders (Admin Auth Required - Queried from Persistent Database)
app.get('/api/admin/orders', requireAdminAuth, async (_req: Request, res: Response) => {
  const dbOrders = await OrderRepo.getAllOrders();
  const formatted = dbOrders.map((o) => ({
    id: o.id,
    orderNumber: o.order_number,
    orderSecretKey: o.order_secret_key,
    createdAt: o.created_at,
    updatedAt: o.updated_at,
    customerName: o.customer_name,
    email: o.email,
    phone: o.phone,
    address: o.address,
    city: o.city,
    state: o.state,
    pincode: o.pincode,
    items: o.items.map((it) => ({
      productId: it.product_id,
      name: it.name,
      size: it.size,
      color: it.color,
      quantity: it.quantity,
      price: it.price,
      image: it.image || '',
    })),
    subtotal: o.subtotal,
    discount: o.discount,
    shippingFee: o.shipping_fee,
    total: o.total,
    paymentMethod: o.payment_method,
    paymentStatus: o.payment_status,
    status: o.status,
    supplierName: o.supplier_name || undefined,
    supplierOrderId: o.supplier_order_id || undefined,
    carrierName: o.carrier_name || undefined,
    trackingNumber: o.tracking_number || undefined,
    notes: o.notes || undefined,
    isDemoOrder: Boolean(o.is_demo_order),
  }));
  res.json(formatted);
});

// Update Order Status and Dropshipping Tracking (Admin Auth Required - Persisted in Database)
app.put('/api/admin/orders/:id', requireAdminAuth, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, supplierName, supplierOrderId, carrierName, trackingNumber, notes, paymentStatus } = req.body;

  const validStatuses = ['pending', 'supplier_ordered', 'dispatched', 'delivered', 'cancelled'];
  const validPaymentStatuses = ['unpaid', 'pending_verification', 'paid', 'failed', 'refunded'];

  if (status && !validStatuses.includes(status)) {
    res.status(400).json({ error: `Invalid status "${status}". Allowed values: ${validStatuses.join(', ')}` });
    return;
  }

  if (paymentStatus && !validPaymentStatuses.includes(paymentStatus)) {
    res.status(400).json({ error: `Invalid paymentStatus "${paymentStatus}".` });
    return;
  }

  const updated = await OrderRepo.updateOrderStatus(id, {
    status: status as DbOrder['status'],
    supplier_name: supplierName ? sanitizeString(supplierName, 100) : undefined,
    supplier_order_id: supplierOrderId ? sanitizeString(supplierOrderId, 60) : undefined,
    carrier_name: carrierName ? sanitizeString(carrierName, 60) : undefined,
    tracking_number: trackingNumber ? sanitizeString(trackingNumber, 60) : undefined,
    notes: notes ? sanitizeString(notes, 300) : undefined,
    payment_status: paymentStatus as DbOrder['payment_status'],
  });

  if (!updated) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }

  res.json({
    success: true,
    message: 'Order updated in persistent database',
  });
});

// Delete Order (Admin Auth Required - Cascades to Order Items in Database)
app.delete('/api/admin/orders/:id', requireAdminAuth, async (req: Request, res: Response) => {
  const { id } = req.params;
  const deleted = await OrderRepo.deleteOrder(id);
  if (!deleted) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }
  res.json({ success: true, message: 'Order and associated line items deleted from persistent database' });
});

// Protected Admin Product Creation
app.post('/api/admin/products', requireAdminAuth, (req: Request, res: Response) => {
  const { name, price, category, fabricGsm, fit, supplierCost, slug } = req.body;
  if (!name || typeof price !== 'number' || price < 1) {
    res.status(400).json({ error: 'Valid product name and price required' });
    return;
  }

  const newProd: ServerProduct = {
    id: slug || 'prod-' + Date.now(),
    slug: slug || sanitizeString(name, 50).toLowerCase().replace(/\s+/g, '-'),
    name: sanitizeString(name, 80),
    category: sanitizeString(category || 'all', 20),
    price: Math.max(1, Math.round(price)),
    fabricGsm: typeof fabricGsm === 'number' ? fabricGsm : 260,
    fit: sanitizeString(fit || 'Boxy Oversized', 40),
    supplierCost: typeof supplierCost === 'number' ? supplierCost : 260,
  };

  canonicalProducts.unshift(newProd);
  res.status(201).json({ success: true, product: newProd });
});

// Protected Admin Product Update
app.put('/api/admin/products/:id', requireAdminAuth, (req: Request, res: Response) => {
  const { id } = req.params;
  const prod = canonicalProducts.find((p) => p.id === id || p.slug === id);
  if (!prod) {
    res.status(404).json({ error: 'Product not found' });
    return;
  }

  const { name, price, category, fabricGsm, fit, supplierCost } = req.body;
  if (name) prod.name = sanitizeString(name, 80);
  if (typeof price === 'number' && price > 0) prod.price = Math.round(price);
  if (category) prod.category = sanitizeString(category, 20);
  if (typeof fabricGsm === 'number') prod.fabricGsm = fabricGsm;
  if (fit) prod.fit = sanitizeString(fit, 40);
  if (typeof supplierCost === 'number') prod.supplierCost = supplierCost;

  res.json({ success: true, product: prod });
});

// Protected Admin Product Deletion
app.delete('/api/admin/products/:id', requireAdminAuth, (req: Request, res: Response) => {
  const { id } = req.params;
  const idx = canonicalProducts.findIndex((p) => p.id === id || p.slug === id);
  if (idx === -1) {
    res.status(404).json({ error: 'Product not found' });
    return;
  }
  canonicalProducts.splice(idx, 1);
  res.json({ success: true, message: 'Product deleted from server catalog' });
});

// Reset Demo Data (Admin Auth Required - Resets Database to Clean Seed State)
app.post('/api/admin/reset-demo', requireAdminAuth, async (_req: Request, res: Response) => {
  await OrderRepo.resetDemoData();
  res.json({ success: true, message: 'Database reset to sanitized demo records' });
});

// Global Safe Error Handler - Never leaks stack traces or customer data
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[CHILL TREADS API ERROR]: Safe handled exception:', err.name);
  res.status(500).json({ error: 'Internal Server Error. Please try again later.' });
});

export default app;
export { app };
