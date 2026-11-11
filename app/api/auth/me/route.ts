import { NextRequest, NextResponse } from 'next/server';
import { withAuth, createErrorResponse } from '@/lib/middleware';
import { readCsv } from '@/lib/csv';
import { User, ApiResponse } from '@/types';

export async function GET(req: NextRequest) {
  try {
    const { user, error } = await withAuth(req);

    if (!user || error) {
      return createErrorResponse('Não autenticado', 401);
    }

    // Get user details from CSV
    const users = readCsv<User>('users.csv');
    const userDetails = users.find((u) => u.id === user.id);

    if (!userDetails) {
      return createErrorResponse('Usuário não encontrado', 404);
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          id: userDetails.id,
          nome: userDetails.nome,
          email: userDetails.email,
          tipo_usuario: userDetails.tipo_usuario,
        },
      } as ApiResponse<any>,
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Get user error:', error);
    return createErrorResponse('Erro ao obter usuário', 500);
  }
}
