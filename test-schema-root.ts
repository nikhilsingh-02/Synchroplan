import { supabase } from './src/lib/supabase.ts';
import fs from 'fs';

async function fetchSchema() {
  const url = supabase['supabaseUrl'] + '/rest/v1/';
  const apiKey = supabase['supabaseKey'];
  
  const res = await fetch(url + '?apikey=' + apiKey);
  
  if (res.ok) {
    const json = await res.json();
    fs.writeFileSync('schema.json', JSON.stringify(json.definitions.expenses.properties, null, 2));
    console.log("Wrote expenses schema to schema.json");
  } else {
    console.log("Failed", res.status);
  }
}

fetchSchema();
