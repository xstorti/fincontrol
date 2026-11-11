import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { hashPassword } from '@/lib/auth';

export async function POST(req: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Not available in production' },
      { status: 403 }
    );
  }

  try {
    console.log('Starting data initialization...');

    // Hash passwords
    const adminPassword = await hashPassword('admin123');
    const userPassword = await hashPassword('user123');

    // 1. Insert users
    console.log('Inserting users...');
    const { error: usersError } = await supabaseAdmin
      .from('users')
      .upsert([
        {
          id: 1,
          nome: 'Pai',
          email: 'pai@familia.com',
          senha_hash: adminPassword,
          tipo_usuario: 'admin',
          ativo: true,
        },
        {
          id: 2,
          nome: 'Mãe',
          email: 'mae@familia.com',
          senha_hash: adminPassword,
          tipo_usuario: 'admin',
          ativo: true,
        },
        {
          id: 3,
          nome: 'Filha',
          email: 'filha@familia.com',
          senha_hash: userPassword,
          tipo_usuario: 'user',
          ativo: true,
        },
      ]);

    if (usersError) {
      console.error('Users error:', usersError);
      return NextResponse.json({ error: usersError.message }, { status: 500 });
    }

    // 2. Insert credits
    console.log('Inserting credits...');
    const { error: creditsError } = await supabaseAdmin
      .from('credits')
      .insert([
        {
          usuario_id: 3,
          data_creditada: new Date().toISOString().split('T')[0],
          valor: 10000,
          descricao: 'Mesada inicial',
          admin_que_adicionou: 1,
        },
      ]);

    if (creditsError) {
      console.error('Credits error:', creditsError);
      return NextResponse.json({ error: creditsError.message }, { status: 500 });
    }

    // 3. Insert email config
    console.log('Inserting email config...');
    const { error: emailError } = await supabaseAdmin
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
      ]);

    if (emailError) {
      console.error('Email config error:', emailError);
      return NextResponse.json({ error: emailError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Data initialized successfully',
    });
  } catch (error: any) {
    console.error('Initialization error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
