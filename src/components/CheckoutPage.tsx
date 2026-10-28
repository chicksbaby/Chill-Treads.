import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { ShieldCheck, ArrowLeft, CheckCircle2, AlertCircle, ShoppingBag, Loader2 } from 'lucide-react';

export const CheckoutPage: React.FC = () => {
  const {
    cart,
    subtotal,
    shippingFee,
    discountAmount,
    total,
    submitOrder,
    lastPlacedOrder,
    clearLastPlacedOrder,
    navigateTo,
  } = useStore();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: 'Maharashtra',
    pincode: '',
    paymentMethod: 'cod',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const indianStates = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa',
    'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala',
    'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland',
    'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
    'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi NCR', 'Chandigarh'
  ];

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      errs.name = 'Full Name is required (minimum 2 characters)';
    }

    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errs.email = 'Valid Email address is required';
    }
    
    // Indian 10-digit mobile number validation (starting with 6-9)
    const cleanPhone = formData.phone.replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      errs.phone = 'Enter valid 10-digit Indian phone number starting with 6, 7, 8, or 9';
    }

    if (!formData.address.trim() || formData.address.trim().length < 5) {
      errs.address = 'Street address is required';
    }

    if (!formData.city.trim()) {
      errs.city = 'City is required';
    }
    
    // Indian 6-digit PIN code validation
    const cleanPin = formData.pincode.replace(/\D/g, '');
    if (!/^[1-9][0-9]{5}$/.test(cleanPin)) {
      errs.pincode = 'Enter valid 6-digit postal PIN code';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (!validate()) return;
    if (cart.length === 0) return;

    setIsSubmitting(true);

    const res = await submitOrder({
      customerName: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      address: formData.address.trim(),
      city: formData.city.trim(),
      state: formData.state,
      pincode: formData.pincode.trim(),
      paymentMethod: formData.paymentMethod,
    });

    setIsSubmitting(false);

    if (!res.success) {
      setServerError(res.error || 'Server error occurred while validating checkout.');
    }
  };

  if (lastPlacedOrder) {
    return (
      <div className="bg-[#0c0c0e] text-white min-h-screen py-16 px-4 sm:px-6 lg:px-8 border-b border-neutral-900">
        <div className="max-w-2xl mx-auto bg-neutral-950 border border-neutral-800 p-8 text-left space-y-6">
          
          <div className="flex items-center gap-3 border-b border-neutral-900 pb-6">
            <CheckCircle2 className="w-8 h-8 text-white shrink-0" />
            <div>
              <span className="text-[10px] font-mono tracking-widest text-neutral-400 uppercase">
                ORDER RECORD CREATED (DEMO SIMULATION)
              </span>
              <h1 className="font-display text-2xl sm:text-3xl font-extrabold uppercase text-white">
                ORDER #{lastPlacedOrder.orderNumber}
              </h1>
            </div>
          </div>

          <div className="p-4 bg-neutral-900/60 border border-neutral-800 text-xs font-mono text-neutral-300 space-y-2">
            <div className="flex justify-between">
              <span className="text-neutral-500">DATE:</span>
              <span className="text-white">{new Date(lastPlacedOrder.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">PAYMENT METHOD:</span>
              <span className="text-white uppercase">
                {lastPlacedOrder.paymentMethod === 'cod' ? 'Cash on Delivery (Verified)' : 'Test Simulation (Paid)'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">STATUS:</span>
              <span className="text-amber-400 font-bold uppercase">PENDING SUPPLIER DISPATCH</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">CUSTOMER:</span>
              <span className="text-white">{lastPlacedOrder.customerName} ({lastPlacedOrder.phone})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">SHIPPING DESTINATION:</span>
              <span className="text-white text-right max-w-xs truncate">
                {lastPlacedOrder.address}, {lastPlacedOrder.city}, {lastPlacedOrder.state} - {lastPlacedOrder.pincode}
              </span>
            </div>
          </div>

          {/* Itemized list */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono tracking-widest uppercase text-neutral-400">
              PURCHASED PIECES
            </h3>
            <div className="divide-y divide-neutral-900 border border-neutral-900">
              {lastPlacedOrder.items.map((it, i) => (
                <div key={i} className="p-3 flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-3">
                    <img src={it.image} alt={it.name} className="w-10 h-12 object-cover bg-neutral-900" />
                    <div>
                      <strong className="text-white font-sans">{it.name}</strong>
                      <div className="text-neutral-400 text-[11px]">
                        Size: {it.size} · Color: {it.color} · Qty: {it.quantity}
                      </div>
                    </div>
                  </div>
                  <span className="text-white font-bold tabular-nums">
                    ₹{it.price * it.quantity}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Total summary */}
          <div className="p-4 bg-neutral-900/40 border border-neutral-900 text-xs font-mono space-y-1.5">
            <div className="flex justify-between text-neutral-400">
              <span>SUBTOTAL</span>
              <span className="tabular-nums">₹{lastPlacedOrder.subtotal}</span>
            </div>
            {lastPlacedOrder.discount > 0 && (
              <div className="flex justify-between text-emerald-400">
                <span>DISCOUNT APPLIED</span>
                <span className="tabular-nums">-₹{lastPlacedOrder.discount}</span>
              </div>
            )}
            <div className="flex justify-between text-neutral-400">
              <span>DELIVERY</span>
              <span>{lastPlacedOrder.shippingFee === 0 ? 'FREE' : `₹${lastPlacedOrder.shippingFee}`}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-neutral-800">
              <span>TOTAL (SERVER-VERIFIED)</span>
              <span className="tabular-nums">₹{lastPlacedOrder.total}</span>
            </div>
          </div>

          <div className="p-3.5 bg-neutral-900 border border-neutral-800 text-[11px] font-mono text-neutral-400">
            ℹ️ Security Notice: Customer order details were validated and recorded on the backend API server. They are NOT stored in public browser storage or git code.
          </div>

          {/* Navigation CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              onClick={() => {
                clearLastPlacedOrder();
                navigateTo('#/track-order');
              }}
              className="flex-1 bg-white text-black hover:bg-neutral-200 py-3 text-xs font-mono font-bold tracking-widest uppercase transition-colors text-center cursor-pointer"
            >
              TRACK THIS ORDER →
            </button>
            <button
              onClick={() => {
                clearLastPlacedOrder();
                navigateTo('#/shop');
              }}
              className="flex-1 bg-neutral-900 text-white hover:bg-neutral-800 border border-neutral-700 py-3 text-xs font-mono font-bold tracking-widest uppercase transition-colors text-center cursor-pointer"
            >
              CONTINUE SHOPPING
            </button>
          </div>

        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="bg-[#0c0c0e] text-white min-h-screen py-24 px-4 text-center">
        <div className="max-w-md mx-auto space-y-4">
          <ShoppingBag className="w-10 h-10 text-neutral-600 mx-auto" />
          <h2 className="font-display text-2xl font-bold uppercase">YOUR BAG IS EMPTY</h2>
          <p className="text-xs text-neutral-400 font-mono">
            Please add an oversized tee to your bag before proceeding to checkout.
          </p>
          <button
            onClick={() => navigateTo('#/shop')}
            className="px-6 py-3 bg-white text-black font-mono text-xs font-bold uppercase tracking-wider cursor-pointer"
          >
            EXPLORE CATALOG
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0c0c0e] text-white min-h-screen py-10 sm:py-16 border-b border-neutral-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Back Link */}
        <button
          onClick={() => navigateTo('#/shop')}
          className="inline-flex items-center gap-1.5 text-xs font-mono text-neutral-400 hover:text-white mb-8 uppercase transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>RETURN TO STORE</span>
        </button>

        {/* Demo Mode Notice Banner */}
        <div className="mb-8 p-4 bg-neutral-950 border border-neutral-800 flex items-start gap-3 text-left">
          <ShieldCheck className="w-5 h-5 text-neutral-300 shrink-0 mt-0.5" />
          <div className="text-xs font-mono">
            <strong className="text-white block font-sans uppercase tracking-wider mb-0.5">
              SECURITY AUDIT & DEMO SIMULATION MODE
            </strong>
            <p className="text-neutral-400 leading-relaxed">
              Order requests are transmitted to the server-side API with strict anti-tampering validation. We never collect or store debit/credit card numbers, CVVs, or UPI PINs. Use dummy test info only until production database & payments are connected.
            </p>
          </div>
        </div>

        {serverError && (
          <div className="mb-6 p-4 bg-red-950/70 border border-red-800 text-red-200 text-xs font-mono flex items-center gap-2 text-left">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{serverError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start text-left">
          
          {/* Checkout Form (Col 1-7) */}
          <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-8">
            
            {/* Step 1: Customer Info */}
            <div className="bg-neutral-950 border border-neutral-900 p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
                <h3 className="font-display text-base font-bold uppercase tracking-wider text-white">
                  01. CONTACT DETAILS
                </h3>
                <span className="text-[10px] font-mono text-neutral-500 uppercase">INDIA (+91)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-neutral-400 mb-1.5 uppercase">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Test Customer"
                    className="w-full bg-neutral-900 border border-neutral-800 px-3.5 py-2.5 text-xs font-mono text-white placeholder:text-neutral-600 focus:outline-none focus:border-white"
                  />
                  {errors.name && <span className="text-[10px] font-mono text-red-400 mt-1 block">{errors.name}</span>}
                </div>

                <div>
                  <label className="block text-xs font-mono text-neutral-400 mb-1.5 uppercase">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="test@example.com"
                    className="w-full bg-neutral-900 border border-neutral-800 px-3.5 py-2.5 text-xs font-mono text-white placeholder:text-neutral-600 focus:outline-none focus:border-white"
                  />
                  {errors.email && <span className="text-[10px] font-mono text-red-400 mt-1 block">{errors.email}</span>}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-mono text-neutral-400 mb-1.5 uppercase">
                    Mobile Phone (10 digits starting with 6-9) *
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 bg-neutral-900 border border-r-0 border-neutral-800 text-xs font-mono text-neutral-400">
                      +91
                    </span>
                    <input
                      type="tel"
                      maxLength={10}
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
                      placeholder="9876543210"
                      className="w-full bg-neutral-900 border border-neutral-800 px-3.5 py-2.5 text-xs font-mono text-white placeholder:text-neutral-600 focus:outline-none focus:border-white"
                    />
                  </div>
                  {errors.phone && <span className="text-[10px] font-mono text-red-400 mt-1 block">{errors.phone}</span>}
                </div>
              </div>
            </div>

            {/* Step 2: Shipping Address */}
            <div className="bg-neutral-950 border border-neutral-900 p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
                <h3 className="font-display text-base font-bold uppercase tracking-wider text-white">
                  02. DELIVERY ADDRESS
                </h3>
                <span className="text-[10px] font-mono text-neutral-500 uppercase">DOORSTEP DELIVERY</span>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-mono text-neutral-400 mb-1.5 uppercase">
                    Flat / House No. / Street Address *
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="e.g. Flat 101, Test Residency"
                    className="w-full bg-neutral-900 border border-neutral-800 px-3.5 py-2.5 text-xs font-mono text-white placeholder:text-neutral-600 focus:outline-none focus:border-white"
                  />
                  {errors.address && <span className="text-[10px] font-mono text-red-400 mt-1 block">{errors.address}</span>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-neutral-400 mb-1.5 uppercase">
                      City *
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="Mumbai"
                      className="w-full bg-neutral-900 border border-neutral-800 px-3.5 py-2.5 text-xs font-mono text-white placeholder:text-neutral-600 focus:outline-none focus:border-white"
                    />
                    {errors.city && <span className="text-[10px] font-mono text-red-400 mt-1 block">{errors.city}</span>}
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-neutral-400 mb-1.5 uppercase">
                      State *
                    </label>
                    <select
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="w-full bg-neutral-900 border border-neutral-800 px-3 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-white cursor-pointer"
                    >
                      {indianStates.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-neutral-400 mb-1.5 uppercase">
                      PIN Code (6 digits) *
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={formData.pincode}
                      onChange={(e) => setFormData({ ...formData, pincode: e.target.value.replace(/\D/g, '') })}
                      placeholder="400001"
                      className="w-full bg-neutral-900 border border-neutral-800 px-3.5 py-2.5 text-xs font-mono text-white placeholder:text-neutral-600 focus:outline-none focus:border-white"
                    />
                    {errors.pincode && <span className="text-[10px] font-mono text-red-400 mt-1 block">{errors.pincode}</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3: Payment Options */}
            <div className="bg-neutral-950 border border-neutral-900 p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
                <h3 className="font-display text-base font-bold uppercase tracking-wider text-white">
                  03. PAYMENT METHOD
                </h3>
                <span className="text-[10px] font-mono text-neutral-500 uppercase">SAFE SIMULATION</span>
              </div>

              <div className="space-y-3">
                <label className={`flex items-start gap-3 p-4 border cursor-pointer transition-colors ${
                  formData.paymentMethod === 'cod'
                    ? 'border-white bg-neutral-900'
                    : 'border-neutral-800 bg-neutral-950 hover:bg-neutral-900/50'
                }`}>
                  <input
                    type="radio"
                    name="payment"
                    checked={formData.paymentMethod === 'cod'}
                    onChange={() => setFormData({ ...formData, paymentMethod: 'cod' })}
                    className="mt-1 accent-white"
                  />
                  <div className="text-xs font-mono">
                    <span className="text-white font-bold block font-sans text-sm">
                      Cash On Delivery (COD)
                    </span>
                    <span className="text-neutral-400 text-[11px] block mt-0.5">
                      Pay in cash or UPI QR to delivery executive when parcel arrives at your doorstep.
                    </span>
                  </div>
                </label>

                <label className={`flex items-start gap-3 p-4 border cursor-pointer transition-colors ${
                  formData.paymentMethod === 'upi_demo'
                    ? 'border-white bg-neutral-900'
                    : 'border-neutral-800 bg-neutral-950 hover:bg-neutral-900/50'
                }`}>
                  <input
                    type="radio"
                    name="payment"
                    checked={formData.paymentMethod === 'upi_demo'}
                    onChange={() => setFormData({ ...formData, paymentMethod: 'upi_demo' })}
                    className="mt-1 accent-white"
                  />
                  <div className="text-xs font-mono">
                    <span className="text-white font-bold block font-sans text-sm">
                      UPI Demo Simulation (GPay / PhonePe / Paytm)
                    </span>
                    <span className="text-neutral-400 text-[11px] block mt-0.5">
                      Simulate instant online payment confirmation for demo testing.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Place Order CTA */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-white text-black hover:bg-neutral-200 disabled:opacity-50 py-4 text-xs font-mono font-bold tracking-[0.2em] uppercase transition-colors shadow-2xl flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>VALIDATING ORDER ON SERVER...</span>
                </>
              ) : (
                <span>CONFIRM & PLACE ORDER (₹{total})</span>
              )}
            </button>
          </form>

          {/* Order Summary (Col 8-12) */}
          <div className="lg:col-span-5 bg-neutral-950 border border-neutral-900 p-6 space-y-6">
            <h3 className="font-display text-base font-bold uppercase tracking-wider text-white border-b border-neutral-900 pb-3">
              BAG SUMMARY ({cart.reduce((a, b) => a + b.quantity, 0)})
            </h3>

            {/* Products */}
            <div className="divide-y divide-neutral-900 max-h-72 overflow-y-auto">
              {cart.map((item) => (
                <div key={item.id} className="py-3 flex gap-3 text-xs font-mono">
                  <img src={item.image} alt={item.name} className="w-14 h-16 object-cover bg-neutral-900 shrink-0" />
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-display text-sm font-bold text-white uppercase line-clamp-1">{item.name}</h4>
                      <p className="text-neutral-400 text-[11px]">Size: {item.size} · Color: {item.color}</p>
                    </div>
                    <div className="flex justify-between items-center text-neutral-300">
                      <span>Qty: {item.quantity}</span>
                      <span className="text-white font-bold tabular-nums">₹{item.price * item.quantity}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Calculations */}
            <div className="space-y-2 border-t border-neutral-900 pt-4 text-xs font-mono text-neutral-400">
              <div className="flex justify-between">
                <span>SUBTOTAL</span>
                <span className="text-white tabular-nums">₹{subtotal}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>DISCOUNT</span>
                  <span className="tabular-nums">-₹{discountAmount}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>SHIPPING CHARGES</span>
                <span className="text-white">
                  {shippingFee === 0 ? 'FREE' : `₹${shippingFee}`}
                </span>
              </div>
              <div className="flex justify-between text-base font-bold text-white pt-2 border-t border-neutral-800">
                <span>FINAL TOTAL (INR)</span>
                <span className="tabular-nums">₹{total}</span>
              </div>
            </div>

            <div className="p-3 bg-neutral-900 border border-neutral-800 text-[11px] font-mono text-neutral-400">
              🔒 Server-Side Price Verification Active: Item prices are recalculated against canonical products to protect against client-side tampering.
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
