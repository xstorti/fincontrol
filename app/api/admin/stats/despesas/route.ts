import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, createErrorResponse } from '@/lib/middleware';
import { supabaseAdmin } from '@/lib/supabase';

async function handler(req: NextRequest) {
  try {
    const { user, error } = await withAdminAuth(req);

    if (!user || error) {
      return createErrorResponse('Acesso negado', 403);
    }

    // Buscar todos os usuários (não-admin)
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, nome')
      .eq('tipo_usuario', 'user')
      .eq('ativo', true);

    if (usersError) throw usersError;

    // Despesas acumuladas por usuário
    const { data: transacoes, error: transError } = await supabaseAdmin
      .from('transactions')
      .select('usuario_id, valor')
      .eq('tipo', 'despesa');

    if (transError) throw transError;

    // Calcular despesas acumuladas por usuário
    const despesasAcumuladas: { usuario_id: string; nome: string; total: number }[] = [];

    users?.forEach((user: any) => {
      const totalUser = transacoes?.reduce((sum: number, t: any) => {
        if (t.usuario_id === user.id) return sum + t.valor;
        return sum;
      }, 0) || 0;

      if (totalUser > 0) {
        despesasAcumuladas.push({
          usuario_id: user.id,
          nome: user.nome,
          total: totalUser,
        });
      }
    });

    // Despesas do dia por usuário
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfDay = today.toISOString();
    today.setHours(23, 59, 59, 999);
    const endOfDay = today.toISOString();

    const { data: transacoesDia, error: transDiaError } = await supabaseAdmin
      .from('transactions')
      .select('usuario_id, valor')
      .eq('tipo', 'despesa')
      .gte('data', startOfDay)
      .lte('data', endOfDay);

    if (transDiaError) throw transDiaError;

    // Calcular despesas do dia por usuário
    const despesasDia: { usuario_id: string; nome: string; total: number }[] = [];

    users?.forEach((user: any) => {
      const totalDia = transacoesDia?.reduce((sum: number, t: any) => {
        if (t.usuario_id === user.id) return sum + t.valor;
        return sum;
      }, 0) || 0;

      if (totalDia > 0) {
        despesasDia.push({
          usuario_id: user.id,
          nome: user.nome,
          total: totalDia,
        });
      }
    });

    return NextResponse.json({
      data: {
        acumuladas: despesasAcumuladas,
        dia: despesasDia,
      },
    });
  } catch (error) {
    console.error('Erro ao buscar despesas:', error);
    return createErrorResponse('Erro ao buscar despesas', 500);
  }
}

export const GET = handler;
