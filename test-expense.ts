import { supabase } from './src/lib/supabase.ts';
import { expenseToDb } from './src/services/api/mapper.ts';

async function testInsert() {
  const mockUserId = 'adfbcf3b-21bc-4781-a515-3efa464a627e';
  
  const expense = {
    id: crypto.randomUUID(),
    category: 'food',
    amount: 15.50,
    description: 'Lunch',
    date: new Date().toISOString()
  };
  
  const row = expenseToDb(mockUserId, expense as any);
  
  console.log("Sending row:", row);
  
  const { data, error } = await supabase
    .from('expenses')
    .insert(row)
    .select()
    .single();
    
  if (error) {
    console.error("400 Bad Request Error Details:");
    console.error(error);
  } else {
    console.log("Success:", data);
    await supabase.from('expenses').delete().eq('id', expense.id);
  }
}

testInsert();
