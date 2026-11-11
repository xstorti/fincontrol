import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // Verify JWT token
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Verify JWT
    const secret = process.env.JWT_SECRET;
    let decoded: any;
    try {
      decoded = jwt.verify(token, secret!) as any;
    } catch {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    // Get request body
    const body = await request.json();
    const { senha_atual, nova_senha } = body;

    if (!senha_atual || !nova_senha) {
      return NextResponse.json(
        { error: 'Forneça senha_atual e nova_senha' },
        { status: 400 }
      );
    }

    if (nova_senha.length < 6) {
      return NextResponse.json(
        { error: 'Nova senha deve ter pelo menos 6 caracteres' },
        { status: 400 }
      );
    }

    // Get current user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', decoded.userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Verify current password
    const passwordMatch = await bcrypt.compare(senha_atual, user.senha_hash);
    if (!passwordMatch) {
      return NextResponse.json({ error: 'Senha atual incorreta' }, { status: 401 });
    }

    // Hash new password
    const novasenhaHash = await bcrypt.hash(nova_senha, 10);

    // Update user password
    const { error: updateError } = await supabase
      .from('users')
      .update({
        senha_hash: novasenhaHash,
        senha_temporaria: false, // Mark as non-temporary
      })
      .eq('id', decoded.userId);

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json({ error: 'Erro ao atualizar senha' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Senha alterada com sucesso',
    });
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
