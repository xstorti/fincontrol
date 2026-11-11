#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

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

async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

async function initializeData() {
  console.log('🚀 Starting Supabase data initialization...\n');

  try {
    // Hash passwords
    const adminPasswordHash = await hashPassword('admin123');
    const userPasswordHash = await hashPassword('user123');

    console.log('📝 Passwords hashed');

    // 1. Insert users
    console.log('👥 Inserting users...');
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .upsert([
        {
          id: 1,
          nome: 'Pai',
          email: 'pai@familia.com',
          senha_hash: adminPasswordHash,
          tipo_usuario: 'admin',
          ativo: true,
        },
        {
          id: 2,
          nome: 'Mãe',
          email: 'mae@familia.com',
          senha_hash: adminPasswordHash,
          tipo_usuario: 'admin',
          ativo: true,
        },
        {
          id: 3,
          nome: 'Filha',
          email: 'filha@familia.com',
          senha_hash: userPasswordHash,
          tipo_usuario: 'user',
          ativo: true,
        },
      ])
      .select();

    if (usersError) {
      console.error('❌ Users error:', usersError);
      return;
    }
    console.log('✅ Users inserted:', usersData?.length || 0);

    // 2. Insert credits
    console.log('💰 Inserting credits...');
    const { data: creditsData, error: creditsError } = await supabase
      .from('credits')
      .insert([
        {
          usuario_id: 3,
          data_creditada: new Date().toISOString().split('T')[0],
          valor: 10000,
          descricao: 'Mesada inicial',
          admin_que_adicionou: 1,
        },
      ])
      .select();

    if (creditsError) {
      console.error('❌ Credits error:', creditsError);
      return;
    }
    console.log('✅ Credits inserted:', creditsData?.length || 0);

    // 3. Insert email config
    console.log('📧 Inserting email config...');
    const { data: emailData, error: emailError } = await supabase
      .from('email_config')
      .upsert([
        {
          email: 'pai@familia.com',
          notifica_despesa: true,
          notifica_credito: true,
          ativo: true,
        },
        {
          email: 'mae@familia.com',
          notifica_despesa: true,
          notifica_credito: true,
          ativo: true,
        },
      ])
      .select();

    if (emailError) {
      console.error('❌ Email config error:', emailError);
      return;
    }
    console.log('✅ Email config inserted:', emailData?.length || 0);

    // 4. Verify data
    console.log('\n🔍 Verifying data...');
    const { data: allUsers } = await supabase.from('users').select('*');
    console.log(`✅ Total users: ${allUsers?.length || 0}`);
    console.log('Users:');
    allUsers?.forEach(u => {
      console.log(`  - ${u.nome} (${u.email}) [${u.tipo_usuario}]`);
    });

    console.log('\n✨ Data initialization completed successfully!\n');
  } catch (error) {
    console.error('❌ Initialization error:', error);
  }
}

initializeData();
