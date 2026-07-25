import React, { useState } from 'react';
import { VegetableListing, UserProfile, Order } from '../../types';
import {
  ShoppingCart,
  Trash2,
  CreditCard,
  ArrowRight,
  Truck,
  MapPin,
  CheckCircle,
  Sparkles,
  FileText,
  AlertTriangle,
  QrCode,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';

interface CartItem {
  listing: VegetableListing;
  quantity: number;
}

interface CartPageProps {
  cart: CartItem[];
  currentUser: UserProfile;
  onUpdateCartItemQuantity: (listingId: string, qty: number) => void;
  onRemoveCartItem: (listingId: string) => void;
  onClearCart: () => void;
  onConfirmCheckout: (items: CartItem[], transportMethod: string, paymentMethod: string) => void;
  onNavigateToDirectory: () => void;
  onNavigateToOrders: () => void;
}

export default function CartPage({
  cart,
  currentUser,
  onUpdateCartItemQuantity,
  onRemoveCartItem,
  onClearCart,
  onConfirmCheckout,
  onNavigateToDirectory,
  onNavigateToOrders
}: CartPageProps) {

  const [transportMethod, setTransportMethod] = useState<'Standard' | 'Refrigerated' | 'Expedited'>('Standard');
  const [paymentMethod, setPaymentMethod] = useState<'Esewa' | 'QR'>('Esewa');
  const [isCompleted, setIsCompleted] = useState(false);
  const [createdOrders, setCreatedOrders] = useState<Order[]>([]);
  const [qtyErrors, setQtyErrors] = useState<Record<string, string>>({});
  // Local display string for each cart item's input — allows free typing
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  // Selected item IDs for partial checkout
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set()
  );

  // Sync selectedIds when cart changes (auto-select newly added items)
  React.useEffect(() => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      cart.forEach(item => { if (!next.has(item.listing.id)) next.add(item.listing.id); });
      // Remove ids that are no longer in cart
      next.forEach(id => { if (!cart.find(i => i.listing.id === id)) next.delete(id); });
      return next;
    });
  }, [cart]);

  const toggleSelect = (id: string) => setSelectedIds(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const allSelected = cart.length > 0 && cart.every(i => selectedIds.has(i.listing.id));
  const toggleSelectAll = () => {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(cart.map(i => i.listing.id)));
  };

  const selectedCart = cart.filter(i => selectedIds.has(i.listing.id));

  // Commit typed value to cart on blur or Enter
  const commitQty = (listingId: string, maxAvailable: number) => {
    const raw = inputValues[listingId];
    // Helper to clear local value so input re-syncs to parent's item.quantity
    const clearLocal = () => setInputValues(prev => { const next = { ...prev }; delete next[listingId]; return next; });

    if (raw === undefined || raw === '') {
      onUpdateCartItemQuantity(listingId, 1);
      setQtyErrors(prev => { const next = { ...prev }; delete next[listingId]; return next; });
      clearLocal();
      return;
    }
    const num = parseInt(raw, 10);
    if (isNaN(num) || num < 1) {
      onUpdateCartItemQuantity(listingId, 1);
      setQtyErrors(prev => { const next = { ...prev }; delete next[listingId]; return next; });
      clearLocal();
      return;
    }
    if (num > maxAvailable) {
      setQtyErrors(prev => ({ ...prev, [listingId]: `Only ${maxAvailable} available` }));
      onUpdateCartItemQuantity(listingId, maxAvailable);
    } else {
      setQtyErrors(prev => { const next = { ...prev }; delete next[listingId]; return next; });
      onUpdateCartItemQuantity(listingId, num);
    }
    clearLocal();
  };

  // Calculate logistics rates per crate based on district origin
  const getLogisticsRatePerCrate = (district: string): number => {
    if (district.includes('Kavre')) return 60;
    if (district.includes('Dhading')) return 100;
    if (district.includes('Makwanpur')) return 90;
    if (district.includes('Mustang')) return 350;
    if (district.includes('Ilam')) return 400;
    return 80; // default
  };

  const getDistanceEstimateText = (district: string): string => {
    if (district.includes('Kavre')) return '52 km (Araniko Hwy)';
    if (district.includes('Dhading')) return '88 km (Prithvi Hwy)';
    if (district.includes('Makwanpur')) return '76 km (Tribhuvan Hwy)';
    if (district.includes('Mustang')) return '360 km (Mountain Roads)';
    if (district.includes('Ilam')) return '520 km (East-West Hwy)';
    return '90 km';
  };

  // Calculations — only for selected items
  const subtotal = selectedCart.reduce((acc, item) => acc + (item.listing.pricePerCrate * item.quantity), 0);

  // Logistics cost
  const logisticsBaseCost = selectedCart.reduce((acc, item) => {
    const rate = getLogisticsRatePerCrate(item.listing.district);
    return acc + (rate * item.quantity);
  }, 0);

  const multiplier = transportMethod === 'Refrigerated' ? 1.4 : transportMethod === 'Expedited' ? 1.25 : 1.0;
  const logisticsFinalCost = Math.round(logisticsBaseCost * multiplier);

  // Agriculture Tax charge (1.5% in Nepal standard)
  const serviceLevy = Math.round(subtotal * 0.015);
  const grandTotal = subtotal + logisticsFinalCost + serviceLevy;

  const handleCheckoutSubmit = () => {
    if (selectedCart.length === 0) return;

    // Build mock order receipts for selected items only
    const generated: Order[] = selectedCart.map((item, idx) => {
      const baseDistanceRate = getLogisticsRatePerCrate(item.listing.district);
      const deliveryPrice = Math.round(baseDistanceRate * multiplier);

      return {
        orderId: `order_2026_${Math.floor(1000 + Math.random() * 9000 + idx)}`,
        listingId: item.listing.id,
        cropName: item.listing.cropName,
        farmerName: item.listing.farmerName,
        wholesalerName: currentUser.name,
        finalPricePerCrate: item.listing.pricePerCrate,
        quantity: item.quantity,
        totalPrice: item.listing.pricePerCrate * item.quantity,
        status: 'PROCESSING',
        vehicleNumber: `BA 3 KHA ${Math.floor(1000 + Math.random() * 9000)}`,
        driverPhone: '+977-98' + Math.floor(10000000 + Math.random() * 90000000).toString(),
        createdAt: new Date().toISOString(),
        estimatedArrival: new Date(Date.now() + (item.listing.district.includes('Mustang') || item.listing.district.includes('Ilam') ? 24 : 8) * 3600 * 1000).toISOString(),
      };
    });

    setCreatedOrders(generated);
    setIsCompleted(true);
    onConfirmCheckout(selectedCart, transportMethod, paymentMethod);
    // Remove only selected items from cart
    selectedIds.forEach(id => onRemoveCartItem(id));
    setSelectedIds(new Set());
  };

  if (isCompleted) {
    return (
      <div className="bg-white border border-neutral-100 rounded-3xl p-6 sm:p-10 shadow-[0_4px_30px_rgba(0,0,0,0.01)] text-center space-y-8 animate-in fade-in duration-200">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto text-2xl font-bold">
          <CheckCircle size={36} className="text-emerald-600 stroke-[2.5]" />
        </div>

        <div className="space-y-2">
          <span className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full uppercase font-mono tracking-wider font-extrabold">
            Deal Successfully Fixed & Locked!
          </span>
          <h2 className="text-3xl font-black text-neutral-800 tracking-tight">Agreed! Delivery is starting.</h2>
          <p className="text-xs text-neutral-500 max-w-md mx-auto leading-relaxed">
            We have locked this purchase. The farmer has been informed to prepare your vegetables and load the delivery truck.
          </p>
        </div>

        {/* List of generated mock orders */}
        <div className="max-w-xl mx-auto bg-neutral-50 rounded-2xl p-5 text-left border border-neutral-200 space-y-4">
          <span className="text-[10px] text-neutral-400 font-mono font-bold uppercase block border-b pb-1.5">
            Your Delivery Details ({createdOrders.length} Crops)
          </span>

          <div className="space-y-3.5">
            {createdOrders.map((ord, i) => (
              <div key={ord.orderId} className="flex justify-between items-start text-xs text-neutral-700">
                <div>
                  <span className="font-bold text-neutral-900">{ord.cropName}</span>
                  <span className="block text-[10px] text-neutral-400">Farmer: {ord.farmerName} · {ord.quantity} Crates</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-neutral-900 block">Rs. {ord.totalPrice}</span>
                  <span className="text-[9px] text-emerald-600 font-bold block">Truck No: {ord.vehicleNumber}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-dotted pt-3 flex justify-between text-xs text-neutral-900 font-bold">
            <span>Total Price to Pay:</span>
            <span>Rs. {grandTotal}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-3 pt-4 max-w-sm mx-auto">
          <button
            onClick={() => {
              setIsCompleted(false);
              onNavigateToOrders();
            }}
            className="w-full bg-neutral-900 hover:bg-neutral-850 text-white font-extrabold text-xs py-3.5 px-6 rounded-xl cursor-pointer transition flex items-center justify-center gap-1.5"
          >
            View My Delivery Bills & Orders
            <ArrowRight size={14} />
          </button>
          <button
            onClick={() => {
              setIsCompleted(false);
              onClearCart();
              onNavigateToDirectory();
            }}
            className="w-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold text-xs py-3.5 px-6 rounded-xl cursor-pointer transition"
          >
            Choose More Fruits & Veggies
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

      {/* List / Left Column (8 cols) */}
      <div className="lg:col-span-8 space-y-4">

        {/* Header summary of Cart */}
        <div className="bg-white border border-neutral-100 rounded-3xl p-5 shadow-[0_4px_25px_rgba(0,0,0,0.015)] flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-neutral-800 tracking-tight flex items-center gap-2">
              <ShoppingCart size={18} className="text-emerald-600" />
              Sourcing Basket
            </h2>
            <p className="text-[11px] text-neutral-400">
              Adjust quantities or edit your items before confirming your order.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {cart.length > 0 && (
              <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-neutral-600">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 accent-emerald-600 cursor-pointer rounded"
                />
                Select All
              </label>
            )}
            {cart.length > 0 && (
              <button
                onClick={onClearCart}
                className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-1.5 rounded-xl transition font-bold cursor-pointer"
              >
                Empty Basket
              </button>
            )}
          </div>
        </div>

        {cart.length === 0 ? (
          <div className="bg-white border border-neutral-100 rounded-3xl p-16 text-center space-y-4">
            <span className="text-5xl block animate-bounce">🥬</span>
            <h3 className="text-lg font-bold text-neutral-700">Your shopping cart is empty</h3>
            <p className="text-xs text-neutral-400 max-w-sm mx-auto leading-relaxed">
              Browse fresh crops listed by farmers across Nepal. Add items here to order them!
            </p>
            <button
              onClick={onNavigateToDirectory}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-5 rounded-xl cursor-pointer transition"
            >
              Browse Fruits & Vegetables
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {cart.map((item) => {
              const itemSubtotal = item.listing.pricePerCrate * item.quantity;
              const unitLogisticsRate = getLogisticsRatePerCrate(item.listing.district);

              return (
                <div
                  key={item.listing.id}
                  className={`bg-white border rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm transition-colors duration-150 ${
                    selectedIds.has(item.listing.id) ? 'border-emerald-300' : 'border-neutral-100'
                  }`}
                >
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={selectedIds.has(item.listing.id)}
                    onChange={() => toggleSelect(item.listing.id)}
                    className="w-4 h-4 accent-emerald-600 cursor-pointer rounded shrink-0 mt-1 self-start sm:self-center"
                  />
                  {/* Left segment details */}
                  <div className="flex gap-3 flex-1">
                    <img
                      src={item.listing.imageUrl}
                      alt={item.listing.cropName}
                      className="w-16 h-16 rounded-xl object-cover border"
                      referrerPolicy="no-referrer"
                    />
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold text-neutral-400 uppercase font-mono tracking-wider flex items-center gap-0.5">
                        <MapPin size={10} className="text-rose-500" />
                        {item.listing.district}
                      </span>
                      <h4 className="font-bold text-neutral-800 text-sm leading-tight">{item.listing.cropName}</h4>
                      <span className="block text-[11px] text-neutral-500">
                        Farmer: <span className="font-semibold">{item.listing.farmerName}</span>
                      </span>
                      <span className="inline-block text-[10px] text-emerald-700 font-mono bg-emerald-50 px-1 rounded mt-0.5">
                        Truck delivery rate: Rs. {unitLogisticsRate}/Cr ({getDistanceEstimateText(item.listing.district)})
                      </span>
                    </div>
                  </div>

                  {/* Quantity slider & prices */}
                  <div className="flex items-center gap-6 justify-between w-full sm:w-auto border-t sm:border-0 pt-3 sm:pt-0">
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => {
                            const newQty = Math.max(1, item.quantity - 1);
                            onUpdateCartItemQuantity(item.listing.id, newQty);
                            setInputValues(prev => { const next = { ...prev }; delete next[item.listing.id]; return next; });
                            setQtyErrors(prev => { const next = {...prev}; delete next[item.listing.id]; return next; });
                          }}
                          className="w-7 h-7 bg-neutral-100 hover:bg-neutral-250 text-neutral-800 font-bold rounded-lg text-xs cursor-pointer flex items-center justify-center leading-none"
                        >
                          -
                        </button>
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            inputMode="numeric"
                            value={inputValues[item.listing.id] !== undefined ? inputValues[item.listing.id] : String(item.quantity)}
                            onFocus={() => setInputValues(prev => ({ ...prev, [item.listing.id]: String(item.quantity) }))}
                            onChange={(e) => {
                              // Only allow digits
                              const val = e.target.value.replace(/[^0-9]/g, '');
                              setInputValues(prev => ({ ...prev, [item.listing.id]: val }));
                              // Live error check
                              if (val !== '') {
                                const num = parseInt(val, 10);
                                if (num > item.listing.quantityAvailableCrates) {
                                  setQtyErrors(prev => ({ ...prev, [item.listing.id]: `Only ${item.listing.quantityAvailableCrates} available` }));
                                } else {
                                  setQtyErrors(prev => { const next = { ...prev }; delete next[item.listing.id]; return next; });
                                }
                              }
                            }}
                            onBlur={() => commitQty(item.listing.id, item.listing.quantityAvailableCrates)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                commitQty(item.listing.id, item.listing.quantityAvailableCrates);
                                (e.target as HTMLInputElement).blur();
                              }
                            }}
                            className="w-12 text-center font-extrabold text-neutral-800 text-xs border border-neutral-200 rounded p-1 hide-arrows focus:outline-none focus:border-emerald-400"
                          />
                          <span className="text-xs text-neutral-500 font-bold">Cr.</span>
                        </div>
                        <button
                          onClick={() => {
                            const newQty = item.quantity + 1;
                            if (newQty > item.listing.quantityAvailableCrates) {
                              setQtyErrors(prev => ({ ...prev, [item.listing.id]: `Only ${item.listing.quantityAvailableCrates} available` }));
                              onUpdateCartItemQuantity(item.listing.id, item.listing.quantityAvailableCrates);
                            } else {
                              onUpdateCartItemQuantity(item.listing.id, newQty);
                              setQtyErrors(prev => { const next = {...prev}; delete next[item.listing.id]; return next; });
                            }
                            setInputValues(prev => { const next = { ...prev }; delete next[item.listing.id]; return next; });
                          }}
                          className="w-7 h-7 bg-neutral-100 hover:bg-neutral-250 text-neutral-800 font-bold rounded-lg text-xs cursor-pointer flex items-center justify-center leading-none"
                        >
                          +
                        </button>
                      </div>
                      {qtyErrors[item.listing.id] && (
                        <span className="text-[9px] text-red-500 font-bold">{qtyErrors[item.listing.id]}</span>
                      )}
                    </div>

                    <div className="text-right">
                      <div className="text-xs text-neutral-400 font-mono">
                        Rs. {item.listing.pricePerCrate} / Cr
                      </div>
                      <div className="font-black text-neutral-800 text-sm">
                        Rs. {itemSubtotal}
                      </div>
                    </div>

                    <button
                      onClick={() => onRemoveCartItem(item.listing.id)}
                      className="p-1.5 hover:bg-rose-50 text-rose-500 hover:text-rose-600 rounded-lg transition cursor-pointer"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Regional Sourcing Policy alerts */}
        <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-3xl space-y-2 text-xs text-emerald-800 leading-relaxed">
          <div className="flex gap-2 items-start">
            <ShieldCheck size={18} className="text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Safe Truck Transport & Delivery Guarantee</span>
              All purchased crops are sent through certified local drivers. If there are any landslide blocks or weather damages on Nepalese highways, your money is fully safe.
            </div>
          </div>
        </div>

      </div>

      {/* Pricing / Right Column (4 cols) */}
      <div className="lg:col-span-4 bg-white border border-neutral-100 rounded-3xl p-5 shadow-[0_4px_25px_rgba(0,0,0,0.015)] space-y-6">
        <div>
          <h3 className="font-black text-neutral-800 text-sm">Total Bill Amount</h3>
          <p className="text-[10.5px] text-neutral-400">See item prices and transport charge here.</p>
        </div>

        {/* 1. Interactive Logistics choice */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-neutral-500 uppercase font-mono block">Transport Delivery Type</label>
          <div className="grid grid-cols-3 gap-2">
            {(['Standard', 'Refrigerated', 'Expedited'] as const).map((method) => (
              <button
                key={method}
                onClick={() => setTransportMethod(method)}
                className={`py-2 px-1 rounded-xl text-[11px] font-bold transition text-center cursor-pointer ${transportMethod === method
                    ? 'bg-neutral-900 text-white shadow-xs'
                    : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100'
                  }`}
              >
                {method === 'Standard' ? 'Normal Truck' : method === 'Refrigerated' ? 'Cold Truck' : 'Fast Truck'}
                <span className="block text-[8px] font-mono text-neutral-400">
                  {method === 'Refrigerated' ? 'Cold' : method === 'Expedited' ? 'Priority' : 'Normal'}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* 2. Interactive payment terms choice */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-neutral-500 uppercase font-mono block">Choose How To Pay</label>
          <div className="grid grid-cols-1 gap-2">
            <button
              onClick={() => setPaymentMethod('Esewa')}
              className={`p-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 text-left cursor-pointer border ${paymentMethod === 'Esewa'
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-950'
                  : 'border-neutral-150 hover:bg-neutral-50 text-neutral-600'
                }`}
            >
              <ShieldCheck size={16} className="text-emerald-600" />
              <div>
                <span className="block">Secure Esewa Payment</span>
                <span className="block text-[9px] font-normal text-neutral-400">Farmer gets money after you check cargo quality</span>
              </div>
            </button>

            <button
              onClick={() => setPaymentMethod('QR')}
              className={`p-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 text-left cursor-pointer border ${paymentMethod === 'QR'
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-950'
                  : 'border-neutral-150 hover:bg-neutral-50 text-neutral-600'
                }`}
            >
              <QrCode size={16} className="text-emerald-600" />
              <div>
                <span className="block">Scan & Pay QR</span>
                <span className="block text-[9px] font-normal text-neutral-400">Pay instantly using your Fonepay / Bank app QR</span>
              </div>
            </button>
          </div>
        </div>

        {/* 3. Cost Summary Breakdown */}
        <div className="bg-neutral-50 rounded-2xl p-4.5 space-y-2 text-xs">
          <div className="flex justify-between text-neutral-500">
            <span>Vegetable Price Total:</span>
            <span className="font-bold text-neutral-800">Rs. {subtotal}</span>
          </div>
          <div className="flex justify-between text-neutral-500">
            <span>Small Service Tax (1.5%):</span>
            <span className="font-bold text-neutral-800">Rs. {serviceLevy}</span>
          </div>
          <div className="flex justify-between text-neutral-500">
            <span>Truck Transport Delivery fee:</span>
            <span className="font-bold text-neutral-800">Rs. {logisticsFinalCost}</span>
          </div>

          <div className="border-t border-dotted border-neutral-200 my-2 pt-2 flex justify-between font-black text-neutral-900 text-sm">
            <span>Total Price to Pay:</span>
            <span className="text-emerald-700">Rs. {grandTotal}</span>
          </div>

          <span className="block text-[9px] text-neutral-400 leading-normal text-center pt-1.5">
            All prices are calculated fairly using daily Kalimati market rates.
          </span>
        </div>

        {/* 4. Action checkout triggers */}
        <div className="space-y-2">
          {paymentMethod === 'QR' && cart.length > 0 && (
            <div className="p-3 bg-neutral-900 text-white rounded-2xl flex flex-col items-center justify-center text-center space-y-2">
              <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold">Pay with Mobile Bank QR</span>
              <div className="bg-white p-2 rounded-xl">
                {/* Visual mockup of a QR code */}
                <div className="w-24 h-24 bg-neutral-200 border flex items-center justify-center text-[10px] text-neutral-800 font-mono">
                  [MOCK_QR_CODE]
                </div>
              </div>
              <span className="text-[9px] text-zinc-400">Scan with any Nepalese mobile banking app to pay Rs. {grandTotal} instantly</span>
            </div>
          )}

          <button
            onClick={handleCheckoutSubmit}
            disabled={selectedCart.length === 0}
            className={`w-full font-extrabold text-xs py-3.5 px-4 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer duration-150 shadow-md ${selectedCart.length === 0
                ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed shadow-none'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
          >
            <CreditCard size={15} />
            Confirm {selectedCart.length > 0 ? `${selectedCart.length} Item${selectedCart.length > 1 ? 's' : ''}` : 'Order'} & Pay Now
          </button>

          <button
            onClick={onNavigateToDirectory}
            className="w-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold text-xs py-3.5 px-4 rounded-xl transition text-center cursor-pointer"
          >
            Choose More Fruits & Veggies
          </button>
        </div>

      </div>

    </div>
  );
}
