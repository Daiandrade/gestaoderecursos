/**
 * Cria a collection "budgets" em um banco Appwrite já existente, caso ainda não exista.
 *
 * Diagnóstico mostrou que resources/products/expenses existem mas "budgets" retorna 404 -
 * a tela de Budget (e agora Resources, que passou a consultar budgets) quebra por isso.
 *
 * Como usar:
 *   cd setup
 *   node create-budgets-collection.js
 */
require('dotenv').config();
const { Client, Databases, Permission, Role } = require('node-appwrite');

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
  console.log('  Criando collection "budgets"');
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
    console.log('\n💵 Configurando collection: budgets');

    await ignoreIfExists(
      databases.createCollection(
        DATABASE_ID,
        COL,
        'Budgets',
        [
          Permission.read(Role.users()),
          Permission.create(Role.users()),
          Permission.update(Role.users()),
          Permission.delete(Role.users())
        ],
        false,
        true
      ),
      'Collection "Budgets"'
    );

    await ignoreIfExists(
      databases.createStringAttribute(DATABASE_ID, COL, 'description', 1000, false),
      'Attribute: description'
    );
    await ignoreIfExists(
      databases.createStringAttribute(DATABASE_ID, COL, 'requested_by', 150, true),
      'Attribute: requested_by'
    );
    await ignoreIfExists(
      databases.createStringAttribute(DATABASE_ID, COL, 'approved_by', 150, false),
      'Attribute: approved_by'
    );
    await ignoreIfExists(
      databases.createDatetimeAttribute(DATABASE_ID, COL, 'approval_date', false),
      'Attribute: approval_date'
    );
    await ignoreIfExists(
      databases.createDatetimeAttribute(DATABASE_ID, COL, 'period_start', true),
      'Attribute: period_start'
    );
    await ignoreIfExists(
      databases.createDatetimeAttribute(DATABASE_ID, COL, 'period_end', true),
      'Attribute: period_end'
    );
    await ignoreIfExists(
      databases.createIntegerAttribute(DATABASE_ID, COL, 'approved_resources', false, 0, 10000, 0),
      'Attribute: approved_resources'
    );
    await ignoreIfExists(
      databases.createFloatAttribute(DATABASE_ID, COL, 'amount_usd', true, 0),
      'Attribute: amount_usd'
    );
    await ignoreIfExists(
      databases.createFloatAttribute(DATABASE_ID, COL, 'exchange_rate', true, 0),
      'Attribute: exchange_rate'
    );
    await ignoreIfExists(
      databases.createFloatAttribute(DATABASE_ID, COL, 'amount_brl', true, 0),
      'Attribute: amount_brl'
    );
    await ignoreIfExists(
      databases.createStringAttribute(DATABASE_ID, COL, 'created_by', 50, false),
      'Attribute: created_by'
    );
    await ignoreIfExists(
      databases.createStringAttribute(DATABASE_ID, COL, 'created_by_name', 100, false),
      'Attribute: created_by_name'
    );
    await ignoreIfExists(
      databases.createIntegerAttribute(DATABASE_ID, COL, 'month', false, 1, 12, 1),
      'Attribute: month'
    );
    await ignoreIfExists(
      databases.createIntegerAttribute(DATABASE_ID, COL, 'year', false, 2000, 9999, new Date().getFullYear()),
      'Attribute: year'
    );
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

    await waitForAttribute('description');
    await waitForAttribute('requested_by');
    await waitForAttribute('approved_by');
    await waitForAttribute('approval_date');
    await waitForAttribute('period_start');
    await waitForAttribute('period_end');
    await waitForAttribute('approved_resources');
    await waitForAttribute('amount_usd');
    await waitForAttribute('exchange_rate');
    await waitForAttribute('amount_brl');
    await waitForAttribute('created_by');
    await waitForAttribute('created_by_name');
    await waitForAttribute('month');
    await waitForAttribute('year');
    await waitForAttribute('month_end');
    await waitForAttribute('year_end');
    await waitForAttribute('monthly_values');

    await ignoreIfExists(
      databases.createIndex(DATABASE_ID, COL, 'period_index', 'key', ['period_start'], ['DESC']),
      'Index: period_index'
    );
    await ignoreIfExists(
      databases.createIndex(DATABASE_ID, COL, 'month_year_index', 'key', ['year', 'month'], ['DESC', 'DESC']),
      'Index: month_year_index'
    );

    console.log('\n============================================================');
    console.log('  ✅ Concluído! Collection "budgets" disponível.');
    console.log('============================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Erro durante a execução:', err.message);
    process.exit(1);
  }
}

main();
