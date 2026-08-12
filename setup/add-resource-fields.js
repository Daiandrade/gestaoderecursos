/**
 * Adiciona atributos de período/valor planejado em "resources", que o frontend
 * sempre gravou (start_date, end_date, planned_value) mas nunca foram criados
 * no schema do Appwrite - causa do erro "Unknown attribute" ao salvar recurso/budget.
 *
 * Como usar:
 *   cd setup
 *   node add-resource-fields.js
 */
require('dotenv').config();
const { Client, Databases } = require('node-appwrite');

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const DATABASE_ID = process.env.DATABASE_ID || 'gesstao_recursos';
const COL = 'resources';

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
  console.log('  Adicionando start_date / end_date / planned_value em resources');
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
    await ignoreIfExists(
      databases.createDatetimeAttribute(DATABASE_ID, COL, 'start_date', false),
      'Attribute: start_date'
    );
    await ignoreIfExists(
      databases.createDatetimeAttribute(DATABASE_ID, COL, 'end_date', false),
      'Attribute: end_date'
    );
    await ignoreIfExists(
      databases.createFloatAttribute(DATABASE_ID, COL, 'planned_value', false, 0),
      'Attribute: planned_value'
    );

    await waitForAttribute('start_date');
    await waitForAttribute('end_date');
    await waitForAttribute('planned_value');

    console.log('\n============================================================');
    console.log('  ✅ Concluído! resources.start_date/end_date/planned_value disponíveis.');
    console.log('============================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Erro durante a execução:', err.message);
    process.exit(1);
  }
}

main();
