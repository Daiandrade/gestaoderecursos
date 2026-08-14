/**
 * Cria a collection do addon "Gestor de Calendário e Eventos" em um banco Appwrite
 * já existente, caso ainda não exista: grupos_tributarios.
 *
 * Como usar:
 *   cd setup
 *   node create-grupos-collection.js
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

async function createGrupos() {
  const col = 'grupos_tributarios';
  console.log('\n👥 Configurando collection: grupos_tributarios');

  await ignoreIfExists(
    databases.createCollection(
      DATABASE_ID,
      col,
      'Grupos Tributários e Piloto Governo',
      [
        Permission.read(Role.users()),
        Permission.create(Role.users()),
        Permission.update(Role.users()),
        Permission.delete(Role.users())
      ],
      false,
      true
    ),
    'Collection "Grupos Tributários e Piloto Governo"'
  );

  await ignoreIfExists(
    databases.createStringAttribute(DATABASE_ID, col, 'nome', 200, true),
    'Attribute: nome'
  );
  await ignoreIfExists(
    databases.createEnumAttribute(DATABASE_ID, col, 'tipo', ['tributario', 'piloto_governo'], true),
    'Attribute: tipo'
  );
  await ignoreIfExists(
    databases.createStringAttribute(DATABASE_ID, col, 'responsavel', 200, true),
    'Attribute: responsavel'
  );
  await ignoreIfExists(
    databases.createStringAttribute(DATABASE_ID, col, 'participantes_fixos', 3000, false),
    'Attribute: participantes_fixos'
  );
  await ignoreIfExists(
    databases.createStringAttribute(DATABASE_ID, col, 'participantes_suplentes', 3000, false),
    'Attribute: participantes_suplentes'
  );

  await waitForAttribute(col, 'nome');
  await waitForAttribute(col, 'tipo');
  await waitForAttribute(col, 'responsavel');
  await waitForAttribute(col, 'participantes_fixos');
  await waitForAttribute(col, 'participantes_suplentes');
}

async function main() {
  console.log('============================================================');
  console.log('  Criando collection "Grupos Tributários e Piloto Governo"');
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
    await createGrupos();

    console.log('\n============================================================');
    console.log('  ✅ Concluído! Collection "grupos_tributarios" disponível.');
    console.log('============================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Erro durante a execução:', err.message);
    process.exit(1);
  }
}

main();
