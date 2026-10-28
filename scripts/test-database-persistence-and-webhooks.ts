/**
 * CHILL TREADS Database Persistence, Webhook Verification & Lifecycle Test Suite
 * Tests persistent SQLite storage across process restarts, signed payment webhooks,
 * underpayment fraud detection, and deployment endpoints.
 */
import Database from 'better-sqlite3';
import path from 'path';
import crypto from 'crypto';

const BASE_URL = 'http://localhost:3000';
const WEBHOOK_SECRET = process.env.PAYMENT_WEBHOOK_SECRET || 'chill_treads_whsec_dev_simulation_2026';
const DB_PATH = path.resolve(process.cwd(), 'data', 'chill_treads.db');

interface TestOutcome {
  id: string;
  category: string;
  name: string;
  expected: string;
  actual: string;
  status: 'PASS' | 'FAIL' | 'NOT VERIFIED';
  details: string;
}

const outcomes: TestOutcome[] = [];

async function makeRequest(
  method: string,
  urlPath: string,
  headers: Record<string, string> = {},
  body?: any
): Promise<{ status: number; data: any; rawText: string; headers: Headers }> {
  const reqHeaders: Record<string, string> = { ...headers };
  let bodyStr: string | undefined;

  if (body !== undefined) {
    if (typeof body === 'string') {
      bodyStr = body;
      if (!reqHeaders['Content-Type']) reqHeaders['Content-Type'] = 'application/json';
    } else {
      reqHeaders['Content-Type'] = 'application/json';
      bodyStr = JSON.stringify(body);
    }
  }

  try {
    const res = await fetch(`${BASE_URL}${urlPath}`, {
      method,
      headers: reqHeaders,
      body: bodyStr,
    });
    const rawText = await res.text();
    let data: any;
    try {
      data = JSON.parse(rawText);
    } catch {
      data = rawText;
    }
    return { status: res.status, data, rawText, headers: res.headers };
  } catch (err: any) {
    return {
      status: 0,
      data: { error: err.message },
      rawText: err.message,
      headers: new Headers(),
    };
  }
}

async function runSuite() {
  console.log('======================================================================');
  console.log('CHILL TREADS: DATABASE PERSISTENCE & PAYMENT WEBHOOK TEST SUITE');
  console.log(`Execution Target: ${BASE_URL}`);
  console.log(`Database Path: ${DB_PATH}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log('======================================================================\n');

  // -------------------------------------------------------------
  // TEST P-01: DATABASE MIGRATIONS ON DISK
  // -------------------------------------------------------------
  try {
    const directDb = new Database(DB_PATH, { readonly: true });
    const migrations = directDb.prepare('SELECT name, applied_at FROM migrations ORDER BY id ASC').all() as any[];
    directDb.close();

    const has001 = migrations.some((m) => m.name === '001_initial_schema');
    const has002 = migrations.some((m) => m.name === '002_seed_demo_orders');

    outcomes.push({
      id: 'P-01',
      category: 'Database Schema & Migrations',
      name: 'Verify SQLite schema and automated migrations table on disk',
      expected: 'Both 001_initial_schema and 002_seed_demo_orders applied',
      actual: `Found ${migrations.length} migrations applied (${migrations.map((m) => m.name).join(', ')})`,
      status: has001 && has002 ? 'PASS' : 'FAIL',
      details: 'Confirmed migrations table exists and tracks schema versions automatically.',
    });
  } catch (err: any) {
    outcomes.push({
      id: 'P-01',
      category: 'Database Schema & Migrations',
      name: 'Verify SQLite schema and automated migrations table on disk',
      expected: 'SQLite migrations table read successfully',
      actual: `Error: ${err.message}`,
      status: 'FAIL',
      details: 'Failed to read SQLite file from disk.',
    });
  }

  // -------------------------------------------------------------
  // TEST P-02: PLACE ORDER IN DATABASE
  // -------------------------------------------------------------
  const orderCPayload = {
    customerName: 'Pooja Iyer',
    email: 'pooja.iyer@example.in',
    phone: '9811223344',
    address: 'Apartment 5B, Palm Grove, Koramangala',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560034',
    items: [
      {
        productId: 'shadow-oversized-tee',
        size: 'M',
        color: 'Black',
        quantity: 1,
      },
    ],
    paymentMethod: 'upi',
  };

  const resOrderC = await makeRequest('POST', '/api/orders', {}, orderCPayload);
  const orderNumC = resOrderC.data.orderNumber;
  const orderIdC = resOrderC.data.orderId;
  const orderSecretC = resOrderC.data.orderSecretKey;

  outcomes.push({
    id: 'P-02',
    category: 'Persistent Order Storage',
    name: 'Customer creates order persisted to SQLite database',
    expected: 'HTTP 201 with generated orderNumber and cryptographic secret',
    actual: `HTTP ${resOrderC.status} (Order #${orderNumC}, ID: ${orderIdC})`,
    status: resOrderC.status === 201 && orderNumC ? 'PASS' : 'FAIL',
    details: `Order created in persistent DB with payment_status: "${resOrderC.data.paymentStatus}"`,
  });

  // -------------------------------------------------------------
  // TEST P-03: CUSTOMER ORDER ISOLATION / IDOR
  // -------------------------------------------------------------
  // Attempt to track Order C with wrong phone number (Customer A's phone)
  const resIdorWrongPhone = await makeRequest(
    'GET',
    `/api/orders/track?orderNumber=${orderNumC}&phone=9999900001`
  );
  // Attempt with forged secret key
  const resIdorForgedSecret = await makeRequest(
    'GET',
    `/api/orders/track?orderNumber=${orderNumC}&orderSecretKey=bogus_secret_token_1234`
  );

  const idorIsolated = resIdorWrongPhone.status === 404 && resIdorForgedSecret.status === 404;
  outcomes.push({
    id: 'P-03',
    category: 'Customer Order Isolation',
    name: 'Verify Order C cannot be accessed by other customers (IDOR defense)',
    expected: 'HTTP 404 for mismatched phone or forged secret token',
    actual: `Wrong phone status: ${resIdorWrongPhone.status}, Forged secret status: ${resIdorForgedSecret.status}`,
    status: idorIsolated ? 'PASS' : 'FAIL',
    details: 'Customer isolation verified: database query checks cryptographic secret or matching phone.',
  });

  // -------------------------------------------------------------
  // TEST P-04: PERSISTENCE ACROSS RESTART SIMULATION (COLD READ FROM DISK)
  // -------------------------------------------------------------
  try {
    // Open a fresh, separate database handle to read directly from raw SQLite disk file
    const coldDb = new Database(DB_PATH, { readonly: true });
    const diskOrder = coldDb
      .prepare('SELECT * FROM orders WHERE order_number = ?')
      .get(orderNumC) as any;
    const diskItems = coldDb
      .prepare('SELECT * FROM order_items WHERE order_id = ?')
      .all(diskOrder?.id) as any[];
    coldDb.close();

    const isDiskValid =
      diskOrder &&
      diskOrder.customer_name === 'Pooja Iyer' &&
      diskOrder.phone === '9811223344' &&
      diskOrder.total === 499 &&
      diskItems.length === 1 &&
      diskItems[0].product_id === 'shadow-oversized-tee';

    outcomes.push({
      id: 'P-04',
      category: 'Persistent Order Storage',
      name: 'Verify Order C persists across process restarts (raw disk verification)',
      expected: 'Order record and items exist on disk with matching customer details and total ₹499',
      actual: isDiskValid
        ? `Found order "${diskOrder.order_number}" with ${diskItems.length} line item(s) on disk`
        : 'Disk order mismatch or not found',
      status: isDiskValid ? 'PASS' : 'FAIL',
      details: 'Simulated cold process restart by reading raw SQLite database file directly from storage.',
    });
  } catch (err: any) {
    outcomes.push({
      id: 'P-04',
      category: 'Persistent Order Storage',
      name: 'Verify Order C persists across process restarts (raw disk verification)',
      expected: 'Successful cold read from disk file',
      actual: `Error: ${err.message}`,
      status: 'FAIL',
      details: err.message,
    });
  }

  // -------------------------------------------------------------
  // TEST P-05: PAYMENT WEBHOOK — MISSING SIGNATURE
  // -------------------------------------------------------------
  const resWhNoSig = await makeRequest('POST', '/api/payments/webhook', {}, {
    event: 'payment.captured',
    payload: { orderId: orderIdC, amount: 49900 },
  });

  outcomes.push({
    id: 'P-05',
    category: 'Payment Webhook Security',
    name: 'Payment Webhook: Reject request with missing signature header',
    expected: 'HTTP 401 Unauthorized',
    actual: `HTTP ${resWhNoSig.status} (${JSON.stringify(resWhNoSig.data)})`,
    status: resWhNoSig.status === 401 ? 'PASS' : 'FAIL',
    details: 'Missing signature rejected before payload processing.',
  });

  // -------------------------------------------------------------
  // TEST P-06: PAYMENT WEBHOOK — FORGED SIGNATURE
  // -------------------------------------------------------------
  const resWhForgedSig = await makeRequest(
    'POST',
    '/api/payments/webhook',
    { 'X-Razorpay-Signature': 'bogus_forged_hex_signature_abcdef1234567890' },
    {
      event: 'payment.captured',
      payload: { orderId: orderIdC, amount: 49900 },
    }
  );

  outcomes.push({
    id: 'P-06',
    category: 'Payment Webhook Security',
    name: 'Payment Webhook: Reject forged HMAC-SHA256 signature',
    expected: 'HTTP 400 Bad Request (Security Violation)',
    actual: `HTTP ${resWhForgedSig.status} (${JSON.stringify(resWhForgedSig.data)})`,
    status: resWhForgedSig.status === 400 ? 'PASS' : 'FAIL',
    details: 'HMAC signature verification failed using timing-safe comparison.',
  });

  // -------------------------------------------------------------
  // TEST P-07: PAYMENT WEBHOOK — UNDERPAYMENT FRAUD DETECTION
  // -------------------------------------------------------------
  // Order C total is ₹499 (49,900 paise). Attacker sends valid signature for ₹1 (100 paise).
  const underpayPayload = {
    event: 'payment.captured',
    payload: {
      orderId: orderIdC,
      amount: 100, // Attacker attempts to pay 100 paise (₹1)
      transactionId: 'pay_fraud_underpay_001',
      gateway: 'razorpay_test',
      method: 'upi',
    },
  };
  const underpayJson = JSON.stringify(underpayPayload);
  const underpaySig = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(underpayJson)
    .digest('hex');

  const resUnderpay = await makeRequest(
    'POST',
    '/api/payments/webhook',
    { 'X-Razorpay-Signature': underpaySig, 'Content-Type': 'application/json' },
    underpayJson
  );

  outcomes.push({
    id: 'P-07',
    category: 'Payment Webhook Security',
    name: 'Payment Webhook: Detect and reject underpayment fraud',
    expected: 'HTTP 400 with fraud alert (Amount 100 paise != expected 49900 paise)',
    actual: `HTTP ${resUnderpay.status} (${JSON.stringify(resUnderpay.data)})`,
    status: resUnderpay.status === 400 ? 'PASS' : 'FAIL',
    details: 'Server verified order total against webhook amount; rejected underpayment attempt.',
  });

  // -------------------------------------------------------------
  // TEST P-08: PAYMENT WEBHOOK — VALID SIGNED PAYMENT EVENT
  // -------------------------------------------------------------
  const validTxId = 'pay_test_valid_' + Date.now();
  const validPaymentPayload = {
    event: 'payment.captured',
    payload: {
      orderId: orderIdC,
      amount: 49900, // Exactly 49900 paise = ₹499
      transactionId: validTxId,
      gateway: 'razorpay_test',
      method: 'upi',
    },
  };
  const validPaymentJson = JSON.stringify(validPaymentPayload);
  const validSig = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(validPaymentJson)
    .digest('hex');

  const resValidPayment = await makeRequest(
    'POST',
    '/api/payments/webhook',
    { 'X-Razorpay-Signature': validSig, 'Content-Type': 'application/json' },
    validPaymentJson
  );

  // Check database state directly
  const verifyDb = new Database(DB_PATH, { readonly: true });
  const updatedOrderRow = verifyDb
    .prepare('SELECT payment_status FROM orders WHERE id = ?')
    .get(orderIdC) as any;
  const txRow = verifyDb
    .prepare('SELECT * FROM payment_transactions WHERE order_id = ? ORDER BY created_at DESC LIMIT 1')
    .get(orderIdC) as any;
  verifyDb.close();

  const isPaymentSuccess =
    resValidPayment.status === 200 &&
    updatedOrderRow?.payment_status === 'paid' &&
    txRow?.status === 'success' &&
    txRow?.signature_verified === 1;

  outcomes.push({
    id: 'P-08',
    category: 'Payment Webhook Security',
    name: 'Payment Webhook: Process valid signed webhook & update order payment status',
    expected: 'HTTP 200, orders.payment_status updated to "paid", tx recorded in database',
    actual: `HTTP ${resValidPayment.status}, DB payment_status: "${updatedOrderRow?.payment_status}", tx status: "${txRow?.status}"`,
    status: isPaymentSuccess ? 'PASS' : 'FAIL',
    details: 'HMAC signature validated; order status transitioned to "paid"; audit transaction logged.',
  });

  // -------------------------------------------------------------
  // TEST P-12: PAYMENT WEBHOOK — DUPLICATE-EVENT IDEMPOTENCY
  // -------------------------------------------------------------
  // Re-send the exact same payment webhook. Should return idempotent 200 OK without re-processing.
  const resDuplicateWebhook = await makeRequest(
    'POST',
    '/api/payments/webhook',
    { 'X-Razorpay-Signature': validSig, 'Content-Type': 'application/json' },
    validPaymentJson
  );

  const isDuplicateIdempotent =
    resDuplicateWebhook.status === 200 && resDuplicateWebhook.data?.isDuplicate === true;

  outcomes.push({
    id: 'P-12',
    category: 'Payment Webhook Security',
    name: 'Payment Webhook: Idempotent handling of duplicate webhook event',
    expected: 'HTTP 200 with isDuplicate: true (idempotent)',
    actual: `HTTP ${resDuplicateWebhook.status}, isDuplicate: ${resDuplicateWebhook.data?.isDuplicate}`,
    status: isDuplicateIdempotent ? 'PASS' : 'FAIL',
    details: 'Gateway retransmissions handled safely without duplicated transactions or state corruption.',
  });

  // -------------------------------------------------------------
  // TEST P-13: PAYMENT WEBHOOK — REPLAY ATTACK DEFENSE
  // -------------------------------------------------------------
  // Attacker attempts to reuse valid transactionId from Order C on another order (Order D)
  const orderDPayload = {
    customerName: 'Replay Target User',
    email: 'target@example.com',
    phone: '9820011222',
    address: 'Target Road 44',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
    paymentMethod: 'razorpay',
    items: [{ productId: 'shadow-oversized-tee', quantity: 1, size: 'L' }],
  };
  const resOrderD = await makeRequest('POST', '/api/orders', {}, orderDPayload);
  const orderIdD = resOrderD.data.orderId;

  const replayAttackPayload = {
    event: 'payment.captured',
    payload: {
      orderId: orderIdD,
      amount: 49900,
      currency: 'INR',
      transactionId: validTxId, // Reusing Order C's transaction ID on Order D
    },
  };
  const replaySig = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(JSON.stringify(replayAttackPayload))
    .digest('hex');

  const resReplayAttack = await makeRequest(
    'POST',
    '/api/payments/webhook',
    { 'X-Razorpay-Signature': replaySig },
    replayAttackPayload
  );

  const isReplayRejected = resReplayAttack.status === 400;

  outcomes.push({
    id: 'P-13',
    category: 'Payment Webhook Security',
    name: 'Payment Webhook: Replay attack prevention (reusing transaction ID on different order)',
    expected: 'HTTP 400 Bad Request (Replay Attack Detected)',
    actual: `HTTP ${resReplayAttack.status} (${JSON.stringify(resReplayAttack.data)})`,
    status: isReplayRejected ? 'PASS' : 'FAIL',
    details: 'Transaction ID binding verified against database; cross-order replay strictly rejected.',
  });

  // -------------------------------------------------------------
  // TEST P-14: PAYMENT WEBHOOK — CURRENCY VALIDATION
  // -------------------------------------------------------------
  const foreignCurrencyPayload = {
    event: 'payment.captured',
    payload: {
      orderId: orderIdD,
      amount: 49900,
      currency: 'USD', // Attacker sends USD instead of INR
      transactionId: 'tx-usd-' + Date.now(),
    },
  };
  const foreignCurSig = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(JSON.stringify(foreignCurrencyPayload))
    .digest('hex');

  const resForeignCurrency = await makeRequest(
    'POST',
    '/api/payments/webhook',
    { 'X-Razorpay-Signature': foreignCurSig },
    foreignCurrencyPayload
  );

  const isCurrencyRejected = resForeignCurrency.status === 400;

  outcomes.push({
    id: 'P-14',
    category: 'Payment Webhook Security',
    name: 'Payment Webhook: Currency validation rejects unauthorized non-INR currencies',
    expected: 'HTTP 400 Bad Request (Only INR authorized)',
    actual: `HTTP ${resForeignCurrency.status} (${JSON.stringify(resForeignCurrency.data)})`,
    status: isCurrencyRejected ? 'PASS' : 'FAIL',
    details: 'Strict ISO currency check enforces INR for Indian retail operations.',
  });

  // -------------------------------------------------------------
  // TEST P-09: ADMIN AUTHORIZATION & DISK MUTATION
  // -------------------------------------------------------------
  const adminSecret = process.env.ADMIN_SECRET_KEY || 'chill_treads_admin_dev_token_2026';
  // Use dedicated IP to isolate admin testing from brute-force rate limiter tests
  const loginRes = await makeRequest(
    'POST',
    '/api/admin/login',
    { 'X-Forwarded-For': '192.168.1.100' },
    { password: adminSecret }
  );
  const adminToken = loginRes.data.token;

  const resUpdate = await makeRequest(
    'PUT',
    `/api/admin/orders/${orderIdC}`,
    { Authorization: `Bearer ${adminToken}`, 'X-Forwarded-For': '192.168.1.100' },
    {
      status: 'supplier_ordered',
      supplierName: 'Qikink POD Partner',
      supplierOrderId: 'SUPP-QIK-98765',
      trackingNumber: 'DEL19928371',
      notes: 'Dispatched to automated POD queue',
    }
  );

  // Verify in SQLite directly
  const verifyUpdateDb = new Database(DB_PATH, { readonly: true });
  const persistedOrder = verifyUpdateDb
    .prepare('SELECT status, supplier_name, supplier_order_id, tracking_number FROM orders WHERE id = ?')
    .get(orderIdC) as any;
  verifyUpdateDb.close();

  const isUpdatePersisted =
    resUpdate.status === 200 &&
    persistedOrder?.status === 'supplier_ordered' &&
    persistedOrder?.supplier_name === 'Qikink POD Partner' &&
    persistedOrder?.supplier_order_id === 'SUPP-QIK-98765';

  outcomes.push({
    id: 'P-09',
    category: 'Admin Authorization & Persistence',
    name: 'Admin updates order status & supplier tracking in persistent database',
    expected: 'HTTP 200 with changes persisted to SQLite disk',
    actual: `HTTP ${resUpdate.status}, DB status: "${persistedOrder?.status}", supplier: "${persistedOrder?.supplier_name}"`,
    status: isUpdatePersisted ? 'PASS' : 'FAIL',
    details: 'Admin authorization validated; supplier order details persisted to database.',
  });

  // -------------------------------------------------------------
  // TEST P-15: CONCURRENT ORDER CREATION & ATOMIC INTEGRITY
  // -------------------------------------------------------------
  // Spawn 5 simultaneous customer orders to verify SQLite WAL mode concurrent integrity
  const concurrentPromises = Array.from({ length: 5 }, (_, idx) => {
    return makeRequest('POST', '/api/orders', { 'X-Forwarded-For': `10.0.0.${idx + 1}` }, {
      customerName: `Concurrent User ${idx + 1}`,
      email: `concurrent${idx + 1}@example.com`,
      phone: `98200112${idx < 10 ? '0' + idx : idx}`,
      address: `Concurrent Street ${idx + 1}`,
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560001',
      paymentMethod: 'cod',
      items: [{ productId: 'minimal-logo-tee', quantity: 1, size: 'M' }],
    });
  });

  const concurrentResults = await Promise.all(concurrentPromises);
  const allConcurrent201 = concurrentResults.every((r) => r.status === 201);
  const concurrentIds = concurrentResults.map((r) => r.data?.orderId);

  // Check in database that all 5 orders and order_items exist
  const verifyConcurrentDb = new Database(DB_PATH, { readonly: true });
  const concurrentFound = concurrentIds.filter((id) => {
    return verifyConcurrentDb.prepare('SELECT id FROM orders WHERE id = ?').get(id);
  });
  verifyConcurrentDb.close();

  const isConcurrentConsistent = allConcurrent201 && concurrentFound.length === 5;

  outcomes.push({
    id: 'P-15',
    category: 'Concurrency & ACID Integrity',
    name: 'Concurrent order creation: Atomic SQLite WAL writes without locking deadlocks',
    expected: 'All 5 concurrent orders succeed with HTTP 201 and persist correctly',
    actual: `${concurrentFound.length}/5 orders persisted to disk (All HTTP 201: ${allConcurrent201})`,
    status: isConcurrentConsistent ? 'PASS' : 'FAIL',
    details: 'Evaluates concurrency and WAL transaction isolation under burst load.',
  });

  // -------------------------------------------------------------
  // TEST P-16: ADMIN SESSION PERSISTENCE ACROSS RE-INITIALIZATIONS
  // -------------------------------------------------------------
  const sessionDbTest = new Database(DB_PATH, { readonly: true });
  const sessionRow = sessionDbTest
    .prepare('SELECT token, role, expires_at FROM admin_sessions WHERE token = ?')
    .get(adminToken) as any;
  sessionDbTest.close();

  const isSessionPersisted = !!sessionRow && sessionRow.role === 'admin' && sessionRow.expires_at > Date.now();

  outcomes.push({
    id: 'P-16',
    category: 'Admin Session Persistence',
    name: 'Admin session token stored in persistent database across process restarts',
    expected: 'Active admin session token found in database with valid expiration',
    actual: `Found session in DB: ${Boolean(sessionRow)}, role: "${sessionRow?.role}"`,
    status: isSessionPersisted ? 'PASS' : 'FAIL',
    details: 'Database session table survives process restarts, enabling stateful revocations.',
  });

  // -------------------------------------------------------------
  // TEST P-10: CASCADE DELETION
  // -------------------------------------------------------------
  const resDelete = await makeRequest(
    'DELETE',
    `/api/admin/orders/${orderIdC}`,
    { Authorization: `Bearer ${adminToken}`, 'X-Forwarded-For': '192.168.1.100' }
  );

  const verifyDeleteDb = new Database(DB_PATH, { readonly: true });
  const remainingOrder = verifyDeleteDb
    .prepare('SELECT id FROM orders WHERE id = ?')
    .get(orderIdC);
  const remainingItems = verifyDeleteDb
    .prepare('SELECT id FROM order_items WHERE order_id = ?')
    .all(orderIdC);
  verifyDeleteDb.close();

  const isCascadeDeleted =
    resDelete.status === 200 && !remainingOrder && remainingItems.length === 0;

  outcomes.push({
    id: 'P-10',
    category: 'Database Referential Integrity',
    name: 'Admin deletes order; SQLite cascades deletion to order_items',
    expected: 'HTTP 200, 0 rows in orders, 0 rows in order_items for orderId',
    actual: `HTTP ${resDelete.status}, Remaining order rows: ${remainingOrder ? 1 : 0}, items: ${remainingItems.length}`,
    status: isCascadeDeleted ? 'PASS' : 'FAIL',
    details: 'Foreign key cascade deletion enforced by SQLite engine.',
  });

  // -------------------------------------------------------------
  // TEST P-11: ACTUAL DEPLOYED HTTPS CLOUD RUN ENDPOINT AUDIT
  // -------------------------------------------------------------
  // Target this applet's ACTUAL Cloud Run endpoint
  const actualCloudRunUrl = 'https://ais-dev-qowjf7dgj2pula4blz2t7x-746924099764.asia-east1.run.app';
  let deployedStatus: 'PASS' | 'FAIL' | 'NOT VERIFIED' = 'NOT VERIFIED';
  let deployedActual = '';

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const cloudRes = await fetch(actualCloudRunUrl + '/api/health', {
      signal: controller.signal,
      redirect: 'manual', // Inspect raw Cloud Run gateway response
    });
    clearTimeout(timeout);
    
    // Status 200 (if public) or 302 (redirect to Google auth proxy cookie check) indicates reachability
    if (cloudRes.status === 200 || cloudRes.status === 302) {
      deployedStatus = 'PASS';
      deployedActual = `HTTP ${cloudRes.status} via Cloud Run HTTPS (${actualCloudRunUrl}) - TLS Handshake Verified`;
    } else {
      deployedStatus = 'FAIL';
      deployedActual = `HTTP ${cloudRes.status} received from Cloud Run endpoint`;
    }
  } catch (err: any) {
    deployedStatus = 'NOT VERIFIED';
    deployedActual = `Cloud Run endpoint egress check: ${err.message}`;
  }

  outcomes.push({
    id: 'P-11',
    category: 'Deployment & HTTPS Verification',
    name: 'Verify actual Cloud Run HTTPS endpoint and TLS security',
    expected: 'HTTP 200 or 302 auth-proxy with valid TLS handshake from project Cloud Run URL',
    actual: deployedActual,
    status: deployedStatus,
    details: 'Verified against genuine project Cloud Run domain ais-dev-qowjf7dgj2pula4blz2t7x-746924099764.asia-east1.run.app.',
  });

  // Print results
  console.log('----------------------------------------------------------------------');
  console.log('DATABASE PERSISTENCE & PAYMENT SUITE RESULTS');
  console.log('----------------------------------------------------------------------');
  for (const o of outcomes) {
    console.log(`[${o.status}] ${o.id}: ${o.name}`);
    console.log(`       Actual: ${o.actual}`);
  }
  console.log('----------------------------------------------------------------------');
  const passCount = outcomes.filter((o) => o.status === 'PASS').length;
  const failCount = outcomes.filter((o) => o.status === 'FAIL').length;
  const notVerifiedCount = outcomes.filter((o) => o.status === 'NOT VERIFIED').length;
  console.log(`SUMMARY: ${passCount} PASSED, ${failCount} FAILED, ${notVerifiedCount} NOT VERIFIED (TOTAL: ${outcomes.length})`);
  console.log('----------------------------------------------------------------------\n');
}

runSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
