import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { ProductCard } from './ProductCard';
import {
  Heart,
  ShoppingBag,
  Ruler,
  Truck,
  RotateCcw,
  ShieldCheck,
  ChevronDown,
  ArrowLeft,
  Sparkles,
  Check,
} from 'lucide-react';

interface ProductDetailPageProps {
  slug: string;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({ slug }) => {
  const {
    products,
    navigateTo,
    addToCart,
    toggleWishlist,
    isInWishlist,
    setIsSizeGuideOpen,
    setActivePolicy,
  } = useStore();

  const product = products.find((p) => p.slug === slug) || products[0];

  const [selectedColor, setSelectedColor] = useState(product?.defaultColor || 'Black');
  const [selectedSize, setSelectedSize] = useState('L');
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [openAccordion, setOpenAccordion] = useState<string | null>('fabric');
  const [addedAnimation, setAddedAnimation] = useState(false);

  if (!product) {
    return (
      <div className="py-24 text-center text-white">
        <h2 className="text-2xl font-display font-bold">Product not found</h2>
        <button
          onClick={() => navigateTo('#/shop')}
          className="mt-4 px-6 py-2 bg-white text-black font-mono text-xs uppercase"
        >
          Return to Shop
        </button>
      </div>
    );
  }

  const galleryImages = [
    product.image,
    product.secondaryImage || product.image,
  ];

  const handleAddToCart = () => {
    addToCart(product, selectedSize, selectedColor, quantity);
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 2000);
  };

  const isFavorited = isInWishlist(product.id);

  // Related products
  const related = products
    .filter((p) => p.id !== product.id && (p.category === product.category || p.category === 'all'))
    .slice(0, 4);

  return (
    <div className="bg-[#0a0a0c] text-white min-h-screen py-8 sm:py-12 border-b border-neutral-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs font-mono text-neutral-400 mb-8" aria-label="Breadcrumbs">
          <button
            onClick={() => navigateTo('#/')}
            className="hover:text-white transition-colors cursor-pointer"
          >
            HOME
          </button>
          <span>/</span>
          <button
            onClick={() => navigateTo('#/shop')}
            className="hover:text-white transition-colors cursor-pointer"
          >
            SHOP
          </button>
          <span>/</span>
          <span className="text-neutral-200 uppercase truncate max-w-xs">{product.name}</span>
        </nav>

        {/* Back Link */}
        <button
          onClick={() => navigateTo('#/shop')}
          className="inline-flex items-center gap-1.5 text-xs font-mono text-neutral-400 hover:text-white mb-6 uppercase transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>BACK TO CATALOG</span>
        </button>

        {/* PDP Main 2-Column Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          
          {/* Gallery: Left Column (7 cols on lg) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Primary Large View */}
            <div className="relative aspect-[3/4] bg-neutral-950 border border-neutral-800 overflow-hidden group">
              <img
                src={galleryImages[activeImageIndex]}
                alt={`${product.name} view`}
                className="w-full h-full object-cover object-center filter grayscale-[20%] contrast-105 transition-all duration-500"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.src = '/images/tee-shadow-black.jpg';
                }}
              />

              {/* Tag Overlays */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                <span className="text-[11px] font-mono tracking-wider text-white bg-black/80 px-2.5 py-1 border border-white/10 uppercase">
                  {product.fabricGsm} GSM HEAVYWEIGHT
                </span>
                <span className="text-[11px] font-mono tracking-wider text-neutral-300 bg-neutral-900/90 px-2.5 py-1 border border-neutral-700 uppercase">
                  {product.fit}
                </span>
              </div>
            </div>

            {/* Thumbnails Row */}
            <div className="flex items-center gap-3">
              {galleryImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative w-20 h-24 overflow-hidden bg-neutral-950 border transition-all cursor-pointer ${
                    activeImageIndex === idx
                      ? 'border-white ring-1 ring-white'
                      : 'border-neutral-800 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img
                    src={img}
                    alt={`Thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = '/images/tee-shadow-black.jpg';
                    }}
                  />
                  <span className="absolute bottom-1 right-1 text-[9px] font-mono bg-black/80 px-1 text-neutral-300">
                    {idx === 0 ? 'FRONT' : 'DETAIL'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Purchase Module: Right Column (5 cols on lg) */}
          <div className="lg:col-span-5 space-y-6 text-left">
            
            {/* Title & Collection */}
            <div className="space-y-2 border-b border-neutral-800/80 pb-6">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs tracking-[0.25em] text-neutral-400 uppercase">
                  CHILL TREADS · {product.category.toUpperCase()}
                </span>
                <span className="text-[11px] font-mono text-neutral-400">
                  SKU: {product.slug}
                </span>
              </div>

              <h1 className="font-display text-3xl sm:text-4xl font-extrabold uppercase tracking-tight text-white leading-tight">
                {product.name}
              </h1>

              {/* Price */}
              <div className="flex items-baseline gap-3 pt-2">
                <span className="font-mono text-2xl sm:text-3xl font-extrabold text-white tabular-nums">
                  ₹{product.price}
                </span>
                {product.originalPrice && (
                  <span className="font-mono text-base text-neutral-500 line-through tabular-nums">
                    ₹{product.originalPrice}
                  </span>
                )}
                <span className="text-[11px] font-mono text-emerald-400 border border-emerald-900/60 bg-emerald-950/40 px-2 py-0.5 uppercase">
                  IN STOCK · SHIPS IN 24H
                </span>
              </div>

              <p className="text-xs font-mono text-neutral-500">
                Inclusive of all taxes. Free shipping on orders over ₹499.
              </p>
            </div>

            {/* Description */}
            <p className="text-sm text-neutral-300 font-normal leading-relaxed">
              {product.description}
            </p>

            {/* Color Swatch Selector */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-neutral-400 uppercase">
                  COLOR: <strong className="text-white font-sans">{selectedColor}</strong>
                </span>
                <span className="text-neutral-500 text-[11px]">
                  {product.colors.length} Available
                </span>
              </div>

              <div className="flex items-center gap-3">
                {product.colors.map((c) => (
                  <button
                    key={c.name}
                    onClick={() => setSelectedColor(c.name)}
                    className={`flex items-center gap-2 px-3 py-1.5 border transition-all cursor-pointer ${
                      selectedColor === c.name
                        ? 'border-white bg-neutral-900 text-white font-bold'
                        : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-neutral-700"
                      style={{ backgroundColor: c.hex }}
                    />
                    <span className="text-xs font-mono uppercase">{c.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Size Selector */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-neutral-400 uppercase">
                  SIZE: <strong className="text-white font-sans">{selectedSize} (OVERSIZED)</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setIsSizeGuideOpen(true)}
                  className="flex items-center gap-1 text-xs text-neutral-400 hover:text-white underline underline-offset-4 cursor-pointer"
                >
                  <Ruler className="w-3.5 h-3.5" />
                  <span>Size Guide</span>
                </button>
              </div>

              <div className="grid grid-cols-5 gap-2">
                {product.sizes.map((sz) => (
                  <button
                    key={sz}
                    onClick={() => setSelectedSize(sz)}
                    className={`py-3 text-xs font-mono font-bold tracking-wider transition-all cursor-pointer ${
                      selectedSize === sz
                        ? 'bg-white text-black border-2 border-white'
                        : 'bg-neutral-900 text-neutral-300 border border-neutral-800 hover:border-neutral-500'
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity Stepper & Add to Bag Actions */}
            <div className="pt-4 space-y-3">
              <div className="flex items-stretch gap-3">
                
                {/* Quantity */}
                <div className="flex items-center border border-neutral-800 bg-neutral-950 font-mono text-sm px-1">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-9 h-12 flex items-center justify-center hover:bg-neutral-900 text-neutral-300 cursor-pointer"
                    aria-label="Decrease quantity"
                  >
                    -
                  </button>
                  <span className="w-8 text-center font-bold text-white tabular-nums">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-9 h-12 flex items-center justify-center hover:bg-neutral-900 text-neutral-300 cursor-pointer"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>

                {/* Primary Add to Bag Button */}
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className={`flex-1 flex items-center justify-center gap-3 py-4 px-6 text-xs font-mono font-bold tracking-[0.2em] uppercase transition-all duration-200 cursor-pointer shadow-xl ${
                    addedAnimation
                      ? 'bg-emerald-500 text-black'
                      : 'bg-white text-black hover:bg-neutral-200'
                  }`}
                >
                  {addedAnimation ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>ADDED TO BAG!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4" />
                      <span>ADD TO BAG · ₹{product.price * quantity}</span>
                    </>
                  )}
                </button>

                {/* Wishlist Toggle Button */}
                <button
                  type="button"
                  onClick={() => toggleWishlist(product.id)}
                  className={`p-4 border transition-colors cursor-pointer ${
                    isFavorited
                      ? 'bg-white text-black border-white'
                      : 'bg-neutral-900 text-white border-neutral-800 hover:border-neutral-600'
                  }`}
                  aria-label="Wishlist toggle"
                >
                  <Heart className={`w-5 h-5 ${isFavorited ? 'fill-black' : ''}`} />
                </button>

              </div>
            </div>

            {/* Quick Guarantees Strip */}
            <div className="p-4 bg-neutral-950 border border-neutral-900 grid grid-cols-2 gap-3 text-[11px] font-mono text-neutral-400">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-neutral-300 shrink-0" />
                <span>Pan-India Delivery in 2–5 Days</span>
              </div>
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-neutral-300 shrink-0" />
                <span>7-Day Hassle-Free Exchange</span>
              </div>
            </div>

            {/* Product Accordion Information */}
            <div className="border-t border-neutral-800 pt-2 divide-y divide-neutral-900 text-left">
              
              {/* Fabric Specs */}
              <div className="py-3">
                <button
                  onClick={() => setOpenAccordion(openAccordion === 'fabric' ? null : 'fabric')}
                  className="w-full flex items-center justify-between text-xs font-mono font-bold tracking-wider uppercase text-neutral-200 py-1 cursor-pointer"
                >
                  <span>FABRIC & CRAFTSMANSHIP</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${openAccordion === 'fabric' ? 'rotate-180' : ''}`} />
                </button>
                {openAccordion === 'fabric' && (
                  <ul className="mt-3 space-y-1.5 text-xs font-mono text-neutral-400 list-disc list-inside">
                    {product.details.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Sizing & Silhouette */}
              <div className="py-3">
                <button
                  onClick={() => setOpenAccordion(openAccordion === 'fit' ? null : 'fit')}
                  className="w-full flex items-center justify-between text-xs font-mono font-bold tracking-wider uppercase text-neutral-200 py-1 cursor-pointer"
                >
                  <span>STREETWEAR SILHOUETTE & FIT</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${openAccordion === 'fit' ? 'rotate-180' : ''}`} />
                </button>
                {openAccordion === 'fit' && (
                  <div className="mt-3 text-xs font-mono text-neutral-400 space-y-2">
                    <p>
                      Crafted specifically with a dropped shoulder line, broader chest width, and structured sleeve drop.
                    </p>
                    <p>
                      Model is 6&apos;1&quot; wearing size L for a relaxed drape.
                    </p>
                  </div>
                )}
              </div>

              {/* Shipping & Delivery Info */}
              <div className="py-3">
                <button
                  onClick={() => setOpenAccordion(openAccordion === 'shipping' ? null : 'shipping')}
                  className="w-full flex items-center justify-between text-xs font-mono font-bold tracking-wider uppercase text-neutral-200 py-1 cursor-pointer"
                >
                  <span>SHIPPING & RETURNS</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${openAccordion === 'shipping' ? 'rotate-180' : ''}`} />
                </button>
                {openAccordion === 'shipping' && (
                  <div className="mt-3 text-xs font-mono text-neutral-400 space-y-2">
                    <p>
                      Free delivery on all orders over ₹499. Orders are packed in 100% recyclable streetwear polybags.
                    </p>
                    <button
                      onClick={() => setActivePolicy('returns')}
                      className="text-white underline underline-offset-4 cursor-pointer"
                    >
                      Read our 7-Day Return & Exchange Policy →
                    </button>
                  </div>
                )}
              </div>

            </div>

          </div>

        </div>

        {/* Related Products Section */}
        {related.length > 0 && (
          <div className="mt-24 pt-12 border-t border-neutral-900">
            <div className="flex items-center justify-between mb-8">
              <div>
                <span className="font-mono text-xs tracking-[0.25em] text-neutral-400 uppercase">
                  COMPLETE YOUR ROTATION
                </span>
                <h3 className="font-display text-2xl font-black uppercase tracking-tight text-white mt-1">
                  RELATED PIECES
                </h3>
              </div>
              <button
                onClick={() => navigateTo('#/shop')}
                className="text-xs font-mono text-neutral-400 hover:text-white uppercase transition-colors"
              >
                VIEW ALL →
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {related.map((rel) => (
                <ProductCard key={rel.id} product={rel} />
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
