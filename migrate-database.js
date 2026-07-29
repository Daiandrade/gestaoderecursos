#!/usr/bin/env node

/**
 * Script de migração do banco de dados
 *
 * Este script atualiza a estrutura da tabela resources para incluir:
 * - Novos status: ativo, urgente, inativo
 * - Período de alocação: start_date, end_date
 * - Valores: planned_value (valor planejado)
 *
 * O valor real (actual_value) é calculado automaticamente das despesas.
 *
 * IMPORTANTE: Execute este script ANTES de iniciar a aplicação
 * se você já tem dados no banco.
 *
 * Uso: node migrate-database.js
 */

const { migrate } = require('./backend/src/config/migrations/add-resource-fields');

console.log('========================================');
console.log('  MIGRAÇÃO DO BANCO DE DADOS');
console.log('========================================\n');

console.log('Esta migração irá:');
console.log('  ✓ Converter status: active → ativo, inactive → inativo');
console.log('  ✓ Adicionar campos: start_date, end_date, planned_value');
console.log('  ✓ Preservar todos os dados existentes\n');

migrate()
  .then(() => {
    console.log('\n========================================');
    console.log('  MIGRAÇÃO CONCLUÍDA COM SUCESSO!');
    console.log('========================================\n');
    console.log('Você pode agora iniciar a aplicação normalmente.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n========================================');
    console.error('  ERRO NA MIGRAÇÃO');
    console.error('========================================\n');
    console.error(err);
    console.error('\nPor favor, verifique o erro acima e tente novamente.');
    process.exit(1);
  });
