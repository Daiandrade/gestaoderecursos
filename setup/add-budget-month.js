/**
 * Adiciona os atributos "month" e "year" à collection "budgets" já existente em produção,
 * e migra os documentos existentes derivando month/year a partir de period_start.
 *
 * Como usar:
 *   cd setup
 *   node add-budget-month.js
 */
require('dotenv').config();
const { Client, Databases } = require('node-appwrite');

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const DATABASE_ID = process.env.DATABASE_ID || 'gesstao_recursos';
const COL = 'budgets';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function waitForAttribute(attrKey, maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const attr = await databases.getAttribute(DATABASE_ID, COL, attrKey);
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

async function main() {
  console.log('============================================================');
  console.log('  Adicionando month/year à collection "budgets"');
  console.log('============================================================');

  if (!process.env.APPWRITE_API_KEY || process.env.APPWRITE_API_KEY.includes('cole_aqui')) {
    console.error('\n❌ ERRO: APPWRITE_API_KEY não configurada no arquivo .env');
    process.exit(1);
  }

  const currentYear = new Date().getFullYear();

  try {
    await ignoreIfExists(
      databases.createIntegerAttribute(DATABASE_ID, COL, 'month', false, 1, 12, 1),
      'Attribute: month'
    );
    await ignoreIfExists(
      databases.createIntegerAttribute(DATABASE_ID, COL, 'year', false, 2000, 9999, currentYear),
      'Attribute: year'
    );

    await waitForAttribute('month');
    await waitForAttribute('year');

    await ignoreIfExists(
      databases.createIndex(DATABASE_ID, COL, 'month_year_index', 'key', ['year', 'month'], ['DESC', 'DESC']),
      'Index: month_year_index'
    );

    console.log('\n📦 Migrando documentos existentes (derivando month/year de period_start)...');
    const res = await databases.listDocuments(DATABASE_ID, COL, []);
    for (const budget of res.documents) {
      if (typeof budget.month === 'number' && typeof budget.year === 'number' && budget.year >= 2000) {
        console.log(`  · ${budget.$id} já tem month/year (${budget.month}/${budget.year}), pulando`);
        continue;
      }
      const start = new Date(budget.period_start);
      const month = start.getUTCMonth() + 1;
      const year = start.getUTCFullYear();
      await databases.updateDocument(DATABASE_ID, COL, budget.$id, { month, year });
      console.log(`  ✓ ${budget.$id} → month: ${month}, year: ${year}`);
    }

    console.log('\n============================================================');
    console.log('  ✅ Concluído!');
    console.log('============================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Erro durante a execução:', err.message);
    process.exit(1);
  }
}

main();
