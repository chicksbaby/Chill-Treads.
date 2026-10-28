import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { X, Trash2, ArrowRight, ShoppingBag, Tag, Check, Truck } from 'lucide-react';

export const CartDrawer: React.FC = () => {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    updateCartQuantity,
    removeFromCart,
    subtotal,
    shippingFee,
    discountCode,
    discountAmount,
    applyCoupon,
    removeCoupon,
    total,
    freeShippingProgress,
    amountNeededForFreeShipping,
    navigateTo,
  } = useStore();

  const [couponInput, setCouponInput] = useState('');
  const [couponFeedback, setCouponFeedback] = useState<string | null>(null);

  if (!isCartOpen) return null;

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput) return;
    const res = applyCoupon(couponInput);
    setCouponFeedback(res.message);
    if (res.success) {
      setCouponInput('');
    }
  };

  const handleCheckout = () => {
    setIsCartOpen(false);
    navigateTo('#/checkout');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity animate-in fade-in duration-300"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#0e0e12] text-white border-l border-neutral-800 shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
          
          {/* Header */}
          <div className="p-6 border-b border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" />
              <h2 className="font-display text-lg font-black tracking-wider uppercase text-white">
                YOUR BAG ({cart.reduce((a, b) => a + b.quantity, 0)})
              </h2>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-1 text-neutral-400 hover:text-white transition-colors cursor-pointer"
              aria-label="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Progress Indicator */}
          <div className="bg-neutral-950 px-6 py-3 border-b border-neutral-800">
            <div className="flex items-center justify-between text-xs font-mono text-neutral-300 mb-1.5">
              <div className="flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-neutral-400" />
                {amountNeededForFreeShipping > 0 ? (
                  <span>
                    Add <strong className="text-white">₹{amountNeededForFreeShipping}</strong> for FREE Shipping
                  </span>
                ) : (
                  <span className="text-emerald-400 font-bold">
                    ✓ FREE SHIPPING UNLOCKED
                  </span>
                )}
              </div>
              <span>{freeShippingProgress}%</span>
            </div>
            <div className="w-full h-1.5 bg-neutral-800 overflow-hidden rounded-full">
              <div
                className="h-full bg-white transition-all duration-300"
                style={{ width: `${freeShippingProgress}%` }}
              />
            </div>
          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12 space-y-4">
                <div className="p-4 bg-neutral-900 rounded-full border border-neutral-800">
                  <ShoppingBag className="w-8 h-8 text-neutral-500" />
                </div>
                <h3 className="font-display text-base font-bold uppercase text-white">
                  YOUR BAG IS CURRENTLY EMPTY
                </h3>
                <p className="text-xs text-neutral-400 max-w-xs leading-relaxed">
                  Explore our heavyweight oversized tees and build your streetwear rotation.
                </p>
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    navigateTo('#/shop');
                  }}
                  className="bg-white text-black hover:bg-neutral-200 px-6 py-3 text-xs font-mono font-bold tracking-widest uppercase transition-colors cursor-pointer"
                >
                  EXPLORE DROP →
                </button>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 p-3 bg-neutral-950 border border-neutral-900 group"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-20 h-24 object-cover bg-neutral-900 shrink-0 filter grayscale-[20%]"
                  />
                  <div className="flex-1 flex flex-col justify-between text-left">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="font-display text-sm font-bold text-white uppercase line-clamp-1">
                          {item.name}
                        </h4>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-neutral-500 hover:text-red-400 transition-colors p-0.5 cursor-pointer"
                          aria-label={`Remove ${item.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="text-[11px] font-mono text-neutral-400 mt-0.5">
                        Size: <span className="text-neutral-200">{item.size}</span> · Color: <span className="text-neutral-200">{item.color}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-900">
                      {/* Quantity stepper */}
                      <div className="flex items-center border border-neutral-800 font-mono text-xs">
                        <button
                          onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                          className="w-7 h-7 flex items-center justify-center hover:bg-neutral-800 text-neutral-300 cursor-pointer"
                          aria-label="Decrease quantity"
                        >
                          -
                        </button>
                        <span className="w-7 text-center font-bold text-white">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                          className="w-7 h-7 flex items-center justify-center hover:bg-neutral-800 text-neutral-300 cursor-pointer"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>

                      <span className="font-mono text-sm font-bold text-white tabular-nums">
                        ₹{item.price * item.quantity}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer & Checkout Area */}
          {cart.length > 0 && (
            <div className="p-6 bg-neutral-950 border-t border-neutral-800 space-y-4">
              {/* Coupon Form */}
              <form onSubmit={handleApply} className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    placeholder="PROMO CODE (e.g. CHILL10)"
                    className="w-full bg-neutral-900 border border-neutral-800 text-xs font-mono text-white pl-8 pr-3 py-2.5 uppercase placeholder:text-neutral-600 focus:outline-none focus:border-white"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-neutral-800 hover:bg-white hover:text-black text-white text-xs font-mono font-bold px-4 py-2.5 transition-colors cursor-pointer"
                >
                  APPLY
                </button>
              </form>

              {/* Active Discount Display */}
              {discountCode && (
                <div className="flex items-center justify-between text-xs font-mono bg-neutral-900 px-3 py-1.5 border border-neutral-800">
                  <div className="flex items-center gap-1.5 text-emerald-400">
                    <Check className="w-3.5 h-3.5" />
                    <span>CODE {discountCode} ACTIVE</span>
                  </div>
                  <button
                    onClick={removeCoupon}
                    className="text-neutral-500 hover:text-white underline cursor-pointer text-[10px]"
                  >
                    REMOVE
                  </button>
                </div>
              )}

              {couponFeedback && !discountCode && (
                <p className="text-[11px] font-mono text-neutral-400">{couponFeedback}</p>
              )}

              {/* Cost Breakdown */}
              <div className="space-y-1.5 text-xs font-mono text-neutral-400 pt-1">
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
                  <span>ESTIMATED DELIVERY</span>
                  <span className="text-white tabular-nums">
                    {shippingFee === 0 ? 'FREE' : `₹${shippingFee}`}
                  </span>
                </div>
                <div className="flex justify-between text-base font-bold text-white pt-2 border-t border-neutral-800">
                  <span>TOTAL (INR)</span>
                  <span className="tabular-nums">₹{total}</span>
                </div>
              </div>

              {/* Checkout CTA */}
              <button
                onClick={handleCheckout}
                className="w-full bg-white text-black hover:bg-neutral-200 py-4 text-xs font-mono font-bold tracking-[0.2em] uppercase transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xl"
              >
                <span>PROCEED TO CHECKOUT</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <p className="text-[10px] font-mono text-center text-neutral-500 uppercase tracking-widest">
                DEMO CHECKOUT · NO CARD OR PIN COLLECTED
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
