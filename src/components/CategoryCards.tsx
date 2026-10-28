import React from 'react';
import { useStore } from '../context/StoreContext';

interface CategoryItem {
  id: string;
  title: string;
  subtitle: string;
  link: string;
  image: string;
}

export const CategoryCards: React.FC = () => {
  const { navigateTo } = useStore();

  const categories: CategoryItem[] = [
    {
      id: 't-shirts',
      title: 'T-SHIRTS',
      subtitle: 'Heavyweight graphic tees',
      link: '#/shop',
      image: '/images/cat-tshirts.jpg',
    },
    {
      id: 'hoodies',
      title: 'HOODIES',
      subtitle: 'Oversized fleece & drops',
      link: '#/c/collections',
      image: '/images/cat-hoodies.jpg',
    },
    {
      id: 'caps',
      title: 'CAPS',
      subtitle: 'Distressed streetwear headwear',
      link: '#/c/collections',
      image: '/images/cat-caps.jpg',
    },
    {
      id: 'bottoms',
      title: 'BOTTOMS',
      subtitle: 'Baggy cargos & utility pants',
      link: '#/c/men',
      image: '/images/cat-bottoms.jpg',
    },
    {
      id: 'new-arrivals',
      title: 'NEW ARRIVALS',
      subtitle: 'Latest capsule releases',
      link: '#/c/collections',
      image: '/images/cat-new-arrivals.jpg',
    },
  ];

  return (
    <section className="bg-[#0a0a0c] text-white border-b border-neutral-900 pb-8 sm:pb-12 pt-4 sm:pt-5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* 5 Cards Row Grid matching reference image */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {categories.map((cat, idx) => (
            <div
              key={cat.id}
              onClick={() => navigateTo(cat.link)}
              className={`group relative aspect-[4/3] sm:aspect-[4/3] lg:aspect-[16/11] overflow-hidden bg-neutral-950 border border-neutral-800/90 hover:border-white/80 cursor-pointer transition-all duration-300 rounded-xs shadow-lg ${
                idx === 4 ? 'col-span-2 sm:col-span-1' : ''
              }`}
            >
              {/* Category Image with smooth zoom on hover */}
              <img
                src={cat.image}
                alt={`Chill Threads ${cat.title}`}
                className="w-full h-full object-cover object-center filter grayscale-[20%] contrast-110 group-hover:scale-108 transition-transform duration-700 ease-out"
                loading="lazy"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.src = '/images/tee-shadow-black.jpg';
                }}
              />

              {/* Dark Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20 group-hover:via-black/25 transition-colors" />

              {/* Title and Shop Now Text (pinned to bottom left as in reference image) */}
              <div className="absolute inset-0 p-3 sm:p-4 flex flex-col justify-end text-left z-10">
                <h3 className="font-display text-base sm:text-lg font-black tracking-wide text-white uppercase leading-tight mb-0.5">
                  {cat.title}
                </h3>
                
                <div className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-mono font-medium tracking-wider text-neutral-300 group-hover:text-white uppercase group-hover:translate-x-1 transition-transform">
                  <span>Shop Now</span>
                  <span className="text-sm leading-none">→</span>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
