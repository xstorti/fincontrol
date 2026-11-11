import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, createErrorResponse } from '@/lib/middleware';
import { getFamilyStats } from '@/lib/kpi';
import { ApiResponse } from '@/types';

interface FamilyStats {
  total_usuarios: number;
  gasto_total_7_dias: number;
  saldo_total: number;
}

export async function GET(req: NextRequest) {
  try {
    const { user, error } = await withAdminAuth(req);

    if (!user || error) {
      return createErrorResponse('Acesso negado', 403);
    }

    const stats = getFamilyStats();

    return NextResponse.json(
      {
        success: true,
        data: stats,
      } as ApiResponse<FamilyStats>,
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Get stats error:', error);
    return createErrorResponse('Erro ao obter estatísticas', 500);
  }
}
