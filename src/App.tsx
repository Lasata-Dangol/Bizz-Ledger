/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { UserProfile, VegetableListing, BargainRoom, Order, UserRole, BargainMessage, KalimatiRate, AppNotification } from './types';
import { MOCK_USERS, KALIMATI_RATES } from './mockData';
import { db, isSupabaseConfigured, supabase } from './lib/supabase';
import KalimatiTicker from './components/KalimatiTicker';
import DashboardCharts from './components/DashboardCharts';
import MarketplacePage from './features/marketplace/MarketplacePage';
import BargainRoomPage from './features/bargain/BargainRoomPage';
import InventoryPage from './features/inventory/InventoryPage';
import OrdersPage from './features/orders/OrdersPage';
import LandingPage from './features/landing/LandingPage';
import CartPage from './features/cart/CartPage';
import OnboardingPage from './features/onboarding/OnboardingPage';
import ProfilePage from './features/profile/ProfilePage';
import {
  Building2,
  LayoutDashboard,
  MessageSquare,
  Boxes,
  FileCheck,
  User,
  Bell,
  Search,
  ChevronDown,
  Leaf,
  Landmark,
  TrendingUp,
  UserSquare2,
  Users2,
  Lock,
  Sparkles,
  ArrowRight,
  Plus,
  ShoppingCart,
  LogOut,
  Menu,
  X,
  ArrowLeft
} from 'lucide-react';
import { motion } from 'motion/react';

export default function App() {
  // --- Portal & Authentication State ---
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    const saved = localStorage.getItem('bl_logged_in');
    return saved === 'true';
  });

  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('bl_current_user');
    return saved ? JSON.parse(saved) : MOCK_USERS[2]; // Default
  });

  const [listings, setListings] = useState<VegetableListing[]>([]);
  const [rooms, setRooms] = useState<BargainRoom[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [kalimatiRates, setKalimatiRates] = useState<KalimatiRate[]>([]);

  // Basket Sourcing list for wholeseller
  const [cart, setCart] = useState<{ listing: VegetableListing, quantity: number }[]>(() => {
    const saved = localStorage.getItem('bl_cart');
    return saved ? JSON.parse(saved) : [];
  });

  const [activeTab, setActiveTab] = useState<'dashboard' | 'marketplace' | 'bargain' | 'inventory' | 'orders' | 'cart' | 'profile'>(() => {
    const saved = localStorage.getItem('bl_active_tab');
    return (saved as any) || 'dashboard';
  });

  const [viewedProfile, setViewedProfile] = useState<UserProfile | null>(null);

  const [activeRoomId, setActiveRoomId] = useState<string | null>(() => {
    const saved = localStorage.getItem('bl_active_room_id');
    return saved || null;
  });

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const [showRoleSelector, setShowRoleSelector] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotificationCount, setShowNotificationCount] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Load datasets dynamically from Supabase direct database adapter
  useEffect(() => {
    const loadData = async () => {
      try {
        const fetchedListings = await db.getListings();
        setListings(fetchedListings);

        const fetchedRates = await db.getKalimatiRates();
        setKalimatiRates(fetchedRates);
      } catch (err) {
        console.error('Failed to load public data from DB:', err);
      }

      if (isLoggedIn && currentUser) {
        try {
          // Dynamic profile sync
          const profile = await db.getProfile(currentUser.id);
          if (profile) {
            setCurrentUser(profile);
          }

          // Active bargain Rooms sync
          const fetchedRooms = await db.getBargainRooms(currentUser.id);
          setRooms(fetchedRooms);

          // Active orders sync
          const fetchedOrders = await db.getOrders(currentUser.name, currentUser.role);
          setOrders(fetchedOrders);

          // Fetch notifications
          const fetchedNotifs = await db.getNotifications(currentUser.id);
          setNotifications(fetchedNotifs);
        } catch (err) {
          console.error('Failed to load personalized data from DB:', err);
        }
      }
    };

    loadData();

    // Setup Supabase Auth Listener for Google OAuth callbacks
    if (isSupabaseConfigured() && supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          try {
            // Retrieve pending signup details from LandingPage if any
            const pendingSignupStr = localStorage.getItem('bl_pending_signup');
            const pendingSignup = pendingSignupStr ? JSON.parse(pendingSignupStr) : null;

            let profile = await db.getProfile(session.user.id);

            if (!profile) {
              profile = {
                id: session.user.id,
                name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'New User',
                role: pendingSignup?.role || 'FARMER',
                avatar: session.user.user_metadata?.avatar_url || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
                district: pendingSignup?.district || 'Kathmandu',
                phone: pendingSignup?.phone || '',
                rating: 5.0,
                totalDeals: 0,
                isOnboarded: false,
              };
              await db.saveProfile(profile);
              localStorage.removeItem('bl_pending_signup');
            }

            setCurrentUser(profile);
            setIsLoggedIn(true);

            // Navigate based on onboarding/role
            if (profile.isOnboarded) {
              if (profile.role === 'FARMER') {
                setActiveTab('inventory');
              } else {
                setActiveTab('dashboard');
              }
            } else {
              setActiveTab('profile');
            }

          } catch (err) {
            console.error('Error handling auth state change:', err);
          }
        }
      });
      return () => {
        subscription.unsubscribe();
      };
    }
  }, [isLoggedIn, currentUser?.id]);

  // Sync session states
  useEffect(() => {
    localStorage.setItem('bl_logged_in', String(isLoggedIn));
  }, [isLoggedIn]);

  useEffect(() => {
    localStorage.setItem('bl_current_user', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('bl_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('bl_active_tab', activeTab);
    setIsMobileMenuOpen(false);
  }, [activeTab]);

  useEffect(() => {
    if (activeRoomId) {
      localStorage.setItem('bl_active_room_id', activeRoomId);
    } else {
      localStorage.removeItem('bl_active_room_id');
    }
  }, [activeRoomId]);

  // --- Handlers & Mutators ---
  const handleAddToCart = (listing: VegetableListing) => {
    setCart((prev) => {
      const existing = prev.find(item => item.listing.id === listing.id);
      if (existing) {
        const nextQty = Math.min(listing.quantityAvailableCrates, existing.quantity + 20);
        return prev.map(item => item.listing.id === listing.id ? { ...item, quantity: nextQty } : item);
      }
      return [...prev, { listing, quantity: Math.min(20, listing.quantityAvailableCrates) }];
    });
  };

  const handleUpdateCartItemQuantity = (listingId: string, qty: number) => {
    setCart((prev) => prev.map(item => item.listing.id === listingId ? { ...item, quantity: qty } : item));
  };

  const handleRemoveCartItem = (listingId: string) => {
    setCart((prev) => prev.filter(item => item.listing.id !== listingId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const handleConfirmCheckout = async (checkoutItems: { listing: VegetableListing, quantity: number }[], transportMethod: string, paymentMethod: string) => {
    // 1. Reduce listings Available Storage in state
    const nextListings = listings.map(lst => {
      const matchingCart = checkoutItems.find(item => item.listing.id === lst.id);
      if (matchingCart) {
        const nextCrates = Math.max(0, lst.quantityAvailableCrates - matchingCart.quantity);
        return {
          ...lst,
          quantityAvailableCrates: nextCrates,
          readyToShip: nextCrates > 0
        };
      }
      return lst;
    });

    for (const item of checkoutItems) {
      const dbListing = nextListings.find(l => l.id === item.listing.id);
      if (dbListing) {
        await db.updateListing(dbListing);
      }
    }
    setListings(nextListings);

    // 2. Generate and append real logical order records
    const newCreatedOrders: Order[] = checkoutItems.map((item, idx) => {
      return {
        orderId: `order_2026_${Math.floor(1000 + Math.random() * 9000 + idx)}`,
        roomId: `direct_checkout_${Date.now()}_${idx}`,
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

    for (const ord of newCreatedOrders) {
      await db.createOrder(ord);

      const matchedItem = checkoutItems.find(item => item.listing.id === ord.listingId);
      if (matchedItem) {
        const notif: AppNotification = {
          id: `notif_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`,
          userId: matchedItem.listing.farmerId,
          title: 'New Order Received',
          message: `${ord.wholesalerName} placed a new order for ${ord.quantity} crates of ${ord.cropName} at Rs. ${ord.finalPricePerCrate} per crate. Status: ${ord.status}.`,
          orderId: ord.orderId,
          isRead: false,
          createdAt: new Date().toISOString()
        };
        await db.createNotification(notif);
      }
    }

    setOrders((prev) => [...newCreatedOrders, ...prev]);

    if (currentUser) {
      const fetchedNotifs = await db.getNotifications(currentUser.id);
      setNotifications(fetchedNotifs);
    }
  };

  const handleAddNewListing = async (newListing: Omit<VegetableListing, 'id' | 'farmerId' | 'farmerName' | 'farmerRating'>) => {
    if (!currentUser) return;
    const fullListing: VegetableListing = {
      ...newListing,
      id: `list_${Date.now()}`,
      farmerId: currentUser.id,
      farmerName: currentUser.name,
      farmerRating: currentUser.rating || 4.5,
    };
    const saved = await db.createListing(fullListing);
    setListings([...listings, saved]);
    alert("New crop listed in marketplace!");
  };

  const handleEditListing = async (id: string, updated: Partial<VegetableListing>) => {
    const existing = listings.find(l => l.id === id);
    if (!existing) return;
    const fullListing = { ...existing, ...updated };
    const saved = await db.updateListing(fullListing);
    setListings(listings.map(l => l.id === id ? saved : l));
    alert("Crop details updated successfully!");
  };

  const handleDeleteListing = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this vegetable listing?")) {
      await db.deleteListing(id);
      setListings(listings.filter(l => l.id !== id));
    }
  };

  const handleStartNegotiation = async (listing: VegetableListing, initialOffer: number, quantity: number) => {
    // Check if room with this listing and this wholesaler already exists
    const existing = rooms.find(r => r.listingId === listing.id && r.wholesalerId === currentUser.id);
    if (existing) {
      setActiveRoomId(existing.roomId);
      setActiveTab('bargain');
      return;
    }

    // Create a new room
    const newRoomId = `room_${Date.now()}`;
    const newRoom: BargainRoom = {
      roomId: newRoomId,
      listingId: listing.id,
      cropName: listing.cropName,
      district: listing.district,
      farmerId: listing.farmerId,
      farmerName: listing.farmerName,
      wholesalerId: currentUser.id,
      wholesalerName: currentUser.name,
      status: 'NEGOTIATING',
      messages: [
        {
          messageId: `msg_${Date.now()}`,
          senderId: currentUser.id,
          senderName: currentUser.name,
          senderRole: currentUser.role,
          type: 'OFFER_SUBMITTED',
          pricePerCrate: initialOffer,
          quantityRequested: quantity,
          text: `Namaskar, we proposed an initial bargaining price of Rs. ${initialOffer} for ${quantity} crates. Let us negotiate terms!`,
          timestamp: new Date().toISOString(),
        }
      ]
    };

    const createdRoom = await db.createBargainRoom(newRoom);
    setRooms((prev) => [createdRoom, ...prev]);
    setActiveRoomId(newRoomId);
    setActiveTab('bargain');
  };

  const handleSendMessage = async (roomId: string, messageFields: Omit<BargainMessage, 'messageId' | 'timestamp'>) => {
    const msgSeed: BargainMessage = {
      ...messageFields,
      messageId: `msg_${Date.now()}`,
      timestamp: new Date().toISOString()
    };

    await db.addBargainMessage(roomId, msgSeed);

    setRooms((prevRooms) =>
      prevRooms.map((r) => {
        if (r.roomId === roomId) {
          return {
            ...r,
            messages: [...r.messages, msgSeed]
          };
        }
        return r;
      })
    );
  };

  const handleAcceptContract = async (roomId: string, finalPrice: number, quantity: number) => {
    await db.updateRoomStatus(roomId, 'COMPLETED');

    const statusMsg: BargainMessage = {
      messageId: `msg_contract_${Date.now()}`,
      senderId: 'admin_sys',
      senderName: 'BizzLedger Desk',
      senderRole: 'ADMIN',
      type: 'ACCEPTED_CONTRACT',
      pricePerCrate: finalPrice,
      quantityRequested: quantity,
      text: `🔒 Transaction Locked Immutable: Agreed settle rate is Rs. ${finalPrice} for ${quantity} crates! Dispatching vehicle manifest.`,
      timestamp: new Date().toISOString()
    };

    await db.addBargainMessage(roomId, statusMsg);

    setRooms((prevRooms) =>
      prevRooms.map((r) => {
        if (r.roomId === roomId) {
          return {
            ...r,
            status: 'COMPLETED',
            messages: [...r.messages, statusMsg]
          };
        }
        return r;
      })
    );

    // Auto spawn a new order
    const matchedRoom = rooms.find(r => r.roomId === roomId);
    if (matchedRoom) {
      const newOrder: Order = {
        orderId: `order_2026_${Math.floor(1000 + Math.random() * 9000)}`,
        roomId,
        listingId: matchedRoom.listingId,
        cropName: matchedRoom.cropName,
        farmerName: matchedRoom.farmerName,
        wholesalerName: matchedRoom.wholesalerName,
        finalPricePerCrate: finalPrice,
        quantity,
        totalPrice: finalPrice * quantity,
        status: 'PROCESSING',
        vehicleNumber: `BA 3 KHA ${Math.floor(1000 + Math.random() * 9000)}`,
        driverPhone: '+977-98' + Math.floor(10000000 + Math.random() * 90000000).toString(),
        createdAt: new Date().toISOString(),
        estimatedArrival: new Date(Date.now() + 8 * 3600 * 1000).toISOString(), // 8 hours later
      };

      await db.createOrder(newOrder);
      setOrders((prev) => [newOrder, ...prev]);

      const notif: AppNotification = {
        id: `notif_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`,
        userId: matchedRoom.farmerId,
        title: 'New Order Received',
        message: `${newOrder.wholesalerName} placed a new order for ${newOrder.quantity} crates of ${newOrder.cropName} at Rs. ${newOrder.finalPricePerCrate} per crate. Status: ${newOrder.status}.`,
        orderId: newOrder.orderId,
        isRead: false,
        createdAt: new Date().toISOString()
      };
      await db.createNotification(notif);

      if (currentUser) {
        const fetchedNotifs = await db.getNotifications(currentUser.id);
        setNotifications(fetchedNotifs);
      }
    }
  };

  const handleWithdrawBargain = async (roomId: string) => {
    await db.updateRoomStatus(roomId, 'WITHDRAWN');

    const statusMsg: BargainMessage = {
      messageId: `msg_withdraw_${Date.now()}`,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      type: 'WITHDRAWN',
      text: 'Negotiation was withdrawn by sender.',
      timestamp: new Date().toISOString()
    };

    await db.addBargainMessage(roomId, statusMsg);

    setRooms((prevRooms) =>
      prevRooms.map((r) => {
        if (r.roomId === roomId) {
          return {
            ...r,
            status: 'WITHDRAWN',
            messages: [...r.messages, statusMsg]
          };
        }
        return r;
      })
    );
  };

  const handleUpdateOrderStatus = async (orderId: string, status: 'PROCESSING' | 'IN_TRANSIT' | 'ARRIVED') => {
    const updated = await db.updateOrderStatus(orderId, status);
    if (updated) {
      setOrders((prev) =>
        prev.map((ord) => (ord.orderId === orderId ? updated : ord))
      );

      if (status === 'IN_TRANSIT') {
        try {
          const wholesalerProfile = await db.getProfileByName(updated.wholesalerName);
          if (wholesalerProfile) {
            const notif: AppNotification = {
              id: `notif_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`,
              userId: wholesalerProfile.id,
              title: 'Order Accepted',
              message: `Your order ${orderId} for ${updated.quantity} crates of ${updated.cropName} has been accepted by farmer ${updated.farmerName}.`,
              orderId: orderId,
              isRead: false,
              createdAt: new Date().toISOString()
            };
            await db.createNotification(notif);
          }
        } catch (e) {
          console.error('Failed to notify wholesaler on order acceptance', e);
        }
      }

      if (currentUser) {
        const fetchedNotifs = await db.getNotifications(currentUser.id);
        setNotifications(fetchedNotifs);
      }
    }
  };

  const resetLocalStorageSeed = () => {
    localStorage.removeItem('bl_current_user');
    localStorage.removeItem('bl_active_tab');
    localStorage.removeItem('bl_active_room_id');
    localStorage.removeItem('bl_logged_in');
    localStorage.removeItem('bl_cart');
    window.location.reload();
  };

  // --- Dynamic Dashboard Views ---
  const renderDashboard = () => {
    const inboundRooms = rooms.filter(r => r.farmerId === currentUser.id && r.status === 'NEGOTIATING');
    const outboundRooms = rooms.filter(r => r.wholesalerId === currentUser.id && r.status === 'NEGOTIATING');

    const farmerCompletedOrders = orders.filter(o => o.status === 'ARRIVED' || o.status === 'PROCESSING' || o.status === 'IN_TRANSIT');
    const farmerTotalSales = farmerCompletedOrders.reduce((sum, ord) => sum + ord.totalPrice, 0);
    const farmerTotalPayments = farmerCompletedOrders.length;
    const wholesalerTotalSpent = orders.reduce((sum, ord) => sum + ord.totalPrice, 0);

    if (currentUser.role === 'FARMER') {
      return (
        <div className="space-y-6">
          {/* Top Banner section */}
          <div className="bg-white border border-neutral-100 rounded-3xl p-6 sm:p-8 shadow-[0_4px_30px_rgba(0,0,0,0.01)] flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-emerald-600 font-mono tracking-widest uppercase block">
                Farmer Dashboard
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-neutral-800 tracking-tight">
                Namaskar, {currentUser.name}
              </h2>
              <p className="text-xs text-neutral-500 max-w-lg">
                Your vegetable list is seen by 120+ shop buyers in Kathmandu. Easy to reply to their price offers instantly.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => { setActiveTab('inventory') }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-5 rounded-2xl flex items-center gap-2 text-xs cursor-pointer shadow-md transition duration-200"
              >
                <Plus size={16} />
                Add New Vegetables
              </button>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="bg-sky-50/50 border border-sky-100/85 p-6 rounded-3xl space-y-2">
            <span className="text-[11px] font-bold text-sky-800 uppercase tracking-wider font-mono">
              Total Sales This Month
            </span>
            <div className="text-3xl font-black text-sky-950">Rs. {farmerTotalSales.toLocaleString()}</div>
            <p className="text-xs text-sky-700">From {farmerTotalPayments} successful cash payments this month</p>
          </div>

          {/* Grid: Vegetable trends */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-12">
              <DashboardCharts orders={orders} listings={listings} />
            </div>
          </div>
        </div>
      );
    }

    // --- Wholesaler View ---
    return (
      <div className="space-y-6">
        {/* Top welcome banner */}
        <div className="bg-white border border-neutral-100 rounded-3xl p-6 sm:p-8 shadow-[0_4px_30px_rgba(0,0,0,0.01)] flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-emerald-600 font-mono tracking-widest uppercase block">
              Buyer Sourcing Center
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-neutral-800 tracking-tight">
              Namaskar, {currentUser.name}
            </h2>
            <p className="text-xs text-neutral-500 max-w-lg">
              Buy fresh crops directly from village farmers. Easy to chat and bargain prices with them.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => { setActiveTab('marketplace') }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-5 rounded-2xl flex items-center gap-2 text-xs cursor-pointer shadow-md transition duration-200"
            >
              Discover Crops
            </button>
          </div>
        </div>

        {/* Top metrics */}
        <div className="bg-sky-50/50 border border-sky-100/85 p-6 rounded-3xl space-y-2">
          <span className="text-[11px] font-bold text-sky-800 uppercase tracking-wider font-mono">
            Total Spent This Month
          </span>
          <div className="text-3xl font-black text-sky-950">Rs. {wholesalerTotalSpent.toLocaleString()}</div>
          <p className="text-xs text-sky-700">From successful crop orders</p>
        </div>

        {/* Columns: Charts and Regional hubs */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8">
            <DashboardCharts orders={orders} listings={listings} />
          </div>

          <div className="lg:col-span-4 bg-white border border-neutral-100 rounded-3xl p-5 shadow-xs space-y-4">
            <div>
              <h3 className="font-bold text-neutral-800 text-sm">Active Farming Districts</h3>
              <p className="text-[10px] text-neutral-400">Where our fresh crops come from</p>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              <div className="p-3 bg-neutral-50/50 border border-neutral-150/50 rounded-2xl flex justify-between items-center text-xs">
                <div>
                  <span className="font-bold text-neutral-800 leading-tight block">Panchkhal, Kavre</span>
                  <span className="text-[10px] text-neutral-400 mt-0.5 block">Known for sweet organic tomatoes</span>
                </div>
                <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">Active</span>
              </div>

              <div className="p-3 bg-neutral-50/50 border border-neutral-150/50 rounded-2xl flex justify-between items-center text-xs">
                <div>
                  <span className="font-bold text-neutral-800 leading-tight block">Benighat, Dhading</span>
                  <span className="text-[10px] text-neutral-400 mt-0.5 block">Known for fresh, delicious mountain potatoes</span>
                </div>
                <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">Active</span>
              </div>

              <div className="p-3 bg-neutral-50/50 border border-neutral-150/50 rounded-2xl flex justify-between items-center text-xs">
                <div>
                  <span className="font-bold text-neutral-800 leading-tight block">Palung, Makwanpur</span>
                  <span className="text-[10px] text-neutral-400 mt-0.5 block">Known for big cauliflowers and cabbages</span>
                </div>
                <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded font-medium">Coming Soon</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (!isLoggedIn) {
    return (
      <LandingPage
        kalimatiRates={kalimatiRates}
        onLogin={(user) => {
          setCurrentUser(user);
          setIsLoggedIn(true);
          // Pre-populate mock users as already onboarded so quick login is smooth
          const isMockUser = MOCK_USERS.some(m => m.id === user.id);
          if (isMockUser) {
            user.isOnboarded = true;
          }
          if (user.isOnboarded) {
            if (user.role === 'FARMER') {
              setActiveTab('inventory');
            } else {
              setActiveTab('dashboard');
            }
          } else {
            // New users start at step 1 onboarding
            setActiveTab('profile');
          }
        }}
      />
    );
  }

  // Intercept for complete account onboarding details
  if (isLoggedIn && currentUser && currentUser.isOnboarded === false) {
    return (
      <OnboardingPage
        currentUser={currentUser}
        onSaveOnboarding={async (updatedProfile) => {
          await db.saveProfile(updatedProfile);
          setCurrentUser(updatedProfile);
          setActiveTab('profile');
        }}
        onLogout={async () => {
          await supabase?.auth.signOut();
          setIsLoggedIn(false);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-neutral-800 flex flex-col font-sans selection:bg-emerald-500 selection:text-white pb-10">

      {/* 1. Kathmandu Kalimati Live Rates Ticker */}
      <KalimatiTicker rates={kalimatiRates} />

      {/* Mobile Top Header (only visible on mobile screens below lg) */}
      <header className="lg:hidden bg-white border-b border-neutral-100 px-4 py-3 flex items-center justify-between sticky top-[40px] z-40 shadow-xs">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 hover:bg-neutral-50 rounded-xl text-neutral-600 transition cursor-pointer"
            aria-label="Open Navigation Menu"
          >
            <Menu size={20} />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-800 font-extrabold text-xs">
              <Leaf size={14} className="stroke-[2.5]" />
            </div>
            <div>
              <span className="font-extrabold text-neutral-900 tracking-tight text-sm block leading-none">
                BizzLedger
              </span>
              <span className="text-[8px] text-neutral-400 uppercase font-mono tracking-widest font-bold block mt-0.5">
                Agribusiness
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Active user representation */}
          <button
            onClick={() => {
              setIsMobileMenuOpen(true);
            }}
            className="flex items-center gap-2"
          >
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-8 h-8 rounded-lg object-cover ring-2 ring-emerald-500/20"
              referrerPolicy="no-referrer"
            />
          </button>
        </div>
      </header>

      {/* Mobile Sidebar overlay drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/45 backdrop-blur-xs transition-opacity duration-205"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          {/* Content container */}
          <aside className="fixed top-0 bottom-0 left-0 w-72 bg-white p-5 flex flex-col justify-between shadow-2xl overflow-y-auto animate-in slide-in-from-left duration-200 z-50">
            <div className="space-y-6">
              {/* Top Brand Logo & Close button */}
              <div className="flex items-center justify-between border-b border-neutral-50 pb-4">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-800 font-extrabold text-sm shadow-xs">
                    <Leaf size={16} className="stroke-[2.5]" />
                  </div>
                  <div>
                    <span className="font-extrabold text-neutral-900 tracking-tight text-[15px] block leading-none">
                      BizzLedger
                    </span>
                    <span className="text-[9px] text-neutral-400 uppercase font-mono tracking-widest font-bold block mt-1">
                      Agribusiness
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {/* Exit to Landing Door */}
                  <button
                    onClick={async () => {
                      await supabase?.auth.signOut();
                      setIsLoggedIn(false);
                      setIsMobileMenuOpen(false);
                    }}
                    title="Exit to Portal Landing"
                    className="p-1.5 hover:bg-neutral-100 text-neutral-500 hover:text-neutral-950 rounded-lg duration-150 cursor-pointer"
                  >
                    <LogOut size={14} />
                  </button>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-1.5 hover:bg-neutral-100 text-neutral-500 rounded-lg cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Sidebar Tab Options */}
              <nav className="space-y-1">
                <button
                  onClick={() => { setViewedProfile(null); setActiveTab('dashboard'); }}
                  className={`w-full text-left p-2.5 rounded-xl text-xs font-bold leading-none flex items-center gap-3 cursor-pointer duration-150 ${activeTab === 'dashboard'
                      ? 'bg-neutral-900 text-white shadow-md'
                      : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-800'
                    }`}
                >
                  <LayoutDashboard size={14} />
                  Dashboard
                </button>
 
                <button
                  onClick={() => { setViewedProfile(null); setActiveTab('marketplace'); }}
                  className={`w-full text-left p-2.5 rounded-xl text-xs font-bold leading-none flex items-center gap-3 cursor-pointer duration-150 ${activeTab === 'marketplace'
                      ? 'bg-neutral-900 text-white shadow-md'
                      : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-800'
                    }`}
                >
                  <Boxes size={14} />
                  Browse Crops
                </button>
 
 
                {currentUser.role === 'FARMER' && (
                  <button
                    onClick={() => { setViewedProfile(null); setActiveTab('inventory'); }}
                    className={`w-full text-left p-2.5 rounded-xl text-xs font-bold leading-none flex items-center gap-3 cursor-pointer duration-150 ${activeTab === 'inventory'
                        ? 'bg-neutral-900 text-white shadow-md'
                        : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-800'
                      }`}
                  >
                    <Building2 size={14} />
                    My Vegetable List
                  </button>
                )}
 
                {currentUser.role === 'WHOLESALER' && (
                  <button
                    onClick={() => { setViewedProfile(null); setActiveTab('cart'); }}
                    className={`w-full text-left p-2.5 rounded-xl text-xs font-bold leading-none flex items-center justify-between cursor-pointer duration-150 ${activeTab === 'cart'
                        ? 'bg-neutral-900 text-white shadow-md'
                        : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-800'
                      }`}
                  >
                    <span className="flex items-center gap-3">
                      <ShoppingCart size={14} />
                      My Shopping Cart
                    </span>
                    {cart.length > 0 && (
                      <span className="h-4.5 px-1.5 rounded-full bg-orange-500 text-white font-black text-[9px] flex items-center justify-center">
                        {cart.reduce((s, c) => s + c.quantity, 0)} Cr
                      </span>
                    )}
                  </button>
                )}
 
                <button
                  onClick={() => { setViewedProfile(null); setActiveTab('orders'); }}
                  className={`w-full text-left p-2.5 rounded-xl text-xs font-bold leading-none flex items-center justify-between cursor-pointer duration-150 ${activeTab === 'orders'
                      ? 'bg-neutral-900 text-white shadow-md'
                      : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-800'
                    }`}
                >
                  <span className="flex items-center gap-3">
                    <FileCheck size={14} />
                    Trucks & Delivery Bills
                  </span>
                  {orders.some(o => o.status !== 'ARRIVED') && (
                    <span className="text-[9px] font-extrabold bg-amber-400 text-amber-950 px-1.5 py-0.5 rounded-full">
                      Active
                    </span>
                  )}
                </button>
 
                <button
                  onClick={() => { setViewedProfile(null); setActiveTab('profile'); }}
                  className={`w-full text-left p-2.5 rounded-xl text-xs font-bold leading-none flex items-center gap-3 cursor-pointer duration-150 ${activeTab === 'profile' && !viewedProfile
                      ? 'bg-neutral-900 text-white shadow-md'
                      : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-800'
                    }`}
                >
                  <User size={14} />
                  My Verified Profile
                </button>
              </nav>
            </div>

            {/* User profile & DB session status */}
            <div className="pt-4 border-t border-neutral-100 flex flex-col gap-2.5">
              <span className="text-[10px] text-neutral-400 font-mono font-bold uppercase block px-1">
                Active Account Credentials
              </span>

              <div className="w-full p-2.5 bg-neutral-50 rounded-2xl flex items-center justify-between text-left">
                <div className="flex items-center gap-2.5">
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-8 h-8 rounded-lg object-cover ring-2 ring-emerald-500/20"
                    referrerPolicy="no-referrer"
                  />
                  <div className="leading-tight">
                    <span className="text-xs font-extrabold text-neutral-800 block truncate max-w-[120px]">{currentUser.name}</span>
                    <span className="text-[10px] text-emerald-700 font-bold block bg-emerald-50 px-1.5 py-0.5 rounded mt-0.5 text-center w-max">
                      {currentUser.role === 'FARMER' ? 'Farmer Role' : 'Wholesaler Role'}
                    </span>
                  </div>
                </div>
              </div>


              <button
                onClick={async () => {
                  await supabase?.auth.signOut();
                  setIsLoggedIn(false);
                  localStorage.removeItem('bl_logged_in');
                }}
                className="w-full py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 duration-150 cursor-pointer"
              >
                <LogOut size={12} />
                Sign Out Account
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Core Layout Wrapper */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 w-full flex-grow grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">

        {/* Sidebar Left Column */}
        <aside className="hidden lg:flex lg:col-span-3 bg-white border border-neutral-100 rounded-3xl p-5 shadow-[0_4px_25px_rgba(0,0,0,0.01)] flex-col justify-between h-[640px] sticky top-20">
          <div className="space-y-6">
            {/* Top Brand Logo */}
            <div className="flex items-center justify-between border-b border-neutral-50 pb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-800 font-extrabold text-sm shadow-xs">
                  <Leaf size={16} className="stroke-[2.5]" />
                </div>
                <div>
                  <span className="font-extrabold text-neutral-900 tracking-tight text-[15px] block leading-none">
                    BizzLedger
                  </span>
                  <span className="text-[9px] text-neutral-400 uppercase font-mono tracking-widest font-bold block mt-1">
                    Agribusiness
                  </span>
                </div>
              </div>

              {/* Exit to Landing Door */}
              <button
                onClick={async () => { await supabase?.auth.signOut(); setIsLoggedIn(false); }}
                title="Exit to Portal Landing"
                className="p-1.5 hover:bg-neutral-100 text-neutral-500 hover:text-neutral-950 rounded-lg duration-150 cursor-pointer"
              >
                <LogOut size={14} />
              </button>
            </div>

            {/* Sidebar Tab Options */}
            <nav className="space-y-1">
              <button
                onClick={() => { setViewedProfile(null); setActiveTab('dashboard'); }}
                className={`w-full text-left p-2.5 rounded-xl text-xs font-bold leading-none flex items-center gap-3 cursor-pointer duration-150 ${activeTab === 'dashboard'
                    ? 'bg-neutral-900 text-white shadow-md'
                    : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-800'
                  }`}
              >
                <LayoutDashboard size={14} />
                Dashboard
              </button>

              <button
                onClick={() => { setViewedProfile(null); setActiveTab('marketplace'); }}
                className={`w-full text-left p-2.5 rounded-xl text-xs font-bold leading-none flex items-center gap-3 cursor-pointer duration-150 ${activeTab === 'marketplace'
                    ? 'bg-neutral-900 text-white shadow-md'
                    : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-800'
                  }`}
              >
                <Boxes size={14} />
                Browse Crops
              </button>


              {currentUser.role === 'FARMER' && (
                <button
                  onClick={() => { setViewedProfile(null); setActiveTab('inventory'); }}
                  className={`w-full text-left p-2.5 rounded-xl text-xs font-bold leading-none flex items-center gap-3 cursor-pointer duration-150 ${activeTab === 'inventory'
                      ? 'bg-neutral-900 text-white shadow-md'
                      : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-800'
                    }`}
                >
                  <Building2 size={14} />
                  My Vegetable List
                </button>
              )}

              {currentUser.role === 'WHOLESALER' && (
                <button
                  onClick={() => { setViewedProfile(null); setActiveTab('cart'); }}
                  className={`w-full text-left p-2.5 rounded-xl text-xs font-bold leading-none flex items-center justify-between cursor-pointer duration-150 ${activeTab === 'cart'
                      ? 'bg-neutral-900 text-white shadow-md'
                      : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-800'
                    }`}
                >
                  <span className="flex items-center gap-3">
                    <ShoppingCart size={14} />
                    My Shopping Cart
                  </span>
                  {cart.length > 0 && (
                    <span className="h-4.5 px-1.5 rounded-full bg-orange-500 text-white font-black text-[9px] flex items-center justify-center">
                      {cart.reduce((s, c) => s + c.quantity, 0)} Cr
                    </span>
                  )}
                </button>
              )}

              <button
                onClick={() => { setViewedProfile(null); setActiveTab('orders'); }}
                className={`w-full text-left p-2.5 rounded-xl text-xs font-bold leading-none flex items-center justify-between cursor-pointer duration-150 ${activeTab === 'orders'
                    ? 'bg-neutral-900 text-white shadow-md'
                    : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-800'
                  }`}
              >
                <span className="flex items-center gap-3">
                  <FileCheck size={14} />
                  Trucks & Delivery Bills
                </span>
                {orders.some(o => o.status !== 'ARRIVED') && (
                  <span className="text-[9px] font-extrabold bg-amber-400 text-amber-950 px-1.5 py-0.5 rounded-full">
                    Active
                  </span>
                )}
              </button>

              <button
                onClick={() => { setViewedProfile(null); setActiveTab('profile'); }}
                className={`w-full text-left p-2.5 rounded-xl text-xs font-bold leading-none flex items-center gap-3 cursor-pointer duration-150 ${activeTab === 'profile' && !viewedProfile
                    ? 'bg-neutral-900 text-white shadow-md'
                    : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-800'
                  }`}
              >
                <User size={14} />
                My Verified Profile
              </button>
            </nav>
          </div>

          {/* User profile & DB session status */}
          <div className="pt-4 border-t border-neutral-100 flex flex-col gap-2.5">
            <span className="text-[10px] text-neutral-400 font-mono font-bold uppercase block px-1">
              Active Account Credentials
            </span>

            <div className="w-full p-2.5 bg-neutral-50 rounded-2xl flex items-center justify-between text-left">
              <div className="flex items-center gap-2.5">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-9 h-9 rounded-xl object-cover ring-2 ring-emerald-500/20"
                  referrerPolicy="no-referrer"
                />
                <div className="leading-tight">
                  <span className="text-xs font-extrabold text-neutral-800 block truncate max-w-[120px]">{currentUser.name}</span>
                  <span className="text-[10px] text-emerald-700 font-bold block bg-emerald-50 px-1.5 py-0.5 rounded mt-0.5 text-center w-max">
                    {currentUser.role === 'FARMER' ? 'Farmer Role' : 'Wholesaler Role'}
                  </span>
                </div>
              </div>
            </div>


            <button
              onClick={async () => {
                await supabase?.auth.signOut();
                setIsLoggedIn(false);
                localStorage.removeItem('bl_logged_in');
              }}
              className="w-full py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 duration-150 cursor-pointer"
            >
              <LogOut size={12} />
              Sign Out Account
            </button>
          </div>
        </aside>

        {/* Primary View Content Right Window Column */}
        <main className="lg:col-span-9 space-y-6">

          {/* Top Bar Header Area */}
          <header className="bg-white border border-neutral-100 rounded-3xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.015)] flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="relative flex-1 w-full max-w-md">
              <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-neutral-400" size={16} />
              <input
                type="text"
                placeholder="Search vegetables, fruits, or districts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-neutral-50/80 border border-neutral-150 rounded-2xl text-xs font-bold leading-none "
              />
            </div>

            <div className="flex items-center gap-3">


            <div className="relative">
              {/* Bell button */}
              <button
                onClick={() => {
                  setShowNotifDropdown(!showNotifDropdown);
                }}
                className="p-2.5 bg-neutral-50 hover:bg-neutral-100 text-neutral-600 rounded-2xl transition relative cursor-pointer"
              >
                <Bell size={16} />
                {notifications.some(n => !n.isRead) && (
                  <span className="w-2 h-2 bg-red-500 rounded-full absolute top-2 right-2 ring-2 ring-white"></span>
                )}
              </button>
 
              {/* Notifications Dropdown Panel */}
              {showNotifDropdown && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-neutral-150 rounded-2xl shadow-xl z-50 p-4 space-y-3 max-h-96 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="flex justify-between items-center border-b border-neutral-50 pb-2">
                    <span className="text-xs font-black text-neutral-800">Notifications</span>
                    {notifications.some(n => !n.isRead) && (
                      <button 
                        onClick={async () => {
                          for (const n of notifications) {
                            if (!n.isRead) {
                              await db.markNotificationRead(n.id);
                            }
                          }
                          setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                        }}
                        className="text-[10px] text-emerald-600 hover:underline font-bold"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
 
                  {notifications.length === 0 ? (
                    <div className="text-center py-6 text-neutral-400 text-xs font-medium">
                      No notifications yet
                    </div>
                  ) : (
                    <div className="space-y-2.5 divide-y divide-neutral-50">
                      {notifications.map(n => (
                        <div 
                          key={n.id}
                          onClick={async () => {
                            if (!n.isRead) {
                              await db.markNotificationRead(n.id);
                              setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, isRead: true } : item));
                            }
                            if (n.orderId) {
                              setSelectedOrderId(n.orderId);
                              setActiveTab('orders');
                            }
                            setShowNotifDropdown(false);
                          }}
                          className={`pt-2.5 text-xs text-left cursor-pointer transition ${n.isRead ? 'opacity-65' : 'font-semibold'}`}
                        >
                          <div className="flex justify-between items-start">
                            <span className="text-[11px] font-bold text-neutral-800 block leading-tight">{n.title}</span>
                            {!n.isRead && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0 mt-1"></span>}
                          </div>
                          <p className="text-[10px] text-neutral-500 mt-1 leading-normal">{n.message}</p>
                          <span className="text-[8px] text-neutral-400 block mt-1 font-mono">{new Date(n.createdAt).toLocaleTimeString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            </div>
          </header>

          {/* Dynamic Tab Panel Switching */}
          <div className="min-h-[500px]">
            {activeTab === 'dashboard' && renderDashboard()}
             {activeTab === 'marketplace' && (
              <MarketplacePage
                listings={listings}
                onStartNegotiation={handleStartNegotiation}
                onAddToCart={handleAddToCart}
                currentUser={currentUser}
                onViewFarmer={async (farmerId) => {
                  try {
                    const profile = await db.getProfile(farmerId);
                    if (profile) {
                      setViewedProfile(profile);
                      setActiveTab('profile');
                    }
                  } catch (e) {
                    console.error('Failed to load farmer profile', e);
                  }
                }}
              />
            )}
            {activeTab === 'bargain' && (
              <BargainRoomPage
                rooms={rooms}
                listings={listings}
                currentUser={currentUser}
                activeRoomId={activeRoomId}
                onSelectRoom={setActiveRoomId}
                onSubmitMessage={handleSendMessage}
                onAcceptContract={handleAcceptContract}
                onWithdrawBargain={handleWithdrawBargain}
              />
            )}
            {activeTab === 'inventory' && (
              <InventoryPage
                listings={listings}
                onAddListing={handleAddNewListing}
                onEditListing={handleEditListing}
                onDeleteListing={handleDeleteListing}
                currentUser={currentUser}
              />
            )}
             {activeTab === 'orders' && (
              <OrdersPage
                orders={orders}
                currentUser={currentUser}
                onUpdateOrderStatus={handleUpdateOrderStatus}
                selectedOrderId={selectedOrderId}
                onSelectOrder={setSelectedOrderId}
              />
            )}
            {activeTab === 'cart' && (
              <CartPage
                cart={cart}
                currentUser={currentUser}
                onUpdateCartItemQuantity={handleUpdateCartItemQuantity}
                onRemoveCartItem={handleRemoveCartItem}
                onClearCart={handleClearCart}
                onConfirmCheckout={handleConfirmCheckout}
                onNavigateToDirectory={() => setActiveTab('marketplace')}
                onNavigateToOrders={() => setActiveTab('orders')}
              />
            )}
            {activeTab === 'profile' && (
              <ProfilePage
                currentUser={viewedProfile || currentUser}
                orders={orders}
                onUpdateProfile={async (updatedUser) => {
                  await db.saveProfile(updatedUser);
                  setCurrentUser(updatedUser);
                }}
                isViewOnly={!!viewedProfile && viewedProfile.id !== currentUser.id}
                onBack={() => {
                  setViewedProfile(null);
                  setActiveTab('marketplace');
                }}
              />
            )}
          </div>

        </main>

      </div>
    </div>
  );
}
