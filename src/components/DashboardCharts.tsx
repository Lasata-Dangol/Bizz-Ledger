import React, { useMemo } from 'react';
import { ArrowUpRight, ArrowDownRight, Package, TrendingUp, DollarSign } from 'lucide-react';
import { Order, VegetableListing } from '../types';

interface DashboardChartsProps {
  orders: Order[];
  listings: VegetableListing[];
}

export default function DashboardCharts({ orders, listings }: DashboardChartsProps) {
  // Compute Market Inflow (Total crates available from listings)
  const marketInflow = useMemo(() => {
    return listings.reduce((sum, list) => sum + list.quantityAvailableCrates, 0);
  }, [listings]);

  // Compute Avg Settlement
  const avgSettlement = useMemo(() => {
    if (orders.length === 0) return 0;
    const totalSpent = orders.reduce((sum, order) => sum + order.totalPrice, 0);
    const totalCrates = orders.reduce((sum, order) => sum + order.quantity, 0);
    return totalCrates > 0 ? Math.round(totalSpent / totalCrates) : 0;
  }, [orders]);

  // Compute Bar Data over last 7 days
  const { barData, totalTradeValue, maxVal } = useMemo(() => {
    const today = new Date();
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    let totalTrade = 0;
    const dailyTotals: Record<number, number> = {};
    const orderedDays: number[] = [];
    
    // Initialize last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      dailyTotals[d.getDay()] = 0;
      orderedDays.push(d.getDay());
    }
    
    orders.forEach(order => {
      const orderDate = new Date(order.createdAt);
      const diffTime = today.getTime() - orderDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 7 && diffDays >= 0) {
        const dayOfWeek = orderDate.getDay();
        if (dailyTotals[dayOfWeek] !== undefined) {
          dailyTotals[dayOfWeek] += order.totalPrice;
          totalTrade += order.totalPrice;
        }
      }
    });

    // Find max to scale bars
    let mVal = 0;
    for (const key in dailyTotals) {
      if (dailyTotals[key] > mVal) mVal = dailyTotals[key];
    }
    
    const computedBarData = orderedDays.map(dayOfWeek => {
      const val = dailyTotals[dayOfWeek] || 0;
      const heightPercent = mVal > 0 ? Math.max((val / mVal) * 100, 5) : 5; // Minimum 5% to show an empty bar
      
      return {
        label: days[dayOfWeek],
        value: heightPercent,
        rawAmount: val,
        highlighted: val === mVal && mVal > 0
      };
    });

    return { barData: computedBarData, totalTradeValue: totalTrade, maxVal: mVal };
  }, [orders]);

  return (
    <div className="space-y-6">
      {/* Product View Visual Chart Card */}
      <div className="bg-white border border-neutral-100 rounded-3xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)] relative overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <div>
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-widest block mb-1">
              Market Pricing Volume
            </span>
            <h3 className="text-xl font-bold text-neutral-800">Product Price Velocity</h3>
          </div>
          <select className="bg-neutral-50 border border-neutral-150 text-xs font-semibold text-neutral-600 rounded-xl px-3.5 py-2 hover:bg-neutral-100 transition duration-150 focus:outline-hidden">
            <option>Last 7 days</option>
            <option>Last month</option>
            <option>Current season</option>
          </select>
        </div>

        {/* Total aggregate label */}
        <div className="mb-4">
          <span className="text-3xl font-extrabold text-neutral-900 tracking-tight">Rs. {totalTradeValue.toLocaleString()}</span>
          <span className="text-xs text-neutral-500 font-mono ml-2">Total trade value routed</span>
        </div>

        {/* Styled Bar Columns and Tooltip */}
        <div className="relative h-48 flex items-end justify-between pt-8 px-4 border-b border-dashed border-neutral-100 mb-2">
          
          {barData.map((bar, i) => (
            <div key={i} className="flex flex-col items-center flex-1 group cursor-pointer relative">
              
              {/* Tooltip hovering on the bar */}
              {bar.highlighted && (
                <div className="absolute -top-[45px] left-1/2 transform -translate-x-1/2 flex flex-col items-center z-10">
                  <div className="bg-neutral-900 text-white text-[11px] font-bold px-2 rounded-md py-1 shadow-md select-none whitespace-nowrap">
                    Rs. {bar.rawAmount.toLocaleString()}
                  </div>
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full border-2 border-white absolute -bottom-1 shadow-sm"></div>
                </div>
              )}

              {/* The bar line itself */}
              <div className="relative w-5 xs:w-6 sm:w-8 h-32 flex items-end justify-center rounded-xl bg-neutral-50 group-hover:bg-neutral-100 transition-colors duration-150">
                <div 
                  style={{ height: `${bar.value}%` }}
                  className={`w-full rounded-b-xl rounded-t-lg transition-all duration-300 ${
                    bar.highlighted 
                      ? 'bg-gradient-to-t from-emerald-500 to-[#10b981] shadow-[0_4px_12px_rgba(16,185,129,0.3)]' 
                      : 'bg-gradient-to-t from-neutral-200 to-neutral-300 group-hover:from-neutral-300 group-hover:to-neutral-400'
                  }`}
                />
              </div>
              <span className="text-[11px] font-bold text-neutral-400 mt-2 font-mono uppercase tracking-wider group-hover:text-neutral-600 transition duration-150">
                {bar.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Mini Statistics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Metric Card 1 */}
        <div className="bg-emerald-50/60 border border-emerald-100 rounded-3xl p-5 shadow-xs flex justify-between items-start">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Market Inflow</span>
            <div className="text-2xl font-black text-emerald-950">{marketInflow > 1000 ? `${(marketInflow/1000).toFixed(1)}k` : marketInflow} Crates</div>
            <p className="text-xs text-emerald-700">Ready at transit hubs today</p>
          </div>
          <div className="bg-emerald-500 text-white p-2.5 rounded-2xl shadow-sm">
            <Package size={20} />
          </div>
        </div>

        {/* Metric Card 2 */}
        <div className="bg-sky-50/60 border border-sky-100 rounded-3xl p-5 shadow-xs flex justify-between items-start">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-sky-800 uppercase tracking-wider">Avg Settlement</span>
            <div className="text-2xl font-black text-sky-950">Rs. {avgSettlement.toLocaleString()}</div>
            <p className="text-xs text-sky-700">Per basket, over last 7 days</p>
          </div>
          <div className="bg-sky-500 text-white p-2.5 rounded-2xl shadow-sm">
            <DollarSign size={20} />
          </div>
        </div>
      </div>
    </div>
  );
}
