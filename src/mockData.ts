/**
 * mockData.ts
 * Initial seeded database rates, listings, users, and conversations.
 */

import { UserProfile, VegetableListing, BargainRoom, Order, KalimatiRate } from './types';

// Standard Users
export const MOCK_USERS: UserProfile[] = [
  {
    id: 'farmer_pema',
    name: 'Pema Shrestha',
    role: 'FARMER',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    district: 'Panchkhal, Kavre',
    phone: '+977-9851012345',
    companyName: 'Panchkhal organic growers co-op',
    rating: 4.8,
    totalDeals: 42,
  },
  {
    id: 'farmer_manoj',
    name: 'Manoj Dahal',
    role: 'FARMER',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    district: 'Benighat, Dhading',
    phone: '+977-9841234567',
    companyName: 'Dhading Vegetable Hub',
    rating: 4.6,
    totalDeals: 29,
  },
  {
    id: 'farmer_sonam',
    name: 'Sonam Gurung',
    role: 'FARMER',
    avatar: 'https://images.unsplash.com/photo-1489980508314-941910ded1f4?w=150&auto=format&fit=crop&q=80',
    district: 'Marpha, Mustang',
    phone: '+977-9856098765',
    companyName: 'Marpha High-Altitude Orchards',
    rating: 4.9,
    totalDeals: 34,
  },
  {
    id: 'farmer_bikas',
    name: 'Bikas Adhikari',
    role: 'FARMER',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
    district: 'Ilam, Eastern Nepal',
    phone: '+977-9801230987',
    companyName: 'Ilam Organics tea & Spices',
    rating: 4.7,
    totalDeals: 51,
  },
  {
    id: 'wholesaler_ramesh',
    name: 'Ramesh Traders',
    role: 'WHOLESALER',
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80',
    district: 'Kalimati, Kathmandu',
    phone: '+977-9803123456',
    companyName: 'Ramesh Fruits & Veg Wholesalers Ltd.',
    rating: 4.9,
    totalDeals: 118,
  },
  {
    id: 'admin_sys',
    name: 'BizzLedger Desk',
    role: 'ADMIN',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    district: 'Teku, Kathmandu',
    phone: '+977-1-4211111',
    rating: 5.0,
    totalDeals: 0,
  }
];

// Today's official Kalimati Market wholesale rates (estimates)
export const KALIMATI_RATES: KalimatiRate[] = [
  { cropName: 'Tomato (Local)', minPrice: 75, maxPrice: 90, avgPrice: 82, unit: 'KG', change: 'up' },
  { cropName: 'Potato (Red)', minPrice: 50, maxPrice: 58, avgPrice: 54, unit: 'KG', change: 'down' },
  { cropName: 'Cabbage', minPrice: 35, maxPrice: 45, avgPrice: 40, unit: 'KG', change: 'stable' },
  { cropName: 'Cauliflower (Local)', minPrice: 95, maxPrice: 115, avgPrice: 105, unit: 'KG', change: 'up' },
  { cropName: 'Okra (Bhindi)', minPrice: 80, maxPrice: 90, avgPrice: 85, unit: 'KG', change: 'down' },
  { cropName: 'Bitter Gourd (Tite Karela)', minPrice: 70, maxPrice: 80, avgPrice: 75, unit: 'KG', change: 'stable' },
  { cropName: 'Onion (Dry)', minPrice: 85, maxPrice: 95, avgPrice: 90, unit: 'KG', change: 'up' },
  { cropName: 'Carrot (Local)', minPrice: 65, maxPrice: 75, avgPrice: 70, unit: 'KG', change: 'stable' },
  { cropName: 'Radish (White)', minPrice: 30, maxPrice: 38, avgPrice: 34, unit: 'KG', change: 'down' },
];

export const INITIAL_LISTINGS: VegetableListing[] = [];

export const INITIAL_ROOMS: BargainRoom[] = [];

export const INITIAL_ORDERS: Order[] = [];
