-- Supabase Schema for BizzLedger
-- Run this in your Supabase SQL Editor to create the necessary tables.

-- ==========================================
-- EDGE FUNCTION AUTOMATION (PG_CRON)
-- Run this block below to schedule the Kalimati Edge Function to run daily!
-- Note: Make sure your edge function is deployed as "kalimati-scraper"
-- ==========================================
/*
select
  cron.schedule(
    'invoke-kalimati-scraper',
    '0 0 * * *', -- Everyday at midnight
    $$
    select
      net.http_post(
          url:='https://zqcuzcqjnqyubsxfrutd.supabase.co/functions/v1/kalimati-scraper',
          headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
      ) as request_id;
    $$
  );
*/

-- Uncomment the following lines if you want to completely drop existing tables and start fresh.
-- WARNING: THIS WILL DELETE ALL EXISTING DATA
-- DROP TABLE IF EXISTS kalimati_rates CASCADE;
-- DROP TABLE IF EXISTS orders CASCADE;
-- DROP TABLE IF EXISTS listings CASCADE;
-- DROP TABLE IF EXISTS profiles CASCADE;

CREATE TABLE IF NOT EXISTS kalimati_rates (
    "cropName" TEXT PRIMARY KEY,
    unit TEXT,
    "minPrice" NUMERIC,
    "maxPrice" NUMERIC,
    "avgPrice" NUMERIC,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    avatar TEXT,
    district TEXT,
    phone TEXT,
    "companyName" TEXT,
    rating NUMERIC DEFAULT 5.0,
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
    "readyToShip" BOOLEAN NOT NULL,
    notes TEXT,
    "imageUrl" TEXT
);


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
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    "estimatedArrival" TIMESTAMP WITH TIME ZONE NOT NULL
);
