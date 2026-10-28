import React from 'react';
import { useStore } from '../context/StoreContext';
import { Instagram, ArrowUpRight } from 'lucide-react';

export const BrandStoryBanner: React.FC = () => {
  const { settings } = useStore();

  return (
    <section className="relative overflow-hidden bg-black text-white border-b border-neutral-900 py-20 sm:py-28">
      {/* Background Monochrome Photo Collage */}
      <div className="absolute inset-0 z-0">
        <img
          src="/images/instagram-collage.jpg"
          alt="Chill Threads Streetwear Culture Collage"
          className="w-full h-full object-cover object-center filter grayscale contrast-125 brightness-[0.25] scale-105"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={(e) => {
            e.currentTarget.src = '/images/hero-model.jpg';
          }}
        />
        <div className="absolute inset-0 bg-radial-gradient from-transparent via-black/60 to-black pointer-events-none" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Subtitle */}
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md border border-white/15 text-[11px] font-mono tracking-[0.25em] text-neutral-300 uppercase mb-6">
          <Instagram className="w-3.5 h-3.5" />
          <span>COMMUNITY & CULTURE</span>
        </div>

        {/* Main Headline */}
        <h2 className="font-display text-4xl sm:text-6xl lg:text-7xl font-black uppercase tracking-tight text-white mb-4 leading-none">
          JOIN THE MOVEMENT
        </h2>

        {/* Tagline */}
        <p className="text-base sm:text-lg text-neutral-300 max-w-2xl mx-auto font-normal leading-relaxed mb-8">
          Chill Treads is built on the belief that everyday streetwear is your visual voice. Tag us in your fits to be featured on our community lookbook.
        </p>

        {/* Instagram Handle & Link */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href={settings.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 bg-white text-black hover:bg-neutral-200 px-8 py-4 text-xs font-mono font-bold tracking-[0.2em] uppercase transition-all duration-200 shadow-2xl group rounded-xs"
          >
            <Instagram className="w-4 h-4" />
            <span>@CHILLTHREADS</span>
            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </a>

          <div className="text-xs font-mono text-neutral-400">
            India&apos;s Gen-Z Streetwear Collective
          </div>
        </div>
      </div>
    </section>
  );
};
