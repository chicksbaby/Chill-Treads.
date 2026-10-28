import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../context/StoreContext';
import { Search, X, ArrowRight } from 'lucide-react';

export const SearchModal: React.FC = () => {
  const { isSearchOpen, setIsSearchOpen, products, navigateTo } = useStore();
  const [query, setQuery] = useState('');
  const [filterCat, setFilterCat] = useState<'all' | 'men' | 'women'>('all');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isSearchOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsSearchOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setIsSearchOpen]);

  if (!isSearchOpen) return null;

  const filtered = products.filter((p) => {
    const matchesCat = filterCat === 'all' || p.category === filterCat || p.category === 'all';
    const matchesText =
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.description.toLowerCase().includes(query.toLowerCase()) ||
      p.colors.some((c) => c.name.toLowerCase().includes(query.toLowerCase()));
    return matchesCat && matchesText;
  });

  const handleSelectProduct = (slug: string) => {
    setIsSearchOpen(false);
    navigateTo(`#/p/${slug}`);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={() => setIsSearchOpen(false)}
      />

      <div className="relative min-h-screen flex items-start justify-center p-4 sm:p-6 lg:p-8 pt-16 sm:pt-24">
        <div className="relative w-full max-w-2xl bg-[#0e0e12] border border-neutral-800 shadow-2xl p-6 text-white text-left animate-in fade-in zoom-in-95 duration-200">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
            <div className="flex items-center gap-2">
              <Search className="w-5 h-5 text-neutral-400" />
              <h3 className="font-display text-base font-bold uppercase tracking-wider text-white">
                SEARCH CHILL TREADS
              </h3>
            </div>
            <button
              onClick={() => setIsSearchOpen(false)}
              className="p-1 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search Input */}
          <div className="py-4">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by tee name, fit, or color (e.g. Shadow, Black, 280 GSM)..."
              className="w-full bg-neutral-900 border border-neutral-800 px-4 py-3 text-sm font-mono text-white placeholder:text-neutral-500 focus:outline-none focus:border-white"
            />
          </div>

          {/* Quick Filter Segments */}
          <div className="flex items-center gap-2 pb-4 text-xs font-mono">
            <span className="text-neutral-500 uppercase">Filter:</span>
            {(['all', 'men', 'women'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCat(cat)}
                className={`px-3 py-1 uppercase tracking-wider transition-colors cursor-pointer ${
                  filterCat === cat
                    ? 'bg-white text-black font-bold'
                    : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
                }`}
              >
                {cat === 'all' ? 'All Cuts' : cat}
              </button>
            ))}
          </div>

          {/* Results List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-neutral-900 border-t border-neutral-800">
            {filtered.length === 0 ? (
              <div className="py-10 text-center text-xs font-mono text-neutral-500">
                No streetwear tees found matching &ldquo;{query}&rdquo;
              </div>
            ) : (
              filtered.map((p) => (
                <div
                  key={p.id}
                  onClick={() => handleSelectProduct(p.slug)}
                  className="py-3 px-2 flex items-center justify-between hover:bg-neutral-900/60 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={p.image}
                      alt={p.name}
                      className="w-12 h-14 object-cover bg-neutral-950 border border-neutral-800"
                    />
                    <div>
                      <h4 className="font-display text-sm font-bold text-white uppercase group-hover:text-neutral-300 transition-colors">
                        {p.name}
                      </h4>
                      <p className="text-[11px] font-mono text-neutral-400">
                        {p.fit} · {p.fabricGsm} GSM · {p.defaultColor}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-bold text-white tabular-nums">
                      ₹{p.price}
                    </span>
                    <ArrowRight className="w-4 h-4 text-neutral-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pt-4 border-t border-neutral-800 text-[11px] font-mono text-neutral-500 flex justify-between">
            <span>Press ESC to exit</span>
            <span>{filtered.length} products available</span>
          </div>

        </div>
      </div>
    </div>
  );
};
