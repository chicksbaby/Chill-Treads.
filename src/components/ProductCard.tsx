import React, { useState } from 'react';
import { Product } from '../types';
import { useStore } from '../context/StoreContext';
import { Heart, Plus, Check } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { navigateTo, addToCart, toggleWishlist, isInWishlist } = useStore();
  const [selectedColor, setSelectedColor] = useState(product.defaultColor);
  const [selectedSize, setSelectedSize] = useState('L');
  const [isQuickSizeOpen, setIsQuickSizeOpen] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  const isFavorited = isInWishlist(product.id);

  const handleCardClick = () => {
    navigateTo(`#/p/${product.slug}`);
  };

  const handleQuickAdd = (e: React.MouseEvent, size: string) => {
    e.stopPropagation();
    addToCart(product, size, selectedColor, 1);
    setIsQuickSizeOpen(false);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1500);
  };

  return (
    <div className="group relative flex flex-col bg-[#0e0e11] border border-neutral-800/90 hover:border-neutral-500 transition-all duration-300">
      
      {/* Image Container with Aspect Ratio */}
      <div 
        onClick={handleCardClick}
        className="relative aspect-[3/4] overflow-hidden bg-neutral-950 cursor-pointer"
      >
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover object-center filter grayscale-[30%] contrast-105 group-hover:scale-105 transition-transform duration-500 ease-out"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={(e) => {
            e.currentTarget.src = '/images/tee-shadow-black.jpg';
          }}
        />

        {/* Hover Secondary Angle if present */}
        {product.secondaryImage && (
          <img
            src={product.secondaryImage}
            alt={`${product.name} detail view`}
            className="absolute inset-0 w-full h-full object-cover object-center filter grayscale-[30%] contrast-105 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        )}

        {/* Dark Vignette Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

        {/* Top Badges / Tags */}
        <div className="absolute top-3 left-3 flex flex-col gap-1 z-10 pointer-events-none">
          {product.fabricGsm && (
            <span className="text-[10px] font-mono tracking-wider text-neutral-300 bg-black/85 backdrop-blur-xs px-2 py-0.5 border border-white/10 uppercase">
              {product.fabricGsm} GSM
            </span>
          )}
          {product.isNewArrival && (
            <span className="text-[10px] font-mono tracking-wider text-[#d4dfc7] bg-[#1e261a]/95 backdrop-blur-xs px-2 py-0.5 border border-[#3e4d36] uppercase">
              NEW DROP
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
          className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-sm transition-all z-20 cursor-pointer ${
            isFavorited
              ? 'bg-white text-black'
              : 'bg-black/60 text-white hover:bg-white hover:text-black'
          }`}
          aria-label={isFavorited ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart className={`w-3.5 h-3.5 ${isFavorited ? 'fill-black' : ''}`} />
        </button>

        {/* Quick Size Overlay Trigger */}
        <div className="absolute bottom-3 inset-x-3 z-20 transition-all duration-200">
          {isQuickSizeOpen ? (
            <div 
              className="bg-black/95 border border-neutral-700 p-2 text-center animate-in fade-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-[10px] font-mono tracking-wider text-neutral-400 uppercase mb-1.5 flex justify-between items-center px-1">
                <span>SELECT SIZE</span>
                <button 
                  onClick={() => setIsQuickSizeOpen(false)}
                  className="text-neutral-400 hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              </div>
              <div className="grid grid-cols-5 gap-1">
                {product.sizes.map((sz) => (
                  <button
                    key={sz}
                    onClick={(e) => handleQuickAdd(e, sz)}
                    className="py-1 text-xs font-mono font-bold bg-neutral-900 hover:bg-white hover:text-black text-white border border-neutral-700 transition-colors cursor-pointer"
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsQuickSizeOpen(true);
              }}
              className={`w-full py-2.5 px-3 text-xs font-mono font-bold uppercase tracking-widest transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer shadow-lg ${
                isAdded
                  ? 'bg-neutral-200 text-black'
                  : 'bg-black/85 text-white hover:bg-white hover:text-black border border-white/20'
              }`}
            >
              {isAdded ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>ADDED TO BAG</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>QUICK ADD</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Product Details Section */}
      <div className="p-4 flex flex-col flex-grow justify-between text-left space-y-3">
        <div>
          {/* Category & Color Swatches */}
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-mono tracking-wider uppercase text-neutral-400">
              {product.fit || 'OVERSIZED TEE'}
            </span>
            
            {/* Swatches */}
            <div className="flex items-center gap-1.5">
              {product.colors.map((c) => (
                <button
                  key={c.name}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedColor(c.name);
                  }}
                  className={`w-3.5 h-3.5 rounded-full border transition-all cursor-pointer ${
                    selectedColor === c.name
                      ? 'border-white scale-125 ring-1 ring-white/50'
                      : 'border-neutral-600 opacity-60 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                  aria-label={`Select color ${c.name}`}
                />
              ))}
            </div>
          </div>

          {/* Product Title */}
          <h3 
            onClick={handleCardClick}
            className="font-display text-base font-bold text-white tracking-wide uppercase line-clamp-1 hover:text-neutral-300 transition-colors cursor-pointer"
          >
            {product.name}
          </h3>

          <p className="text-[11px] font-mono text-neutral-400">
            Color: <span className="text-neutral-200">{selectedColor}</span>
          </p>
        </div>

        {/* Price & Link */}
        <div className="pt-2 border-t border-neutral-900 flex items-baseline justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-base font-mono font-bold text-white tabular-nums">
              ₹{product.price}
            </span>
            {product.originalPrice && (
              <span className="text-xs font-mono text-neutral-500 line-through tabular-nums">
                ₹{product.originalPrice}
              </span>
            )}
          </div>
          
          <button
            onClick={handleCardClick}
            className="text-[11px] font-mono tracking-wider text-neutral-400 hover:text-white uppercase transition-colors cursor-pointer"
          >
            DETAILS →
          </button>
        </div>

      </div>

    </div>
  );
};
