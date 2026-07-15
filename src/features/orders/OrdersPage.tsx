import React, { useState } from 'react';
import { Order, UserProfile } from '../../types';
import { Truck, CheckCircle, Package2, Compass, PhoneCall, Award, MapPin, Printer } from 'lucide-react';

interface OrdersPageProps {
  orders: Order[];
  currentUser: UserProfile;
  onUpdateOrderStatus: (orderId: string, status: 'PROCESSING' | 'IN_TRANSIT' | 'ARRIVED') => void;
}

export default function OrdersPage({ orders, currentUser, onUpdateOrderStatus }: OrdersPageProps) {
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(orders[0]?.orderId || null);

  const activeOrder = orders.find(o => o.orderId === selectedOrderId) || orders[0];

  const handleProgressStatus = (order: Order) => {
    let nextStatus: 'PROCESSING' | 'IN_TRANSIT' | 'ARRIVED' = 'PROCESSING';
    if (order.status === 'PROCESSING') nextStatus = 'IN_TRANSIT';
    else if (order.status === 'IN_TRANSIT') nextStatus = 'ARRIVED';
    else return;

    onUpdateOrderStatus(order.orderId, nextStatus);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-neutral-800 tracking-tight">Your Orders & Delivery Bills</h2>
        <p className="text-xs text-neutral-500">View your delivery details, track vehicles on the road, and print bills.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Orders side list column */}
        <div className="lg:col-span-4 bg-white border border-neutral-100 rounded-3xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.01)] flex flex-col gap-4">
          <div>
            <h3 className="font-bold text-neutral-800 text-sm">Your Delivery Bills ({orders.length})</h3>
            <p className="text-[10px] text-neutral-400">Select a bill below to see details</p>
          </div>

          <div className="space-y-2.5 overflow-y-auto max-h-[460px] pr-1">
            {orders.map((order) => {
              const isSelected = order.orderId === selectedOrderId;
              return (
                <button
                  key={order.orderId}
                  onClick={() => setSelectedOrderId(order.orderId)}
                  className={`w-full text-left p-3.5 rounded-2xl border transition duration-150 flex justify-between items-center cursor-pointer ${
                    isSelected 
                      ? 'bg-neutral-900 border-neutral-950 text-white shadow-md' 
                      : 'bg-neutral-50/50 hover:bg-neutral-100 border-neutral-150 text-neutral-700'
                  }`}
                >
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase tracking-wider font-mono opacity-80 block">{order.cropName}</span>
                    <span className="font-extrabold text-xs block">ID: {order.orderId.substring(6)}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase scale-90 ${
                    order.status === 'ARRIVED' 
                      ? 'bg-emerald-500 text-white' 
                      : order.status === 'IN_TRANSIT' 
                      ? 'bg-amber-400 text-amber-950' 
                      : 'bg-neutral-200 text-neutral-700'
                  }`}>
                    {order.status}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Detailed Tracking View and Manifest Invoice column */}
        <div className="lg:col-span-8 space-y-6">
          {activeOrder ? (
            <>
              {/* Stepper Timeline Tracker */}
              <div className="bg-white border border-neutral-100 rounded-3xl p-6 shadow-[0_4px_25px_rgba(0,0,0,0.02)] space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="font-extrabold text-neutral-850 text-sm">Delivery Tracker</h3>
                  
                  {/* Transit simulator status block */}
                  {currentUser.role !== 'WHOLESALER' && activeOrder.status !== 'ARRIVED' && (
                    <button 
                      onClick={() => handleProgressStatus(activeOrder)}
                      className="bg-neutral-900 font-bold hover:bg-neutral-850 text-white text-[11px] px-3.5 py-2 rounded-xl flex items-center gap-1 cursor-pointer transition"
                    >
                      <Truck size={12} className="animate-bounce" />
                      Move Truck to Next Step →
                    </button>
                  )}
                </div>

                {/* Stepper visualization */}
                <div className="grid grid-cols-3 gap-2 relative pt-2">
                  {/* Step 1: Processing */}
                  <div className="flex flex-col items-center text-center space-y-2 relative">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                      activeOrder.status === 'PROCESSING' || activeOrder.status === 'IN_TRANSIT' || activeOrder.status === 'ARRIVED'
                        ? 'bg-neutral-900 text-white' 
                        : 'bg-neutral-100 text-neutral-400'
                    }`}>
                      <Package2 size={14} />
                    </div>
                    <div>
                      <span className="block font-bold text-neutral-800 text-xs">Processing</span>
                      <span className="block text-[10px] text-neutral-400">Packed at Farm</span>
                    </div>
                  </div>

                  {/* Step 2: In Transit */}
                  <div className="flex flex-col items-center text-center space-y-2 relative">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                      activeOrder.status === 'IN_TRANSIT' || activeOrder.status === 'ARRIVED'
                        ? 'bg-amber-400 text-neutral-900 shadow-xs' 
                        : 'bg-neutral-100 text-neutral-400'
                    }`}>
                      <Truck size={14} />
                    </div>
                    <div>
                      <span className="block font-bold text-neutral-800 text-xs">In Transit</span>
                      <span className="block text-[10px] text-neutral-400">Driving on Highway</span>
                    </div>
                  </div>

                  {/* Step 3: Arrived */}
                  <div className="flex flex-col items-center text-center space-y-2 relative">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                      activeOrder.status === 'ARRIVED'
                        ? 'bg-emerald-600 text-white shadow-xs' 
                        : 'bg-neutral-100 text-neutral-400'
                    }`}>
                      <CheckCircle size={14} />
                    </div>
                    <div>
                      <span className="block font-bold text-neutral-800 text-xs">Arrived</span>
                      <span className="block text-[10px] text-neutral-400">Arrived at Buyer Warehouse</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Immutable Summary Invoice Manifest Card */}
              <div id="invoice-manifest" className="bg-[#fcfdfd] border-2 border-neutral-150 rounded-3xl p-6 sm:p-8 space-y-6 relative overflow-hidden shadow-xs">
                {/* Top background aesthetic */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-700"></div>

                {/* Invoice top brand bar */}
                <div className="flex justify-between items-start pt-2">
                  <div className="space-y-1">
                    <span className="text-emerald-700 font-black tracking-tight text-xl font-mono">
                      BizzLedger Delivery Bill
                    </span>
                    <span className="block text-[10px] text-neutral-400 font-mono">CONTRACT AGREEMENT</span>
                  </div>
                  <button 
                    onClick={() => window.print()} 
                    className="p-2 bg-white border border-neutral-200 text-neutral-600 rounded-xl hover:bg-neutral-50 transition cursor-pointer"
                    title="Print manifest"
                  >
                    <Printer size={15} />
                  </button>
                </div>

                {/* Sub Metadata rows */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-y border-dashed border-neutral-200 text-xs">
                  <div>
                    <span className="block text-neutral-400 font-mono uppercase text-[9px]">Bill ID</span>
                    <span className="font-mono font-bold text-neutral-800">{activeOrder.orderId}</span>
                  </div>
                  <div>
                    <span className="block text-neutral-400 font-mono uppercase text-[9px]">Date</span>
                    <span className="font-mono font-bold text-neutral-800">{new Date(activeOrder.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="block text-neutral-400 font-mono uppercase text-[9px]">Delivery Destination</span>
                    <span className="font-bold text-neutral-800">Kalimati, Kathmandu</span>
                  </div>
                  <div>
                    <span className="block text-neutral-400 font-mono uppercase text-[9px]">Deal Status</span>
                    <span className="font-black text-emerald-700">AGREED & SEALED</span>
                  </div>
                </div>

                {/* Trader participants block */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-neutral-50 p-4 rounded-2xl text-xs">
                  <div className="space-y-1">
                    <span className="block text-neutral-400 font-bold uppercase text-[9px]">Seller (Farmer)</span>
                    <span className="font-black text-neutral-800 text-sm block">{activeOrder.farmerName}</span>
                    <span className="text-neutral-500 block">Source Farm: Kavre</span>
                  </div>
                  <div className="space-y-1 sm:border-l sm:border-neutral-200 sm:pl-6">
                    <span className="block text-neutral-400 font-bold uppercase text-[9px]">Buyer (Wholesaler)</span>
                    <span className="font-black text-neutral-800 text-sm block">{activeOrder.wholesalerName}</span>
                    <span className="text-neutral-500 block">Delivery Warehouse: Kathmandu</span>
                  </div>
                </div>

                {/* Core Items line table */}
                <div className="space-y-2">
                  <span className="block text-neutral-400 font-bold font-mono uppercase text-[9px]">Vegetable Goods & Price Details</span>
                  <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden text-xs">
                    <div className="grid grid-cols-4 bg-neutral-50 border-b border-neutral-200 p-3 font-mono text-neutral-500 font-bold uppercase">
                      <div className="col-span-2">Crop Name</div>
                      <div className="text-right">Settled Price</div>
                      <div className="text-right">Quantity</div>
                    </div>
                    <div className="grid grid-cols-4 p-3 font-semibold text-neutral-800">
                      <div className="col-span-2">{activeOrder.cropName} Crates</div>
                      <div className="text-right">Rs. {activeOrder.finalPricePerCrate}</div>
                      <div className="text-right">{activeOrder.quantity} Crates</div>
                    </div>
                  </div>
                </div>

                {/* Driver Vehicle Manifest info */}
                <div className="border border-neutral-100 bg-[#fffbeb] p-4 rounded-2xl space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-amber-800 flex items-center gap-1">
                      <Truck size={14} />
                      Pickup Truck & Driver Info
                    </span>
                    <span className="text-[10px] bg-amber-400/20 text-amber-900 border border-amber-350 px-2.5 py-0.5 rounded-md font-mono font-bold uppercase">
                      Assigned
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                    <div>
                      <span className="block text-[8px] text-neutral-500 uppercase">Truck Number Plate</span>
                      <span className="font-bold text-neutral-800 text-sm block mt-0.5">
                        {activeOrder.vehicleNumber || 'BA 3 KHA 2092'}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[8px] text-neutral-500 uppercase">Driver Mobile Number</span>
                      <span className="font-bold text-neutral-800 text-sm block mt-0.5 flex items-center gap-1.5 focus:outline-hidden">
                        <PhoneCall size={12} className="text-neutral-500" />
                        {activeOrder.driverPhone || '+977-9810100200'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Final calculated total sum */}
                <div className="flex justify-between items-center py-3 border-t border-neutral-200">
                  <span className="text-sm font-bold text-neutral-600">Total Payment Amount:</span>
                  <div className="text-right">
                    <span className="text-2xl font-black text-neutral-900 font-mono">Rs. {activeOrder.totalPrice.toLocaleString()}</span>
                    <span className="block text-[10px] text-neutral-400 mt-0.5">Includes standard loading fees</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-neutral-50 border border-neutral-200 rounded-3xl p-12 text-center text-neutral-400">
              No delivery bills found yet. Complete a bargain to create orders!
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
