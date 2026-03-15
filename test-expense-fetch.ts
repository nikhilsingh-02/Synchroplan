import { supabase } from './src/lib/supabase.ts';

async function testFetch() {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('user_id', 'adfbcf3b-21bc-4781-a515-3efa464a627e')
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error("Fetch Error:", error);
  } else {
    console.log("Fetch Success. Columns available in first row:");
    if (data && data.length > 0) {
      console.log(Object.keys(data[0]));
      console.log(data[0]);
    } else {
      console.log("No data returned.");
    }
  }
}

testFetch();
