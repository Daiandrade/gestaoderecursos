/**
 * Cria as collections do addon "Gestão de Consultorias" em um banco Appwrite já existente,
 * caso ainda não existam: consultorias, entregas, agendas.
 *
 * Como usar:
 *   cd setup
 *   node create-consultorias-collections.js
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

async function createConsultorias() {
  const col = 'consultorias';
  console.log('\n📋 Configurando collection: consultorias');

  await ignoreIfExists(
    databases.createCollection(
      DATABASE_ID,
      col,
      'Consultorias',
      [
        Permission.read(Role.users()),
        Permission.create(Role.users()),
        Permission.update(Role.users()),
        Permission.delete(Role.users())
      ],
      false,
      true
    ),
    'Collection "Consultorias"'
  );

  await ignoreIfExists(
    databases.createStringAttribute(DATABASE_ID, col, 'nome', 200, true),
    'Attribute: nome'
  );
  await ignoreIfExists(
    databases.createStringAttribute(DATABASE_ID, col, 'descricao', 1000, false),
    'Attribute: descricao'
  );

  await waitForAttribute(col, 'nome');
  await waitForAttribute(col, 'descricao');
}

async function createEntregas() {
  const col = 'entregas';
  console.log('\n📦 Configurando collection: entregas');

  await ignoreIfExists(
    databases.createCollection(
      DATABASE_ID,
      col,
      'Entregas',
      [
        Permission.read(Role.users()),
        Permission.create(Role.users()),
        Permission.update(Role.users()),
        Permission.delete(Role.users())
      ],
      false,
      true
    ),
    'Collection "Entregas"'
  );

  await ignoreIfExists(
    databases.createStringAttribute(DATABASE_ID, col, 'consultoria_id', 50, true),
    'Attribute: consultoria_id'
  );
  await ignoreIfExists(
    databases.createStringAttribute(DATABASE_ID, col, 'nome', 200, true),
    'Attribute: nome'
  );
  await ignoreIfExists(
    databases.createStringAttribute(DATABASE_ID, col, 'descricao', 1000, false),
    'Attribute: descricao'
  );
  await ignoreIfExists(
    databases.createIntegerAttribute(DATABASE_ID, col, 'quantidade_agendas', true, 1, 1000),
    'Attribute: quantidade_agendas'
  );
  await ignoreIfExists(
    databases.createIntegerAttribute(DATABASE_ID, col, 'limite_participantes', true, 1, 30),
    'Attribute: limite_participantes'
  );

  await waitForAttribute(col, 'consultoria_id');
  await waitForAttribute(col, 'nome');
  await waitForAttribute(col, 'descricao');
  await waitForAttribute(col, 'quantidade_agendas');
  await waitForAttribute(col, 'limite_participantes');

  await ignoreIfExists(
    databases.createIndex(DATABASE_ID, col, 'consultoria_id_index', 'key', ['consultoria_id'], ['ASC']),
    'Index: consultoria_id_index'
  );
}

async function createAgendas() {
  const col = 'agendas';
  console.log('\n🗓️  Configurando collection: agendas');

  await ignoreIfExists(
    databases.createCollection(
      DATABASE_ID,
      col,
      'Agendas',
      [
        Permission.read(Role.users()),
        Permission.create(Role.users()),
        Permission.update(Role.users()),
        Permission.delete(Role.users())
      ],
      false,
      true
    ),
    'Collection "Agendas"'
  );

  await ignoreIfExists(
    databases.createStringAttribute(DATABASE_ID, col, 'entrega_id', 50, true),
    'Attribute: entrega_id'
  );
  await ignoreIfExists(
    databases.createStringAttribute(DATABASE_ID, col, 'tema', 200, true),
    'Attribute: tema'
  );
  await ignoreIfExists(
    databases.createDatetimeAttribute(DATABASE_ID, col, 'data_agenda', false),
    'Attribute: data_agenda'
  );
  await ignoreIfExists(
    databases.createStringAttribute(DATABASE_ID, col, 'participantes', 3000, false),
    'Attribute: participantes'
  );
  await ignoreIfExists(
    databases.createStringAttribute(DATABASE_ID, col, 'ata', 2000, false),
    'Attribute: ata'
  );
  await ignoreIfExists(
    databases.createStringAttribute(DATABASE_ID, col, 'pontos_discutidos', 2000, false),
    'Attribute: pontos_discutidos'
  );
  await ignoreIfExists(
    databases.createStringAttribute(DATABASE_ID, col, 'proximos_passos', 1500, false),
    'Attribute: proximos_passos'
  );

  await waitForAttribute(col, 'entrega_id');
  await waitForAttribute(col, 'tema');
  await waitForAttribute(col, 'data_agenda');
  await waitForAttribute(col, 'participantes');
  await waitForAttribute(col, 'ata');
  await waitForAttribute(col, 'pontos_discutidos');
  await waitForAttribute(col, 'proximos_passos');

  await ignoreIfExists(
    databases.createIndex(DATABASE_ID, col, 'entrega_id_index', 'key', ['entrega_id'], ['ASC']),
    'Index: entrega_id_index'
  );
}

async function main() {
  console.log('============================================================');
  console.log('  Criando collections do addon "Gestão de Consultorias"');
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
    await createConsultorias();
    await createEntregas();
    await createAgendas();

    console.log('\n============================================================');
    console.log('  ✅ Concluído! Collections "consultorias", "entregas" e "agendas" disponíveis.');
    console.log('============================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Erro durante a execução:', err.message);
    process.exit(1);
  }
}

main();
