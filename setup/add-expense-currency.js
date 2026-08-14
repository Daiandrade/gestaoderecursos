/**
 * Adiciona escolha de moeda + cotação manual por despesa em um banco Appwrite já existente
 *
 * Cria:
 *   - expenses.currency       (string, opcional, 'USD' ou 'BRL' — ausente = tratado como 'USD')
 *   - expenses.exchange_rate  (float, opcional — cotação definida manualmente pelo usuário
 *                              no lançamento; ausente = cai no fallback da cotação do budget)
 *
 * Como usar:
 *   cd setup
 *   node add-expense-currency.js
 */
require('dotenv').config();
const { Client, Databases } = require('node-appwrite');

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const DATABASE_ID = process.env.DATABASE_ID || 'gestao_recursos';

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

async function addCurrencyToExpenses() {
  console.log('\n💱 Adicionando currency/exchange_rate em expenses...');
  await ignoreIfExists(
    databases.createStringAttribute(DATABASE_ID, 'expenses', 'currency', 3, false),
    'Attribute: expenses.currency'
  );
  await ignoreIfExists(
    databases.createFloatAttribute(DATABASE_ID, 'expenses', 'exchange_rate', false),
    'Attribute: expenses.exchange_rate'
  );
  await waitForAttribute('expenses', 'currency');
  await waitForAttribute('expenses', 'exchange_rate');
}

async function main() {
  console.log('============================================================');
  console.log('  Adicionando moeda/cotação manual em Despesas');
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
    await addCurrencyToExpenses();

    console.log('\n============================================================');
    console.log('  ✅ Concluído! expenses.currency e expenses.exchange_rate disponíveis.');
    console.log('============================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Erro durante a execução:', err.message);
    process.exit(1);
  }
}

main();
