import React from 'react';
import { useStore } from '../context/StoreContext';
import { ProductCard } from './ProductCard';
import { ArrowRight, SlidersHorizontal } from 'lucide-react';

export const FeaturedProducts: React.FC = () => {
  const { products, navigateTo } = useStore();

  // Get the 5 featured products specified in the prompt
  const initialSlugs = [
    'shadow-oversized-tee',
    'minimal-logo-tee',
    'abstract-oversized-tee',
    'vision-tee',
    'classic-graphic-tee',
  ];

  const featured = products
    .filter((p) => initialSlugs.includes(p.slug) || p.isFeatured)
    .slice(0, 5);

  return (
    <section className="py-16 sm:py-24 bg-[#0a0a0c] text-white border-b border-neutral-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header with Title and Shop All Link */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 pb-5 border-b border-neutral-900 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-6 h-[1px] bg-neutral-500" />
              <span className="font-mono text-xs tracking-[0.25em] text-neutral-400 uppercase">
                SEASON 01 // ESSENTIALS
              </span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight text-white">
              FEATURED PRODUCTS
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs font-mono text-neutral-500 hidden sm:inline-block">
              5 SIGNATURE CUTS
            </span>
            <button
              onClick={() => navigateTo('#/shop')}
              className="inline-flex items-center gap-2 bg-neutral-900 hover:bg-white hover:text-black text-white border border-neutral-800 px-5 py-2.5 text-xs font-mono tracking-widest uppercase transition-all duration-200 cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>SHOP FULL DROP</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 5 Product Cards Horizontal Grid on Desktop, Responsive on Mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
          {featured.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {/* Demo Pricing Transparency Notice */}
        <div className="mt-10 p-4 bg-neutral-950/70 border border-neutral-900 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs font-mono text-neutral-400 gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-neutral-400 shrink-0" />
            <span>
              TRANSPARENCY NOTE: Concept & demo products at initial ₹499 baseline. Product specs, custom print designs, and prices are fully editable in the Admin Portal.
            </span>
          </div>
          <button
            onClick={() => navigateTo('#/admin')}
            className="text-white underline underline-offset-4 hover:text-neutral-300 font-bold shrink-0 cursor-pointer"
          >
            EDIT IN ADMIN PORTAL →
          </button>
        </div>

      </div>
    </section>
  );
};
