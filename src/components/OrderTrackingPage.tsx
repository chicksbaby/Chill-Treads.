import React, { useState, useEffect } from 'react';
import { useStore, TrackedOrderMilestone } from '../context/StoreContext';
import { Search, Package, Truck, CheckCircle2, Copy, Check, Clock, AlertCircle, Loader2, ShieldCheck, KeyRound } from 'lucide-react';

export const OrderTrackingPage: React.FC = () => {
  const { trackOrder, showToast } = useStore();
  const [searchInput, setSearchInput] = useState('CT-2601');
  const [phoneInput, setPhoneInput] = useState('0001');
  const [copied, setCopied] = useState(false);
  const [trackedData, setTrackedData] = useState<TrackedOrderMilestone | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchTracking = async (orderNum: string, phoneVerif: string) => {
    if (!orderNum.trim()) return;
    setIsLoading(true);
    setErrorMessage(null);

    const res = await trackOrder(orderNum.trim(), phoneVerif.trim());
    setIsLoading(false);

    if (res.success && res.data) {
      setTrackedData(res.data);
    } else {
      setTrackedData(null);
      setErrorMessage(res.error || 'No shipment record found. Please verify your order number and mobile number.');
    }
  };

  useEffect(() => {
    fetchTracking(searchInput, phoneInput);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTracking(searchInput, phoneInput);
  };

  const handleCopyTracking = (trackingNum: string) => {
    navigator.clipboard.writeText(trackingNum);
    setCopied(true);
    showToast(`Copied tracking number: ${trackingNum}`);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStepStatus = (status: string, step: number) => {
    const levels: Record<string, number> = {
      pending: 1,
      supplier_ordered: 2,
      dispatched: 3,
      delivered: 4,
    };
    const current = levels[status] || 1;
    if (current > step) return 'completed';
    if (current === step) return 'active';
    return 'upcoming';
  };

  return (
    <div className="bg-[#0c0c0e] text-white min-h-screen py-12 sm:py-16 border-b border-neutral-900 text-left">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Page Header */}
        <div className="mb-10 pb-6 border-b border-neutral-900">
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="font-mono text-xs tracking-[0.25em] text-emerald-400 uppercase font-semibold">
              PRIVACY PROTECTED SHIPMENT VERIFICATION
            </span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold uppercase tracking-tight text-white mt-1">
            TRACK YOUR CHILL TREADS ORDER
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-2 font-mono">
            To prevent unauthorized order enumeration, access requires your Order Number AND the mobile number (or last 4 digits) provided during checkout.
          </p>
        </div>

        {/* Search Bar with 2-Factor Order Verification */}
        <form onSubmit={handleSearch} className="bg-neutral-950 p-6 border border-neutral-900 mb-8 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-6 relative">
              <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1">
                01. Order Number
              </label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input
                  type="text"
                  required
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="e.g. CT-2601"
                  className="w-full bg-neutral-900 border border-neutral-800 text-xs font-mono text-white pl-9 pr-4 py-2.5 uppercase placeholder:text-neutral-600 focus:outline-none focus:border-white"
                />
              </div>
            </div>

            <div className="sm:col-span-4 relative">
              <label className="block text-[10px] font-mono text-neutral-400 uppercase mb-1">
                02. Mobile Phone (or last 4 digits)
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input
                  type="text"
                  required
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="e.g. 0001 or 9999900001"
                  className="w-full bg-neutral-900 border border-neutral-800 text-xs font-mono text-white pl-9 pr-4 py-2.5 placeholder:text-neutral-600 focus:outline-none focus:border-white"
                />
              </div>
            </div>

            <div className="sm:col-span-2 flex items-end">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-white text-black hover:bg-neutral-200 disabled:opacity-50 py-2.5 text-xs font-mono font-bold uppercase transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>VERIFY</span>
              </button>
            </div>
          </div>

          {/* Quick Demo Suggestions */}
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-neutral-500 pt-1">
            <span>Demo Test Orders:</span>
            <button
              type="button"
              onClick={() => {
                setSearchInput('CT-2601');
                setPhoneInput('0001');
                fetchTracking('CT-2601', '0001');
              }}
              className="underline hover:text-white cursor-pointer"
            >
              #CT-2601 (PIN: 0001)
            </button>
            <span>·</span>
            <button
              type="button"
              onClick={() => {
                setSearchInput('CT-2602');
                setPhoneInput('0002');
                fetchTracking('CT-2602', '0002');
              }}
              className="underline hover:text-white cursor-pointer"
            >
              #CT-2602 (PIN: 0002)
            </button>
          </div>
        </form>

        {/* Error Message */}
        {errorMessage && (
          <div className="p-8 text-center bg-neutral-950 border border-neutral-800 space-y-3 mb-8">
            <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
            <h3 className="font-display text-base uppercase text-white font-bold">
              ACCESS RESTRICTED
            </h3>
            <p className="text-xs text-neutral-400 font-mono max-w-md mx-auto leading-relaxed">
              {errorMessage}
            </p>
          </div>
        )}

        {/* Matched Order Display */}
        {trackedData && (
          <div className="bg-neutral-950 border border-neutral-800 p-6 sm:p-8 space-y-8">
            
            {/* Top Bar of Order */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-900">
              <div>
                <span className="text-[10px] font-mono tracking-widest text-neutral-400 uppercase">
                  VERIFIED SHIPMENT RECORD
                </span>
                <h2 className="font-display text-2xl font-black uppercase text-white mt-0.5">
                  #{trackedData.orderNumber}
                </h2>
                <p className="text-xs font-mono text-neutral-400 mt-1">
                  Placed on {new Date(trackedData.createdAt).toLocaleString()} · Recipient: {trackedData.customerMaskedName} ({trackedData.customerMaskedPhone})
                </p>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-mono uppercase text-neutral-400 block">
                  DISPATCH STATUS
                </span>
                <span className="inline-block mt-1 px-3 py-1 text-xs font-mono font-bold uppercase tracking-wider bg-neutral-900 border border-neutral-700 text-white">
                  {trackedData.status.replace('_', ' ')}
                </span>
              </div>
            </div>

            {/* Tracking Milestones Stepper */}
            <div className="space-y-4">
              <h3 className="text-xs font-mono font-bold tracking-widest uppercase text-neutral-400">
                DISPATCH MILESTONES
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs font-mono">
                {/* Step 1 */}
                <div className={`p-4 border ${
                  getStepStatus(trackedData.status, 1) === 'completed' || getStepStatus(trackedData.status, 1) === 'active'
                    ? 'border-white bg-neutral-900/60'
                    : 'border-neutral-900 bg-neutral-950 text-neutral-600'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span className="font-bold uppercase">1. PLACED</span>
                  </div>
                  <p className="text-[11px] text-neutral-400">Order recorded & payment authorized</p>
                </div>

                {/* Step 2 */}
                <div className={`p-4 border ${
                  getStepStatus(trackedData.status, 2) === 'completed' || getStepStatus(trackedData.status, 2) === 'active'
                    ? 'border-white bg-neutral-900/60'
                    : 'border-neutral-900 bg-neutral-950 text-neutral-600'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="w-4 h-4 text-white" />
                    <span className="font-bold uppercase">2. SUPPLIER</span>
                  </div>
                  <p className="text-[11px] text-neutral-400">
                    {trackedData.supplierName}
                  </p>
                </div>

                {/* Step 3 */}
                <div className={`p-4 border ${
                  getStepStatus(trackedData.status, 3) === 'completed' || getStepStatus(trackedData.status, 3) === 'active'
                    ? 'border-white bg-neutral-900/60'
                    : 'border-neutral-900 bg-neutral-950 text-neutral-600'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Truck className="w-4 h-4 text-white" />
                    <span className="font-bold uppercase">3. DISPATCHED</span>
                  </div>
                  <p className="text-[11px] text-neutral-400">
                    {trackedData.carrierName}
                  </p>
                </div>

                {/* Step 4 */}
                <div className={`p-4 border ${
                  getStepStatus(trackedData.status, 4) === 'completed' || getStepStatus(trackedData.status, 4) === 'active'
                    ? 'border-white bg-neutral-900/60'
                    : 'border-neutral-900 bg-neutral-950 text-neutral-600'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-white" />
                    <span className="font-bold uppercase">4. DELIVERED</span>
                  </div>
                  <p className="text-[11px] text-neutral-400">At destination doorstep</p>
                </div>
              </div>
            </div>

            {/* Courier Tracking Card */}
            {trackedData.trackingNumber ? (
              <div className="p-4 bg-neutral-900/80 border border-neutral-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-mono text-neutral-400 uppercase block">
                    COURIER WAYBILL / TRACKING CODE
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-sm font-bold text-white tracking-wider">
                      {trackedData.carrierName}: {trackedData.trackingNumber}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopyTracking(trackedData.trackingNumber!)}
                  className="inline-flex items-center gap-1.5 bg-neutral-800 hover:bg-white hover:text-black text-neutral-200 px-4 py-2 text-xs font-mono font-bold transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'COPIED' : 'COPY TRACKING #'}</span>
                </button>
              </div>
            ) : (
              <div className="p-4 bg-neutral-900/40 border border-neutral-900 text-xs font-mono text-neutral-400">
                ⏳ Waybill / AWB code will be generated as soon as your parcel is packed and scanned by Delhivery / Bluedart.
              </div>
            )}

            {/* Order Items */}
            <div className="space-y-3 pt-4 border-t border-neutral-900">
              <h3 className="text-xs font-mono tracking-widest uppercase text-neutral-400">
                PARCEL CONTENTS ({trackedData.items.length} PIECES)
              </h3>
              <div className="divide-y divide-neutral-900 border border-neutral-900">
                {trackedData.items.map((it, i) => (
                  <div key={i} className="p-3.5 flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-3">
                      <img src={it.image} alt={it.name} className="w-12 h-14 object-cover bg-neutral-900" />
                      <div>
                        <strong className="text-white font-sans text-sm">{it.name}</strong>
                        <div className="text-neutral-400 text-[11px] mt-0.5">
                          Size: {it.size} · Color: {it.color} · Qty: {it.quantity}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Destination Privacy Protection Banner */}
            <div className="p-4 bg-neutral-900/40 border border-neutral-800 text-xs font-mono text-neutral-400 space-y-1">
              <span className="text-white font-bold uppercase block mb-1">
                DESTINATION CITY:
              </span>
              <p>{trackedData.destinationCity}, {trackedData.destinationState}</p>
              <p className="text-[11px] text-neutral-500 pt-1">
                🔒 PII Redaction Policy: Exact street address and raw phone number are concealed from public viewing to protect customer privacy.
              </p>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
