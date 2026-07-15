import React, { useState } from 'react';
import { UserProfile, Order } from '../../types';
import { 
  User, 
  MapPin, 
  Phone, 
  Building2, 
  Check, 
  Edit3, 
  X,
  History,
  FileText
} from 'lucide-react';

interface ProfilePageProps {
  currentUser: UserProfile;
  orders: Order[];
  onUpdateProfile: (updatedProfile: UserProfile) => void;
}

export default function ProfilePage({ currentUser, orders, onUpdateProfile }: ProfilePageProps) {
  const isFarmer = currentUser.role === 'FARMER';
  
  // Edit mode toggle state
  const [isEditing, setIsEditing] = useState(false);
  const [editSuccessMessage, setEditSuccessMessage] = useState<string | null>(null);

  // Form states initialized from currentUser
  const [fullName, setFullName] = useState(currentUser.name);
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [region, setRegion] = useState(currentUser.district || 'Panchkhal, Kavre');

  // Farmer specific states
  const [farmName, setFarmName] = useState(currentUser.farmName || '');
  const [farmSize, setFarmSize] = useState<number>(currentUser.farmSize || 5);
  const [primaryCrops, setPrimaryCrops] = useState<string[]>(currentUser.primaryCrops || ['Tomatoes']);

  // Wholesaler specific states
  const [companyName, setCompanyName] = useState(currentUser.companyName || '');
  const [panNumber, setPanNumber] = useState(currentUser.panNumber || '');
  const [warehouseAddress, setWarehouseAddress] = useState(currentUser.warehouseAddress || '');

  // Keep form states synced with asynchronously loaded profile from db
  React.useEffect(() => {
    setFullName(currentUser.name);
    setPhone(currentUser.phone || '');
    setRegion(currentUser.district || 'Panchkhal, Kavre');
    setFarmName(currentUser.farmName || '');
    setFarmSize(currentUser.farmSize || 5);
    setPrimaryCrops(currentUser.primaryCrops || ['Tomatoes']);
    setCompanyName(currentUser.companyName || '');
    setPanNumber(currentUser.panNumber || '');
    setWarehouseAddress(currentUser.warehouseAddress || '');
  }, [currentUser]);

  // Filters for user transactions
  const userOrders = orders.filter(o => 
    isFarmer ? o.farmerName === currentUser.name : o.wholesalerName === currentUser.name
  );

  const availableCrops = ['Tomatoes', 'Cabbages', 'Greens', 'Potatoes', 'Onions', 'Cauliflowers'];

  const handleToggleCrop = (crop: string) => {
    if (primaryCrops.includes(crop)) {
      setPrimaryCrops(primaryCrops.filter(item => item !== crop));
    } else {
      setPrimaryCrops([...primaryCrops, crop]);
    }
  };

  const handleSaveChanges = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Save simplified profile info
    const updatedProfile: UserProfile = {
      ...currentUser,
      name: fullName,
      phone,
      district: region,
      companyName: isFarmer ? farmName : companyName,
      // Farmer parameters
      farmName: isFarmer ? farmName : undefined,
      farmSize: isFarmer ? farmSize : undefined,
      primaryCrops: isFarmer ? primaryCrops : undefined,
      // Wholesaler parameters
      panNumber: !isFarmer ? panNumber : undefined,
      warehouseAddress: !isFarmer ? warehouseAddress : undefined,
    };

    onUpdateProfile(updatedProfile);
    setIsEditing(false);
    setEditSuccessMessage('Your profile specifications have been updated successfully!');
    setTimeout(() => setEditSuccessMessage(null), 4000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* 1. Header with Name & Quick Edit Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-neutral-850 tracking-tight">Your Verified Account Details</h2>
          <p className="text-xs text-neutral-500">View and update your verified trading parameters below</p>
        </div>

        {!isEditing && (
          <button 
            type="button"
            onClick={() => setIsEditing(true)}
            className="self-start sm:self-center px-4 py-2.5 bg-neutral-900 font-bold hover:bg-neutral-800 text-white text-xs rounded-xl flex items-center gap-1.5 transition select-none cursor-pointer"
          >
            <Edit3 size={13} />
            Edit Profile
          </button>
        )}
      </div>

      {editSuccessMessage && (
        <div className="bg-emerald-50 border border-emerald-255 text-emerald-800 p-3 rounded-2xl text-[11px] font-semibold flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600"></span>
          {editSuccessMessage}
        </div>
      )}

      {/* 2. Interactive Form or Display Area */}
      {isEditing ? (
        <form onSubmit={handleSaveChanges} className="bg-white border border-neutral-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
            <h3 className="font-extrabold text-xs text-neutral-800">Edit Verified Specs</h3>
            <button 
              type="button"
              onClick={() => setIsEditing(false)}
              className="text-neutral-400 hover:text-neutral-700 p-1"
            >
              <X size={15} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <span className="text-[9px] font-bold text-neutral-400 font-mono tracking-widest uppercase block border-b border-dashed border-neutral-100 pb-1">
                CONTACT INFORMATION
              </span>

              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-700 block">Full Name</label>
                <input 
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full text-xs font-semibold p-2.5 border border-neutral-200 bg-neutral-50 focus:bg-white rounded-xl focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-700 block">Mobile Phone Number</label>
                <input 
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full text-xs font-semibold p-2.5 border border-neutral-200 bg-neutral-50 focus:bg-white rounded-xl focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-700 block">Location District</label>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full text-xs font-semibold p-2.5 border border-neutral-200 bg-neutral-50 focus:bg-white rounded-xl focus:outline-hidden"
                >
                  <option value="Panchkhal, Kavre">Panchkhal, Kavre</option>
                  <option value="Benighat, Dhading">Benighat, Dhading</option>
                  <option value="Palung, Makwanpur">Palung, Makwanpur</option>
                  <option value="Marpha, Mustang">Marpha, Mustang</option>
                  <option value="Ilam, Eastern Nepal">Ilam, Eastern Nepal</option>
                  <option value="Kalimati, Kathmandu">Kalimati, Kathmandu</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <span className="text-[9px] font-bold text-neutral-400 font-mono tracking-widest uppercase block border-b border-dashed border-neutral-100 pb-1">
                BUSINESS DETAIL SPECS
              </span>

              {isFarmer ? (
                // FARMER SCHEMAS
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-neutral-700 block">Farm / Cooperative Name</label>
                    <input 
                      type="text"
                      required
                      value={farmName}
                      onChange={(e) => setFarmName(e.target.value)}
                      className="w-full text-xs font-semibold p-2.5 border border-neutral-200 bg-neutral-50 focus:bg-white rounded-xl focus:outline-hidden"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-neutral-700 block">Farm Size (Ropani)</label>
                    <input 
                      type="number"
                      min={1}
                      value={farmSize}
                      onChange={(e) => setFarmSize(Number(e.target.value))}
                      className="w-full text-xs font-semibold p-2.5 border border-neutral-200 bg-neutral-50 focus:bg-white rounded-xl focus:outline-hidden"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-705 block">Crops currently harvested</label>
                    <div className="flex flex-wrap gap-1.5">
                      {availableCrops.map((c) => {
                        const isSelected = primaryCrops.includes(c);
                        return (
                          <button
                            type="button"
                            key={c}
                            onClick={() => handleToggleCrop(c)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer ${
                              isSelected ? 'bg-emerald-600 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                            }`}
                          >
                            {isSelected && <Check size={10} />}
                            {c}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                // WHOLESALER SCHEMAS
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-neutral-700 block">Store or Company Name</label>
                    <input 
                      type="text"
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full text-xs font-semibold p-2.5 border border-neutral-200 bg-neutral-50 focus:bg-white rounded-xl focus:outline-hidden"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-neutral-700 block">9-Digit PAN Number</label>
                    <input 
                      type="text"
                      maxLength={9}
                      required
                      value={panNumber.replace(/[^0-9]/g, '')}
                      onChange={(e) => setPanNumber(e.target.value)}
                      className="w-full text-xs font-mono font-bold p-2.5 border border-neutral-200 bg-neutral-50 focus:bg-white rounded-xl focus:outline-hidden"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-neutral-700 block">Warehouse Storage Address</label>
                    <input 
                      type="text"
                      required
                      value={warehouseAddress}
                      onChange={(e) => setWarehouseAddress(e.target.value)}
                      className="w-full text-xs font-semibold p-2.5 border border-neutral-200 bg-neutral-50 focus:bg-white rounded-xl focus:outline-hidden"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 justify-end items-center pt-4 border-t border-neutral-200 mt-6">
            <button 
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 text-neutral-500 hover:text-neutral-800 text-xs font-bold cursor-pointer"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl transition cursor-pointer"
            >
              Save Changes
            </button>
          </div>
        </form>
      ) : (
        // STATIC VIEW PANEL Layout
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Main User reputation Card Column */}
          <div className="lg:col-span-4 bg-white border border-neutral-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <img 
                  src={currentUser.avatar} 
                  alt={currentUser.name} 
                  className="w-14 h-14 rounded-2xl object-cover ring-4 ring-emerald-500/10 shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <h3 className="font-extrabold text-md text-neutral-900 tracking-tight leading-tight">{currentUser.name}</h3>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-extrabold text-[9px] uppercase tracking-wider">
                    {isFarmer ? 'Farmer Desk' : 'Wholesaler Desk'}
                  </span>
                </div>
              </div>

              <div className="space-y-2 pt-2 text-xs">
                <div className="flex items-center gap-2 text-neutral-600 font-medium">
                  <MapPin size={13} className="text-neutral-400 shrink-0" />
                  <span>District: <strong className="text-neutral-800">{currentUser.district}</strong></span>
                </div>
                <div className="flex items-center gap-2 text-neutral-600 font-medium font-mono">
                  <Phone size={13} className="text-neutral-400 shrink-0" />
                  <span>Phone: <strong className="text-neutral-800">{currentUser.phone || 'N/A'}</strong></span>
                </div>
                {currentUser.companyName && (
                  <div className="flex items-center gap-2 text-neutral-600 font-medium">
                    <Building2 size={13} className="text-neutral-400 shrink-0" />
                    <span>Business: <strong className="text-neutral-800">{currentUser.companyName}</strong></span>
                  </div>
                )}
              </div>
            </div>

            {/* Platform statistics: Simple without ratings */}
            <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-150 space-y-1.5 text-center">
              <span className="block text-[8px] uppercase font-bold text-neutral-400 tracking-wider font-mono">
                COMPLETED DIGITAL TRANSACTIONS
              </span>
              <div className="text-2xl font-black text-neutral-800 font-mono">
                {userOrders.length + (currentUser.totalDeals || 0)} <span className="text-xs text-neutral-400 font-normal">deals</span>
              </div>
            </div>
            
            <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-100 text-[9px] text-emerald-800 block text-center font-bold">
              ✔ VERIFIED DIGITAL LEDGER Profile Active
            </div>
          </div>

          {/* Sourcing Specifications Column */}
          <div className="lg:col-span-8 bg-white border border-neutral-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between space-y-6">
            
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-extrabold text-neutral-900 tracking-tight">Onboarding Verified Specs</h3>
                <p className="text-[11px] text-neutral-400">These data points represent your simple, verified agricultural parameters.</p>
              </div>

              {isFarmer ? (
                // FARMER SIMPLIFIED SCHEMATIC DISPLAYS
                <div className="space-y-4">
                  <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-150 text-xs space-y-2">
                    <span className="text-[9px] font-bold text-neutral-400 font-mono tracking-wider uppercase block">FARM METADATA</span>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="block text-neutral-400 text-[10px]">Farm Name</span>
                        <span className="font-extrabold text-neutral-800 block">{currentUser.farmName || currentUser.companyName || 'Not Set'}</span>
                      </div>
                      <div>
                        <span className="block text-neutral-400 text-[10px]">Acreage Area</span>
                        <span className="font-extrabold text-neutral-800 block">{currentUser.farmSize || 5} Ropani</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-150 text-xs space-y-2">
                    <span className="text-[9px] font-bold text-neutral-400 font-mono tracking-wider uppercase block">PRIMARY CROPS HARVESTED</span>
                    {currentUser.primaryCrops && currentUser.primaryCrops.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {currentUser.primaryCrops.map(crop => (
                          <span key={crop} className="px-2.5 py-1 bg-white border border-neutral-200 text-neutral-700 rounded-lg text-[10px] font-bold">
                            📦 {crop}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[11px] text-neutral-400 block italic">No specific crops logged yet.</span>
                    )}
                  </div>
                </div>
              ) : (
                // WHOLESALER SIMPLIFIED SCHEMATIC DISPLAYS
                <div className="space-y-4">
                  <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-150 text-xs space-y-2">
                    <span className="text-[9px] font-bold text-neutral-400 font-mono tracking-wider uppercase block">COMMERCIAL CREDENTIALS</span>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="block text-neutral-400 text-[10px]">Registered Business</span>
                        <span className="font-extrabold text-neutral-800 block">{currentUser.companyName || 'Not Registered'}</span>
                      </div>
                      <div>
                        <span className="block text-neutral-400 text-[10px]">PAN / VAT Number</span>
                        <span className="font-bold text-neutral-800 block font-mono bg-neutral-200/50 px-1.5 py-0.5 rounded text-center w-max mt-0.5">
                          {currentUser.panNumber || 'Pending Setup'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-150 text-xs space-y-1.5 font-sans">
                    <span className="text-[9px] font-bold text-neutral-400 font-mono tracking-wider uppercase block">PRIMARY STORAGE ADDRESS</span>
                    <span className="font-semibold text-neutral-700 block text-[11px]">
                      🕋 Location: <strong className="text-neutral-800">{currentUser.warehouseAddress || 'Nepal Wholesale Depot'}</strong>
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Transaction Ledger Records list */}
            <div className="pt-4 border-t border-neutral-150 space-y-2.5">
              <span className="text-[9px] font-bold text-neutral-400 font-mono tracking-wider uppercase block flex items-center gap-1">
                <History size={11} />
                Transaction History Ledger
              </span>

              {userOrders.length > 0 ? (
                <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                  {userOrders.map((o) => (
                    <div key={o.orderId} className="flex justify-between items-center p-2.5 bg-neutral-50 border border-neutral-100 rounded-xl text-[11px]">
                      <div className="space-y-0.5">
                        <span className="font-extrabold text-neutral-800 block">
                          {o.cropName} ({o.quantity} Cr)
                        </span>
                        <span className="text-[9px] text-neutral-400 block">
                          Id: {o.orderId} · Partner: {isFarmer ? o.wholesalerName : o.farmerName}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-black text-neutral-800 block">Rs. {o.totalPrice.toLocaleString()}</span>
                        <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded-full ${
                          o.status === 'ARRIVED' ? 'bg-green-150 text-green-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {o.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-neutral-50 border border-neutral-155 rounded-xl text-center text-[11px] text-neutral-400">
                  No active orders recorded on this ledger yet.
                </div>
              )}
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
