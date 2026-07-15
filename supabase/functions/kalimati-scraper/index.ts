import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.42.0'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
}

serve(async (req) => {
  // Handle CORS Preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  try {
    // 1. Fetch the target markup page
    const targetUrl = "https://nepalicalendar.rat32.com/vegetable/"
    const response = await fetch(targetUrl)
    const htmlContent = await response.text()

    // 2. Parse HTML using Deno DOM
    const doc = new DOMParser().parseFromString(htmlContent, 'text/html')
    if (!doc) {
      throw new Error("Failed to parse document markup")
    }

    const rows = doc.querySelectorAll("#commodityDailyPrice tbody tr")
    const scrapedCrops = []

    for (const row of rows) {
      const cols = row.querySelectorAll("td")
      if (cols.length >= 5) {
        const cropName = cols[0].textContent?.trim()
        if (cropName) {
          scrapedCrops.push({
            cropName: cropName,
            unit: cols[1].textContent?.trim(),
            minPrice: Number(cols[2].textContent?.trim()) || null,
            maxPrice: Number(cols[3].textContent?.trim()) || null,
            avgPrice: Number(cols[4].textContent?.trim()) || null,
            updatedAt: new Date().toISOString()
          })
        }
      }
    }

    // 3. Store to Supabase
    // Create a Supabase client with the Auth context of the logged in user.
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
       throw new Error("Missing Supabase environment variables.")
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Option A: Clear the table and insert the new ones (since it's a daily refresh of live rates)
    // Wait, deleting all rows and inserting might cause a split second of empty data.
    // Option B: Upsert by cropName.
    const { error: upsertError } = await supabase
      .from('kalimati_rates')
      .upsert(scrapedCrops, { onConflict: 'cropName' })

    if (upsertError) {
      throw upsertError
    }

    return new Response(
      JSON.stringify({ success: true, count: scrapedCrops.length, data: scrapedCrops }),
      { headers: CORS_HEADERS, status: 200 }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: CORS_HEADERS, status: 500 }
    )
  }
})
