import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { Product, Order, OrderStatus } from '../types';
import {
  ShieldCheck,
  Package,
  TrendingUp,
  Plus,
  Edit2,
  Trash2,
  Truck,
  RotateCcw,
  Lock,
  LogOut,
  AlertTriangle,
  Loader2,
  CheckCircle,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const {
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    resetProductsToDefault,
    settings,
    updateSettings,
    isAdminAuthenticated,
    adminLogin,
    adminLogout,
    adminOrders,
    fetchAdminOrders,
    updateAdminOrder,
    deleteAdminOrder,
    resetAdminDemoData,
    navigateTo,
    showToast,
  } = useStore();

  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'settings' | 'security'>('orders');
  
  // Order editing modal state
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [orderSupplierName, setOrderSupplierName] = useState('');
  const [orderSupplierId, setOrderSupplierId] = useState('');
  const [orderCarrier, setOrderCarrier] = useState('');
  const [orderTracking, setOrderTracking] = useState('');
  const [orderStatus, setOrderStatus] = useState<OrderStatus>('pending');
  const [orderNotes, setOrderNotes] = useState('');

  // Product editing state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isNewProductModalOpen, setIsNewProductModalOpen] = useState(false);

  // Settings state
  const [announcementInput, setAnnouncementInput] = useState(settings.announcementText);
  const [freeShipInput, setFreeShipInput] = useState(settings.freeShippingThreshold);
  const [shipFeeInput, setShipFeeInput] = useState(settings.shippingFee);
  const [emailInput, setEmailInput] = useState(settings.contactEmail);
  const [phoneInput, setPhoneInput] = useState(settings.contactPhone);
  const [instaInput, setInstaInput] = useState(settings.instagramUrl);

  // Fetch admin orders whenever authenticated
  useEffect(() => {
    if (isAdminAuthenticated) {
      fetchAdminOrders();
    }
  }, [isAdminAuthenticated]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);
    const res = await adminLogin(passwordInput);
    setIsLoggingIn(false);
    if (!res.success) {
      setLoginError(res.error || 'Authentication failed. Please verify credentials.');
    } else {
      setPasswordInput('');
    }
  };

  // If not authenticated, render strict login barrier
  if (!isAdminAuthenticated) {
    return (
      <div className="bg-[#0c0c0e] text-white min-h-screen py-20 px-4 sm:px-6 lg:px-8 border-b border-neutral-900 flex items-center justify-center">
        <div className="w-full max-w-md bg-neutral-950 border border-neutral-800 p-8 shadow-2xl text-left space-y-6">
          <div className="flex items-center gap-3 border-b border-neutral-900 pb-4">
            <div className="p-3 bg-neutral-900 border border-neutral-800 text-white">
              <Lock className="w-6 h-6 stroke-[1.5]" />
            </div>
            <div>
              <span className="text-[10px] font-mono tracking-widest text-neutral-400 uppercase">
                RESTRICTED AREA
              </span>
              <h1 className="font-display text-xl sm:text-2xl font-black uppercase text-white">
                ADMIN AUTHENTICATION
              </h1>
            </div>
          </div>

          <p className="text-xs font-mono text-neutral-400 leading-relaxed">
            Access to customer delivery orders, pricing controls, and supplier dispatch requires server-side token authentication. Hiding the admin URL is not sufficient.
          </p>

          {loginError && (
            <div className="p-3 bg-red-950/80 border border-red-800 text-red-200 text-xs font-mono flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-neutral-300 uppercase mb-1">
                Admin Secret Password
              </label>
              <input
                type="password"
                required
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Enter ADMIN_SECRET_KEY..."
                className="w-full bg-neutral-900 border border-neutral-800 px-3.5 py-3 text-xs font-mono text-white focus:outline-none focus:border-white"
              />
              <span className="text-[10px] font-mono text-neutral-500 mt-1 block">
                Default local dev key: <code className="text-neutral-300">chill_treads_admin_dev_token_2026</code>
              </span>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full bg-white text-black hover:bg-neutral-200 disabled:opacity-50 py-3.5 text-xs font-mono font-bold tracking-widest uppercase transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>AUTHENTICATING...</span>
                </>
              ) : (
                <span>UNLOCK OPERATIONS PORTAL</span>
              )}
            </button>
          </form>

          <div className="pt-2 text-center">
            <button
              onClick={() => navigateTo('#/')}
              className="text-xs font-mono text-neutral-500 hover:text-white uppercase transition-colors"
            >
              ← RETURN TO STOREFRONT
            </button>
          </div>
        </div>
      </div>
    );
  }

  // KPI calculations
  const totalRevenue = adminOrders.reduce((sum, o) => sum + o.total, 0);
  const totalOrders = adminOrders.length;
  const pendingOrders = adminOrders.filter((o) => o.status === 'pending').length;
  const supplierCostEstimate = adminOrders.reduce(
    (sum, o) => sum + (o.supplierCostTotal || o.items.reduce((acc, it) => acc + (it.price * 0.55), 0)),
    0
  );
  const estimatedProfit = Math.max(0, totalRevenue - supplierCostEstimate);

  const openOrderEditor = (ord: Order) => {
    setEditingOrder(ord);
    setOrderSupplierName(ord.supplierName || 'Qikink POD');
    setOrderSupplierId(ord.supplierOrderId || '');
    setOrderCarrier(ord.carrierName || 'Delhivery');
    setOrderTracking(ord.trackingNumber || '');
    setOrderStatus(ord.status);
    setOrderNotes(ord.notes || '');
  };

  const handleSaveOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;
    await updateAdminOrder(editingOrder.id, {
      supplierName: orderSupplierName,
      supplierOrderId: orderSupplierId,
      carrierName: orderCarrier,
      trackingNumber: orderTracking,
      status: orderStatus,
      notes: orderNotes,
    });
    setEditingOrder(null);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      announcementText: announcementInput,
      freeShippingThreshold: Number(freeShipInput),
      shippingFee: Number(shipFeeInput),
      contactEmail: emailInput,
      contactPhone: phoneInput,
      instagramUrl: instaInput,
    });
  };

  return (
    <div className="bg-[#0c0c0e] text-white min-h-screen py-10 sm:py-14 border-b border-neutral-900 text-left">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header with Title, Security Tag, and Logout */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-neutral-900 gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span className="font-mono text-xs tracking-[0.25em] text-emerald-400 uppercase font-bold">
                AUTHENTICATED ADMIN SESSION
              </span>
            </div>
            <h1 className="font-display text-2xl sm:text-4xl font-extrabold uppercase tracking-tight text-white mt-1">
              CHILL TREADS OPERATIONS PORTAL
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={resetAdminDemoData}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-mono text-neutral-400 hover:text-white bg-neutral-900 border border-neutral-800 transition-colors cursor-pointer"
              title="Reset test orders"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>RESET DEMO DATA</span>
            </button>

            <button
              onClick={adminLogout}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-mono font-bold bg-red-950/80 hover:bg-red-900 border border-red-800 text-red-200 uppercase transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>LOGOUT</span>
            </button>
          </div>
        </div>

        {/* KPI Metrics Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="p-5 bg-neutral-950 border border-neutral-900 space-y-1">
            <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider block">
              GROSS SALES (INR)
            </span>
            <div className="font-mono text-2xl font-bold text-white tabular-nums">
              ₹{totalRevenue.toFixed(0)}
            </div>
            <span className="text-[10px] font-mono text-neutral-500">
              From {totalOrders} customer orders
            </span>
          </div>

          <div className="p-5 bg-neutral-950 border border-neutral-900 space-y-1">
            <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider block">
              EST. GROSS PROFIT
            </span>
            <div className="font-mono text-2xl font-bold text-emerald-400 tabular-nums">
              ₹{estimatedProfit.toFixed(0)}
            </div>
            <span className="text-[10px] font-mono text-neutral-500">
              Net of supplier printing costs
            </span>
          </div>

          <div className="p-5 bg-neutral-950 border border-neutral-900 space-y-1">
            <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider block">
              PENDING FULFILLMENT
            </span>
            <div className="font-mono text-2xl font-bold text-amber-400 tabular-nums">
              {pendingOrders}
            </div>
            <span className="text-[10px] font-mono text-neutral-500">
              Requires manual POD placement
            </span>
          </div>

          <div className="p-5 bg-neutral-950 border border-neutral-900 space-y-1">
            <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider block">
              CATALOG ITEMS
            </span>
            <div className="font-mono text-2xl font-bold text-white tabular-nums">
              {products.length}
            </div>
            <span className="text-[10px] font-mono text-neutral-500">
              Active streetwear silhouettes
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-neutral-900 mb-8 space-x-2 overflow-x-auto text-xs font-mono">
          <button
            onClick={() => setActiveTab('orders')}
            className={`pb-3 px-4 font-bold uppercase tracking-wider transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
              activeTab === 'orders'
                ? 'border-white text-white'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            CUSTOMER ORDERS ({adminOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`pb-3 px-4 font-bold uppercase tracking-wider transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
              activeTab === 'products'
                ? 'border-white text-white'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            PRODUCTS & PRICING ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`pb-3 px-4 font-bold uppercase tracking-wider transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
              activeTab === 'settings'
                ? 'border-white text-white'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            STORE POLICIES
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`pb-3 px-4 font-bold uppercase tracking-wider transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
              activeTab === 'security'
                ? 'border-white text-white'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            SECURITY AUDIT & PRE-LAUNCH CHECKLIST
          </button>
        </div>

        {/* TAB 1: DROPSHIP ORDERS */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="p-4 bg-neutral-950 border border-neutral-800 text-xs font-mono text-neutral-300 flex items-start gap-3">
              <Truck className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block font-sans uppercase mb-0.5">
                  Server-Protected Dropshipping Orders:
                </strong>
                <p className="text-neutral-400 leading-relaxed">
                  These records are stored securely on the backend server and require valid admin session tokens to view or update. Customer delivery details are never exposed to public storefront visitors.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto border border-neutral-900 bg-neutral-950">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-neutral-900/80 text-neutral-300 border-b border-neutral-800 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Order #</th>
                    <th className="py-3 px-4">Date & Customer</th>
                    <th className="py-3 px-4">Items</th>
                    <th className="py-3 px-4">Total</th>
                    <th className="py-3 px-4">Payment</th>
                    <th className="py-3 px-4">Supplier & Tracking</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-900 text-neutral-300">
                  {adminOrders.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-neutral-500">
                        No orders recorded yet.
                      </td>
                    </tr>
                  ) : (
                    adminOrders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-neutral-900/30">
                        <td className="py-3 px-4 font-bold text-white whitespace-nowrap">
                          #{ord.orderNumber}
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-white font-sans font-medium">{ord.customerName}</div>
                          <div className="text-neutral-500 text-[11px]">
                            {ord.address}, {ord.city}, {ord.state} - {ord.pincode}
                          </div>
                          <div className="text-neutral-400 text-[11px] font-mono">Phone: {ord.phone}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-neutral-200">
                            {ord.items.map((it) => `${it.quantity}x ${it.name} (${it.size})`).join(', ')}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-white tabular-nums">
                          ₹{ord.total}
                        </td>
                        <td className="py-3 px-4 uppercase text-[11px]">
                          {ord.paymentMethod === 'cod' ? 'Cash On Delivery' : 'Simulated UPI'}
                        </td>
                        <td className="py-3 px-4">
                          {ord.trackingNumber ? (
                            <div className="text-[11px]">
                              <span className="text-neutral-200 font-bold block">{ord.carrierName}: {ord.trackingNumber}</span>
                              <span className="text-neutral-500">Supplier ID: {ord.supplierOrderId || 'Manual'}</span>
                            </div>
                          ) : (
                            <span className="text-amber-400 text-[11px]">Needs Supplier Dispatch</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase ${
                            ord.status === 'delivered'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : ord.status === 'dispatched'
                              ? 'bg-blue-950 text-blue-400 border border-blue-800'
                              : ord.status === 'supplier_ordered'
                              ? 'bg-purple-950 text-purple-400 border border-purple-800'
                              : 'bg-amber-950 text-amber-400 border border-amber-800'
                          }`}>
                            {ord.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <button
                            onClick={() => openOrderEditor(ord)}
                            className="px-3 py-1 bg-neutral-900 hover:bg-white hover:text-black border border-neutral-800 text-white text-[11px] font-bold uppercase transition-colors cursor-pointer"
                          >
                            DISPATCH
                          </button>
                          <button
                            onClick={() => deleteAdminOrder(ord.id)}
                            className="p-1 hover:text-red-400 text-neutral-500 cursor-pointer"
                            title="Delete Order"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: PRODUCTS & PRICING */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-lg font-bold uppercase text-white">
                  PRODUCT CATALOG & INVENTORY
                </h3>
                <p className="text-xs font-mono text-neutral-400">
                  Update placeholder pricing (₹499), edit titles, descriptions, and fabric weights.
                </p>
              </div>

              <button
                onClick={() => setIsNewProductModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-black hover:bg-neutral-200 text-xs font-mono font-bold uppercase cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>ADD NEW STREETWEAR TEE</span>
              </button>
            </div>

            <div className="overflow-x-auto border border-neutral-900 bg-neutral-950">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-neutral-900/80 text-neutral-300 border-b border-neutral-800 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Product</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Fabric</th>
                    <th className="py-3 px-4">Selling Price (INR)</th>
                    <th className="py-3 px-4">Supplier Cost</th>
                    <th className="py-3 px-4">Colors</th>
                    <th className="py-3 px-4">Featured</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-900 text-neutral-300">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-neutral-900/30">
                      <td className="py-3 px-4 flex items-center gap-3">
                        <img src={p.image} alt={p.name} className="w-10 h-12 object-cover bg-neutral-900" />
                        <div>
                          <div className="text-white font-sans font-bold">{p.name}</div>
                          <div className="text-neutral-500 text-[11px]">{p.fit}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4 uppercase">{p.category}</td>
                      <td className="py-3 px-4">{p.fabricGsm} GSM</td>
                      <td className="py-3 px-4">
                        <input
                          type="number"
                          defaultValue={p.price}
                          onBlur={(e) => updateProduct(p.id, { price: Number(e.target.value) })}
                          className="w-20 bg-neutral-900 border border-neutral-800 px-2 py-1 text-white font-bold"
                        />
                      </td>
                      <td className="py-3 px-4 text-neutral-400">₹{p.supplierCost || 260}</td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1">
                          {p.colors.map((c) => (
                            <span key={c.name} className="w-3 h-3 rounded-full border border-neutral-700" style={{ backgroundColor: c.hex }} title={c.name} />
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => updateProduct(p.id, { isFeatured: !p.isFeatured })}
                          className={`px-2 py-0.5 text-[10px] uppercase font-bold cursor-pointer ${
                            p.isFeatured ? 'bg-white text-black' : 'bg-neutral-900 text-neutral-500'
                          }`}
                        >
                          {p.isFeatured ? 'FEATURED' : 'STANDARD'}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          onClick={() => setEditingProduct(p)}
                          className="p-1 hover:text-white text-neutral-400 cursor-pointer"
                          title="Edit Product"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteProduct(p.id)}
                          className="p-1 hover:text-red-400 text-neutral-500 cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: STORE SETTINGS */}
        {activeTab === 'settings' && (
          <form onSubmit={handleSaveSettings} className="max-w-2xl bg-neutral-950 border border-neutral-900 p-6 space-y-6">
            <div>
              <h3 className="font-display text-lg font-bold uppercase text-white">
                STORE POLICIES & BRAND CONFIGURATION
              </h3>
              <p className="text-xs font-mono text-neutral-400 mt-1">
                Configure announcement banner text, shipping thresholds, and verified business contacts.
              </p>
            </div>

            <div className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-neutral-400 mb-1 uppercase">Top Announcement Banner Text</label>
                <input
                  type="text"
                  value={announcementInput}
                  onChange={(e) => setAnnouncementInput(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 px-3 py-2 text-white focus:outline-none focus:border-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-neutral-400 mb-1 uppercase">Free Shipping Threshold (INR)</label>
                  <input
                    type="number"
                    value={freeShipInput}
                    onChange={(e) => setFreeShipInput(Number(e.target.value))}
                    className="w-full bg-neutral-900 border border-neutral-800 px-3 py-2 text-white focus:outline-none focus:border-white"
                  />
                </div>
                <div>
                  <label className="block text-neutral-400 mb-1 uppercase">Standard Shipping Charge (INR)</label>
                  <input
                    type="number"
                    value={shipFeeInput}
                    onChange={(e) => setShipFeeInput(Number(e.target.value))}
                    className="w-full bg-neutral-900 border border-neutral-800 px-3 py-2 text-white focus:outline-none focus:border-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-400 mb-1 uppercase">Support Email</label>
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 px-3 py-2 text-white focus:outline-none focus:border-white"
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1 uppercase">Support Phone</label>
                <input
                  type="text"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 px-3 py-2 text-white focus:outline-none focus:border-white"
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1 uppercase">Official Instagram Profile URL</label>
                <input
                  type="url"
                  value={instaInput}
                  onChange={(e) => setInstaInput(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 px-3 py-2 text-white focus:outline-none focus:border-white"
                />
              </div>
            </div>

            <button
              type="submit"
              className="bg-white text-black hover:bg-neutral-200 px-6 py-3 text-xs font-mono font-bold uppercase transition-colors cursor-pointer"
            >
              SAVE SETTINGS
            </button>
          </form>
        )}

        {/* TAB 4: SECURITY AUDIT & PRE-LAUNCH CHECKLIST */}
        {activeTab === 'security' && (
          <div className="max-w-4xl space-y-6">
            <div className="p-6 bg-neutral-950 border border-neutral-900 space-y-5 text-xs font-mono text-neutral-300">
              <div className="flex items-center gap-2 border-b border-neutral-800 pb-3">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <h3 className="font-display text-base font-bold uppercase text-white">
                  SECURITY AUDIT FINDINGS & IMPLEMENTED DEFENSES
                </h3>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-neutral-900 border border-neutral-800">
                  <strong className="text-white block font-sans text-sm mb-1">
                    1. Customer PII Storage Isolation (FIXED)
                  </strong>
                  <p className="text-neutral-400 leading-relaxed">
                    Customer names, telephone numbers, and addresses have been completely removed from client-side bundles and browser <code className="text-neutral-200">localStorage</code>. Orders are stored exclusively in the server backend memory behind token authorization.
                  </p>
                </div>

                <div className="p-4 bg-neutral-900 border border-neutral-800">
                  <strong className="text-white block font-sans text-sm mb-1">
                    2. Server-Side Price & Order Sanitization (FIXED)
                  </strong>
                  <p className="text-neutral-400 leading-relaxed">
                    All checkout requests sent to <code className="text-neutral-200">POST /api/orders</code> are recomputed against canonical server catalog prices. Clients cannot manipulate item prices, discounts, or delivery thresholds. String fields are sanitized and HTML tags stripped.
                  </p>
                </div>

                <div className="p-4 bg-neutral-900 border border-neutral-800">
                  <strong className="text-white block font-sans text-sm mb-1">
                    3. Order Tracking Public Redaction (FIXED)
                  </strong>
                  <p className="text-neutral-400 leading-relaxed">
                    The public tracking endpoint <code className="text-neutral-200">GET /api/orders/track</code> masks customer names (<code className="text-neutral-200">A*** S***</code>) and phone numbers (<code className="text-neutral-200">******3210</code>), and withholds exact street addresses. This prevents unauthorized attackers from scraping customer personal details.
                  </p>
                </div>

                <div className="p-4 bg-neutral-900 border border-neutral-800">
                  <strong className="text-white block font-sans text-sm mb-1">
                    4. Hardened Admin Authentication (FIXED)
                  </strong>
                  <p className="text-neutral-400 leading-relaxed">
                    The Operations Portal is locked behind timing-safe cryptographic password comparison (<code className="text-neutral-200">crypto.timingSafeEqual</code>) and HMAC-signed session tokens. All administrative order retrieval, updates, and deletions require a valid <code className="text-neutral-200">Bearer</code> token.
                  </p>
                </div>

                <div className="p-4 bg-amber-950/40 border border-amber-900 text-amber-200">
                  <strong className="text-white block font-sans text-sm mb-1">
                    ⚠️ Required Manual Configuration Before Accepting Real Customer Orders:
                  </strong>
                  <ul className="list-disc list-inside space-y-1 text-neutral-300">
                    <li>
                      <strong>Production Database:</strong> Replace server in-memory storage with a persistent database (PostgreSQL Cloud SQL or Firebase Firestore).
                    </li>
                    <li>
                      <strong>Firestore Security Rules (If using Firebase):</strong> Deploy rules ensuring only <code className="text-white">request.auth != null && request.auth.token.admin == true</code> can read or query the <code className="text-white">orders</code> collection.
                    </li>
                    <li>
                      <strong>Live Payment Gateway:</strong> Integrate a certified Payment Aggregator (Razorpay / Cashfree) with server-side webhook signature verification.
                    </li>
                    <li>
                      <strong>Update Admin Secret:</strong> Change <code className="text-white">ADMIN_SECRET_KEY</code> in production environment secrets to a high-entropy passphrase.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Order Modal */}
        {editingOrder && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setEditingOrder(null)} />
            <div className="relative min-h-screen flex items-center justify-center p-4">
              <form onSubmit={handleSaveOrder} className="relative w-full max-w-lg bg-[#0e0e12] border border-neutral-800 p-6 sm:p-8 space-y-4 text-white text-left">
                <div className="flex justify-between items-center pb-3 border-b border-neutral-800">
                  <h3 className="font-display text-lg font-bold uppercase">
                    MANAGE ORDER #{editingOrder.orderNumber}
                  </h3>
                  <button type="button" onClick={() => setEditingOrder(null)} className="text-neutral-400 hover:text-white cursor-pointer">✕</button>
                </div>

                <div className="space-y-3 text-xs font-mono">
                  <div>
                    <label className="block text-neutral-400 mb-1">Customer Delivery Address</label>
                    <div className="p-2.5 bg-neutral-900 border border-neutral-800 text-neutral-200">
                      {editingOrder.customerName} ({editingOrder.phone})
                      <br />
                      {editingOrder.address}, {editingOrder.city}, {editingOrder.state} - {editingOrder.pincode}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-neutral-400 mb-1">Supplier POD Partner</label>
                      <input
                        type="text"
                        value={orderSupplierName}
                        onChange={(e) => setOrderSupplierName(e.target.value)}
                        placeholder="e.g. Qikink / Printrove"
                        className="w-full bg-neutral-900 border border-neutral-800 p-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-neutral-400 mb-1">Supplier Order ID</label>
                      <input
                        type="text"
                        value={orderSupplierId}
                        onChange={(e) => setOrderSupplierId(e.target.value)}
                        placeholder="e.g. QK-9831"
                        className="w-full bg-neutral-900 border border-neutral-800 p-2 text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-neutral-400 mb-1">Courier Carrier</label>
                      <input
                        type="text"
                        value={orderCarrier}
                        onChange={(e) => setOrderCarrier(e.target.value)}
                        placeholder="e.g. Delhivery Surface"
                        className="w-full bg-neutral-900 border border-neutral-800 p-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-neutral-400 mb-1">Courier Tracking / AWB #</label>
                      <input
                        type="text"
                        value={orderTracking}
                        onChange={(e) => setOrderTracking(e.target.value)}
                        placeholder="e.g. DEL981723412"
                        className="w-full bg-neutral-900 border border-neutral-800 p-2 text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-neutral-400 mb-1">Fulfillment Status</label>
                    <select
                      value={orderStatus}
                      onChange={(e) => setOrderStatus(e.target.value as OrderStatus)}
                      className="w-full bg-neutral-900 border border-neutral-800 p-2 text-white cursor-pointer"
                    >
                      <option value="pending">Pending (Awaiting Supplier Order)</option>
                      <option value="supplier_ordered">Supplier Ordered (Printing)</option>
                      <option value="dispatched">Dispatched (With Courier)</option>
                      <option value="delivered">Delivered to Customer</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-neutral-400 mb-1">Internal Notes</label>
                    <textarea
                      rows={2}
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      placeholder="Add supplier notes, dispatch instructions..."
                      className="w-full bg-neutral-900 border border-neutral-800 p-2 text-white"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-neutral-800 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingOrder(null)}
                    className="px-4 py-2 bg-neutral-900 text-neutral-300 text-xs font-mono uppercase"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-white text-black text-xs font-mono font-bold uppercase"
                  >
                    Save & Update Tracking
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add/Edit Product Modal */}
        {(isNewProductModalOpen || editingProduct) && (
          <ProductFormModal
            product={editingProduct}
            onClose={() => {
              setIsNewProductModalOpen(false);
              setEditingProduct(null);
            }}
            onSave={(prodData) => {
              if (editingProduct) {
                updateProduct(editingProduct.id, prodData);
              } else {
                addProduct(prodData);
              }
              setIsNewProductModalOpen(false);
              setEditingProduct(null);
            }}
          />
        )}

      </div>
    </div>
  );
};

interface ProductFormModalProps {
  product: Product | null;
  onClose: () => void;
  onSave: (data: any) => void;
}

const ProductFormModal: React.FC<ProductFormModalProps> = ({ product, onClose, onSave }) => {
  const [name, setName] = useState(product?.name || '');
  const [price, setPrice] = useState(product?.price || 499);
  const [category, setCategory] = useState<'men' | 'women' | 'all'>(product?.category || 'men');
  const [fabricGsm, setFabricGsm] = useState(product?.fabricGsm || 260);
  const [fit, setFit] = useState(product?.fit || 'Boxy Oversized');
  const [description, setDescription] = useState(product?.description || '');
  const [isFeatured, setIsFeatured] = useState(product?.isFeatured ?? true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    onSave({
      slug,
      name,
      price: Number(price),
      category,
      fabricGsm: Number(fabricGsm),
      fit,
      description,
      isFeatured,
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      defaultColor: 'Black',
      colors: [
        { name: 'Black', hex: '#121212' },
        { name: 'Charcoal', hex: '#2c2c30' },
        { name: 'White', hex: '#f6f6f6' },
      ],
      details: [
        `${fabricGsm} GSM 100% Combed Cotton`,
        'Dropped shoulder boxy cut',
        'Pre-shrunk and bio-washed',
      ],
      image: product?.image || '/images/tee-shadow-black.jpg',
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <form onSubmit={handleSubmit} className="relative w-full max-w-lg bg-[#0e0e12] border border-neutral-800 p-6 sm:p-8 space-y-4 text-white text-left">
          <div className="flex justify-between items-center pb-3 border-b border-neutral-800">
            <h3 className="font-display text-lg font-bold uppercase">
              {product ? 'EDIT PRODUCT' : 'NEW STREETWEAR TEE'}
            </h3>
            <button type="button" onClick={onClose} className="text-neutral-400 hover:text-white cursor-pointer">✕</button>
          </div>

          <div className="space-y-3 text-xs font-mono">
            <div>
              <label className="block text-neutral-400 mb-1">Product Title *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Nocturnal Acid Oversized Tee"
                className="w-full bg-neutral-900 border border-neutral-800 p-2 text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-neutral-400 mb-1">Price in INR (₹)</label>
                <input
                  type="number"
                  required
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="w-full bg-neutral-900 border border-neutral-800 p-2 text-white"
                />
              </div>
              <div>
                <label className="block text-neutral-400 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full bg-neutral-900 border border-neutral-800 p-2 text-white cursor-pointer"
                >
                  <option value="men">Men</option>
                  <option value="women">Women</option>
                  <option value="all">Unisex / All</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-neutral-400 mb-1">Fabric GSM</label>
                <input
                  type="number"
                  value={fabricGsm}
                  onChange={(e) => setFabricGsm(Number(e.target.value))}
                  className="w-full bg-neutral-900 border border-neutral-800 p-2 text-white"
                />
              </div>
              <div>
                <label className="block text-neutral-400 mb-1">Fit Silhouette</label>
                <input
                  type="text"
                  value={fit}
                  onChange={(e) => setFit(e.target.value)}
                  placeholder="e.g. Boxy Drop Shoulder"
                  className="w-full bg-neutral-900 border border-neutral-800 p-2 text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-neutral-400 mb-1">Description</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Product description and street aesthetic details..."
                className="w-full bg-neutral-900 border border-neutral-800 p-2 text-white"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="feat"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="accent-white"
              />
              <label htmlFor="feat" className="text-neutral-300 cursor-pointer">
                Showcase on Homepage Featured Strip
              </label>
            </div>
          </div>

          <div className="pt-3 border-t border-neutral-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-neutral-900 text-neutral-300 text-xs font-mono uppercase"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-white text-black text-xs font-mono font-bold uppercase"
            >
              Save Product
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
