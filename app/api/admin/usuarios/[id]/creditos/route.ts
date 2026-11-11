import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, createErrorResponse } from '@/lib/middleware';
import { supabaseAdmin } from '@/lib/supabase';
import { ApiResponse, Credit } from '@/types';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, error } = await withAdminAuth(req);

    if (!user || error) {
      return createErrorResponse('Acesso negado', 403);
    }

    const { id } = params;

    // Get user's credits
    const { data: credits, error: fetchError } = await supabaseAdmin
      .from('credits')
      .select('*')
      .eq('usuario_id', parseInt(id))
      .order('data_creditada', { ascending: false });

    if (fetchError) {
      console.error('Fetch error:', fetchError);
      return createErrorResponse('Erro ao buscar créditos', 500);
    }

    const response: ApiResponse<Credit[]> = {
      success: true,
      data: credits || [],
    };

    return NextResponse.json(response);
  } catch (err: any) {
    console.error('Error:', err);
    return createErrorResponse(err.message || 'Erro ao buscar créditos', 500);
  }
}
