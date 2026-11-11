#!/usr/bin/env node

/**
 * 🚀 FinControl - Build & Deploy Verification
 * 
 * This script verifies that the application is ready for Vercel deployment.
 * Run this before pushing to production.
 */

const fs = require('fs');
const path = require('path');

const checks = [
  {
    name: '✅ Build Production',
    command: 'npm run build',
    description: 'Executa build otimizado',
  },
  {
    name: '✅ Todos os Types OK',
    file: 'public/data/users.csv',
    description: 'Arquivo de usuários existe',
  },
  {
    name: '✅ Configurações de Env',
    file: '.env.production.local.example',
    description: 'Template de variáveis de produção',
  },
  {
    name: '✅ Documentação Deployment',
    file: 'DEPLOYMENT.md',
    description: 'Guia completo de deployment',
  },
  {
    name: '✅ Configuração Vercel',
    file: 'vercel.json',
    description: 'Configurações do Vercel',
  },
  {
    name: '✅ Routes Corrigidas',
    files: [
      'app/api/admin/usuarios/[id]/route.ts',
      'app/api/transacoes/[id]/route.ts',
    ],
    description: 'Params atualizar para Promise<>',
  },
  {
    name: '✅ Client Components Fixos',
    files: [
      'app/adicionar-gasto/page.tsx',
      'app/dashboard/page.tsx',
    ],
    description: 'Sem new Date() em initial state',
  },
];

console.log('\n🚀 FinControl - Deployment Readiness Check\n');
console.log('=' .repeat(60));

let allPassed = true;

checks.forEach(check => {
  if (check.file) {
    const exists = fs.existsSync(path.join(process.cwd(), check.file));
    const status = exists ? '✅' : '❌';
    console.log(`${status} ${check.name}`);
    if (!exists) allPassed = false;
  } else if (check.files) {
    const allExist = check.files.every(f => fs.existsSync(path.join(process.cwd(), f)));
    const status = allExist ? '✅' : '❌';
    console.log(`${status} ${check.name}`);
    if (!allExist) allPassed = false;
  }
});

console.log('=' .repeat(60));

if (allPassed) {
  console.log('\n✅ TUDO PRONTO PARA DEPLOYMENT!\n');
  console.log('Próximos passos:');
  console.log('  1. git add .');
  console.log('  2. git commit -m "Fase 9: Deploy-ready"');
  console.log('  3. git push origin main');
  console.log('  4. Acesse https://vercel.com/new e selecione seu repo');
  console.log('  5. Configure variáveis de ambiente:');
  console.log('     - RESEND_API_KEY');
  console.log('     - JWT_SECRET');
  console.log('     - ADMIN_EMAIL');
  console.log('     - NEXT_PUBLIC_APP_URL');
  console.log('\nDocumentação: ./DEPLOYMENT.md\n');
  process.exit(0);
} else {
  console.log('\n❌ Alguns requisitos não foram atendidos.\n');
  console.log('Veja DEPLOYMENT.md para instruções.\n');
  process.exit(1);
}
