import React from 'react';
import { useStore } from '../context/StoreContext';
import { ArrowRight, Sparkles, Feather, ShieldCheck } from 'lucide-react';

export const AboutPage: React.FC = () => {
  const { navigateTo, settings } = useStore();

  return (
    <div className="bg-[#0c0c0e] text-white min-h-screen py-16 sm:py-24 border-b border-neutral-900 text-left">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* Hero Section */}
        <div className="space-y-4 border-b border-neutral-900 pb-12">
          <div className="flex items-center gap-2">
            <span className="w-8 h-[1px] bg-neutral-500" />
            <span className="font-mono text-xs tracking-[0.25em] text-neutral-400 uppercase">
              ABOUT CHILL TREADS
            </span>
          </div>
          <h1 className="font-display text-4xl sm:text-6xl font-black uppercase tracking-tight text-white leading-none">
            WEAR YOUR VIBE. STAY CHILL.
          </h1>
          <p className="text-base sm:text-xl text-neutral-300 max-w-3xl leading-relaxed pt-2">
            Chill Treads was founded on the streets of India with one core conviction: streetwear is more than fabric — it’s a mindset for dreamers, creators, and the ones who stay grounded.
          </p>
        </div>

        {/* Story Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold uppercase text-white">
              ENGINEERED FOR THE REAL ONES
            </h2>
            <p className="text-sm text-neutral-300 leading-relaxed">
              We were tired of flimsy, generic t-shirts that lost their shape after a single wash. Streetwear deserves structured silhouettes, dropped shoulder cuts, and heavyweight 240–280 GSM cotton that drapes with architectural intent.
            </p>
            <p className="text-sm text-neutral-400 leading-relaxed">
              Every graphic is designed in-house or in collaboration with independent underground designers. Minimalist typography, brutalist geometry, and raw monochrome tones that speak without screaming.
            </p>
            <div className="pt-2">
              <button
                onClick={() => navigateTo('#/shop')}
                className="inline-flex items-center gap-2 bg-white text-black hover:bg-neutral-200 px-6 py-3.5 text-xs font-mono font-bold tracking-widest uppercase cursor-pointer"
              >
                <span>EXPLORE THE DROP</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="relative aspect-[4/5] bg-neutral-950 border border-neutral-800 overflow-hidden">
            <img
              src="/images/hero-model.jpg"
              alt="Chill Threads Heritage"
              className="w-full h-full object-cover filter grayscale contrast-110"
              onError={(e) => {
                e.currentTarget.src = '/images/cat-new-arrivals.jpg';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
            <div className="absolute bottom-6 left-6 right-6">
              <span className="text-xs font-mono text-neutral-300 uppercase tracking-widest block mb-1">
                BENGALURU, INDIA
              </span>
              <span className="font-display text-lg font-bold text-white uppercase">
                HEAVYWEIGHT COTTON & DROPPED SEAMS
              </span>
            </div>
          </div>
        </div>

        {/* Core Principles */}
        <div className="pt-12 border-t border-neutral-900 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 bg-neutral-950 border border-neutral-900 space-y-3">
            <div className="w-10 h-10 bg-neutral-900 border border-neutral-800 flex items-center justify-center text-white">
              <Feather className="w-5 h-5" />
            </div>
            <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-white">
              240–280 GSM DURABILITY
            </h3>
            <p className="text-xs text-neutral-400 leading-relaxed font-mono">
              Pure combed ring-spun compact cotton. Thick ribbing that doesn’t sag or warp.
            </p>
          </div>

          <div className="p-6 bg-neutral-950 border border-neutral-900 space-y-3">
            <div className="w-10 h-10 bg-neutral-900 border border-neutral-800 flex items-center justify-center text-white">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-white">
              MONOCHROME EDITORIAL
            </h3>
            <p className="text-xs text-neutral-400 leading-relaxed font-mono">
              Blacks, whites, acid-washed charcoals. Timeless streetwear without noisy novelty colors.
            </p>
          </div>

          <div className="p-6 bg-neutral-950 border border-neutral-900 space-y-3">
            <div className="w-10 h-10 bg-neutral-900 border border-neutral-800 flex items-center justify-center text-white">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-white">
              FAIR INDIAN CRAFTSMANSHIP
            </h3>
            <p className="text-xs text-neutral-400 leading-relaxed font-mono">
              Knitted, dyed, tailored, and screen-printed proudly in India supporting local POD hubs.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
