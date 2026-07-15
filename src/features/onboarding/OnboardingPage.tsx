import React, { useState } from 'react';
import { UserProfile } from '../../types';
import { Leaf, Check, ShieldCheck } from 'lucide-react';

interface OnboardingPageProps {
  currentUser: UserProfile;
  onSaveOnboarding: (updatedProfile: UserProfile) => void;
  onLogout: () => void;
}

export default function OnboardingPage({ currentUser, onSaveOnboarding, onLogout }: OnboardingPageProps) {
  const isFarmer = currentUser.role === 'FARMER';
  const [error, setError] = useState<string | null>(null);

  // Common contact info
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

  const availableCrops = ['Tomatoes', 'Cabbages', 'Greens', 'Potatoes', 'Onions', 'Cauliflowers'];

  const handleToggleCrop = (crop: string) => {
    if (primaryCrops.includes(crop)) {
      setPrimaryCrops(primaryCrops.filter(item => item !== crop));
    } else {
      setPrimaryCrops([...primaryCrops, crop]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!phone.trim()) {
      setError('Please enter your telephone number.');
      return;
    }

    if (isFarmer) {
      if (!farmName.trim()) {
        setError('Please enter your farm or cooperative name.');
        return;
      }
      if (primaryCrops.length === 0) {
        setError('Please select at least one primary crop.');
        return;
      }
    } else {
      if (!companyName.trim()) {
        setError('Please enter your business or shop name.');
        return;
      }
      if (!panNumber.trim() || panNumber.trim().length < 9) {
        setError('Please enter a valid 9-digit PAN/VAT number.');
        return;
      }
      if (!warehouseAddress.trim()) {
        setError('Please enter your business location/warehouse address.');
        return;
      }
    }

    // Build stripped, simplified profile
    const updatedProfile: UserProfile = {
      ...currentUser,
      name: fullName,
      phone,
      district: region,
      companyName: isFarmer ? farmName : companyName,
      isOnboarded: true,
      // Farmer params
      farmName: isFarmer ? farmName : undefined,
      farmSize: isFarmer ? farmSize : undefined,
      primaryCrops: isFarmer ? primaryCrops : undefined,
      // Wholesaler params
      panNumber: !isFarmer ? panNumber : undefined,
      warehouseAddress: !isFarmer ? warehouseAddress : undefined,
    };

    onSaveOnboarding(updatedProfile);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-neutral-800 flex flex-col justify-center py-8 px-4 sm:px-6">
      <div className="max-w-md mx-auto w-full bg-white border border-neutral-200 rounded-3xl shadow-sm overflow-hidden flex flex-col my-auto">
        
        {/* Onboarding Header */}
        <div className="bg-emerald-600 text-white p-6 relative">
          <div className="flex items-center gap-2 mb-2">
            <Leaf size={16} className="text-emerald-100" />
            <span className="font-bold text-xs font-sans tracking-wide uppercase">Profile Setup</span>
          </div>
          <h2 className="text-xl font-black tracking-tight">Complete Your Profile</h2>
          <p className="text-emerald-100/80 text-[11px] mt-1">
            Fill in some basic details to join the direct wholesale marketplace.
          </p>
        </div>

        {/* Content Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-rose-50 border border-rose-250 text-rose-800 p-3 rounded-2xl text-[11px] font-semibold flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-600 shrink-0"></span>
              {error}
            </div>
          )}

          <div className="space-y-3">
            <span className="text-[10px] font-bold text-neutral-400 font-mono tracking-widest uppercase block border-b border-dashed border-neutral-100 pb-1">
              Contact Specs
            </span>

            <div className="space-y-1">
              <label className="text-xs font-bold text-neutral-700 block">Full Name</label>
              <input 
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Ramesh Devkota"
                className="w-full text-xs font-semibold p-2.5 border border-neutral-200 bg-neutral-50 focus:bg-white rounded-xl focus:outline-hidden focus:ring-1 focus:ring-emerald-500 transition"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-700 block">Phone Number</label>
                <input 
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +977-98510XXXXX"
                  className="w-full text-xs font-semibold p-2.5 border border-neutral-200 bg-neutral-50 focus:bg-white rounded-xl focus:outline-hidden focus:ring-1 focus:ring-emerald-500 transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-700 block">Primary District</label>
                <select 
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full text-xs font-semibold p-2.5 border border-neutral-200 bg-neutral-50 focus:bg-white rounded-xl focus:outline-hidden focus:ring-1 focus:ring-emerald-500 transition"
                >
                  <option value="Panchkhal, Kavre">Kavre</option>
                  <option value="Benighat, Dhading">Dhading</option>
                  <option value="Palung, Makwanpur">Makwanpur</option>
                  <option value="Marpha, Mustang">Mustang</option>
                  <option value="Ilam, Eastern Nepal">Ilam</option>
                  <option value="Kalimati, Kathmandu">Kathmandu</option>
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <span className="text-[10px] font-bold text-neutral-400 font-mono tracking-widest uppercase block border-b border-dashed border-neutral-100 pb-1">
              {isFarmer ? 'Farm Details' : 'Business Registry'}
            </span>

            {isFarmer ? (
              // FARMER SIMPLIFIED FIELDS
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-700 block">Farm Name</label>
                  <input 
                    type="text"
                    value={farmName}
                    onChange={(e) => setFarmName(e.target.value)}
                    placeholder="e.g. Panchkhal Fresh Farm"
                    className="w-full text-xs font-semibold p-2.5 border border-neutral-200 bg-neutral-50 focus:bg-white rounded-xl focus:outline-hidden focus:ring-1 focus:ring-emerald-500 transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-700 block">Farm Size (Ropani)</label>
                  <input 
                    type="number"
                    min={1}
                    value={farmSize}
                    onChange={(e) => setFarmSize(Number(e.target.value))}
                    className="w-full text-xs font-semibold p-2.5 border border-neutral-200 bg-neutral-50 focus:bg-white rounded-xl focus:outline-hidden focus:ring-1 focus:ring-emerald-500 transition"
                  />
                </div>

                {/* Micro multiselect crops */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-750 block">Primary Crops Harvested</label>
                  <div className="flex flex-wrap gap-1.5">
                    {availableCrops.map(c => {
                      const isSelected = primaryCrops.includes(c);
                      return (
                        <button
                          type="button"
                          key={c}
                          onClick={() => handleToggleCrop(c)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer ${
                            isSelected 
                              ? 'bg-emerald-600 text-white' 
                              : 'bg-neutral-150 text-neutral-600 hover:bg-neutral-200'
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
              // WHOLESALER SIMPLIFIED FIELDS
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-700 block">Store or Company Name</label>
                  <input 
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Everest Fresh Sourcing"
                    className="w-full text-xs font-semibold p-2.5 border border-neutral-200 bg-neutral-50 focus:bg-white rounded-xl focus:outline-hidden focus:ring-1 focus:ring-emerald-500 transition"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-neutral-700 block">9-Digit PAN Number</label>
                    <input 
                      type="text"
                      maxLength={9}
                      value={panNumber.replace(/[^0-9]/g, '')}
                      onChange={(e) => setPanNumber(e.target.value)}
                      placeholder="e.g. 603248392"
                      className="w-full text-xs font-mono font-bold p-2.5 border border-neutral-200 bg-neutral-50 focus:bg-white rounded-xl focus:outline-hidden"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-neutral-700 block">Warehouse Location</label>
                    <input 
                      type="text"
                      value={warehouseAddress}
                      onChange={(e) => setWarehouseAddress(e.target.value)}
                      placeholder="e.g. Kalimati, Kathmandu"
                      className="w-full text-xs font-semibold p-2.5 border border-neutral-200 bg-neutral-50 focus:bg-white rounded-xl focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-neutral-100 mt-4">
            <button 
              type="button"
              onClick={onLogout}
              className="text-neutral-500 hover:text-neutral-900 text-xs font-bold p-2"
            >
              Exit
            </button>
            <button 
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-2.5 px-5 rounded-xl text-xs flex items-center gap-1"
            >
              <Check size={14} />
              Save Details
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
