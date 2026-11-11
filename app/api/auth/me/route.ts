import { NextRequest, NextResponse } from 'next/server';
import { withAuth, createErrorResponse } from '@/lib/middleware';
import { supabaseAdmin } from '@/lib/supabase';
import { User, ApiResponse } from '@/types';

export async function GET(req: NextRequest) {
  try {
    const { user, error } = await withAuth(req);

    if (!user || error) {
      return createErrorResponse('Não autenticado', 401);
    }

    // Get user details from Supabase
    const { data: users, error: dbError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (dbError || !users) {
      return createErrorResponse('Usuário não encontrado', 404);
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          id: users.id,
          nome: users.nome,
          email: users.email,
          tipo_usuario: users.tipo_usuario,
          senha_temporaria: users.senha_temporaria,
        },
      } as ApiResponse<any>,
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Get user error:', error);
    return createErrorResponse('Erro ao obter usuário', 500);
  }
}
