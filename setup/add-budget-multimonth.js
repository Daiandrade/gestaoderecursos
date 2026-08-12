/**
 * Adiciona os atributos "month_end", "year_end" e "monthly_values" à collection "budgets"
 * já existente em produção, permitindo que um único registro cubra vários meses (um valor
 * aprovado por mês dentro do período), e migra os documentos existentes para o novo formato.
 *
 * Como usar:
 *   cd setup
 *   node add-budget-multimonth.js
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
  console.log('  Adicionando month_end/year_end/monthly_values à collection "budgets"');
  console.log('============================================================');

  if (!process.env.APPWRITE_API_KEY || process.env.APPWRITE_API_KEY.includes('cole_aqui')) {
    console.error('\n❌ ERRO: APPWRITE_API_KEY não configurada no arquivo .env');
    process.exit(1);
  }

  try {
    await ignoreIfExists(
      databases.createIntegerAttribute(DATABASE_ID, COL, 'month_end', false, 1, 12, 1),
      'Attribute: month_end'
    );
    await ignoreIfExists(
      databases.createIntegerAttribute(DATABASE_ID, COL, 'year_end', false, 2000, 9999, new Date().getFullYear()),
      'Attribute: year_end'
    );
    await ignoreIfExists(
      databases.createStringAttribute(DATABASE_ID, COL, 'monthly_values', 4000, false),
      'Attribute: monthly_values'
    );

    await waitForAttribute('month_end');
    await waitForAttribute('year_end');
    await waitForAttribute('monthly_values');

    console.log('\n📦 Migrando documentos existentes (month_end/year_end/monthly_values a partir de month/year/amount_usd)...');
    const res = await databases.listDocuments(DATABASE_ID, COL, []);
    for (const budget of res.documents) {
      if (budget.monthly_values) {
        console.log(`  · ${budget.$id} já tem monthly_values, pulando`);
        continue;
      }
      const month = budget.month || 1;
      const year = budget.year || new Date().getFullYear();
      const monthlyValues = JSON.stringify([{ month, year, amount_usd: parseFloat(budget.amount_usd) || 0 }]);
      await databases.updateDocument(DATABASE_ID, COL, budget.$id, {
        month_end: month,
        year_end: year,
        monthly_values: monthlyValues
      });
      console.log(`  ✓ ${budget.$id} → month_end: ${month}, year_end: ${year}, monthly_values: ${monthlyValues}`);
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
