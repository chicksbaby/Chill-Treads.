import React from 'react';
import { useStore } from '../context/StoreContext';
import { ProductCard } from './ProductCard';
import { Heart, ArrowRight } from 'lucide-react';

export const WishlistPage: React.FC = () => {
  const { wishlist, products, navigateTo } = useStore();

  const wishlistedProducts = products.filter((p) => wishlist.includes(p.id));

  return (
    <div className="bg-[#0c0c0e] text-white min-h-screen py-12 sm:py-16 border-b border-neutral-900 text-left">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-10 pb-6 border-b border-neutral-900 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="font-mono text-xs tracking-[0.25em] text-neutral-400 uppercase">
              YOUR SAVED DROPS
            </span>
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold uppercase tracking-tight text-white mt-1">
              WISHLIST ({wishlistedProducts.length})
            </h1>
          </div>

          <button
            onClick={() => navigateTo('#/shop')}
            className="text-xs font-mono tracking-widest text-neutral-400 hover:text-white uppercase flex items-center gap-1.5 cursor-pointer"
          >
            <span>CONTINUE SHOPPING</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {wishlistedProducts.length === 0 ? (
          <div className="p-16 text-center bg-neutral-950 border border-neutral-900 space-y-4">
            <Heart className="w-10 h-10 text-neutral-600 mx-auto" />
            <h3 className="font-display text-lg uppercase text-white font-bold">
              NO PIECES IN YOUR WISHLIST YET
            </h3>
            <p className="text-xs text-neutral-400 font-mono max-w-sm mx-auto">
              Tap the heart icon on any oversized tee to save your favorites for later.
            </p>
            <button
              onClick={() => navigateTo('#/shop')}
              className="bg-white text-black hover:bg-neutral-200 px-6 py-3 text-xs font-mono font-bold uppercase transition-colors cursor-pointer"
            >
              EXPLORE CATALOG
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {wishlistedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}

      </div>
    </div>
  );
};
