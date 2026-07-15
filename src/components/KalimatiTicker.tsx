import React from 'react';
import { KalimatiRate } from '../types';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KalimatiTickerProps {
  rates: KalimatiRate[];
}

export default function KalimatiTicker({ rates }: KalimatiTickerProps) {
  // Duplicate list to achieve a continuous loop animation
  const scrollingRates = rates.length > 0 ? [...rates, ...rates, ...rates] : [];

  if (rates.length === 0) {
    return null; // Don't show ticker if no live data is fetched yet
  }

  return (
    <div className="bg-[#fffbeb] border-b border-[#fef3c7] py-2.5 overflow-hidden sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 flex items-center">
        {/* Market Label */}
        <div className="flex-shrink-0 flex items-center gap-1.5 bg-[#f59e0b] text-white text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm mr-4 z-10 relative">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-100"></span>
          </span>
          Kalimati Live Kathmandu Rates
        </div>
        
        {/* Sliding Container */}
        <div className="relative w-full overflow-hidden">
          <div className="animate-marquee whitespace-nowrap flex gap-10 items-center">
            {scrollingRates.map((rate, index) => {
              // Since live data might not have 'change' computed yet, default to stable/minus icon
              const changeStatus = rate.change || 'stable';
              const ChangeIcon = changeStatus === 'up' ? TrendingUp : changeStatus === 'down' ? TrendingDown : Minus;
              const changeColor = changeStatus === 'up' ? 'text-emerald-600' : changeStatus === 'down' ? 'text-rose-500' : 'text-neutral-500';
              const changeBg = changeStatus === 'up' ? 'bg-emerald-50' : changeStatus === 'down' ? 'bg-rose-50' : 'bg-neutral-50';

              return (
                <div 
                  key={`${rate.cropName}-${index}`} 
                  className="inline-flex items-center gap-2 hover:scale-[1.02] transition-transform duration-200 cursor-pointer"
                >
                  <span className="font-semibold text-neutral-800 text-sm">{rate.cropName}</span>
                  <span className="text-xs text-neutral-500">Avg:</span>
                  <span className="font-bold text-neutral-900 text-sm">Rs. {rate.avgPrice}/{rate.unit?.toLowerCase() || 'kg'}</span>
                  <span className={`flex items-center gap-0.5 text-[11px] px-1.5 py-0.5 rounded ${changeBg} ${changeColor} font-medium`}>
                    <ChangeIcon size={12} className="stroke-[2.5]" />
                    Rs. {rate.minPrice} - {rate.maxPrice}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
