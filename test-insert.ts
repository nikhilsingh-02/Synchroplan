import { supabase } from './src/lib/supabase.ts';
import { eventToDb } from './src/services/api/mapper.ts';

async function testInsert() {
  // Use a random UUID for test user, we just want to see validation errors
  const mockUserId = 'adfbcf3b-21bc-4781-a515-3efa464a627e';
  
  const event = {
    id: crypto.randomUUID(),
    title: 'Test Event',
    location: '',
    startTime: '2025-01-01T10:00',
    endTime: '2025-01-01T11:00',
    priority: 'medium',
    type: 'meeting'
  };
  
  const row = eventToDb(mockUserId, event as any);
  
  console.log("Sending row:", row);
  
  // Actually execute the insert
  const { data, error } = await supabase
    .from('events')
    .insert(row)
    .select()
    .single();
    
  if (error) {
    console.error("400 Bad Request Error Details:");
    console.error(error);
  } else {
    console.log("Success:", data);
    // clean up
    await supabase.from('events').delete().eq('id', event.id);
  }
}

testInsert();
