import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    // Get all users for debugging
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('*');

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      count: users?.length || 0,
      users: users?.map(u => ({
        id: u.id,
        nome: u.nome,
        email: u.email,
        tipo_usuario: u.tipo_usuario,
        ativo: u.ativo,
        senha_hash_length: u.senha_hash?.length || 0,
      })) || [],
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
