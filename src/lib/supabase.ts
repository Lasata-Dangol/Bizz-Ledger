import { createClient } from '@supabase/supabase-js';
import { UserProfile, VegetableListing, Order, KalimatiRate, AppNotification } from '../types';
import { MOCK_USERS, KALIMATI_RATES, INITIAL_LISTINGS, INITIAL_ORDERS } from '../mockData';

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

// Lazy initialization of the Supabase client to prevent startup crash if keys are missing
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

// Helper to check if Supabase is connected
export const isSupabaseConfigured = () => {
  return !!supabase;
};

/**
 * Robust Direct Database Adapter
 * Transparently swaps between live Supabase DB and local unified persistence engine
 * so that the App NEVER crashes, is fully functional, and stores all changes dynamically!
 */
class DirectLedgerDb {
  private localKey(name: string) {
    return `bizzledger_db_${name}`;
  }

  // Get current active authenticated user structure
  async getProfile(userId: string): Promise<UserProfile | null> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();
        if (!error && data) return data as UserProfile;
      } catch (e) {
        console.warn('Supabase profiles query failed, falling back to local storage', e);
      }
    }

    // Local Storage fallback
    const profiles = this.getLocalList<UserProfile>('profiles', MOCK_USERS);
    return profiles.find(p => p.id === userId) || null;
  }

  async saveProfile(profile: UserProfile): Promise<UserProfile> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .upsert(profile)
          .select()
          .single();
        if (!error && data) return data as UserProfile;
      } catch (e) {
        console.warn('Supabase profiles upsert failed, falling back to local storage', e);
      }
    }

    // Local Storage fallback
    const profiles = this.getLocalList<UserProfile>('profiles', MOCK_USERS);
    const existingIdx = profiles.findIndex(p => p.id === profile.id);
    if (existingIdx !== -1) {
      profiles[existingIdx] = profile;
    } else {
      profiles.push(profile);
    }
    this.setLocalList('profiles', profiles);
    return profile;
  }

  // Listing Operations
  async getListings(): Promise<VegetableListing[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('listings')
          .select('*')
          .order('harvestDate', { ascending: false });
        if (!error && data) return data as VegetableListing[];
      } catch (e) {
        console.warn('Supabase listings query failed, falling back to local storage', e);
      }
    }

    return this.getLocalList<VegetableListing>('listings', INITIAL_LISTINGS);
  }

  async createListing(listing: VegetableListing): Promise<VegetableListing> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('listings')
          .insert(listing)
          .select()
          .single();
        if (!error && data) return data as VegetableListing;
      } catch (e) {
        console.warn('Supabase listing insert failed, falling back to local storage', e);
      }
    }

    const listings = this.getLocalList<VegetableListing>('listings', INITIAL_LISTINGS);
    listings.unshift(listing);
    this.setLocalList('listings', listings);
    return listing;
  }

  async updateListing(listing: VegetableListing): Promise<VegetableListing> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('listings')
          .update(listing)
          .eq('id', listing.id)
          .select()
          .single();
        if (!error && data) return data as VegetableListing;
      } catch (e) {
        console.warn('Supabase listing update failed, falling back to local storage', e);
      }
    }

    const listings = this.getLocalList<VegetableListing>('listings', INITIAL_LISTINGS);
    const idx = listings.findIndex(l => l.id === listing.id);
    if (idx !== -1) {
      listings[idx] = listing;
      this.setLocalList('listings', listings);
    }
    return listing;
  }

  async deleteListing(listingId: string): Promise<boolean> {
    if (supabase) {
      try {
        const { error } = await supabase
          .from('listings')
          .delete()
          .eq('id', listingId);
        if (!error) return true;
      } catch (e) {
        console.warn('Supabase listing deletion failed, falling back to local storage', e);
      }
    }

    const listings = this.getLocalList<VegetableListing>('listings', INITIAL_LISTINGS);
    const filtered = listings.filter(l => l.id !== listingId);
    this.setLocalList('listings', filtered);
    return true;
  }


  // --- Kalimati Rates ---
  async getKalimatiRates(): Promise<KalimatiRate[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('kalimati_rates')
          .select('*')
          .order('cropName', { ascending: true });
        
        if (!error && data) {
          // Store in local storage for offline fallback
          localStorage.setItem(this.localKey('kalimati_rates'), JSON.stringify(data));
          return data as KalimatiRate[];
        }
      } catch (e) {
        console.warn('Supabase kalimati_rates query failed, falling back to local storage', e);
      }
    }

    // Local Storage Fallback
    const localData = localStorage.getItem(this.localKey('kalimati_rates'));
    if (localData) {
      return JSON.parse(localData);
    }
    
    // No data yet, return empty array
    return [];
  }

  // --- Orders Operations ---
  async getOrders(userId: string, role: string): Promise<Order[]> {
    if (supabase) {
      try {
        const query = supabase.from('orders').select('*');
        if (role === 'FARMER') {
          query.eq('farmerName', userId); // or map via name/ids appropriately
        } else {
          query.eq('wholesalerName', userId);
        }
        const { data, error } = await query;
        if (!error && data) return data as Order[];
      } catch (e) {
        console.warn('Supabase orders fetch failed, falling back to local storage', e);
      }
    }

    const orders = this.getLocalList<Order>('orders', INITIAL_ORDERS);
    return orders;
  }

  async createOrder(order: Order): Promise<Order> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('orders')
          .insert(order)
          .select()
          .single();
        if (!error && data) return data as Order;
      } catch (e) {
        console.warn('Supabase order creation failed, falling back to local storage', e);
      }
    }

    const orders = this.getLocalList<Order>('orders', INITIAL_ORDERS);
    orders.unshift(order);
    this.setLocalList('orders', orders);
    return order;
  }

  async updateOrderStatus(orderId: string, status: 'PROCESSING' | 'IN_TRANSIT' | 'ARRIVED', extra?: Partial<Order>): Promise<Order | null> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('orders')
          .update({ status, ...extra })
          .eq('orderId', orderId)
          .select()
          .single();
        if (!error && data) return data as Order;
      } catch (e) {
        console.warn('Supabase order update failed, falling back to local storage', e);
      }
    }

    const orders = this.getLocalList<Order>('orders', INITIAL_ORDERS);
    const idx = orders.findIndex(o => o.orderId === orderId);
    if (idx !== -1) {
      orders[idx] = { ...orders[idx], status, ...extra };
      this.setLocalList('orders', orders);
      return orders[idx];
    }
    return null;
  }

  // Local Storage generic read/write
  private getLocalList<T>(key: string, initialSeed: T[]): T[] {
    const raw = localStorage.getItem(this.localKey(key));
    if (!raw) {
      localStorage.setItem(this.localKey(key), JSON.stringify(initialSeed));
      return initialSeed;
    }
    try {
      return JSON.parse(raw) as T[];
    } catch {
      return initialSeed;
    }
  }

  // --- Notifications Operations ---
  async getNotifications(userId: string): Promise<AppNotification[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('userId', userId)
          .order('createdAt', { ascending: false });
        if (!error && data) return data as AppNotification[];
      } catch (e) {
        console.warn('Supabase notifications fetch failed, falling back to local storage', e);
      }
    }
    const list = this.getLocalList<AppNotification>('notifications', []);
    return list.filter(n => n.userId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async createNotification(notification: AppNotification): Promise<AppNotification> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .insert(notification)
          .select()
          .single();
        if (!error && data) return data as AppNotification;
      } catch (e) {
        console.warn('Supabase notification insertion failed, falling back to local storage', e);
      }
    }
    const list = this.getLocalList<AppNotification>('notifications', []);
    list.unshift(notification);
    this.setLocalList('notifications', list);
    return notification;
  }

  async markNotificationRead(id: string): Promise<boolean> {
    if (supabase) {
      try {
        const { error } = await supabase
          .from('notifications')
          .update({ isRead: true })
          .eq('id', id);
        if (!error) return true;
      } catch (e) {
        console.warn('Supabase notification update failed, falling back to local storage', e);
      }
    }
    const list = this.getLocalList<AppNotification>('notifications', []);
    const idx = list.findIndex(n => n.id === id);
    if (idx !== -1) {
      list[idx].isRead = true;
      this.setLocalList('notifications', list);
      return true;
    }
    return false;
  }

  async getProfileByName(name: string): Promise<UserProfile | null> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('name', name)
          .maybeSingle();
        if (!error && data) return data as UserProfile;
      } catch (e) {
        console.warn('Supabase profile query by name failed, falling back to local storage', e);
      }
    }
    const profiles = this.getLocalList<UserProfile>('profiles', MOCK_USERS);
    return profiles.find(p => p.name === name) || null;
  }

  private setLocalList<T>(key: string, list: T[]) {
    localStorage.setItem(this.localKey(key), JSON.stringify(list));
  }
}

export const db = new DirectLedgerDb();
