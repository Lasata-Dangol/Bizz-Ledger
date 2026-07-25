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
    .select('id, cropName, category');
  
  if (error) {
    console.error("Error fetching listings:", error);
    return;
  }

  for (const item of data) {
    const name = item.cropName.toLowerCase();
    let newCat = item.category;

    if (name.includes('cauliflower')) newCat = 'Cauliflower';
    else if (name.includes('tomato')) newCat = 'Tomatoes';
    else if (name.includes('potato')) newCat = 'Potatoes';
    else if (name.includes('cabbage')) newCat = 'Cabbages';
    else if (name.includes('spanich') || name.includes('spinach') || name.includes('munta')) newCat = 'Greens';
    else if (name.includes('ginger') || name.includes('cardamom')) newCat = 'Spices';
    else if (name.includes('apple')) newCat = 'Fruits';

    if (newCat !== item.category) {
      console.log(`Updating ${item.cropName}: ${item.category} -> ${newCat}`);
      await supabase.from('listings').update({ category: newCat }).eq('id', item.id);
    }
  }

  console.log("Done fixing all categories!");
}

main();
