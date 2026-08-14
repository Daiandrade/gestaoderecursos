/**
 * Adiciona o atributo "addon_ids" à collection "user_profiles" já existente em produção,
 * permitindo que o admin controle quais addons do Hub cada usuário pode acessar. Também
 * faz o backfill dos perfis "product_manager" existentes, dando acesso ao addon "budget"
 * (hoje o único addon), pra ninguém perder acesso ao Gestor de Budget com essa mudança.
 *
 * Como usar:
 *   cd setup
 *   node add-user-addon-access.js
 */
require('dotenv').config();
const { Client, Databases } = require('node-appwrite');

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const DATABASE_ID = process.env.DATABASE_ID || 'gesstao_recursos';
const COL = 'user_profiles';

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
  console.log('  Adicionando "addon_ids" à collection "user_profiles"');
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
      databases.createStringAttribute(DATABASE_ID, COL, 'addon_ids', 255, false),
      'Attribute: addon_ids'
    );

    await waitForAttribute('addon_ids');

    console.log('\n📦 Dando acesso ao addon "budget" pros gerentes de produto existentes...');
    const res = await databases.listDocuments(DATABASE_ID, COL, []);
    for (const profile of res.documents) {
      if (profile.role !== 'product_manager') {
        console.log(`  · ${profile.username || profile.$id} é ${profile.role}, pulando`);
        continue;
      }
      if (profile.addon_ids) {
        console.log(`  · ${profile.username || profile.$id} já tem addon_ids, pulando`);
        continue;
      }
      await databases.updateDocument(DATABASE_ID, COL, profile.$id, { addon_ids: 'budget' });
      console.log(`  ✓ ${profile.username || profile.$id} → addon_ids: budget`);
    }

    console.log('\n============================================================');
    console.log('  ✅ Concluído! user_profiles.addon_ids disponível.');
    console.log('============================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Erro durante a execução:', err.message);
    process.exit(1);
  }
}

main();
