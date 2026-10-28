import React from 'react';
import { useStore } from '../context/StoreContext';
import { ArrowRight, Truck, ShieldCheck, Package, Globe } from 'lucide-react';

export const HeroBanner: React.FC = () => {
  const { navigateTo, setActivePolicy } = useStore();

  return (
    <section className="relative overflow-hidden bg-[#0a0a0c] text-white min-h-[82vh] lg:min-h-[88vh] flex flex-col justify-between border-b border-neutral-900 select-none">
      
      {/* 1. Full-Width Cinematic Streetwear Background Image with Model & Concrete Steps */}
      <div className="absolute inset-0 z-0">
        <img
          src="/images/hero-streetwear.jpg"
          alt="Chill Threads Streetwear Model in Concrete Urban Setting"
          className="w-full h-full object-cover object-[75%_25%] sm:object-[75%_center] lg:object-right-top brightness-90 contrast-110"
          loading="eager"
          referrerPolicy="no-referrer"
          onError={(e) => {
            e.currentTarget.src = '/images/hero-model.jpg';
          }}
        />

        {/* Layered Graffiti Wall Typography behind model across concrete */}
        <div 
          className="absolute right-0 top-1/3 -translate-y-1/2 pointer-events-none select-none z-10 opacity-30 lg:opacity-40 mix-blend-overlay overflow-hidden max-w-4xl"
          aria-hidden="true"
        >
          <span className="font-street text-[14vw] lg:text-[11vw] font-black leading-none tracking-tight text-white uppercase whitespace-nowrap text-graffiti block transform -rotate-2">
            CHILL THREADS
          </span>
        </div>

        {/* Multi-layered Cinematic Dark Gradients & Scrims for Legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-black/70 to-black/30 sm:bg-gradient-to-r sm:from-black/95 sm:via-black/80 lg:via-black/55 sm:to-black/25 pointer-events-none z-10" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-[#0a0a0c]/90 pointer-events-none z-10" />
      </div>

      {/* 2. Top-Right Editorial Manifesto Accent (from reference image) */}
      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-6 sm:pt-8 flex justify-end">
        <div className="text-right space-y-1">
          <p className="font-display text-xs lg:text-sm font-extrabold uppercase tracking-[0.25em] text-neutral-300 leading-snug">
            SAME<br />
            MINDSET.<br />
            DIFFERENT<br />
            ENERGY.
          </p>
          <span className="inline-block w-8 h-[2px] bg-neutral-400" />
        </div>
      </div>

      {/* 3. Main Hero Headline & Primary CTA on Left */}
      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-8 sm:py-12 lg:py-16 my-auto">
        <div className="max-w-2xl space-y-5 lg:space-y-6 text-left">
          
          {/* Subtitle / Kicker */}
          <div className="flex items-center gap-3">
            <span className="w-6 h-[1.5px] bg-white/70" />
            <p className="text-xs sm:text-sm font-mono tracking-[0.3em] text-neutral-300 uppercase font-semibold">
              STREETWEAR / CULTURE / YOU
            </p>
          </div>

          {/* Giant Hero Headline */}
          <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-black uppercase tracking-tight text-white leading-[0.92] drop-shadow-2xl">
            BUILT FOR<br />THE REAL ONES.
          </h1>

          {/* Short Brand Description */}
          <p className="text-sm sm:text-base lg:text-lg text-neutral-300 max-w-lg font-normal leading-relaxed text-balance">
            More than clothing — it&apos;s a mindset. Chill Threads is for the dreamers, the doers, and the ones who stay real.
          </p>

          {/* Striking White CTA Button */}
          <div className="pt-2 flex items-center gap-4">
            <button
              onClick={() => navigateTo('#/shop')}
              className="inline-flex items-center justify-center gap-3 bg-white text-black hover:bg-neutral-200 px-8 py-4 text-xs font-mono font-black tracking-[0.2em] uppercase rounded-xs transition-all duration-200 cursor-pointer group shadow-2xl hover:scale-102"
            >
              <span>SHOP NOW</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            
            <button
              onClick={() => navigateTo('#/c/collections')}
              className="hidden sm:inline-flex items-center justify-center gap-2 bg-black/60 hover:bg-black text-white border border-white/20 hover:border-white px-7 py-4 text-xs font-mono font-bold tracking-[0.2em] uppercase rounded-xs transition-all duration-200 cursor-pointer backdrop-blur-sm"
            >
              <span>NEW DROPS</span>
            </button>
          </div>

        </div>
      </div>

      {/* 4. Bottom Integrated Trust Strip (Matching Reference Image) */}
      <div className="relative z-20 border-t border-white/10 bg-black/75 backdrop-blur-md py-4 sm:py-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 items-center">
            
            {/* Free Shipping */}
            <div 
              onClick={() => setActivePolicy('shipping')}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <Truck className="w-5 h-5 text-neutral-400 group-hover:text-white transition-colors shrink-0 stroke-[1.75]" />
              <div className="text-left">
                <span className="block text-[11px] sm:text-xs font-mono font-bold tracking-wider text-white uppercase">
                  FREE SHIPPING
                </span>
                <span className="block text-[10px] sm:text-[11px] font-mono text-neutral-400">
                  On Orders Over ₹999
                </span>
              </div>
            </div>

            {/* Secure Payments */}
            <div 
              onClick={() => setActivePolicy('security')}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <ShieldCheck className="w-5 h-5 text-neutral-400 group-hover:text-white transition-colors shrink-0 stroke-[1.75]" />
              <div className="text-left">
                <span className="block text-[11px] sm:text-xs font-mono font-bold tracking-wider text-white uppercase">
                  SECURE PAYMENTS
                </span>
                <span className="block text-[10px] sm:text-[11px] font-mono text-neutral-400">
                  Shop with Confidence
                </span>
              </div>
            </div>

            {/* Easy Returns */}
            <div 
              onClick={() => setActivePolicy('returns')}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <Package className="w-5 h-5 text-neutral-400 group-hover:text-white transition-colors shrink-0 stroke-[1.75]" />
              <div className="text-left">
                <span className="block text-[11px] sm:text-xs font-mono font-bold tracking-wider text-white uppercase">
                  EASY RETURNS
                </span>
                <span className="block text-[10px] sm:text-[11px] font-mono text-neutral-400">
                  Hassle-Free Returns
                </span>
              </div>
            </div>

            {/* Worldwide Community */}
            <div 
              onClick={() => navigateTo('#/about')}
              className="flex items-center gap-3 cursor-pointer group lg:justify-end"
            >
              <Globe className="w-5 h-5 text-neutral-400 group-hover:text-white transition-colors shrink-0 stroke-[1.75]" />
              <div className="text-left">
                <span className="block text-[11px] sm:text-xs font-mono font-bold tracking-wider text-white uppercase">
                  WORLDWIDE
                </span>
                <span className="block text-[10px] sm:text-[11px] font-mono text-neutral-400 uppercase">
                  Streetwear Community
                </span>
              </div>
            </div>

          </div>
        </div>
      </div>

    </section>
  );
};
