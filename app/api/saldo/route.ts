import { NextRequest, NextResponse } from 'next/server';
import { withAuth, createErrorResponse } from '@/lib/middleware';
import { calculateKPI, calculateBalance } from '@/lib/kpi';
import { ApiResponse, KPI } from '@/types';

export async function GET(req: NextRequest) {
  try {
    const { user, error } = await withAuth(req);

    if (!user || error) {
      return createErrorResponse('Não autenticado', 401);
    }

    // Get query params
    const { searchParams } = new URL(req.url);
    const usuario_id = searchParams.get('usuario_id') || user.id;
    const dias = parseInt(searchParams.get('dias') || '7', 10);

    // Verify user can access this data
    if (usuario_id !== user.id && user.tipo_usuario !== 'admin') {
      return createErrorResponse('Acesso negado', 403);
    }

    // Calculate KPI
    const kpi = calculateKPI(usuario_id, dias);

    return NextResponse.json(
      {
        success: true,
        data: kpi,
      } as ApiResponse<KPI>,
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Get saldo error:', error);
    return createErrorResponse('Erro ao calcular saldo', 500);
  }
}
