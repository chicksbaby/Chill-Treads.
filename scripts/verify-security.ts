/**
 * CHILL TREADS Comprehensive Security Verification Suite
 * Executes live tests against the local running backend at http://localhost:3000
 */
import fs from 'fs';

const BASE_URL = 'http://localhost:3000';

interface TestResult {
  id: string;
  name: string;
  category: string;
  endpoint: string;
  method: string;
  payloadSummary: string;
  expectedStatus: number | number[];
  actualStatus: number;
  responseSnippet: string;
  pass: boolean;
  notes: string;
  codeLocation: string;
}

const results: TestResult[] = [];

async function makeRequest(
  method: string,
  path: string,
  headers: Record<string, string> = {},
  body?: any
): Promise<{ status: number; data: any; rawText: string; headers: Headers }> {
  const reqHeaders: Record<string, string> = { ...headers };
  let bodyStr: string | undefined;

  if (body !== undefined) {
    if (typeof body === 'string') {
      bodyStr = body;
    } else {
      reqHeaders['Content-Type'] = 'application/json';
      bodyStr = JSON.stringify(body);
    }
  }

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
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

function recordResult(
  id: string,
  name: string,
  category: string,
  endpoint: string,
  method: string,
  payloadSummary: string,
  expectedStatus: number | number[],
  res: { status: number; data: any; rawText: string },
  codeLocation: string,
  notes: string
) {
  const isMatch = Array.isArray(expectedStatus)
    ? expectedStatus.includes(res.status)
    : res.status === expectedStatus;

  let snippet = typeof res.data === 'object' ? JSON.stringify(res.data) : res.rawText;
  if (snippet.length > 120) snippet = snippet.slice(0, 117) + '...';

  const r: TestResult = {
    id,
    name,
    category,
    endpoint,
    method,
    payloadSummary,
    expectedStatus,
    actualStatus: res.status,
    responseSnippet: snippet,
    pass: isMatch,
    notes,
    codeLocation,
  };
  results.push(r);
  console.log(
    `[${r.pass ? 'PASS' : 'FAIL'}] ${id} - ${name} | Status: ${res.status} (Expected: ${expectedStatus})`
  );
}

async function runTestSuite() {
  console.log('===============================================================');
  console.log('CHILL TREADS ADVANCED APPSEC VERIFICATION RUNNER');
  console.log(`Target: ${BASE_URL}`);
  console.log(`Execution Timestamp: ${new Date().toISOString()}`);
  console.log('===============================================================\n');

  // Check health
  const health = await makeRequest('GET', '/api/health');
  if (health.status !== 200) {
    console.error('Server is not healthy or unreachable on port 3000:', health.rawText);
    process.exit(1);
  }
  console.log('Server verified healthy. Running test matrix...\n');

  // -------------------------------------------------------------
  // DOMAIN 1: CUSTOMER ORDER ACCESS CONTROL & IDOR DEFENSE
  // -------------------------------------------------------------
  console.log('--- DOMAIN 1: Customer Order Access Control & IDOR ---');

  // 1.1 Customer A places Order A
  const custAOrderPayload = {
    customerName: 'Aarav Sharma',
    email: 'aarav.sharma@example.in',
    phone: '9820112233',
    address: 'Flat 402, Skyline Residency, Bandra West',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400050',
    items: [
      {
        productId: 'shadow-oversized-tee',
        size: 'L',
        color: 'Black',
        quantity: 1,
      },
    ],
    paymentMethod: 'upi_demo',
  };
  const resOrderA = await makeRequest('POST', '/api/orders', {}, custAOrderPayload);
  recordResult(
    'SEC-01',
    'Customer A creates Order A',
    'Customer Access Control',
    '/api/orders',
    'POST',
    'Valid order for Aarav Sharma, phone 9820112233',
    201,
    resOrderA,
    'server.ts:375-547',
    'Created Order A with cryptographic orderSecretKey'
  );

  const orderNumA = resOrderA.data.orderNumber;
  const orderIdA = resOrderA.data.orderId;
  const orderSecretA = resOrderA.data.orderSecretKey;

  // 1.2 Customer B places Order B
  const custBOrderPayload = {
    customerName: 'Diya Patel',
    email: 'diya.patel@example.in',
    phone: '9845099887',
    address: 'Plot 12, Indiranagar 100ft Road',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560038',
    items: [
      {
        productId: 'vision-tee',
        size: 'M',
        color: 'Off-White',
        quantity: 2,
      },
    ],
    paymentMethod: 'cod',
  };
  const resOrderB = await makeRequest('POST', '/api/orders', {}, custBOrderPayload);
  recordResult(
    'SEC-02',
    'Customer B creates Order B',
    'Customer Access Control',
    '/api/orders',
    'POST',
    'Valid order for Diya Patel, phone 9845099887',
    201,
    resOrderB,
    'server.ts:375-547',
    'Created Order B with distinct orderSecretKey'
  );

  const orderNumB = resOrderB.data.orderNumber;
  const orderIdB = resOrderB.data.orderId;
  const orderSecretB = resOrderB.data.orderSecretKey;

  // 1.3 Customer A attempts IDOR: Track Order B without credentials
  const resIdorUnauth = await makeRequest('GET', `/api/orders/track?orderNumber=${orderNumB}`);
  recordResult(
    'SEC-03',
    'IDOR: Track Order B with zero credentials',
    'Customer Access Control',
    `/api/orders/track?orderNumber=${orderNumB}`,
    'GET',
    'Order number only, no phone or secret',
    404,
    resIdorUnauth,
    'server.ts:551-588',
    'Access blocked: requires matching phone or cryptographic secret'
  );

  // 1.4 Customer A attempts IDOR: Track Order B using Customer A phone
  const resIdorPhoneTamper = await makeRequest(
    'GET',
    `/api/orders/track?orderNumber=${orderNumB}&phone=9820112233`
  );
  recordResult(
    'SEC-04',
    'IDOR: Track Order B with Customer A phone',
    'Customer Access Control',
    `/api/orders/track?orderNumber=${orderNumB}&phone=9820112233`,
    'GET',
    'Order B number + Customer A phone number',
    404,
    resIdorPhoneTamper,
    'server.ts:579-588',
    'Access denied: Phone number mismatch rejected with generic 404'
  );

  // 1.5 Customer A attempts IDOR: Track Order B using Customer A secret key
  const resIdorSecretTamper = await makeRequest(
    'GET',
    `/api/orders/track?orderNumber=${orderNumB}&orderSecretKey=${orderSecretA}`
  );
  recordResult(
    'SEC-05',
    'IDOR: Track Order B with Customer A secret key',
    'Customer Access Control',
    `/api/orders/track?orderNumber=${orderNumB}&orderSecretKey=[TOKEN_A]`,
    'GET',
    'Order B number + Customer A orderSecretKey',
    404,
    resIdorSecretTamper,
    'server.ts:579-588',
    'Access denied: Cryptographic HMAC token mismatch rejected'
  );

  // 1.6 Customer B tracks Order B legitimately with their phone
  const resAuthTrackB = await makeRequest(
    'GET',
    `/api/orders/track?orderNumber=${orderNumB}&phone=9845099887`
  );
  recordResult(
    'SEC-06',
    'Legitimate Customer B tracks Order B',
    'Customer Access Control',
    `/api/orders/track?orderNumber=${orderNumB}&phone=9845099887`,
    'GET',
    'Order B number + matching phone 9845099887',
    200,
    resAuthTrackB,
    'server.ts:590-618',
    'Tracking allowed; PII masked (name masked, street address withheld)'
  );

  // 1.7 Verify PII masking in tracking output: No raw phone, no street address
  const dataB = resAuthTrackB.data;
  const isAddressWithheld = !dataB.address && !dataB.email;
  const isNameMasked = dataB.customerMaskedName && dataB.customerMaskedName.includes('*');
  const isPhoneMasked = dataB.customerMaskedPhone && dataB.customerMaskedPhone.startsWith('******');
  const piiPass = isAddressWithheld && isNameMasked && isPhoneMasked;
  recordResult(
    'SEC-07',
    'Privacy Verification: Tracking redactions',
    'Customer Access Control',
    '/api/orders/track',
    'GET',
    'Inspect returned JSON fields for PII leakage',
    200,
    { status: piiPass ? 200 : 500, data: { isAddressWithheld, isNameMasked, isPhoneMasked }, rawText: '' },
    'server.ts:590-618',
    `Name masked: ${isNameMasked}, Phone masked: ${isPhoneMasked}, Address withheld: ${isAddressWithheld}`
  );

  // 1.8 Customer A attempts to modify Order B via public endpoint (HTTP PUT)
  const resModifyOrderB = await makeRequest(
    'PUT',
    `/api/orders/${orderIdB}`,
    {},
    { status: 'cancelled' }
  );
  recordResult(
    'SEC-08',
    'Direct Order Tamper: Public PUT order route',
    'Customer Access Control',
    `/api/orders/${orderIdB}`,
    'PUT',
    'Payload: { status: "cancelled" }',
    404,
    resModifyOrderB,
    'server.ts: Express router',
    'Public order modification route does not exist (404)'
  );

  // 1.9 Customer A attempts to delete Order B via public endpoint (HTTP DELETE)
  const resDeleteOrderB = await makeRequest('DELETE', `/api/orders/${orderIdB}`);
  recordResult(
    'SEC-09',
    'Direct Order Tamper: Public DELETE order route',
    'Customer Access Control',
    `/api/orders/${orderIdB}`,
    'DELETE',
    'Attempt to delete customer order record',
    404,
    resDeleteOrderB,
    'server.ts: Express router',
    'Public order deletion route does not exist (404)'
  );

  // 1.10 Order Enumeration Prevention: Request non-existent order number
  const resNonExistentTrack = await makeRequest(
    'GET',
    '/api/orders/track?orderNumber=CT-99999999'
  );
  recordResult(
    'SEC-10',
    'Order Enumeration Resistance: Non-existent order',
    'Customer Access Control',
    '/api/orders/track?orderNumber=CT-99999999',
    'GET',
    'Non-existent order number',
    404,
    resNonExistentTrack,
    'server.ts:570-574',
    'Generic 404 identical to credential mismatch error; no user enumeration'
  );

  // -------------------------------------------------------------
  // DOMAIN 2: ADMIN AUTHORIZATION & TOKEN REVOCATION
  // -------------------------------------------------------------
  console.log('\n--- DOMAIN 2: Admin Authorization & Session Revocation ---');

  // 2.1 Admin endpoints without token
  const resAdminNoTokenOrders = await makeRequest('GET', '/api/admin/orders');
  recordResult(
    'SEC-11',
    'Admin Orders without Authorization header',
    'Admin Authorization',
    '/api/admin/orders',
    'GET',
    'No Authorization header',
    401,
    resAdminNoTokenOrders,
    'server.ts:224-236',
    'Blocked with 401 Unauthorized'
  );

  const resAdminNoTokenProductPost = await makeRequest('POST', '/api/admin/products', {}, {
    name: 'Hacked Streetwear Hoodie',
    price: 1,
  });
  recordResult(
    'SEC-12',
    'Admin Product Creation without Authorization',
    'Admin Authorization',
    '/api/admin/products',
    'POST',
    'New product creation payload',
    401,
    resAdminNoTokenProductPost,
    'server.ts:224-236',
    'Blocked with 401 Unauthorized'
  );

  // 2.2 Admin endpoint with malformed / forged token
  const resAdminMalformedToken = await makeRequest('GET', '/api/admin/orders', {
    Authorization: 'Bearer invalid_forged_token_string.signature',
  });
  recordResult(
    'SEC-13',
    'Admin Endpoint with Malformed/Forged Token',
    'Admin Authorization',
    '/api/admin/orders',
    'GET',
    'Authorization: Bearer invalid_forged_token_string.signature',
    403,
    resAdminMalformedToken,
    'server.ts:197-236',
    'HMAC signature verification failed; rejected with 403 Forbidden'
  );

  // 2.3 Attempt to register/create admin account (Endpoint does not exist)
  const resAdminRegister = await makeRequest('POST', '/api/admin/register', {}, {
    username: 'hacker',
    password: 'Password123!',
    role: 'admin',
  });
  recordResult(
    'SEC-14',
    'Attempt to create new admin account',
    'Admin Authorization',
    '/api/admin/register',
    'POST',
    'Payload: { username: "hacker", role: "admin" }',
    404,
    resAdminRegister,
    'server.ts: No registration route',
    'No admin registration route exists; admin accounts cannot be self-provisioned'
  );

  // 2.4 Legitimate Admin Login
  const adminSecret = process.env.ADMIN_SECRET_KEY || 'chill_treads_admin_dev_token_2026';
  const resLogin = await makeRequest('POST', '/api/admin/login', {}, { password: adminSecret });
  recordResult(
    'SEC-15',
    'Legitimate Admin Login (Salted Scrypt derivation)',
    'Admin Authorization',
    '/api/admin/login',
    'POST',
    'Correct password verified via crypto.scryptSync',
    200,
    resLogin,
    'server.ts:316-351',
    'Login succeeded, issued HMAC signed session token'
  );

  const adminToken = resLogin.data.token;

  // 2.5 Authenticated Admin retrieves all orders
  const resAdminAuthedOrders = await makeRequest('GET', '/api/admin/orders', {
    Authorization: `Bearer ${adminToken}`,
  });
  recordResult(
    'SEC-16',
    'Authenticated Admin retrieves orders',
    'Admin Authorization',
    '/api/admin/orders',
    'GET',
    'Authorization: Bearer [VALID_ADMIN_TOKEN]',
    200,
    resAdminAuthedOrders,
    'server.ts:625-628',
    `Retrieved all orders in system (${resAdminAuthedOrders.data.length} orders)`
  );

  // 2.6 Authenticated Admin updates Order B status
  const resAdminUpdateOrder = await makeRequest(
    'PUT',
    `/api/admin/orders/${orderIdB}`,
    { Authorization: `Bearer ${adminToken}` },
    { status: 'supplier_ordered', supplierName: 'Qikink Direct', trackingNumber: 'DEL9928172' }
  );
  recordResult(
    'SEC-17',
    'Authenticated Admin updates order fulfillment',
    'Admin Authorization',
    `/api/admin/orders/${orderIdB}`,
    'PUT',
    'Status update to "supplier_ordered"',
    200,
    resAdminUpdateOrder,
    'server.ts:631-652',
    'Order updated successfully by authorized administrator'
  );

  // 2.7 Admin Logout & Server-Side Token Revocation
  const resLogout = await makeRequest('POST', '/api/admin/logout', {
    Authorization: `Bearer ${adminToken}`,
  });
  recordResult(
    'SEC-18',
    'Admin Logout (Session Token Revocation)',
    'Admin Authorization',
    '/api/admin/logout',
    'POST',
    'Authorization: Bearer [VALID_ADMIN_TOKEN]',
    200,
    resLogout,
    'server.ts:365-372',
    'Token purged from validAdminTokens Set on server'
  );

  // 2.8 Verify Revoked Token is immediately rejected
  const resPostLogoutUse = await makeRequest('GET', '/api/admin/orders', {
    Authorization: `Bearer ${adminToken}`,
  });
  recordResult(
    'SEC-19',
    'Post-Logout Token Rejection (Replay Protection)',
    'Admin Authorization',
    '/api/admin/orders',
    'GET',
    'Reusing revoked Bearer token',
    403,
    resPostLogoutUse,
    'server.ts:216-236',
    'Revoked token successfully rejected with 403 Forbidden'
  );

  // -------------------------------------------------------------
  // DOMAIN 3: LOGIN PROTECTION & BRUTE FORCE DEFENSE
  // -------------------------------------------------------------
  console.log('\n--- DOMAIN 3: Login Protection & Brute Force Defense ---');

  // 3.1 Wrong password rejection
  const resWrongPass = await makeRequest('POST', '/api/admin/login', {}, { password: 'wrong_password_123' });
  recordResult(
    'SEC-20',
    'Invalid Admin Password Rejection',
    'Login Protection',
    '/api/admin/login',
    'POST',
    'Payload: { password: "wrong_password_123" }',
    401,
    resWrongPass,
    'server.ts:334-340',
    'Scrypt hash mismatch rejected with timing-safe comparison'
  );

  // 3.2 Brute Force Lockout Test (Simulate 5 consecutive failed attempts)
  let lockoutHit = false;
  let finalStatus = 401;
  for (let i = 1; i <= 6; i++) {
    const resFail = await makeRequest('POST', '/api/admin/login', {}, { password: `bruteforce_guess_${i}` });
    if (resFail.status === 429) {
      lockoutHit = true;
      finalStatus = 429;
      break;
    }
  }
  recordResult(
    'SEC-21',
    'Brute-Force Lockout Defense (5 attempts threshold)',
    'Login Protection',
    '/api/admin/login',
    'POST',
    'Submitting rapid failed passwords to trigger IP lockout',
    429,
    { status: finalStatus, data: { lockoutHit }, rawText: '' },
    'server.ts:246-271, 318-325',
    `Rate limiter triggered: lockoutHit=${lockoutHit}, HTTP 429 received`
  );

  // -------------------------------------------------------------
  // DOMAIN 4: INPUT VALIDATION & TAMPERING
  // -------------------------------------------------------------
  console.log('\n--- DOMAIN 4: Input Validation & Injection Defense ---');

  // 4.1 Prototype Pollution Injection Attempt
  const protoRawJson = JSON.stringify({
    customerName: 'Hacker',
    email: 'hacker@example.com',
    phone: '9876543210',
    address: 'Darknet Street 1',
    city: 'Delhi',
    state: 'Delhi',
    pincode: '110001',
    items: [{ productId: 'shadow-oversized-tee', quantity: 1, size: 'L' }],
  }).replace('{', '{"__proto__":{"isAdmin":true,"role":"superuser"},');

  const resProtoPollution = await makeRequest(
    'POST',
    '/api/orders',
    { 'Content-Type': 'application/json' },
    protoRawJson
  );
  recordResult(
    'SEC-22',
    'Prototype Pollution (__proto__) Injection Defense',
    'Input Validation',
    '/api/orders',
    'POST',
    'Payload with __proto__: { isAdmin: true }',
    400,
    resProtoPollution,
    'server.ts:283-295, 389-393',
    'Prototype pollution attempt detected and rejected with 400'
  );

  // 4.2 Prohibited Financial Data Defense (Card / CVV injection)
  const resCardPayload = await makeRequest(
    'POST',
    '/api/orders',
    {},
    {
      customerName: 'Victim User',
      email: 'victim@example.com',
      phone: '9876543210',
      address: 'Main Street 1',
      city: 'Delhi',
      state: 'Delhi',
      pincode: '110001',
      cardNumber: '4111111111111111',
      cvv: '123',
      items: [{ productId: 'shadow-oversized-tee', quantity: 1, size: 'L' }],
    }
  );
  recordResult(
    'SEC-23',
    'Prohibited Financial Data Rejection (Card/CVV)',
    'Input Validation',
    '/api/orders',
    'POST',
    'Payload containing raw card and CVV fields',
    400,
    resCardPayload,
    'server.ts:396-404',
    'Card and CVV transmission strictly prohibited by server policy'
  );

  // 4.3 Invalid / Non-Existent Product ID
  const resInvalidProdId = await makeRequest(
    'POST',
    '/api/orders',
    {},
    {
      customerName: 'Tamper Test',
      email: 'tamper@example.com',
      phone: '9876543210',
      address: 'Main Street 1',
      city: 'Delhi',
      state: 'Delhi',
      pincode: '110001',
      items: [{ productId: 'fake-nonexistent-tee-9999', quantity: 1, size: 'L' }],
    }
  );
  recordResult(
    'SEC-24',
    'Non-Existent Product ID Rejection',
    'Input Validation',
    '/api/orders',
    'POST',
    'Product ID: "fake-nonexistent-tee-9999"',
    400,
    resInvalidProdId,
    'server.ts:466-470',
    'Strict rejection: Catalog does not contain product ID'
  );

  // 4.4 Negative Quantity Tampering
  const resNegativeQty = await makeRequest(
    'POST',
    '/api/orders',
    {},
    {
      customerName: 'Negative Qty Test',
      email: 'tamper@example.com',
      phone: '9876543210',
      address: 'Main Street 1',
      city: 'Delhi',
      state: 'Delhi',
      pincode: '110001',
      items: [{ productId: 'shadow-oversized-tee', quantity: -2, size: 'L' }],
    }
  );
  recordResult(
    'SEC-25',
    'Negative Quantity Rejection',
    'Input Validation',
    '/api/orders',
    'POST',
    'Quantity: -2',
    400,
    resNegativeQty,
    'server.ts:473-477',
    'Quantity must be an integer between 1 and 10'
  );

  // 4.5 Excessively Large Quantity
  const resExcessiveQty = await makeRequest(
    'POST',
    '/api/orders',
    {},
    {
      customerName: 'Large Qty Test',
      email: 'tamper@example.com',
      phone: '9876543210',
      address: 'Main Street 1',
      city: 'Delhi',
      state: 'Delhi',
      pincode: '110001',
      items: [{ productId: 'shadow-oversized-tee', quantity: 999999, size: 'L' }],
    }
  );
  recordResult(
    'SEC-26',
    'Excessive Quantity Rejection (>10 bulk limit)',
    'Input Validation',
    '/api/orders',
    'POST',
    'Quantity: 999999',
    400,
    resExcessiveQty,
    'server.ts:473-477',
    'Quantity exceeding limit rejected to prevent order abuse'
  );

  // 4.6 Invalid Indian Mobile Number (not starting with 6-9, <10 digits)
  const resBadPhone = await makeRequest(
    'POST',
    '/api/orders',
    {},
    {
      customerName: 'Bad Phone Test',
      email: 'tamper@example.com',
      phone: '1234567890',
      address: 'Main Street 1',
      city: 'Delhi',
      state: 'Delhi',
      pincode: '110001',
      items: [{ productId: 'shadow-oversized-tee', quantity: 1, size: 'L' }],
    }
  );
  recordResult(
    'SEC-27',
    'Invalid Indian Mobile Number Rejection',
    'Input Validation',
    '/api/orders',
    'POST',
    'Phone: "1234567890" (does not start with 6-9)',
    400,
    resBadPhone,
    'server.ts:427-431',
    'Strict Indian mobile regex /^[6-9]\\d{9}$/ enforced'
  );

  // 4.7 Invalid Indian PIN Code
  const resBadPincode = await makeRequest(
    'POST',
    '/api/orders',
    {},
    {
      customerName: 'Bad PIN Test',
      email: 'tamper@example.com',
      phone: '9876543210',
      address: 'Main Street 1',
      city: 'Delhi',
      state: 'Delhi',
      pincode: '000000',
      items: [{ productId: 'shadow-oversized-tee', quantity: 1, size: 'L' }],
    }
  );
  recordResult(
    'SEC-28',
    'Invalid Indian Postal PIN Code Rejection',
    'Input Validation',
    '/api/orders',
    'POST',
    'PIN: "000000" (starts with 0)',
    400,
    resBadPincode,
    'server.ts:443-447',
    'Strict Indian PIN regex /^[1-9][0-9]{5}$/ enforced'
  );

  // -------------------------------------------------------------
  // DOMAIN 5: SERVER-SIDE PRICE & ORDER INTEGRITY
  // -------------------------------------------------------------
  console.log('\n--- DOMAIN 5: Server-Side Price & Order Integrity ---');

  // 5.1 Client attempts to tamper price to ₹1 and total to ₹1
  const resTamperedPrice = await makeRequest(
    'POST',
    '/api/orders',
    {},
    {
      customerName: 'Price Hacker',
      email: 'hacker@example.in',
      phone: '9876543210',
      address: 'Street 99, Cyber City',
      city: 'Gurugram',
      state: 'Haryana',
      pincode: '122002',
      items: [
        {
          productId: 'chaos-order-tee', // Official price is ₹549
          size: 'XL',
          quantity: 1,
          price: 1.0, // Client attempts ₹1
        },
      ],
      subtotal: 1.0,
      total: 1.0,
      status: 'delivered', // Client attempts to force status to 'delivered'
    }
  );
  const enforcedTotal = resTamperedPrice.data.total;
  const enforcedStatus = resTamperedPrice.data.status;
  const priceEnforced = enforcedTotal === 549 && enforcedStatus === 'pending';
  recordResult(
    'SEC-29',
    'Server Price Enforcement (Anti-Tampering)',
    'Order Integrity',
    '/api/orders',
    'POST',
    'Client submitted price: ₹1, total: ₹1, status: "delivered"',
    201,
    { status: priceEnforced ? 201 : 500, data: { enforcedTotal, enforcedStatus }, rawText: '' },
    'server.ts:488-505, 526-528',
    `Official price ₹549 strictly enforced; client status overridden to "pending"`
  );

  // 5.2 Server Free Shipping Threshold Enforcement (<₹499 gets ₹60 fee)
  const resDiscountCode = await makeRequest(
    'POST',
    '/api/orders',
    {},
    {
      customerName: 'Coupon User',
      email: 'coupon@example.in',
      phone: '9876543210',
      address: 'Street 99, Cyber City',
      city: 'Gurugram',
      state: 'Haryana',
      pincode: '122002',
      discountCode: 'CHILL10',
      items: [
        {
          productId: 'shadow-oversized-tee', // ₹499
          size: 'L',
          quantity: 1,
        },
      ],
    }
  );
  // ₹499 - 10% (₹50) = ₹449. Free shipping applies because subtotal ₹499 >= ₹499 threshold
  const expectedTotal = 499 - Math.round(499 * 0.1); // 449
  const discountCorrect = resDiscountCode.data.total === expectedTotal;
  recordResult(
    'SEC-30',
    'Authoritative Server Discount Calculation (CHILL10)',
    'Order Integrity',
    '/api/orders',
    'POST',
    'Discount code "CHILL10" on ₹499 subtotal',
    201,
    { status: discountCorrect ? 201 : 500, data: resDiscountCode.data, rawText: '' },
    'server.ts:496-505',
    `Server recomputed total: ₹${resDiscountCode.data.total} (Expected: ₹${expectedTotal})`
  );

  // -------------------------------------------------------------
  // DOMAIN 6: WEB & DEPLOYMENT HEADERS CHECK
  // -------------------------------------------------------------
  console.log('\n--- DOMAIN 6: Web & Deployment Security Headers ---');

  const headersRes = await makeRequest('GET', '/api/products');
  const nosniff = headersRes.headers.get('x-content-type-options');
  const frameOptions = headersRes.headers.get('x-frame-options');
  const xssProtection = headersRes.headers.get('x-xss-protection');
  const referrerPolicy = headersRes.headers.get('referrer-policy');
  const headersPass =
    nosniff === 'nosniff' &&
    frameOptions === 'SAMEORIGIN' &&
    xssProtection === '1; mode=block' &&
    referrerPolicy === 'strict-origin-when-cross-origin';

  recordResult(
    'SEC-31',
    'Security Headers (nosniff, SAMEORIGIN, XSS, Referrer)',
    'Deployment Security',
    '/api/products',
    'GET',
    'Inspect response security headers',
    200,
    {
      status: headersPass ? 200 : 500,
      data: { nosniff, frameOptions, xssProtection, referrerPolicy },
      rawText: '',
    },
    'server.ts:20-25',
    `nosniff=${nosniff}, frameOptions=${frameOptions}, xss=${xssProtection}`
  );

  console.log('\n===============================================================');
  console.log('TEST SUMMARY');
  console.log('===============================================================');
  const passCount = results.filter((r) => r.pass).length;
  const failCount = results.filter((r) => !r.pass).length;
  console.log(`Total Executed Tests: ${results.length}`);
  console.log(`Passed: ${passCount}`);
  console.log(`Failed: ${failCount}`);
  console.log(`Success Rate: ${((passCount / results.length) * 100).toFixed(1)}%`);

  // Export results
  fs.writeFileSync('./security-audit-results.json', JSON.stringify(results, null, 2));
  console.log('\nDetailed test log exported to ./security-audit-results.json');
}

runTestSuite().catch((e) => {
  console.error('Fatal execution error:', e);
  process.exit(1);
});
