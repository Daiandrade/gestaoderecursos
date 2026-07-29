#!/usr/bin/env node

/**
 * Script de Migração de Dados no Appwrite
 *
 * Este script atualiza os recursos existentes no Appwrite para usar os novos status:
 * - active → ativo
 * - inactive → inativo
 *
 * IMPORTANTE: Execute este script APÓS atualizar os atributos da coleção no painel Appwrite!
 *
 * Uso: node migrate-appwrite.js
 */

require('dotenv').config({ path: './frontend/.env' });
const { Client, Databases, Query } = require('appwrite');

const client = new Client()
  .setEndpoint(process.env.REACT_APP_APPWRITE_ENDPOINT)
  .setProject(process.env.REACT_APP_APPWRITE_PROJECT_ID);

const databases = new Databases(client);

const DATABASE_ID = process.env.REACT_APP_APPWRITE_DATABASE_ID;
const RESOURCES_COLLECTION = process.env.REACT_APP_APPWRITE_RESOURCES_COLLECTION;

async function migrateResources() {
  console.log('\n========================================');
  console.log('  MIGRAÇÃO DE DADOS NO APPWRITE');
  console.log('========================================\n');

  console.log('Configuração:');
  console.log(`  Endpoint: ${process.env.REACT_APP_APPWRITE_ENDPOINT}`);
  console.log(`  Project ID: ${process.env.REACT_APP_APPWRITE_PROJECT_ID}`);
  console.log(`  Database: ${DATABASE_ID}`);
  console.log(`  Collection: ${RESOURCES_COLLECTION}\n`);

  try {
    // Buscar todos os recursos
    console.log('📥 Buscando recursos existentes...');
    const response = await databases.listDocuments(
      DATABASE_ID,
      RESOURCES_COLLECTION,
      [Query.limit(500)]
    );

    const resources = response.documents;
    console.log(`✓ Encontrados ${resources.length} recursos\n`);

    if (resources.length === 0) {
      console.log('ℹ️  Nenhum recurso para migrar.');
      return;
    }

    let updated = 0;
    let errors = 0;
    let skipped = 0;

    console.log('🔄 Atualizando recursos...\n');

    for (const resource of resources) {
      const oldStatus = resource.status;
      let newStatus;

      // Converter status antigo para novo
      if (oldStatus === 'active') {
        newStatus = 'ativo';
      } else if (oldStatus === 'inactive') {
        newStatus = 'inativo';
      } else if (['ativo', 'urgente', 'inativo'].includes(oldStatus)) {
        // Já está no novo formato
        console.log(`  ⏭️  ${resource.name} - Status já atualizado (${oldStatus})`);
        skipped++;
        continue;
      } else {
        console.log(`  ⚠️  ${resource.name} - Status desconhecido: ${oldStatus}, convertendo para 'ativo'`);
        newStatus = 'ativo';
      }

      try {
        await databases.updateDocument(
          DATABASE_ID,
          RESOURCES_COLLECTION,
          resource.$id,
          {
            status: newStatus,
            // Adicionar valores padrão para novos campos se não existirem
            start_date: resource.start_date || null,
            end_date: resource.end_date || null,
            planned_value: resource.planned_value || 0
          }
        );

        console.log(`  ✓ ${resource.name} - ${oldStatus} → ${newStatus}`);
        updated++;
      } catch (error) {
        console.error(`  ✗ ${resource.name} - Erro: ${error.message}`);
        errors++;
      }
    }

    console.log('\n========================================');
    console.log('  MIGRAÇÃO CONCLUÍDA');
    console.log('========================================\n');
    console.log(`✓ Atualizados: ${updated}`);
    console.log(`⏭️  Já estavam corretos: ${skipped}`);
    if (errors > 0) {
      console.log(`✗ Erros: ${errors}`);
    }
    console.log(`\nTotal processado: ${resources.length}`);

    if (errors > 0) {
      console.log('\n⚠️  Alguns recursos não foram atualizados. Verifique os erros acima.');
      console.log('   Possível causa: Os atributos da coleção ainda não foram atualizados no Appwrite.');
      console.log('   Consulte: ATUALIZAR-APPWRITE.md\n');
      process.exit(1);
    } else {
      console.log('\n🎉 Todos os recursos foram migrados com sucesso!');
      console.log('   Agora você pode usar o sistema normalmente.\n');
      process.exit(0);
    }

  } catch (error) {
    console.error('\n========================================');
    console.error('  ERRO NA MIGRAÇÃO');
    console.error('========================================\n');
    console.error('Detalhes:', error.message);

    if (error.code === 401) {
      console.error('\n⚠️  Erro de autenticação!');
      console.error('   Verifique se o Project ID está correto no arquivo .env\n');
    } else if (error.code === 404) {
      console.error('\n⚠️  Database ou Collection não encontrado!');
      console.error('   Verifique os IDs no arquivo frontend/.env\n');
    } else if (error.message.includes('Attribute')) {
      console.error('\n⚠️  Os atributos da coleção ainda não foram atualizados!');
      console.error('   Execute os passos do arquivo: ATUALIZAR-APPWRITE.md');
      console.error('   Atualize o atributo "status" no painel Appwrite primeiro.\n');
    }

    process.exit(1);
  }
}

// Executar migração
console.log('\n⚠️  ATENÇÃO: Este script irá atualizar os dados no Appwrite!');
console.log('   Certifique-se de que você já atualizou os atributos da coleção');
console.log('   conforme descrito em ATUALIZAR-APPWRITE.md\n');

migrateResources();
