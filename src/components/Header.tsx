import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Search, ShoppingBag, User, Heart, Menu, X, ShieldCheck } from 'lucide-react';

export const Header: React.FC = () => {
  const {
    currentRoute,
    navigateTo,
    cartCount,
    setIsCartOpen,
    setIsSearchOpen,
    wishlist,
  } = useStore();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const desktopNavLinks = [
    { label: 'HOME', href: '#/' },
    { label: 'SHOP', href: '#/shop' },
    { label: 'COLLECTIONS', href: '#/c/collections' },
    { label: 'ABOUT', href: '#/about' },
  ];

  const mobileNavLinks = [
    { label: 'HOME', href: '#/' },
    { label: 'SHOP ALL', href: '#/shop' },
    { label: 'MEN', href: '#/c/men' },
    { label: 'WOMEN', href: '#/c/women' },
    { label: 'COLLECTIONS', href: '#/c/collections' },
    { label: 'ABOUT US', href: '#/about' },
  ];

  const handleNavClick = (href: string) => {
    navigateTo(href);
    setMobileMenuOpen(false);
  };

  const isActive = (href: string) => {
    if (href === '#/' && (currentRoute === '#/' || currentRoute === '')) return true;
    if (href !== '#/' && currentRoute.startsWith(href)) return true;
    return false;
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0a0a0a]/95 backdrop-blur-md text-white border-b border-neutral-900 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Mobile Menu Button */}
          <div className="flex items-center lg:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-neutral-300 hover:text-white focus-visible:outline-2 focus-visible:outline-white cursor-pointer"
              aria-label={mobileMenuOpen ? 'Close Menu' : 'Open Menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Logo on Left: Streetwear Distressed Brush Wordmark */}
          <div className="flex items-center select-none py-1">
            <a
              href="#/"
              onClick={(e) => {
                e.preventDefault();
                handleNavClick('#/');
              }}
              className="group inline-flex items-center gap-1.5 focus-visible:outline-none"
            >
              <span className="font-street text-2xl sm:text-3xl text-white tracking-wider uppercase leading-none transform -rotate-1 group-hover:scale-105 transition-transform duration-200 text-graffiti">
                CHILL THREADS
              </span>
            </a>
          </div>

          {/* Desktop Navigation Links: Centered Minimalist Upper-Case */}
          <nav className="hidden lg:flex items-center space-x-10" aria-label="Main Navigation">
            {desktopNavLinks.map((link) => {
              const active = isActive(link.href);
              return (
                <button
                  key={link.label}
                  onClick={() => handleNavClick(link.href)}
                  className={`text-xs font-mono font-bold tracking-[0.2em] transition-all py-1.5 relative cursor-pointer ${
                    active
                      ? 'text-white after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-white'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </nav>

          {/* Actions on the Right: Search, Account/Admin, Bag */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Search Icon */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-2 text-neutral-300 hover:text-white hover:bg-neutral-900 rounded-full transition-colors cursor-pointer"
              title="Search collection"
              aria-label="Search"
            >
              <Search className="w-5 h-5 stroke-[1.75]" />
            </button>

            {/* Wishlist Link */}
            <button
              onClick={() => handleNavClick('#/wishlist')}
              className="p-2 text-neutral-300 hover:text-white hover:bg-neutral-900 rounded-full transition-colors relative cursor-pointer hidden sm:block"
              title="Saved Wishlist"
              aria-label="Wishlist"
            >
              <Heart className="w-5 h-5 stroke-[1.75]" />
              {wishlist.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-white rounded-full" />
              )}
            </button>

            {/* Account / Admin Portal */}
            <button
              onClick={() => handleNavClick('#/admin')}
              className="p-2 text-neutral-300 hover:text-white hover:bg-neutral-900 rounded-full transition-colors relative cursor-pointer"
              title="Admin & Dropship Portal"
              aria-label="Account and Admin"
            >
              <User className="w-5 h-5 stroke-[1.75]" />
            </button>

            {/* Shopping Bag Icon with Cart Counter */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 text-neutral-300 hover:text-white hover:bg-neutral-900 rounded-full transition-colors cursor-pointer group"
              aria-label={`Shopping Bag (${cartCount} items)`}
            >
              <ShoppingBag className="w-5 h-5 stroke-[1.75] group-hover:scale-105 transition-transform" />
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-white text-black text-[10px] font-mono font-extrabold flex items-center justify-center rounded-full px-1 shadow-md">
                {cartCount}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-neutral-900 bg-[#0e0e11] px-6 py-6 shadow-2xl animate-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col space-y-4">
            {mobileNavLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => handleNavClick(link.href)}
                className={`text-left text-sm font-mono font-bold tracking-widest py-2 border-b border-neutral-900 cursor-pointer ${
                  isActive(link.href) ? 'text-white' : 'text-neutral-400'
                }`}
              >
                {link.label}
              </button>
            ))}

            <div className="pt-2 flex flex-col gap-3">
              <button
                onClick={() => handleNavClick('#/track-order')}
                className="flex items-center justify-between text-xs font-mono font-semibold tracking-wider text-neutral-300 py-1"
              >
                <span>TRACK MY ORDER</span>
                <span className="text-neutral-500">→</span>
              </button>
              <button
                onClick={() => handleNavClick('#/wishlist')}
                className="flex items-center justify-between text-xs font-mono font-semibold tracking-wider text-neutral-300 py-1"
              >
                <span>SAVED WISHLIST ({wishlist.length})</span>
                <Heart className="w-4 h-4 text-neutral-400" />
              </button>
              <button
                onClick={() => handleNavClick('#/admin')}
                className="flex items-center justify-between text-xs font-mono font-semibold tracking-wider text-neutral-300 py-1 border-t border-neutral-900 pt-3"
              >
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-neutral-400" />
                  ADMIN & DROPSHIP MANAGER
                </span>
                <span className="text-[10px] font-mono bg-neutral-900 px-2 py-0.5 rounded text-neutral-300 border border-neutral-800">PORTAL</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
