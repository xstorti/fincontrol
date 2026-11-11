import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Get current admin user
    const { data: adminUser, error: adminError } = await supabase
      .from('users')
      .select('*')
      .eq('id', decoded.userId)
      .single();

    if (adminError || !adminUser || adminUser.tipo_usuario !== 'admin') {
      return NextResponse.json({ error: 'Apenas admin pode alterar senhas' }, { status: 403 });
    }

    // Get request body
    const body = await request.json();
    const { nova_senha, gerar_temporaria } = body;

    if (!nova_senha && !gerar_temporaria) {
      return NextResponse.json({ error: 'Forneça nova_senha ou gerar_temporaria' }, { status: 400 });
    }

    // Hash new password
    let senhaHash = nova_senha ? await bcrypt.hash(nova_senha, 10) : null;
    
    // If generating temporary password, create a random one
    let tempPassword = null;
    if (gerar_temporaria) {
      tempPassword = Math.random().toString(36).slice(-10);
      senhaHash = await bcrypt.hash(tempPassword, 10);
    }

    // Update user password
    const { error: updateError } = await supabase
      .from('users')
      .update({
        senha_hash: senhaHash,
        senha_temporaria: gerar_temporaria ? true : false,
      })
      .eq('id', params.id);

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json({ error: 'Erro ao atualizar senha' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Senha alterada com sucesso',
      data: {
        usuario_id: params.id,
        senha_temporaria: gerar_temporaria ? true : false,
        temp_password: tempPassword, // Return generated password if created
      },
    });
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
