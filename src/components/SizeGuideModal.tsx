import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { X, Ruler } from 'lucide-react';

export const SizeGuideModal: React.FC = () => {
  const { isSizeGuideOpen, setIsSizeGuideOpen } = useStore();
  const [unit, setUnit] = useState<'inches' | 'cm'>('inches');

  if (!isSizeGuideOpen) return null;

  const measurements = [
    { size: 'S', chestIn: '40', lengthIn: '28', shoulderIn: '20.5', sleeveIn: '8.5', chestCm: '101', lengthCm: '71', shoulderCm: '52', sleeveCm: '21.5' },
    { size: 'M', chestIn: '42', lengthIn: '29', shoulderIn: '21.5', sleeveIn: '9.0', chestCm: '106', lengthCm: '73', shoulderCm: '54', sleeveCm: '23' },
    { size: 'L', chestIn: '44', lengthIn: '30', shoulderIn: '22.5', sleeveIn: '9.5', chestCm: '111', lengthCm: '76', shoulderCm: '57', sleeveCm: '24' },
    { size: 'XL', chestIn: '46', lengthIn: '31', shoulderIn: '23.5', sleeveIn: '10.0', chestCm: '116', lengthCm: '78', shoulderCm: '59', sleeveCm: '25.5' },
    { size: 'XXL', chestIn: '48', lengthIn: '32', shoulderIn: '24.5', sleeveIn: '10.5', chestCm: '121', lengthCm: '81', shoulderCm: '62', sleeveCm: '26.5' },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={() => setIsSizeGuideOpen(false)}
      />

      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative w-full max-w-xl bg-[#0e0e12] border border-neutral-800 shadow-2xl p-6 sm:p-8 text-white text-left animate-in fade-in zoom-in-95 duration-200">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
            <div className="flex items-center gap-2">
              <Ruler className="w-5 h-5 text-neutral-400" />
              <h3 className="font-display text-lg font-bold uppercase tracking-wider text-white">
                OVERSIZED FIT SIZE GUIDE
              </h3>
            </div>
            <button
              onClick={() => setIsSizeGuideOpen(false)}
              className="p-1 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Unit Toggle */}
          <div className="py-4 flex items-center justify-between">
            <p className="text-xs text-neutral-400">
              Chill Treads tees feature an intentional dropped shoulder and relaxed drape.
            </p>
            <div className="flex bg-neutral-900 border border-neutral-800 p-0.5 text-xs font-mono">
              <button
                onClick={() => setUnit('inches')}
                className={`px-3 py-1 cursor-pointer ${
                  unit === 'inches' ? 'bg-white text-black font-bold' : 'text-neutral-400'
                }`}
              >
                IN
              </button>
              <button
                onClick={() => setUnit('cm')}
                className={`px-3 py-1 cursor-pointer ${
                  unit === 'cm' ? 'bg-white text-black font-bold' : 'text-neutral-400'
                }`}
              >
                CM
              </button>
            </div>
          </div>

          {/* Measurement Table */}
          <div className="overflow-x-auto border border-neutral-800">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-neutral-900 text-neutral-300 border-b border-neutral-800 uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Size</th>
                  <th className="py-2.5 px-3">Chest</th>
                  <th className="py-2.5 px-3">Length</th>
                  <th className="py-2.5 px-3">Shoulder</th>
                  <th className="py-2.5 px-3">Sleeve</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-900 text-neutral-300">
                {measurements.map((m) => (
                  <tr key={m.size} className="hover:bg-neutral-900/40">
                    <td className="py-2.5 px-3 font-bold text-white">{m.size}</td>
                    <td className="py-2.5 px-3 tabular-nums">{unit === 'inches' ? m.chestIn : m.chestCm}</td>
                    <td className="py-2.5 px-3 tabular-nums">{unit === 'inches' ? m.lengthIn : m.lengthCm}</td>
                    <td className="py-2.5 px-3 tabular-nums">{unit === 'inches' ? m.shoulderIn : m.shoulderCm}</td>
                    <td className="py-2.5 px-3 tabular-nums">{unit === 'inches' ? m.sleeveIn : m.sleeveCm}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Fit Tip */}
          <div className="mt-5 p-3.5 bg-neutral-950 border border-neutral-800/80 text-xs text-neutral-400 space-y-1 font-mono">
            <strong className="text-white block font-sans">Fit Recommendation:</strong>
            <p>
              Order your standard size for a boxy streetwear drape. For an ultra-baggy look, size up by 1. For a closer fit, size down by 1.
            </p>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={() => setIsSizeGuideOpen(false)}
              className="bg-white text-black hover:bg-neutral-200 px-6 py-2.5 text-xs font-mono font-bold uppercase cursor-pointer"
            >
              GOT IT
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
