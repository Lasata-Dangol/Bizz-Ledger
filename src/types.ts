/**
 * types.ts
 * Core typings for BizzLedger vegetable marketplace.
 */

export type UserRole = 'FARMER' | 'WHOLESALER' | 'ADMIN';

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  avatar: string;
  district: string;
  phone: string;
  companyName?: string;
  rating: number;
  totalDeals: number;
  // Onboarding metadata
  isOnboarded?: boolean;
  // Farmer fields
  farmName?: string;
  farmSize?: number;
  landUnit?: 'Acres' | 'Ropani' | 'Bigha';
  primaryCrops?: string[];
  experienceYears?: number;
  supplyCapacityCrates?: number;
  hasOwnTransport?: boolean;
  farmBio?: string;
  // Wholesaler fields
  panNumber?: string;
  wholesalerType?: string;
  warehouseAddress?: string;
  purchaseVolumeWeekly?: number;
  preferredDistricts?: string[];
  paymentPreference?: string[];
}

export interface VegetableListing {
  id: string;
  cropName: string;
  category: 'Tomatoes' | 'Cabbages' | 'Greens' | 'Potatoes' | 'Squash' | 'Other';
  district: string; // e.g. Panchkhal, Dhading, Kakani, Palung
  farmerId: string;
  farmerName: string;
  farmerRating: number;
  quantityAvailableCrates: number; // crates (~20 kg each)
  pricePerCrate: number; // price Rs. per crate
  harvestDate: string;
  readyToShip: boolean;
  notes?: string;
  imageUrl?: string;
}

export interface Order {
  orderId: string;
  listingId: string;
  cropName: string;
  farmerName: string;
  wholesalerName: string;
  finalPricePerCrate: number;
  quantity: number;
  totalPrice: number;
  status: 'PROCESSING' | 'IN_TRANSIT' | 'ARRIVED';
  vehicleNumber?: string;
  driverPhone?: string;
  createdAt: string;
  estimatedArrival: string;
}

export interface KalimatiRate {
  cropName: string;
  minPrice: number; // per kg
  maxPrice: number; // per kg
  avgPrice: number; // per kg
  unit: string; // e.g. "KG", "Crate"
  change?: 'up' | 'down' | 'stable';
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  orderId?: string;
  isRead: boolean;
  createdAt: string;
}
