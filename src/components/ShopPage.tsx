import React, { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { ProductCard } from './ProductCard';
import { SlidersHorizontal, X } from 'lucide-react';

interface ShopPageProps {
  initialCategory?: 'men' | 'women' | 'all' | 'collections';
}

export const ShopPage: React.FC<ShopPageProps> = ({ initialCategory = 'all' }) => {
  const { products } = useStore();
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [selectedColor, setSelectedColor] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('featured');

  const filtered = useMemo(() => {
    return products
      .filter((p) => {
        if (selectedCategory === 'men') return p.category === 'men' || p.category === 'all';
        if (selectedCategory === 'women') return p.category === 'women' || p.category === 'all';
        if (selectedCategory === 'collections') return p.isNewArrival;
        return true;
      })
      .filter((p) => {
        if (selectedColor === 'all') return true;
        return p.colors.some((c) => c.name.toLowerCase() === selectedColor.toLowerCase());
      })
      .sort((a, b) => {
        if (sortBy === 'price-low') return a.price - b.price;
        if (sortBy === 'price-high') return b.price - a.price;
        if (sortBy === 'gsm') return b.fabricGsm - a.fabricGsm;
        return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
      });
  }, [products, selectedCategory, selectedColor, sortBy]);

  const allColors = ['all', 'Black', 'White', 'Charcoal', 'Washed Grey'];

  const categoryTitles: Record<string, { title: string; subtitle: string }> = {
    all: {
      title: 'ALL STREETWEAR TEES',
      subtitle: 'Original heavyweight oversized silhouettes engineered for everyday wear.',
    },
    men: {
      title: "MEN'S STREETWEAR",
      subtitle: 'Boxy cuts, relaxed dropped shoulders, and statement monochrome graphic prints.',
    },
    women: {
      title: "WOMEN'S COLLECTION",
      subtitle: 'Effortless relaxed drape, high neckline, and fluid streetwear proportions.',
    },
    collections: {
      title: 'LIMITED DROPS & COLLECTIONS',
      subtitle: 'Exclusive seasonal drops in limited run batches. Once sold out, they never return.',
    },
  };

  const currentInfo = categoryTitles[selectedCategory] || categoryTitles.all;

  const hasActiveFilters = selectedCategory !== 'all' || selectedColor !== 'all' || sortBy !== 'featured';

  const clearAllFilters = () => {
    setSelectedCategory('all');
    setSelectedColor('all');
    setSortBy('featured');
  };

  return (
    <div className="bg-[#0a0a0c] text-white min-h-screen py-12 sm:py-16 border-b border-neutral-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Title */}
        <div className="mb-10 text-left border-b border-neutral-900 pb-8">
          <span className="font-mono text-xs tracking-[0.25em] text-neutral-400 uppercase">
            CHILL THREADS CATALOG
          </span>
          <h1 className="font-display text-3xl sm:text-5xl font-black uppercase tracking-tight text-white mt-1">
            {currentInfo.title}
          </h1>
          <p className="text-sm text-neutral-400 mt-2 max-w-2xl font-normal leading-relaxed">
            {currentInfo.subtitle}
          </p>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-neutral-950 p-4 border border-neutral-900 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-1">
            {[
              { id: 'all', label: 'ALL TEES' },
              { id: 'men', label: 'MEN' },
              { id: 'women', label: 'WOMEN' },
              { id: 'collections', label: 'LIMITED DROPS' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id)}
                className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer ${
                  selectedCategory === tab.id
                    ? 'bg-white text-black font-bold'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Color & Sort Selectors */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Color Filter */}
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-neutral-500 uppercase">Color:</span>
              <select
                value={selectedColor}
                onChange={(e) => setSelectedColor(e.target.value)}
                className="bg-neutral-900 border border-neutral-800 text-neutral-200 px-2.5 py-1.5 text-xs font-mono uppercase focus:outline-none focus:border-white cursor-pointer"
              >
                {allColors.map((c) => (
                  <option key={c} value={c}>
                    {c === 'all' ? 'All Colors' : c}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Selector */}
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-neutral-500 uppercase">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-neutral-900 border border-neutral-800 text-neutral-200 px-2.5 py-1.5 text-xs font-mono uppercase focus:outline-none focus:border-white cursor-pointer"
              >
                <option value="featured">Featured First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="gsm">Fabric GSM (Heaviest)</option>
              </select>
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="flex items-center gap-1 text-xs font-mono text-neutral-400 hover:text-white underline underline-offset-4 cursor-pointer ml-2"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>

        </div>

        {/* Count Bar */}
        <div className="flex items-center justify-between text-xs font-mono text-neutral-400 mb-6">
          <span>SHOWING {filtered.length} STREETWEAR PIECES</span>
          <span>CURRENCY: INR (₹)</span>
        </div>

        {/* Products Grid */}
        {filtered.length === 0 ? (
          <div className="py-20 text-center bg-neutral-950 border border-neutral-900 space-y-4">
            <SlidersHorizontal className="w-8 h-8 text-neutral-600 mx-auto" />
            <h3 className="font-display text-lg uppercase text-white font-bold">
              NO PIECES MATCH YOUR CURRENT FILTER
            </h3>
            <p className="text-xs text-neutral-400 font-mono">
              Try adjusting your color choice or view all cuts.
            </p>
            <button
              onClick={clearAllFilters}
              className="bg-white text-black hover:bg-neutral-200 px-6 py-2.5 text-xs font-mono font-bold uppercase transition-colors cursor-pointer"
            >
              RESET ALL FILTERS
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

      </div>
    </div>
  );
};
