/**
 * Adiciona o vínculo Budget -> Recurso/Despesa em um banco Appwrite já existente
 *
 * Cria:
 *   - resources.budget_id (string, opcional)
 *   - expenses.budget_id  (string, opcional, snapshot do budget do recurso no momento do lançamento)
 *   - índices correspondentes
 *
 * Como usar:
 *   cd setup
 *   node add-budget-link.js
 */
require('dotenv').config();
const { Client, Databases } = require('node-appwrite');

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const DATABASE_ID = process.env.DATABASE_ID || 'gesstao_recursos';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function waitForAttribute(collectionId, attrKey, maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const attr = await databases.getAttribute(DATABASE_ID, collectionId, attrKey);
      if (attr.status === 'available') return true;
    } catch (e) { /* ignore */ }
    await sleep(500);
  }
  return false;
}

async function ignoreIfExists(promise, label) {
  try {
    await promise;
    console.log(`  ✓ ${label}`);
  } catch (err) {
    if (err.code === 409) {
      console.log(`  · ${label} (já existia)`);
    } else {
      console.error(`  ✗ ${label}: ${err.message}`);
      throw err;
    }
  }
}

async function addBudgetLinkToResources() {
  console.log('\n👥 Adicionando budget_id em resources...');
  await ignoreIfExists(
    databases.createStringAttribute(DATABASE_ID, 'resources', 'budget_id', 50, false),
    'Attribute: resources.budget_id'
  );
  await waitForAttribute('resources', 'budget_id');
  await ignoreIfExists(
    databases.createIndex(DATABASE_ID, 'resources', 'budget_id_index', 'key', ['budget_id'], ['ASC']),
    'Index: resources.budget_id_index'
  );
}

async function addBudgetLinkToExpenses() {
  console.log('\n💰 Adicionando budget_id em expenses...');
  await ignoreIfExists(
    databases.createStringAttribute(DATABASE_ID, 'expenses', 'budget_id', 50, false),
    'Attribute: expenses.budget_id'
  );
  await waitForAttribute('expenses', 'budget_id');
  await ignoreIfExists(
    databases.createIndex(DATABASE_ID, 'expenses', 'budget_id_index', 'key', ['budget_id'], ['ASC']),
    'Index: expenses.budget_id_index'
  );
}

async function main() {
  console.log('============================================================');
  console.log('  Adicionando vínculo Budget -> Recurso / Despesa');
  console.log('============================================================');
  console.log(`Endpoint:   ${process.env.APPWRITE_ENDPOINT}`);
  console.log(`Project:    ${process.env.APPWRITE_PROJECT_ID}`);
  console.log(`Database:   ${DATABASE_ID}`);
  console.log('============================================================');

  if (!process.env.APPWRITE_API_KEY || process.env.APPWRITE_API_KEY.includes('cole_aqui')) {
    console.error('\n❌ ERRO: APPWRITE_API_KEY não configurada no arquivo .env');
    process.exit(1);
  }

  try {
    await addBudgetLinkToResources();
    await addBudgetLinkToExpenses();

    console.log('\n============================================================');
    console.log('  ✅ Concluído! resources.budget_id e expenses.budget_id disponíveis.');
    console.log('============================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Erro durante a execução:', err.message);
    process.exit(1);
  }
}

main();
