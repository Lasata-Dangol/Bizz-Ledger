import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env') });

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(url, key);

async function main() {
  const { data, error } = await supabase
    .from('listings')
    .select('id, cropName, category, imageUrl');
  
  if (error) {
    console.error("Error fetching listings:", error);
  } else {
    data.forEach(item => console.log(`ID: ${item.id}, Crop: ${item.cropName}, Category: ${item.category}`));
  }
}

main();
