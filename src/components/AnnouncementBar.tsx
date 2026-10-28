import React from 'react';
import { useStore } from '../context/StoreContext';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const AnnouncementBar: React.FC = () => {
  const { navigateTo } = useStore();

  return (
    <aside aria-label="Announcement" className="bg-[#08080a] text-white text-xs tracking-wider border-b border-neutral-900 py-2 px-4 select-none">
      <div 
        onClick={() => navigateTo('#/shop')}
        className="max-w-7xl mx-auto flex items-center justify-center text-center gap-3 font-mono cursor-pointer group"
      >
        <ChevronLeft className="w-3 h-3 text-neutral-500 group-hover:text-white transition-colors" />
        <span className="text-[10px] sm:text-[11px] tracking-[0.25em] text-neutral-300 uppercase font-semibold group-hover:text-white transition-colors">
          FREE SHIPPING ON ORDERS OVER ₹999
        </span>
        <ChevronRight className="w-3 h-3 text-neutral-500 group-hover:text-white transition-colors" />
      </div>
    </aside>
  );
};
