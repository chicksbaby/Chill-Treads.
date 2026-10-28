import React from 'react';
import { useStore } from '../context/StoreContext';
import { ArrowUpRight } from 'lucide-react';

export const NewArrivals: React.FC = () => {
  const { navigateTo } = useStore();

  return (
    <section className="py-20 sm:py-28 bg-[#0a0a0c] text-white border-b border-neutral-900 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Editorial Split 3-column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          
          {/* Left Side: NEW ARRIVALS, FRESH DROPS, short description, VIEW ALL button */}
          <div className="lg:col-span-3 space-y-6 text-left order-1">
            <div className="space-y-1">
              <span className="font-mono text-xs tracking-[0.25em] text-neutral-400 uppercase">
                NEW ARRIVALS
              </span>
              <h2 className="font-display text-3xl sm:text-4xl xl:text-5xl font-black uppercase tracking-tight text-white leading-none">
                FRESH DROPS
              </h2>
            </div>

            <p className="text-sm text-neutral-300 leading-relaxed">
              Unfiltered cuts crafted from ultra-dense 280 GSM combed yarn. Each drop explores brutalist graphics, relaxed shoulder geometry, and enduring monochrome depth.
            </p>

            <div className="pt-2">
              <button
                onClick={() => navigateTo('#/c/collections')}
                className="inline-flex items-center gap-2 bg-white text-black hover:bg-neutral-200 px-6 py-3.5 text-xs font-bold tracking-[0.18em] uppercase transition-all duration-200 cursor-pointer shadow-lg group"
              >
                <span>VIEW ALL</span>
                <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </button>
            </div>

            <div className="pt-6 border-t border-neutral-900 space-y-2">
              <div className="text-[11px] font-mono uppercase text-neutral-400">
                CURRENT SERIES: <span className="text-white">A/W METROPOLIS 01</span>
              </div>
              <div className="text-[11px] font-mono uppercase text-neutral-400">
                AVAILABILITY: <span className="text-white">LIMITED RUN BATCH</span>
              </div>
            </div>
          </div>

          {/* Centre: Large Lifestyle Photograph featuring an oversized T-shirt */}
          <div className="lg:col-span-6 order-3 lg:order-2">
            <div className="relative aspect-[4/5] sm:aspect-[3/4] lg:aspect-[4/5] overflow-hidden bg-neutral-950 border border-neutral-800 group">
              <img
                src="/images/editorial-new-arrivals.jpg"
                alt="Chill Threads Oversized Graphic Back Print T-shirt Editorial"
                className="w-full h-full object-cover object-center filter grayscale contrast-110 group-hover:scale-105 transition-transform duration-700 ease-out"
                loading="lazy"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.src = '/images/cat-tshirts.jpg';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
              
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-[11px] font-mono text-neutral-300 uppercase tracking-widest bg-black/75 px-4 py-2 border border-white/10">
                <span>GRAPHIC OVERSIZE EDIT</span>
                <span className="text-white">HEAVYWEIGHT 280 GSM</span>
              </div>
            </div>
          </div>

          {/* Right Side: SAME MINDSET. DIFFERENT ENERGY. with subtle handwritten brand signature */}
          <div className="lg:col-span-3 space-y-6 text-left lg:text-right order-2 lg:order-3">
            <div className="space-y-3">
              <span className="font-mono text-xs tracking-[0.25em] text-neutral-400 uppercase block">
                MANIFESTO
              </span>
              <h3 className="font-display text-2xl sm:text-3xl xl:text-4xl font-extrabold uppercase tracking-tight text-white leading-snug">
                SAME MINDSET. DIFFERENT ENERGY.
              </h3>
            </div>

            <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed lg:ml-auto max-w-xs">
              Every thread tells a story of creative independence. Designed for those who let their presence speak before words do.
            </p>

            {/* Subtle Handwritten-style / Editorial Brand Signature */}
            <div className="pt-6 border-t border-neutral-900/80 lg:flex lg:flex-col lg:items-end">
              <div className="font-street text-2xl sm:text-3xl text-neutral-100 tracking-wider select-none text-graffiti transform -rotate-1">
                Chill Threads
              </div>
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-neutral-500 mt-1 block">
                AUTHENTIC URBAN COUTURE
              </span>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
