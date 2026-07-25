import React, { useState } from 'react';
import { VegetableListing, UserProfile } from '../../types';
import { Search, MapPin, Tag, Calendar, Truck, ArrowRight, Star, Plus, ShoppingCart } from 'lucide-react';

interface MarketplacePageProps {
  listings: VegetableListing[];
  onAddToCart?: (listing: VegetableListing) => void;
  currentUser: UserProfile;
  onViewFarmer?: (farmerId: string) => void;
}

export default function MarketplacePage({ listings, onAddToCart, currentUser, onViewFarmer }: MarketplacePageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Extract unique districts and categories
  const districts = ['All', 'Panchkhal, Kavre', 'Benighat, Dhading', 'Palung, Makwanpur'];
  const categories = ['All', 'Tomatoes', 'Cabbages', 'Greens', 'Potatoes', 'Squash', 'Other'];

  // Filter listings
  const filteredListings = listings.filter((item) => {
    const matchesSearch = item.cropName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.farmerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDistrict = selectedDistrict === 'All' || item.district === selectedDistrict;
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesDistrict && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Search Header Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-[0_10px_30px_rgba(16,185,129,0.15)]">
        <div className="space-y-2">
          <span className="text-xs bg-emerald-500/55 backdrop-blur-md text-emerald-100 font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            Fresh Vegetables
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Buy Direct From Farmer</h2>
          <p className="text-emerald-100/90 text-sm max-w-lg">
            Find fresh tomatoes, potatoes, onions, cabbage & cauliflowers directly from village farms. Chat to get the best wholesale price!
          </p>
        </div>
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 flex gap-4 text-xs">
          <div>
            <span className="block text-emerald-200 font-bold mb-0.5 uppercase font-mono tracking-wider">Your Location</span>
            <span className="font-extrabold text-[15px] text-white flex items-center gap-1">
              <MapPin size={14} className="text-amber-400" />
              {currentUser.district}
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Sourcing Filters */}
      <div className="bg-white border border-neutral-100 rounded-3xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Main search input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-neutral-400 group-focus-within:text-emerald-500 transition duration-200" size={18} />
            <input 
              type="text"
              placeholder="Search vegetables or farmers (e.g. Tomato, Pema Shrestha)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-neutral-50/80 border border-neutral-200 rounded-2xl text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition duration-200"
            />
          </div>

          {/* District selector */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-neutral-500 font-mono uppercase mr-1">District:</span>
            {districts.map(dist => (
              <button
                key={dist}
                onClick={() => setSelectedDistrict(dist)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer transition ${
                  selectedDistrict === dist 
                    ? 'bg-neutral-900 text-white shadow-xs' 
                    : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                {dist === 'All' ? 'All Districts' : dist.split(',')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Categories selector */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-dotted border-neutral-100">
          <span className="text-xs font-bold text-neutral-500 font-mono uppercase mr-1">Category:</span>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition ${
                selectedCategory === cat 
                  ? 'bg-emerald-600 text-white shadow-xs' 
                  : 'bg-neutral-50 text-neutral-500 hover:bg-neutral-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid Feed */}
      {filteredListings.length === 0 ? (
        <div className="bg-neutral-50 border border-dashed border-neutral-200 rounded-3xl p-16 text-center space-y-3">
          <div className="text-neutral-300 font-extrabold text-5xl font-mono">?</div>
          <h3 className="font-bold text-neutral-700 text-lg">No Crops Posted Here</h3>
          <p className="text-neutral-500 text-sm max-w-md mx-auto">
            Try resetting your search query or selecting "All Districts" to browse crop volumes across Kavre, Dhading, and Makwanpur.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredListings.map((item) => {
            // Check if listing has a floor budget indicator and visual progress bar
            const readyShipment = item.readyToShip;

            return (
              <div 
                key={item.id} 
                className="bg-white border border-neutral-100 rounded-3xl overflow-hidden shadow-[0_4px_25px_rgba(0,0,0,0.02)] hover:shadow-md transition-all duration-300 flex flex-col justify-between"
              >
                {/* Visual Header */}
                <div className="relative h-48 bg-neutral-100">
                  <img 
                    src={item.imageUrl} 
                    alt={item.cropName} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  {/* Category overlay */}
                  <span className="absolute top-4 left-4 bg-white/80 backdrop-blur-md text-neutral-800 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                    {item.category}
                  </span>
                  
                  {/* Shipping readiness indicator */}
                  <span className={`absolute top-4 right-4 text-[10px] font-extrabold px-3 py-1 rounded-full shadow-sm flex items-center gap-1 ${
                    readyShipment 
                      ? 'bg-emerald-500 text-white' 
                      : 'bg-amber-400 text-amber-950'
                  }`}>
                    <Truck size={11} />
                    {readyShipment ? 'Ready for Sourcing' : 'Harvest Scheduled'}
                  </span>
                </div>

                {/* Content body */}
                <div className="p-6 flex-1 space-y-4">
                  <div className="space-y-1">
                    <span className="text-xs text-neutral-400 font-bold font-mono uppercase tracking-wider flex items-center gap-1">
                      <MapPin size={12} className="text-rose-500" />
                      {item.district}
                    </span>
                    <h3 className="text-xl font-bold text-neutral-800 tracking-tight">{item.cropName}</h3>
                  </div>

                  {/* Farmer profile bar */}
                  <div className="bg-neutral-50 rounded-2xl p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center font-bold text-emerald-800">
                        {item.farmerName[0]}
                      </div>
                      <div>
                        <span 
                          onClick={() => onViewFarmer && onViewFarmer(item.farmerId)}
                          className="block text-xs font-bold text-neutral-700 leading-tight cursor-pointer hover:text-emerald-700 hover:underline"
                        >
                          {item.farmerName}
                        </span>
                        <span className="block text-[10px] text-neutral-400 font-mono">Producer Partner</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-neutral-500 line-clamp-2 leading-relaxed h-8">
                    {item.notes || 'No description provided by farmer co-op.'}
                  </p>

                  {/* Quantity & Target Prices */}
                  <div className="grid grid-cols-2 gap-4 pt-3 border-t border-neutral-100">
                    <div>
                      <span className="block text-[10px] text-neutral-400 uppercase font-mono tracking-wider font-bold">Supply Available</span>
                      <span className="text-[15px] font-black text-neutral-800">
                        {item.quantityAvailableCrates} <span className="text-xs font-normal">Crates</span>
                      </span>
                      <span className="block text-[10px] text-neutral-400">~ {item.quantityAvailableCrates * 20} kg total</span>
                    </div>

                    <div>
                      <span className="block text-[10px] text-neutral-400 uppercase font-mono tracking-wider font-bold">Price</span>
                      <span className="text-[15px] font-black text-emerald-600">
                        Rs. {item.pricePerCrate} <span className="text-xs font-normal text-neutral-500">/ Cr</span>
                      </span>
                      <span className="block text-[11px] text-neutral-400 font-mono">Rs. {item.pricePerCrate / 20}/kg</span>
                    </div>
                  </div>

                  {/* Sourcing Timeline metrics */}
                  <div className="flex items-center justify-between text-xs text-neutral-500 bg-neutral-50/50 p-2 rounded-xl">
                    <span className="flex items-center gap-1.5 font-mono">
                      <Calendar size={13} />
                      Harvested: {item.harvestDate}
                    </span>
                  </div>
                </div>

                {/* Footer buttons based on current roles etc */}
                <div className="p-6 pt-0 space-y-2">
                  {currentUser.role === 'WHOLESALER' ? (
                    <button 
                      onClick={() => onAddToCart && onAddToCart(item)}
                      className="w-full flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-3 rounded-xl text-xs cursor-pointer hover:shadow-xs transition duration-150"
                    >
                      <ShoppingCart size={13} />
                      Add to Basket
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
