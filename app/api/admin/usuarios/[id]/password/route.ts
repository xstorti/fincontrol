import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withAdminAuth, createErrorResponse } from '@/lib/middleware';
import bcrypt from 'bcryptjs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Verify admin access
    const { user: adminUser, error } = await withAdminAuth(request);

    if (!adminUser || error) {
      return createErrorResponse('Apenas admin pode alterar senhas', 403);
    }

    // Get request body
    const body = await request.json();
    const { nova_senha, gerar_temporaria } = body;

    if (!nova_senha && !gerar_temporaria) {
      return createErrorResponse('Forneça nova_senha ou gerar_temporaria', 400);
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
      .eq('id', id);

    if (updateError) {
      console.error('Update error:', updateError);
      return createErrorResponse('Erro ao atualizar senha', 500);
    }

    return NextResponse.json({
      message: 'Senha alterada com sucesso',
      data: {
        usuario_id: id,
        senha_temporaria: gerar_temporaria ? true : false,
        temp_password: tempPassword, // Return generated password if created
      },
    });
  } catch (error: any) {
    console.error('Error:', error);
    return createErrorResponse(error.message || 'Erro ao alterar senha', 500);
  }
}
