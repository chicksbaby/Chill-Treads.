import React from 'react';
import { useStore } from '../context/StoreContext';
import { X, ShieldAlert, Truck, RefreshCw, Lock, Sparkles } from 'lucide-react';

export const PolicyModal: React.FC = () => {
  const { activePolicy, setActivePolicy, settings } = useStore();

  if (!activePolicy) return null;

  const getPolicyContent = () => {
    switch (activePolicy) {
      case 'shipping':
        return {
          title: 'SHIPPING & DELIVERY POLICY',
          icon: Truck,
          content: (
            <div className="space-y-4 text-xs font-mono text-neutral-300 leading-relaxed">
              <p>
                <strong>Delivery Locations:</strong> We deliver to over 19,000 PIN codes across India via our express logistics partners including Delhivery, Bluedart, and Xpressbees.
              </p>
              <p>
                <strong>Processing & Dispatch Time:</strong> Orders are verified, packed, and dispatched within 24 to 48 hours from our fulfillment hub.
              </p>
              <p>
                <strong>Delivery Timelines:</strong>
                <br />· Metro Cities (Mumbai, Bengaluru, Delhi NCR, Chennai, Hyderabad, Kolkata): 2–4 business days.
                <br />· Rest of India: 4–6 business days.
              </p>
              <p>
                <strong>Shipping Fees:</strong>
                <br />· Orders above ₹{settings.freeShippingThreshold}: FREE STANDARD SHIPPING across India.
                <br />· Orders below ₹{settings.freeShippingThreshold}: Flat ₹{settings.shippingFee} shipping fee.
              </p>
              <p>
                <strong>Order Tracking:</strong> Once dispatched, a live tracking link with carrier ID is generated and trackable directly via our Track Order portal.
              </p>
            </div>
          ),
        };
      case 'returns':
        return {
          title: '7-DAY RETURN & EXCHANGE POLICY',
          icon: RefreshCw,
          content: (
            <div className="space-y-4 text-xs font-mono text-neutral-300 leading-relaxed">
              <p>
                <strong>Return Window:</strong> We offer a 7-day hassle-free size replacement or exchange from the date of delivery.
              </p>
              <p>
                <strong>Eligibility Conditions:</strong>
                <br />· The item must be unused, unwashed, and in its original condition.
                <br />· Original brand tags, barcode stickers, and polybag packaging must remain intact.
                <br />· Proof of purchase (Order ID or Invoice) is required.
              </p>
              <p>
                <strong>Exchange Process:</strong> Simply initiate an exchange request with your Order ID via email ({settings.contactEmail}). We arrange a reverse pickup from your doorstep.
              </p>
              <p>
                <strong>Refunds:</strong> Approved refunds for returns are processed back to the original payment source within 5–7 business days, or as store credit for Cash on Delivery orders.
              </p>
            </div>
          ),
        };
      case 'security':
        return {
          title: 'SECURE CHECKOUT & PRIVACY GUARANTEE',
          icon: Lock,
          content: (
            <div className="space-y-4 text-xs font-mono text-neutral-300 leading-relaxed">
              <p>
                <strong>Data Minimization:</strong> Chill Treads never collects or stores sensitive financial credentials, CVV codes, bank passwords, or UPI PINs on our servers.
              </p>
              <p>
                <strong>Simulation Notice:</strong> In this demo storefront mode, orders are simulated safely so you can test the full shopping and dropship workflow without real charges.
              </p>
              <p>
                <strong>Information Handled:</strong> Customer shipping details (Name, Address, Phone, Pincode) are utilized strictly for order generation, supplier dropship fulfillment, and courier tracking updates.
              </p>
            </div>
          ),
        };
      case 'quality':
        return {
          title: 'PREMIUM FABRIC & PRINT SPECIFICATIONS',
          icon: Sparkles,
          content: (
            <div className="space-y-4 text-xs font-mono text-neutral-300 leading-relaxed">
              <p>
                <strong>Cotton Quality:</strong> 100% Super-combed ring-spun compact cotton sourced from premium Indian textile mills.
              </p>
              <p>
                <strong>Fabric Density:</strong> 240 to 280 GSM heavyweight jersey. Sturdy, architectural drape that maintains silhouette without clinging.
              </p>
              <p>
                <strong>Finishes:</strong> Enzyme biowashed and pre-shrunk for maximum handfeel softness and zero shrinkage on cold wash.
              </p>
              <p>
                <strong>Printing Technique:</strong> High-density plastisol and water-based screen printing. Crack-resistant, fade-resistant, and tested for 50+ wash cycles.
              </p>
            </div>
          ),
        };
      case 'privacy':
      default:
        return {
          title: 'PRIVACY & DATA POLICY',
          icon: ShieldAlert,
          content: (
            <div className="space-y-4 text-xs font-mono text-neutral-300 leading-relaxed">
              <p>
                <strong>Privacy Commitment:</strong> Chill Treads respects your personal data. We do not sell or rent customer phone numbers or email addresses to third-party data brokers.
              </p>
              <p>
                <strong>Cookies & Local Storage:</strong> We utilize modern browser localStorage solely to preserve your bag items, wishlist preferences, and order history across browsing sessions.
              </p>
              <p>
                <strong>Contact:</strong> For inquiries regarding your records or removal requests, contact {settings.contactEmail}.
              </p>
            </div>
          ),
        };
    }
  };

  const policy = getPolicyContent();
  const Icon = policy.icon;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={() => setActivePolicy(null)}
      />

      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative w-full max-w-lg bg-[#0e0e12] border border-neutral-800 shadow-2xl p-6 sm:p-8 text-white text-left animate-in fade-in zoom-in-95 duration-200">
          
          <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
            <div className="flex items-center gap-2.5">
              <Icon className="w-5 h-5 text-neutral-300" />
              <h3 className="font-display text-base font-bold uppercase tracking-wider text-white">
                {policy.title}
              </h3>
            </div>
            <button
              onClick={() => setActivePolicy(null)}
              className="p-1 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="py-6">{policy.content}</div>

          <div className="pt-4 border-t border-neutral-800 flex justify-end">
            <button
              onClick={() => setActivePolicy(null)}
              className="bg-white text-black hover:bg-neutral-200 px-6 py-2.5 text-xs font-mono font-bold uppercase cursor-pointer"
            >
              CLOSE
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
