import React, { useState } from 'react';
import { VegetableListing, UserProfile } from '../../types';
import { PlusCircle, Database, Leaf, AlertCircle, ShoppingBag, Landmark, ArrowUpRight, TrendingUp, Edit2, Trash2 } from 'lucide-react';

interface InventoryPageProps {
  listings: VegetableListing[];
  onAddListing: (newListing: Omit<VegetableListing, 'id' | 'farmerId' | 'farmerName' | 'farmerRating'>) => void;
  onEditListing?: (id: string, updated: Partial<VegetableListing>) => void;
  onDeleteListing?: (id: string) => void;
  currentUser: UserProfile;
}

export default function InventoryPage({ listings, onAddListing, onEditListing, onDeleteListing, currentUser }: InventoryPageProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [cropName, setCropName] = useState('Tomato (Local)');
  const [cropNameCustom, setCropNameCustom] = useState('');
  const [isOtherCrop, setIsOtherCrop] = useState(false);
  const [category, setCategory] = useState<'Tomatoes' | 'Cabbages' | 'Greens' | 'Potatoes' | 'Squash' | 'Other'>('Tomatoes');
  const [district, setDistrict] = useState('Panchkhal, Kavre');
  const [crates, setCrates] = useState(60);
  const [priceVal, setPriceVal] = useState(1400);
  const [readyShip, setReadyShip] = useState(true);
  const [notes, setNotes] = useState('');
  const [imageUrl, setImageUrl] = useState('https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=400&auto=format&fit=crop&q=80');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Filter listings belonging to current logged-in farmer
  const myListings = listings.filter(item => item.farmerId === currentUser.id);

  const handleOpenAddModal = () => {
    setEditingId(null);
    setCropName('Tomato (Local)');
    setCropNameCustom('');
    setIsOtherCrop(false);
    setCategory('Tomatoes');
    setCrates(60);
    setPriceVal(1400);
    setReadyShip(true);
    setNotes('');
    setImageUrl('https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=400&auto=format&fit=crop&q=80');
    setShowAddModal(true);
  };

  const handleOpenEditModal = (listing: VegetableListing) => {
    setEditingId(listing.id);
    const knownCrops = ['Tomato (Local)', 'Potatoes', 'Cabbage', 'Cauliflower (Local)'];
    if (knownCrops.includes(listing.cropName)) {
      setCropName(listing.cropName);
      setIsOtherCrop(false);
      setCropNameCustom('');
    } else {
      setCropName('Other');
      setIsOtherCrop(true);
      setCropNameCustom(listing.cropName);
    }
    setCategory(listing.category as any);
    setDistrict(listing.district);
    setCrates(listing.quantityAvailableCrates);
    setPriceVal(listing.pricePerCrate);
    setReadyShip(listing.readyToShip);
    setNotes(listing.notes || '');
    setImageUrl(listing.imageUrl);
    setShowAddModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalCropName = isOtherCrop ? cropNameCustom.trim() : cropName;
    const listingData = {
      cropName: finalCropName,
      category,
      district,
      quantityAvailableCrates: crates,
      pricePerCrate: priceVal,
      harvestDate: new Date().toISOString().split('T')[0],
      readyToShip: readyShip,
      notes,
      imageUrl
    };

    if (editingId && onEditListing) {
      onEditListing(editingId, listingData);
    } else {
      onAddListing(listingData);
    }
    
    setShowAddModal(false);
    setNotes('');
    setEditingId(null);
    setIsOtherCrop(false);
    setCropNameCustom('');
  };

  const imageOptions = [
    { label: 'Tomatoes', value: 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=400&auto=format&fit=crop&q=80' },
    { label: 'Potatoes', value: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&auto=format&fit=crop&q=80' },
    { label: 'Cabbage', value: 'https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?w=400&auto=format&fit=crop&q=80' },
    { label: 'Local Cauliflower', value: 'https://images.unsplash.com/photo-1568584711075-3d021a7c3ca3?w=400&auto=format&fit=crop&q=80' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-neutral-800 tracking-tight">My Vegetable List</h2>
          <p className="text-xs text-neutral-500">See how many crates you have, add new crops, or change your prices.</p>
        </div>

        <button 
          onClick={handleOpenAddModal}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-5 rounded-2xl flex items-center gap-2 text-xs cursor-pointer shadow-md transition duration-200"
        >
          <PlusCircle size={16} />
          Add Fresh Vegetables
        </button>
      </div>

      {/* Grid of Key metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white border border-neutral-100 p-6 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.01)] space-y-2">
          <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest font-mono">My Vegetables Listed</span>
          <div className="text-3xl font-black text-neutral-800">{myListings.length} Active</div>
          <p className="text-xs text-neutral-500">Your organic crops online</p>
        </div>

        <div className="bg-white border border-neutral-100 p-6 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.01)] space-y-2">
          <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest font-mono">Total Crates Available</span>
          <div className="text-3xl font-black text-emerald-600">
            {myListings.reduce((sum, item) => sum + item.quantityAvailableCrates, 0)} <span className="text-sm font-semibold">Crates</span>
          </div>
          <p className="text-xs text-neutral-500">Ready for sale or pickup</p>
        </div>
      </div>

      {/* Primary inventory grid */}
      <div className="bg-white border border-neutral-100 rounded-3xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.01)]">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-neutral-800 text-base">Vegetables listed online ({myListings.length})</h3>
          <span className="text-xs text-neutral-400 font-mono">Updated just now</span>
        </div>

        {myListings.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <Database size={32} className="mx-auto text-neutral-300" />
            <p className="text-sm text-neutral-500 font-bold font-sans">You have not listed any vegetables yet.</p>
            <p className="text-xs text-neutral-400">Click Add Fresh Vegetables button above to list crops.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-100 text-neutral-400 font-bold font-mono uppercase tracking-wider">
                  <th className="py-3 px-2">Vegetable Name</th>
                  <th className="py-3 px-2">District</th>
                  <th className="py-3 px-2">Crates Available</th>
                  <th className="py-3 px-2">Price per Crate</th>
                  <th className="py-3 px-2">Status</th>
                  <th className="py-3 px-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {myListings.map(item => (
                  <tr key={item.id} className="hover:bg-neutral-50/50 transition duration-150">
                    <td className="py-4 px-2 flex items-center gap-2.5">
                      <img 
                        src={item.imageUrl} 
                        alt={item.cropName} 
                        className="w-9 h-9 rounded-lg object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <span className="font-bold text-neutral-800 block text-sm">{item.cropName}</span>
                        <span className="text-[10px] text-neutral-400 uppercase tracking-wider">{item.category}</span>
                      </div>
                    </td>
                    <td className="py-4 px-2 font-mono text-neutral-500">{item.district}</td>
                    <td className="py-4 px-2 font-black text-neutral-700 text-sm">
                      {item.quantityAvailableCrates} <span className="text-xs font-normal">cr.</span>
                    </td>
                    <td className="py-4 px-2 text-emerald-600 font-black">Rs. {item.pricePerCrate} / Cr</td>
                    <td className="py-4 px-2">
                       <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        item.readyToShip 
                          ? 'bg-emerald-50 text-emerald-700' 
                          : 'bg-amber-50 text-amber-700'
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${item.readyToShip ? 'bg-emerald-500' : 'bg-amber-400'}`}></span>
                        {item.readyToShip ? 'Ready for pickup' : 'Growing in Field'}
                      </span>
                    </td>
                    <td className="py-4 px-2 text-right space-x-2">
                      <button 
                        onClick={() => handleOpenEditModal(item)}
                        className="p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-emerald-600 rounded-lg transition"
                        title="Edit Listing"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => onDeleteListing && onDeleteListing(item.id)}
                        className="p-1.5 text-neutral-500 hover:bg-red-50 hover:text-red-600 rounded-lg transition"
                        title="Delete Listing"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* List New Harvest Modal Overlay */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold font-mono text-emerald-600 tracking-wider uppercase block">BizzLedger Growers Group</span>
                <h3 className="text-xl font-bold text-neutral-900">{editingId ? 'Edit Vegetable Crop' : 'List New Vegetable Crop'}</h3>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-neutral-400 hover:text-neutral-600 text-xl font-bold font-mono px-2 py-1 bg-neutral-100 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Crop select */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-600 block">Vegetable Crop Name</label>
                <select 
                  value={isOtherCrop ? 'Other' : cropName}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'Other') {
                      setIsOtherCrop(true);
                      setCropName('Other');
                      setCategory('Other');
                    } else {
                      setIsOtherCrop(false);
                      setCropName(val);
                      if (val === 'Potatoes') {
                        setCategory('Potatoes');
                        setImageUrl('https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&auto=format&fit=crop&q=80');
                      } else if (val === 'Cabbage') {
                        setCategory('Cabbages');
                        setImageUrl('https://images.unsplash.com/photo-1550142414-ac6200fa53f4?w=400&auto=format&fit=crop&q=80');
                      } else if (val === 'Cauliflower (Local)') {
                        setCategory('Cabbages');
                        setImageUrl('https://images.unsplash.com/photo-1568584711075-3d021a7c3ca3?w=400&auto=format&fit=crop&q=80');
                      } else {
                        setCategory('Tomatoes');
                        setImageUrl('https://images.unsplash.com/photo-1595855759920-86582396756a?w=400&auto=format&fit=crop&q=80');
                      }
                    }
                  }}
                  className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-semibold focus:outline-hidden"
                >
                  <option>Tomato (Local)</option>
                  <option>Potatoes</option>
                  <option>Cabbage</option>
                  <option>Cauliflower (Local)</option>
                  <option>Other</option>
                </select>
              </div>

              {isOtherCrop && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-600 block">Custom Crop Name</label>
                  <input 
                    type="text" 
                    value={cropNameCustom}
                    onChange={(e) => setCropNameCustom(e.target.value)}
                    placeholder="Enter crop name"
                    className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-semibold focus:outline-hidden"
                    required
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* District location setup */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-600 block">Farming District</label>
                  <select 
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-semibold focus:outline-hidden"
                  >
                    <option>Panchkhal, Kavre</option>
                    <option>Benighat, Dhading</option>
                    <option>Palung, Makwanpur</option>
                  </select>
                </div>

                {/* Available volume select */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-600 block">How many crates available?</label>
                  <input 
                    type="number" 
                    min={5}
                    value={crates}
                    onChange={(e) => setCrates(Number(e.target.value))}
                    className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-semibold focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Single Price Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-600 block">Price per Crate (Rs.)</label>
                <input 
                  type="number"
                  min={100}
                  value={priceVal}
                  onChange={(e) => setPriceVal(Number(e.target.value))}
                  className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-semibold focus:outline-hidden"
                />
              </div>

              {/* Shipment status checklist */}
              <div className="flex items-center gap-3">
                <input 
                  type="checkbox" 
                  id="readyShipBox" 
                  checked={readyShip}
                  onChange={(e) => setReadyShip(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 rounded border-neutral-300 pointer-events-auto cursor-pointer"
                />
                <label htmlFor="readyShipBox" className="text-xs font-bold text-neutral-700 cursor-pointer select-none">
                  This crop is harvested and ready for truck pickup
                </label>
              </div>

              {/* Photo template picker */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-600 block">Choose a Photo</label>
                <div className="grid grid-cols-4 gap-2">
                  {imageOptions.map((opt, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setImageUrl(opt.value)}
                      className={`p-1 border rounded-lg overflow-hidden transition ${
                        imageUrl === opt.value ? 'border-emerald-600 bg-emerald-50/20' : 'border-neutral-200 opacity-60'
                      }`}
                    >
                      <img src={opt.value} alt={opt.label} className="w-full h-8 object-cover rounded-md" referrerPolicy="no-referrer" />
                      <span className="text-[8px] text-center block mt-1 line-clamp-1 font-semibold text-neutral-600">{opt.label}</span>
                    </button>
                  ))}
                  {!imageOptions.some(opt => opt.value === imageUrl) && imageUrl && (
                    <div className="p-1 border rounded-lg overflow-hidden border-emerald-600 bg-emerald-50/20">
                      <img src={imageUrl} alt="Uploaded custom photo" className="w-full h-8 object-cover rounded-md" />
                      <span className="text-[8px] text-center block mt-1 line-clamp-1 font-semibold text-emerald-600">Custom Photo</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Custom Image Upload */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-600 block">Or Upload Your Own Photo</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setImageUrl(reader.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="w-full text-xs text-neutral-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                />
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-600 block">Notes/Description (Optional)</label>
                <textarea 
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. sweet organic taste, medium size, harvested today morning..."
                  className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold py-3 px-4 rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl text-xs cursor-pointer shadow-sm"
                >
                  {editingId ? 'Save Changes' : 'Add to Marketplace List'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
