import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, createErrorResponse } from '@/lib/middleware';
import { supabaseAdmin } from '@/lib/supabase';
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

    // Get total users
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id');

    if (usersError) {
      return createErrorResponse('Erro ao obter estatísticas', 500);
    }

    // Get expenses from last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const dateStr = sevenDaysAgo.toISOString().split('T')[0];

    const { data: recentExpenses } = await supabaseAdmin
      .from('transactions')
      .select('valor')
      .eq('tipo', 'despesa')
      .gte('data', dateStr);

    // Get all credits and transactions to calculate total balance
    const { data: credits } = await supabaseAdmin
      .from('credits')
      .select('valor');

    const { data: allExpenses } = await supabaseAdmin
      .from('transactions')
      .select('valor')
      .eq('tipo', 'despesa');

    const totalCredito = (credits || []).reduce((sum, c) => sum + (c.valor || 0), 0);
    const totalGasto = (allExpenses || []).reduce((sum, t) => sum + (t.valor || 0), 0);
    const gastoUltimos7 = (recentExpenses || []).reduce((sum, t) => sum + (t.valor || 0), 0);

    const stats: FamilyStats = {
      total_usuarios: users?.length || 0,
      gasto_total_7_dias: gastoUltimos7,
      saldo_total: totalCredito - totalGasto,
    };

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
