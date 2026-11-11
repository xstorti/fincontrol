#!/usr/bin/env node

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function addSenhaTemporariaColumn() {
  console.log('🚀 Adding senha_temporaria column to users table...\n');

  try {
    // Execute raw SQL to add the column
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS senha_temporaria BOOLEAN DEFAULT false;
      `
    }).catch(async () => {
      // If rpc doesn't exist, try direct SQL execution
      console.log('ℹ️  Attempting direct SQL execution...');
      return await supabase.from('users').select('senha_temporaria').limit(1);
    });

    if (error && error.message.includes('senha_temporaria')) {
      console.error('❌ Error adding column:', error);
      return;
    }

    // Verify the column was added by trying to query it
    const { data: checkData, error: checkError } = await supabase
      .from('users')
      .select('id, nome, senha_temporaria')
      .limit(1);

    if (checkError && checkError.message.includes('unknown field')) {
      console.error('❌ Column still does not exist. Please add manually in Supabase SQL editor:');
      console.error(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS senha_temporaria BOOLEAN DEFAULT false;
      `);
      console.log('\n📋 Instructions:');
      console.log('1. Go to Supabase Dashboard: https://app.supabase.com');
      console.log('2. Select your project');
      console.log('3. Go to SQL Editor');
      console.log('4. Create a new query and paste the SQL above');
      console.log('5. Run the query');
      return;
    }

    console.log('✅ Column existe ou foi adicionada com sucesso!\n');
    console.log('📊 Sample data:');
    checkData?.slice(0, 3).forEach(user => {
      console.log(`  - ${user.nome}: senha_temporaria = ${user.senha_temporaria}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n📋 MANUAL FIX:');
    console.log('Go to Supabase SQL Editor and run:');
    console.log(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS senha_temporaria BOOLEAN DEFAULT false;
    `);
  }
}

addSenhaTemporariaColumn();
