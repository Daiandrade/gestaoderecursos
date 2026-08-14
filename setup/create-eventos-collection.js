/**
 * Cria a collection do addon "Gestor de Calendário e Eventos" em um banco Appwrite
 * já existente, caso ainda não exista: eventos.
 *
 * Como usar:
 *   cd setup
 *   node create-eventos-collection.js
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

async function createEventos() {
  const col = 'eventos';
  console.log('\n📅 Configurando collection: eventos');

  await ignoreIfExists(
    databases.createCollection(
      DATABASE_ID,
      col,
      'Eventos',
      [
        Permission.read(Role.users()),
        Permission.create(Role.users()),
        Permission.update(Role.users()),
        Permission.delete(Role.users())
      ],
      false,
      true
    ),
    'Collection "Eventos"'
  );

  await ignoreIfExists(
    databases.createStringAttribute(DATABASE_ID, col, 'nome', 200, true),
    'Attribute: nome'
  );
  await ignoreIfExists(
    databases.createEnumAttribute(DATABASE_ID, col, 'formato', ['presencial', 'remoto'], true),
    'Attribute: formato'
  );
  await ignoreIfExists(
    databases.createDatetimeAttribute(DATABASE_ID, col, 'data_hora', true),
    'Attribute: data_hora'
  );
  await ignoreIfExists(
    databases.createStringAttribute(DATABASE_ID, col, 'responsavel', 200, true),
    'Attribute: responsavel'
  );
  await ignoreIfExists(
    databases.createEnumAttribute(
      DATABASE_ID, col, 'tipo_evento',
      ['reuniao', 'treinamento', 'workshop', 'apresentacao', 'outro'],
      true
    ),
    'Attribute: tipo_evento'
  );
  await ignoreIfExists(
    databases.createEnumAttribute(
      DATABASE_ID, col, 'status',
      ['agendado', 'confirmado', 'cancelado', 'concluido'],
      false, 'agendado'
    ),
    'Attribute: status'
  );
  await ignoreIfExists(
    databases.createEnumAttribute(
      DATABASE_ID, col, 'publico',
      ['clientes', 'parceiros', 'internos', 'todos'],
      true
    ),
    'Attribute: publico'
  );

  await waitForAttribute(col, 'nome');
  await waitForAttribute(col, 'formato');
  await waitForAttribute(col, 'data_hora');
  await waitForAttribute(col, 'responsavel');
  await waitForAttribute(col, 'tipo_evento');
  await waitForAttribute(col, 'status');
  await waitForAttribute(col, 'publico');

  await ignoreIfExists(
    databases.createIndex(DATABASE_ID, col, 'data_hora_index', 'key', ['data_hora'], ['ASC']),
    'Index: data_hora_index'
  );
}

async function main() {
  console.log('============================================================');
  console.log('  Criando collection do addon "Gestor de Calendário e Eventos"');
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
    await createEventos();

    console.log('\n============================================================');
    console.log('  ✅ Concluído! Collection "eventos" disponível.');
    console.log('============================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Erro durante a execução:', err.message);
    process.exit(1);
  }
}

main();
