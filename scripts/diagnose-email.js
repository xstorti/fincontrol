#!/usr/bin/env node

/**
 * Email Service Diagnostics
 * Check if email configuration is working correctly
 */

const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function diagnose() {
  console.log('🔍 FinControl Email Service Diagnostics\n');

  const issues = [];
  const successes = [];

  // Check 1: RESEND_API_KEY
  console.log('1️⃣ Checking RESEND_API_KEY...');
  if (!process.env.RESEND_API_KEY) {
    issues.push('❌ RESEND_API_KEY not configured in environment variables');
    console.log('   ❌ NOT FOUND\n');
  } else {
    successes.push('✅ RESEND_API_KEY is configured');
    console.log('   ✅ FOUND (starts with: ' + process.env.RESEND_API_KEY.substring(0, 8) + '...)\n');
  }

  // Check 2: ADMIN_EMAIL
  console.log('2️⃣ Checking ADMIN_EMAIL...');
  if (!process.env.ADMIN_EMAIL) {
    issues.push('❌ ADMIN_EMAIL not configured');
    console.log('   ❌ NOT FOUND\n');
  } else {
    successes.push('✅ ADMIN_EMAIL is configured');
    console.log('   ✅ FOUND: ' + process.env.ADMIN_EMAIL + '\n');
  }

  // Check 3: Database connection
  console.log('3️⃣ Checking database configuration...');
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    issues.push('❌ Supabase credentials not configured');
    console.log('   ❌ SUPABASE NOT CONFIGURED\n');
  } else {
    successes.push('✅ Supabase is configured');
    console.log('   ✅ SUPABASE CONFIGURED\n');
  }

  // Summary
  console.log('\n📋 Summary:');
  console.log('═'.repeat(50));
  
  if (successes.length > 0) {
    console.log('\n✅ Working:');
    successes.forEach(s => console.log('   ' + s));
  }

  if (issues.length > 0) {
    console.log('\n❌ Issues Found:');
    issues.forEach(i => console.log('   ' + i));
    console.log('\n📌 To fix email notifications:\n');
    console.log('1. Add RESEND_API_KEY to Vercel environment variables');
    console.log('   https://vercel.com/dashboard → Project Settings → Environment Variables\n');
    console.log('2. Make sure email recipients are configured in FinControl');
    console.log('   https://app.vercel.app/admin/emails\n');
    console.log('3. Enable notifications for "Despesas" and "Ativo"\n');
    process.exit(1);
  } else {
    console.log('\n🎉 All email service checks passed!');
    console.log('   Make sure at least one email is configured in /admin/emails\n');
    process.exit(0);
  }
}

diagnose().catch(err => {
  console.error('Error during diagnostics:', err);
  process.exit(1);
});
