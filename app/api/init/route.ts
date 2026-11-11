import { NextResponse } from 'next/server';

// ⚠️ TEMPORARY ENDPOINT - DESABILITADO EM PRODUÇÃO
// Este arquivo foi usado apenas para testes locais
// Remova-o antes de fazer deploy em produção

export async function GET() {
  return NextResponse.json(
    { error: 'Endpoint /api/init foi desabilitado' },
    { status: 403 }
  );
}
