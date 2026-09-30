const fs = require('fs');
const path = require('path');

// Get environment variables from Vercel
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

// Create the env.js file content
const envContent = `
window.ENV = {
  SUPABASE_URL: '${supabaseUrl}',
  SUPABASE_ANON_KEY: '${supabaseKey}'
};
`;

// Write it to js/env.js
const envPath = path.join(__dirname, 'js', 'env.js');
fs.writeFileSync(envPath, envContent.trim());

console.log('✅ js/env.js created successfully with Vercel environment variables.');
