import React from 'react';
import { useStore } from '../context/StoreContext';
import { Instagram, Mail, Phone, MapPin, ArrowUpRight } from 'lucide-react';

export const Footer: React.FC = () => {
  const { settings, navigateTo, setActivePolicy } = useStore();

  const handleNav = (href: string) => {
    navigateTo(href);
  };

  return (
    <footer className="bg-[#08080a] text-white border-t border-neutral-900 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-12 pb-14 border-b border-neutral-900">
          
          {/* Brand Column (Col 1-5) */}
          <div className="lg:col-span-5 space-y-4 text-left">
            <div className="flex flex-col items-start select-none">
              <span className="font-street text-2xl sm:text-3xl text-white uppercase leading-none tracking-wider text-graffiti transform -rotate-1">
                CHILL THREADS
              </span>
              <span className="text-[10px] font-mono tracking-[0.25em] font-semibold text-neutral-400 uppercase mt-1">
                {settings.brandTagline}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-neutral-400 max-w-sm leading-relaxed">
              Premium oversized streetwear t-shirts engineered with 240–280 GSM heavyweight cotton. Designed for Indian youth subculture, dreamers, and everyday urban chill.
            </p>

            <div className="pt-2 flex items-center gap-3">
              <a
                href={settings.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 bg-neutral-900 hover:bg-white hover:text-black text-neutral-300 rounded-full transition-colors border border-neutral-800"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <button
                onClick={() => handleNav('#/contact')}
                className="p-2.5 bg-neutral-900 hover:bg-white hover:text-black text-neutral-300 rounded-full transition-colors border border-neutral-800 cursor-pointer"
                aria-label="Email Support"
              >
                <Mail className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Shop Links (Col 6-7) */}
          <div className="lg:col-span-2 space-y-3 text-left">
            <h4 className="text-xs font-mono font-bold tracking-[0.2em] text-neutral-200 uppercase">
              SHOP
            </h4>
            <ul className="space-y-2 text-xs font-medium text-neutral-400">
              <li>
                <button
                  onClick={() => handleNav('#/shop')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  All Products
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('#/c/men')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Men&apos;s Streetwear
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('#/c/women')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Women&apos;s Collection
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('#/c/collections')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Limited Drops
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('#/wishlist')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Saved Wishlist
                </button>
              </li>
            </ul>
          </div>

          {/* Customer & Orders (Col 8-9) */}
          <div className="lg:col-span-2 space-y-3 text-left">
            <h4 className="text-xs font-mono font-bold tracking-[0.2em] text-neutral-200 uppercase">
              ASSISTANCE
            </h4>
            <ul className="space-y-2 text-xs font-medium text-neutral-400">
              <li>
                <button
                  onClick={() => handleNav('#/track-order')}
                  className="hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                >
                  <span>Track Order</span>
                  <ArrowUpRight className="w-3 h-3" />
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActivePolicy('shipping')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Shipping Rates
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActivePolicy('returns')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  7-Day Returns
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('#/about')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Our Brand Story
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('#/admin')}
                  className="text-neutral-500 hover:text-neutral-300 transition-colors cursor-pointer"
                >
                  Admin Portal
                </button>
              </li>
            </ul>
          </div>

          {/* Contact Details (Col 10-12) */}
          <div className="lg:col-span-3 space-y-3 text-left">
            <h4 className="text-xs font-mono font-bold tracking-[0.2em] text-neutral-200 uppercase">
              SUPPORT & HUB
            </h4>
            <div className="space-y-2 text-xs text-neutral-400 font-mono">
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                <span className="truncate">{settings.contactEmail}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                <span>{settings.contactPhone}</span>
              </div>
              <div className="flex items-start gap-2 pt-1">
                <MapPin className="w-3.5 h-3.5 text-neutral-500 shrink-0 mt-0.5" />
                <span className="text-[11px] leading-relaxed">
                  Design Studio: Bengaluru, Karnataka · Made in India
                </span>
              </div>
            </div>

            <div className="pt-2">
              <span className="text-[10px] font-mono text-neutral-500 uppercase block">
                PAYMENT METHODS ACCEPTED:
              </span>
              <p className="text-[11px] text-neutral-400 font-mono mt-1">
                Cash On Delivery (COD) · UPI · Net Banking · Cards
              </p>
            </div>
          </div>

        </div>

        {/* Bottom Bar: Copyright & Policies */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-neutral-500 gap-4">
          <div>
            © 2026 CHILL TREADS. All rights reserved. Crafted for Indian Streetwear Culture.
          </div>

          <div className="flex flex-wrap items-center gap-4 text-[11px]">
            <button
              onClick={() => setActivePolicy('privacy')}
              className="hover:text-neutral-300 transition-colors cursor-pointer"
            >
              Privacy Policy
            </button>
            <span>·</span>
            <button
              onClick={() => setActivePolicy('terms')}
              className="hover:text-neutral-300 transition-colors cursor-pointer"
            >
              Terms of Service
            </button>
            <span>·</span>
            <button
              onClick={() => setActivePolicy('shipping')}
              className="hover:text-neutral-300 transition-colors cursor-pointer"
            >
              Shipping Policy
            </button>
          </div>
        </div>

      </div>
    </footer>
  );
};
