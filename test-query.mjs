import { createClient } from '@supabase/supabase-js';

// Load from .env if possible, but mock for query building test
const supabase = createClient('https://mock.supabase.co', 'mock-key', {
  auth: { persistSession: false },
});

async function testFetch() {
  const query = supabase
    .from('events')
    .select('*')
    .eq('user_id', '123')
    .order('start_time', { ascending: true });
    
  // Intercept fetch to see the URL
  console.log("Fetch URL:", query['url']);
}

async function testInsert() {
  const row = {
    user_id: '123',
    title: 'test',
    location: '',
    start_time: '2025-01-01T10:00',
    end_time: '2025-01-01T11:00',
    priority: 'medium',
    type: 'meeting'
  };
  
  const query = supabase
    .from('events')
    .insert(row)
    .select()
    .single();
    
  console.log("Insert URL:", query['url']);
}

testFetch();
testInsert();
