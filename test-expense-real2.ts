import { supabase } from './src/lib/supabase.ts';

async function testInsert() {
  const mockUserId = 'adfbcf3b-21bc-4781-a515-3efa464a627e';
  
  const row = {
    id: crypto.randomUUID(),
    user_id: mockUserId,
    category: 'food',
    amount: 15.50,
    description: 'Lunch', // omitted date!
    created_at: new Date().toISOString()
  };
  
  const { data, error } = await supabase
    .from('expenses')
    .insert(row)
    .select()
    .single();
    
  if (error) {
    console.error("400 Bad Request Error Details:", error);
  } else {
    console.log("Success:", data);
    await supabase.from('expenses').delete().eq('id', row.id);
  }
}

testInsert();
