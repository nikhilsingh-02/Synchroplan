import { supabase } from './src/lib/supabase.ts';

async function getCols() {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .limit(1);
    
  console.log("Cols error?", error);
  if (data) {
    console.log("Cols:", data);
  }
}

getCols();
