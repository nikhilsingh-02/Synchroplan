import { supabase } from './src/lib/supabase.ts';

async function fetchSchema() {
  const url = supabase['supabaseUrl'] + '/rest/v1/expenses';
  const apiKey = supabase['supabaseKey'];
  
  const res = await fetch(url, {
    method: 'OPTIONS',
    headers: {
      apikey: apiKey,
      Authorization: `Bearer ${apiKey}`
    }
  });
  
  if (res.ok) {
    const json = await res.json();
    console.log("Allowed columns:");
    console.log(Object.keys(json.paths['/'].get.parameters.find((p: any) => p.name === 'select') || {}));
    console.log("Let's just print the properties definition:");
    console.log(JSON.stringify(json.definitions.expenses.properties, null, 2));
  } else {
    console.log("Failed to fetch OPTIONS", res.status);
  }
}

fetchSchema();
