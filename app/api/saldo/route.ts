import { NextRequest, NextResponse } from 'next/server';
import { withAuth, createErrorResponse } from '@/lib/middleware';
import { supabaseAdmin } from '@/lib/supabase';
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

    // Calculate date range
    const dataFim = new Date();
    const dataInicio = new Date();
    dataInicio.setDate(dataInicio.getDate() - dias);
    const dataInicioStr = dataInicio.toISOString().split('T')[0];

    // Get all credits for user
    const { data: credits } = await supabaseAdmin
      .from('credits')
      .select('valor')
      .eq('usuario_id', parseInt(usuario_id));

    // Get all transactions (despesas) for user
    const { data: transactions } = await supabaseAdmin
      .from('transactions')
      .select('valor, data')
      .eq('usuario_id', parseInt(usuario_id))
      .eq('tipo', 'despesa');

    // Get transactions in period
    const { data: transacoesPeriodo } = await supabaseAdmin
      .from('transactions')
      .select('valor, data')
      .eq('usuario_id', parseInt(usuario_id))
      .eq('tipo', 'despesa')
      .gte('data', dataInicioStr);

    // Get transactions from previous period (for variation calculation)
    const dataInicioAnterior = new Date();
    dataInicioAnterior.setDate(dataInicioAnterior.getDate() - dias * 2);
    const dataFimAnterior = new Date();
    dataFimAnterior.setDate(dataFimAnterior.getDate() - dias);
    const dataFimAnteriorStr = dataFimAnterior.toISOString().split('T')[0];
    const dataInicioAnteriorStr = dataInicioAnterior.toISOString().split('T')[0];

    const { data: transacoesPeriodoAnterior } = await supabaseAdmin
      .from('transactions')
      .select('valor')
      .eq('usuario_id', parseInt(usuario_id))
      .eq('tipo', 'despesa')
      .gte('data', dataInicioAnteriorStr)
      .lt('data', dataFimAnteriorStr);

    // Calculate totals
    const totalCredito = (credits || []).reduce((sum, c) => sum + (c.valor || 0), 0);
    const totalGasto = (transactions || []).reduce((sum, t) => sum + (t.valor || 0), 0);
    const gastoPeriorod = (transacoesPeriodo || []).reduce((sum, t) => sum + (t.valor || 0), 0);
    const gastoPeriodoAnterior = (transacoesPeriodoAnterior || []).reduce((sum, t) => sum + (t.valor || 0), 0);
    
    const saldo_atual = totalCredito - totalGasto;
    const media_dia = dias > 0 ? gastoPeriorod / dias : 0;

    // Calculate variation percentage
    const variacao_percentual = gastoPeriodoAnterior > 0 
      ? ((gastoPeriorod - gastoPeriodoAnterior) / gastoPeriodoAnterior) * 100
      : 0;

    // Build daily history for sparkline
    const historioDiario: { data: string; valor: number }[] = [];
    for (let i = dias - 1; i >= 0; i--) {
      const dia = new Date();
      dia.setDate(dia.getDate() - i);
      const diaStr = dia.toISOString().split('T')[0];
      const gastoNoDia = (transacoesPeriodo || [])
        .filter(t => (t.data as string).split('T')[0] === diaStr)
        .reduce((sum, t) => sum + (t.valor || 0), 0);
      historioDiario.push({ data: diaStr, valor: gastoNoDia });
    }

    const kpi: KPI = {
      saldo_atual,
      credito_total: totalCredito,
      gasto_total: totalGasto,
      gasto_periodo: gastoPeriorod,
      media_dia: Math.round(media_dia * 100) / 100,
      periodo_dias: dias,
      variacao_percentual: Math.round(variacao_percentual * 100) / 100,
      historico_diario: historioDiario,
    };

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
