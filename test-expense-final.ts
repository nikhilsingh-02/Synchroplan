import { supabase } from './src/lib/supabase.ts';
import { expenseToDb } from './src/services/api/mapper.ts';

async function testEverything() {
  const expense = {
    id: crypto.randomUUID(),
    category: 'food',
    amount: 15.50,
    description: 'Lunch TEST',
    date: new Date().toISOString()
  };
  
  const row = expenseToDb('adfbcf3b-21bc-4781-a515-3efa464a627e', expense as any);
  
  const { data, error } = await supabase
    .from('expenses')
    .insert(row)
    .select()
    .single();
    
  if (error) {
    console.error("Insert Error:", error);
  } else {
    console.log("Insert Success!", data);
    await supabase.from('expenses').delete().eq('id', row.id);
  }
}

testEverything();
