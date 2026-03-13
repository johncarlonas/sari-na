import { supabase } from '../lib/supabaseClient';

async function listNodes() {
  const { data } = await supabase.from('nodes').select('id, label');
  console.log("📍 Current IDs in your database:");
  console.table(data);
}

listNodes();
