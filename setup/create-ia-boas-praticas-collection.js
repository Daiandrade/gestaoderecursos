/**
 * Cria a collection do addon "IA - Boas Práticas" em um banco Appwrite já existente,
 * caso ainda não exista: ia_boas_praticas.
 *
 * Como usar:
 *   cd setup
 *   node create-ia-boas-praticas-collection.js
 */
require('dotenv').config();
const { Client, Databases, Permission, Role } = require('node-appwrite');

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const DATABASE_ID = process.env.DATABASE_ID || 'gesstao_recursos';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function waitForAttribute(col, attrKey, maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const attr = await databases.getAttribute(DATABASE_ID, col, attrKey);
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

// createStringAttribute valida o limite de tamanho da linha ANTES de checar se o
// atributo já existe, então uma tentativa de recriar um atributo grande já existente
// falha com "maximum size reached" em vez de 409. Por isso checamos existência primeiro.
async function createStringAttributeIfMissing(col, key, size, required) {
  try {
    await databases.getAttribute(DATABASE_ID, col, key);
    console.log(`  · Attribute: ${key} (já existia)`);
  } catch (err) {
    if (err.code !== 404) throw err;
    await ignoreIfExists(
      databases.createStringAttribute(DATABASE_ID, col, key, size, required),
      `Attribute: ${key}`
    );
  }
}

async function createIaBoasPraticas() {
  const col = 'ia_boas_praticas';
  console.log('\n🤖 Configurando collection: ia_boas_praticas');

  await ignoreIfExists(
    databases.createCollection(
      DATABASE_ID,
      col,
      'IA - Boas Práticas',
      [
        Permission.read(Role.users()),
        Permission.create(Role.users()),
        Permission.update(Role.users()),
        Permission.delete(Role.users())
      ],
      false,
      true
    ),
    'Collection "IA - Boas Práticas"'
  );

  await createStringAttributeIfMissing(col, 'titulo', 200, true);
  await createStringAttributeIfMissing(col, 'prompt', 10000, true);
  await createStringAttributeIfMissing(col, 'skill_texto', 50000, true);
  await createStringAttributeIfMissing(col, 'funcionalidade', 2000, true);
  await createStringAttributeIfMissing(col, 'beneficio', 2000, true);
  await createStringAttributeIfMissing(col, 'como_usar', 1000, true);
  await createStringAttributeIfMissing(col, 'autor_user_id', 100, true);
  await createStringAttributeIfMissing(col, 'autor_nome', 200, true);

  await waitForAttribute(col, 'titulo');
  await waitForAttribute(col, 'prompt');
  await waitForAttribute(col, 'skill_texto');
  await waitForAttribute(col, 'funcionalidade');
  await waitForAttribute(col, 'beneficio');
  await waitForAttribute(col, 'como_usar');
  await waitForAttribute(col, 'autor_user_id');
  await waitForAttribute(col, 'autor_nome');
}

async function main() {
  console.log('============================================================');
  console.log('  Criando collection do addon "IA - Boas Práticas"');
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
    await createIaBoasPraticas();

    console.log('\n============================================================');
    console.log('  ✅ Concluído! Collection "ia_boas_praticas" disponível.');
    console.log('============================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Erro durante a execução:', err.message);
    process.exit(1);
  }
}

main();
