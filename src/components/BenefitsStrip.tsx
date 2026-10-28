import React from 'react';
import { Truck, ShieldCheck, RefreshCw, Feather } from 'lucide-react';
import { useStore } from '../context/StoreContext';

interface BenefitItem {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  policyKey: string;
}

export const BenefitsStrip: React.FC = () => {
  const { setActivePolicy } = useStore();

  const benefits: BenefitItem[] = [
    {
      icon: Truck,
      title: 'SHIPPING INFORMATION',
      description: 'Pan-India dispatch via Delhivery & Bluedart. Free delivery over ₹499 threshold.',
      policyKey: 'shipping',
    },
    {
      icon: ShieldCheck,
      title: 'SECURE CHECKOUT',
      description: 'Transparent payment simulation. Zero storage of sensitive cards, CVV or UPI PINs.',
      policyKey: 'security',
    },
    {
      icon: RefreshCw,
      title: 'RETURN POLICY',
      description: '7-Day hassle-free replacement on unworn, unwashed items with tags intact.',
      policyKey: 'returns',
    },
    {
      icon: Feather,
      title: 'QUALITY MATERIALS',
      description: '100% Combed ring-spun cotton. 240–280 GSM heavyweight structured weave.',
      policyKey: 'quality',
    },
  ];

  return (
    <section className="bg-[#0e0e11] text-white border-b border-neutral-900 py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
          {benefits.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="flex flex-col items-start p-6 bg-neutral-950/60 border border-neutral-900 hover:border-neutral-700 transition-colors group cursor-pointer"
                onClick={() => setActivePolicy(item.policyKey)}
              >
                <div className="p-3 bg-neutral-900 text-white border border-neutral-800 mb-4 group-hover:bg-white group-hover:text-black transition-colors">
                  <Icon className="w-5 h-5 stroke-[1.5]" />
                </div>

                <h3 className="font-mono text-xs font-bold tracking-[0.2em] uppercase text-white mb-2">
                  {item.title}
                </h3>

                <p className="text-xs text-neutral-400 font-normal leading-relaxed mb-3">
                  {item.description}
                </p>

                <span className="text-[10px] font-mono tracking-wider text-neutral-500 uppercase group-hover:text-white transition-colors flex items-center gap-1 mt-auto">
                  <span>LEARN MORE</span>
                  <span>→</span>
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
