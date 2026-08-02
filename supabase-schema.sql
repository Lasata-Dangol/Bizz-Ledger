-- ============================================================
-- BizzLedger Supabase Schema
-- Run the entire file in your Supabase SQL Editor.
-- Safe to re-run: all statements use IF NOT EXISTS.
-- ============================================================

-- ==========================================
-- EDGE FUNCTION AUTOMATION (PG_CRON)
-- Uncomment the block below to schedule the
-- Kalimati Edge Function to run daily.
-- Make sure your edge function is deployed as "kalimati-scraper".
-- ==========================================
/*
select
  cron.schedule(
    'invoke-kalimati-scraper',
    '0 0 * * *', -- Every day at midnight
    $$
    select
      net.http_post(
          url:='https://zqcuzcqjnqyubsxfrutd.supabase.co/functions/v1/kalimati-scraper',
          headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
      ) as request_id;
    $$
  );
*/

-- ==========================================
-- OPTIONAL: Drop tables to start fresh
-- WARNING: THIS WILL DELETE ALL EXISTING DATA
-- ==========================================
-- DROP TABLE IF EXISTS notifications CASCADE;
-- DROP TABLE IF EXISTS orders CASCADE;
-- DROP TABLE IF EXISTS listings CASCADE;
-- DROP TABLE IF EXISTS profiles CASCADE;
-- DROP TABLE IF EXISTS kalimati_rates CASCADE;

-- ==========================================
-- TABLE: kalimati_rates
-- ==========================================
CREATE TABLE IF NOT EXISTS kalimati_rates (
    "cropName" TEXT PRIMARY KEY,
    unit TEXT,
    "minPrice" NUMERIC,
    "maxPrice" NUMERIC,
    "avgPrice" NUMERIC,
    change TEXT,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- TABLE: profiles
-- ==========================================
CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    avatar TEXT,
    district TEXT,
    phone TEXT,
    "companyName" TEXT,
    "totalDeals" INTEGER DEFAULT 0,
    "isOnboarded" BOOLEAN DEFAULT false,
    "farmName" TEXT,
    "farmSize" NUMERIC,
    "landUnit" TEXT,
    "primaryCrops" TEXT[],
    "experienceYears" INTEGER,
    "supplyCapacityCrates" INTEGER,
    "hasOwnTransport" BOOLEAN,
    "farmBio" TEXT,
    "panNumber" TEXT,
    "wholesalerType" TEXT,
    "warehouseAddress" TEXT,
    "purchaseVolumeWeekly" INTEGER,
    "preferredDistricts" TEXT[],
    "paymentPreference" TEXT[]
);

-- ==========================================
-- TABLE: listings
-- ==========================================
CREATE TABLE IF NOT EXISTS listings (
    id TEXT PRIMARY KEY,
    "cropName" TEXT NOT NULL,
    category TEXT NOT NULL,
    district TEXT NOT NULL,
    "farmerId" TEXT NOT NULL,
    "farmerName" TEXT NOT NULL,
    "farmerRating" NUMERIC NOT NULL,
    "quantityAvailableCrates" INTEGER NOT NULL,
    "pricePerCrate" NUMERIC NOT NULL,
    "harvestDate" TIMESTAMP WITH TIME ZONE NOT NULL,
    "readyToShip" BOOLEAN NOT NULL DEFAULT false,
    notes TEXT,
    "imageUrl" TEXT
);

-- ==========================================
-- TABLE: orders
-- ==========================================
CREATE TABLE IF NOT EXISTS orders (
    "orderId" TEXT PRIMARY KEY,
    "listingId" TEXT NOT NULL,
    "cropName" TEXT NOT NULL,
    "farmerName" TEXT NOT NULL,
    "wholesalerName" TEXT NOT NULL,
    "finalPricePerCrate" NUMERIC NOT NULL,
    quantity INTEGER NOT NULL,
    "totalPrice" NUMERIC NOT NULL,
    status TEXT NOT NULL,
    "vehicleNumber" TEXT,
    "driverPhone" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "estimatedArrival" TIMESTAMP WITH TIME ZONE NOT NULL
);

-- ==========================================
-- TABLE: notifications  <-- REQUIRED FOR NOTIFICATION SYSTEM
-- ==========================================
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    "orderId" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Index for fast per-user notification queries (most recent first)
CREATE INDEX IF NOT EXISTS idx_notifications_user_created
    ON notifications ("userId", "createdAt" DESC);

-- ==========================================
-- ROW LEVEL SECURITY (RLS)
-- ==========================================

-- profiles: anyone can read, owner can write
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='profiles' AND policyname='profiles_select_all') THEN
    CREATE POLICY "profiles_select_all" ON profiles FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='profiles' AND policyname='profiles_insert_own') THEN
    CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (id = auth.uid()::text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='profiles' AND policyname='profiles_update_own') THEN
    CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (id = auth.uid()::text);
  END IF;
END $$;

-- listings: public read, farmer-only write
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='listings' AND policyname='listings_select_all') THEN
    CREATE POLICY "listings_select_all" ON listings FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='listings' AND policyname='listings_insert_own') THEN
    CREATE POLICY "listings_insert_own" ON listings FOR INSERT WITH CHECK ("farmerId" = auth.uid()::text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='listings' AND policyname='listings_update_own') THEN
    CREATE POLICY "listings_update_own" ON listings FOR UPDATE USING ("farmerId" = auth.uid()::text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='listings' AND policyname='listings_delete_own') THEN
    CREATE POLICY "listings_delete_own" ON listings FOR DELETE USING ("farmerId" = auth.uid()::text);
  END IF;
END $$;

-- orders: visible to both farmer and wholesaler involved
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='orders' AND policyname='orders_select_involved') THEN
    CREATE POLICY "orders_select_involved" ON orders FOR SELECT USING (
      "farmerName" = (SELECT name FROM profiles WHERE id = auth.uid()::text LIMIT 1)
      OR
      "wholesalerName" = (SELECT name FROM profiles WHERE id = auth.uid()::text LIMIT 1)
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='orders' AND policyname='orders_insert_any') THEN
    CREATE POLICY "orders_insert_any" ON orders FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='orders' AND policyname='orders_update_farmer') THEN
    CREATE POLICY "orders_update_farmer" ON orders FOR UPDATE USING (
      "farmerName" = (SELECT name FROM profiles WHERE id = auth.uid()::text LIMIT 1)
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='orders' AND policyname='orders_update_wholesaler') THEN
    CREATE POLICY "orders_update_wholesaler" ON orders FOR UPDATE USING (
      "wholesalerName" = (SELECT name FROM profiles WHERE id = auth.uid()::text LIMIT 1)
    );
  END IF;
END $$;

-- notifications: each user sees only their own
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='notifications' AND policyname='notifications_select_own') THEN
    CREATE POLICY "notifications_select_own" ON notifications FOR SELECT USING ("userId" = auth.uid()::text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='notifications' AND policyname='notifications_insert_any') THEN
    -- Any authenticated user can insert (needed to notify other users e.g. farmer notifies wholesaler)
    CREATE POLICY "notifications_insert_any" ON notifications FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='notifications' AND policyname='notifications_update_own') THEN
    CREATE POLICY "notifications_update_own" ON notifications FOR UPDATE USING ("userId" = auth.uid()::text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='notifications' AND policyname='notifications_delete_own') THEN
    CREATE POLICY "notifications_delete_own" ON notifications FOR DELETE USING ("userId" = auth.uid()::text);
  END IF;
END $$;

-- kalimati_rates: public read only (edge function writes via service role)
ALTER TABLE kalimati_rates ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='kalimati_rates' AND policyname='kalimati_rates_select_all') THEN
    CREATE POLICY "kalimati_rates_select_all" ON kalimati_rates FOR SELECT USING (true);
  END IF;
END $$;
