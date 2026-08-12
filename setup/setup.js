/**
 * Setup automático do Appwrite
 * Cria todas as collections, atributos, índices e dados iniciais
 *
 * Como usar:
 *   1. cd setup
 *   2. npm install
 *   3. Criar arquivo .env com APPWRITE_API_KEY (veja .env.example)
 *   4. node setup.js
 */
require('dotenv').config();
const { Client, Databases, ID, Permission, Role } = require('node-appwrite');

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const DATABASE_ID = process.env.DATABASE_ID || 'gestao_recursos';

// Helper: aguardar attribute ficar "available"
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

async function createCollection(id, name, permissions) {
  await ignoreIfExists(
    databases.createCollection(
      DATABASE_ID,
      id,
      name,
      permissions,
      false,    // documentSecurity
      true      // enabled
    ),
    `Collection "${name}"`
  );
}

async function setupDatabase() {
  console.log('\n📦 Criando database...');
  await ignoreIfExists(
    databases.create(DATABASE_ID, 'Gestão de Recursos', true),
    `Database "gestao_recursos"`
  );
}

async function setupProductsCollection() {
  console.log('\n📋 Configurando collection: products');
  const COL = 'products';

  await createCollection(COL, 'Products', [
    Permission.read(Role.users()),
    Permission.create(Role.users()),
    Permission.update(Role.users()),
    Permission.delete(Role.users())
  ]);

  // Attributes
  await ignoreIfExists(
    databases.createStringAttribute(DATABASE_ID, COL, 'name', 100, true),
    'Attribute: name'
  );
  await ignoreIfExists(
    databases.createStringAttribute(DATABASE_ID, COL, 'description', 500, false),
    'Attribute: description'
  );

  // Aguardar attributes
  await waitForAttribute(COL, 'name');
  await waitForAttribute(COL, 'description');

  // Index
  await ignoreIfExists(
    databases.createIndex(DATABASE_ID, COL, 'name_index', 'key', ['name'], ['ASC']),
    'Index: name_index'
  );
}

async function setupUserProfilesCollection() {
  console.log('\n👤 Configurando collection: user_profiles');
  const COL = 'user_profiles';

  await createCollection(COL, 'User Profiles', [
    Permission.read(Role.users()),
    Permission.create(Role.users()),
    Permission.update(Role.users()),
    Permission.delete(Role.users())
  ]);

  await ignoreIfExists(
    databases.createStringAttribute(DATABASE_ID, COL, 'user_id', 50, true),
    'Attribute: user_id'
  );
  await ignoreIfExists(
    databases.createStringAttribute(DATABASE_ID, COL, 'username', 100, true),
    'Attribute: username'
  );
  await ignoreIfExists(
    databases.createEmailAttribute(DATABASE_ID, COL, 'email', true),
    'Attribute: email'
  );
  await ignoreIfExists(
    databases.createEnumAttribute(DATABASE_ID, COL, 'role', ['admin', 'product_manager'], true),
    'Attribute: role'
  );
  await ignoreIfExists(
    databases.createStringAttribute(DATABASE_ID, COL, 'product_id', 50, false),
    'Attribute: product_id'
  );

  await waitForAttribute(COL, 'user_id');
  await waitForAttribute(COL, 'username');
  await waitForAttribute(COL, 'email');
  await waitForAttribute(COL, 'role');
  await waitForAttribute(COL, 'product_id');

  await ignoreIfExists(
    databases.createIndex(DATABASE_ID, COL, 'user_id_index', 'unique', ['user_id'], ['ASC']),
    'Index: user_id_index (unique)'
  );
  await ignoreIfExists(
    databases.createIndex(DATABASE_ID, COL, 'product_id_index', 'key', ['product_id'], ['ASC']),
    'Index: product_id_index'
  );
}

async function setupResourcesCollection() {
  console.log('\n👥 Configurando collection: resources');
  const COL = 'resources';

  await createCollection(COL, 'Resources', [
    Permission.read(Role.users()),
    Permission.create(Role.users()),
    Permission.update(Role.users()),
    Permission.delete(Role.users())
  ]);

  await ignoreIfExists(
    databases.createStringAttribute(DATABASE_ID, COL, 'name', 150, true),
    'Attribute: name'
  );
  await ignoreIfExists(
    databases.createStringAttribute(DATABASE_ID, COL, 'product_id', 50, true),
    'Attribute: product_id'
  );
  await ignoreIfExists(
    databases.createStringAttribute(DATABASE_ID, COL, 'job_title', 200, true),
    'Attribute: job_title'
  );
  await ignoreIfExists(
    databases.createStringAttribute(DATABASE_ID, COL, 'job_description', 5000, false),
    'Attribute: job_description'
  );
  await ignoreIfExists(
    databases.createStringAttribute(DATABASE_ID, COL, 'supplier', 150, false),
    'Attribute: supplier'
  );
  await ignoreIfExists(
    databases.createIntegerAttribute(DATABASE_ID, COL, 'allocation_percentage', false, 0, 100, 100),
    'Attribute: allocation_percentage'
  );
  await ignoreIfExists(
    databases.createEnumAttribute(DATABASE_ID, COL, 'status', ['ativo', 'urgente', 'inativo'], false, 'ativo'),
    'Attribute: status'
  );
  await ignoreIfExists(
    databases.createStringAttribute(DATABASE_ID, COL, 'budget_id', 50, false),
    'Attribute: budget_id'
  );
  await ignoreIfExists(
    databases.createDatetimeAttribute(DATABASE_ID, COL, 'start_date', false),
    'Attribute: start_date'
  );
  await ignoreIfExists(
    databases.createDatetimeAttribute(DATABASE_ID, COL, 'end_date', false),
    'Attribute: end_date'
  );

  await waitForAttribute(COL, 'name');
  await waitForAttribute(COL, 'product_id');
  await waitForAttribute(COL, 'job_title');
  await waitForAttribute(COL, 'job_description');
  await waitForAttribute(COL, 'supplier');
  await waitForAttribute(COL, 'allocation_percentage');
  await waitForAttribute(COL, 'status');
  await waitForAttribute(COL, 'budget_id');
  await waitForAttribute(COL, 'start_date');
  await waitForAttribute(COL, 'end_date');

  await ignoreIfExists(
    databases.createIndex(DATABASE_ID, COL, 'product_id_index', 'key', ['product_id'], ['ASC']),
    'Index: product_id_index'
  );
  await ignoreIfExists(
    databases.createIndex(DATABASE_ID, COL, 'status_index', 'key', ['status'], ['ASC']),
    'Index: status_index'
  );
  await ignoreIfExists(
    databases.createIndex(DATABASE_ID, COL, 'budget_id_index', 'key', ['budget_id'], ['ASC']),
    'Index: budget_id_index'
  );
}

async function setupExpensesCollection() {
  console.log('\n💰 Configurando collection: expenses');
  const COL = 'expenses';

  await createCollection(COL, 'Expenses', [
    Permission.read(Role.users()),
    Permission.create(Role.users()),
    Permission.update(Role.users()),
    Permission.delete(Role.users())
  ]);

  await ignoreIfExists(
    databases.createStringAttribute(DATABASE_ID, COL, 'resource_id', 50, true),
    'Attribute: resource_id'
  );
  await ignoreIfExists(
    databases.createStringAttribute(DATABASE_ID, COL, 'product_id', 50, true),
    'Attribute: product_id'
  );
  await ignoreIfExists(
    databases.createIntegerAttribute(DATABASE_ID, COL, 'month', true, 1, 12),
    'Attribute: month'
  );
  await ignoreIfExists(
    databases.createIntegerAttribute(DATABASE_ID, COL, 'year', true, 2020, 2100),
    'Attribute: year'
  );
  await ignoreIfExists(
    databases.createFloatAttribute(DATABASE_ID, COL, 'amount', true, 0),
    'Attribute: amount'
  );
  await ignoreIfExists(
    databases.createStringAttribute(DATABASE_ID, COL, 'description', 500, false),
    'Attribute: description'
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
    databases.createStringAttribute(DATABASE_ID, COL, 'budget_id', 50, false),
    'Attribute: budget_id'
  );

  await waitForAttribute(COL, 'resource_id');
  await waitForAttribute(COL, 'product_id');
  await waitForAttribute(COL, 'month');
  await waitForAttribute(COL, 'year');
  await waitForAttribute(COL, 'amount');
  await waitForAttribute(COL, 'description');
  await waitForAttribute(COL, 'budget_id');

  await ignoreIfExists(
    databases.createIndex(DATABASE_ID, COL, 'resource_id_index', 'key', ['resource_id'], ['ASC']),
    'Index: resource_id_index'
  );
  await ignoreIfExists(
    databases.createIndex(DATABASE_ID, COL, 'product_id_index', 'key', ['product_id'], ['ASC']),
    'Index: product_id_index'
  );
  await ignoreIfExists(
    databases.createIndex(DATABASE_ID, COL, 'year_month_index', 'key', ['year', 'month'], ['DESC', 'DESC']),
    'Index: year_month_index'
  );
  await ignoreIfExists(
    databases.createIndex(DATABASE_ID, COL, 'budget_id_index', 'key', ['budget_id'], ['ASC']),
    'Index: budget_id_index'
  );
}

async function setupBudgetsCollection() {
  console.log('\n💵 Configurando collection: budgets');
  const COL = 'budgets';

  await createCollection(COL, 'Budgets', [
    Permission.read(Role.users()),
    Permission.create(Role.users()),
    Permission.update(Role.users()),
    Permission.delete(Role.users())
  ]);

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

  await waitForAttribute(COL, 'description');
  await waitForAttribute(COL, 'requested_by');
  await waitForAttribute(COL, 'approved_by');
  await waitForAttribute(COL, 'approval_date');
  await waitForAttribute(COL, 'period_start');
  await waitForAttribute(COL, 'period_end');
  await waitForAttribute(COL, 'approved_resources');
  await waitForAttribute(COL, 'amount_usd');
  await waitForAttribute(COL, 'exchange_rate');
  await waitForAttribute(COL, 'amount_brl');

  await ignoreIfExists(
    databases.createIndex(DATABASE_ID, COL, 'period_index', 'key', ['period_start'], ['DESC']),
    'Index: period_index'
  );
}

async function setupHistoryCollection() {
  console.log('\n📜 Configurando collection: history');
  const COL = 'history';

  await createCollection(COL, 'History', [
    Permission.read(Role.users()),
    Permission.create(Role.users())
  ]);

  await ignoreIfExists(
    databases.createStringAttribute(DATABASE_ID, COL, 'table_name', 50, true),
    'Attribute: table_name'
  );
  await ignoreIfExists(
    databases.createStringAttribute(DATABASE_ID, COL, 'record_id', 50, true),
    'Attribute: record_id'
  );
  await ignoreIfExists(
    databases.createEnumAttribute(DATABASE_ID, COL, 'action', ['create', 'update', 'delete'], true),
    'Attribute: action'
  );
  await ignoreIfExists(
    databases.createStringAttribute(DATABASE_ID, COL, 'old_values', 2000, false),
    'Attribute: old_values'
  );
  await ignoreIfExists(
    databases.createStringAttribute(DATABASE_ID, COL, 'new_values', 2000, false),
    'Attribute: new_values'
  );
  await ignoreIfExists(
    databases.createStringAttribute(DATABASE_ID, COL, 'changed_by', 50, false),
    'Attribute: changed_by'
  );
  await ignoreIfExists(
    databases.createStringAttribute(DATABASE_ID, COL, 'changed_by_name', 100, false),
    'Attribute: changed_by_name'
  );

  await waitForAttribute(COL, 'table_name');
  await waitForAttribute(COL, 'record_id');
  await waitForAttribute(COL, 'action');

  await ignoreIfExists(
    databases.createIndex(DATABASE_ID, COL, 'record_index', 'key', ['table_name', 'record_id'], ['ASC', 'ASC']),
    'Index: record_index'
  );
}

async function seedProducts() {
  console.log('\n🌱 Populando produtos iniciais...');

  const products = [
    { name: 'Tax One', description: 'Sistema Tax One' },
    { name: 'Tax One For SAP', description: 'Tax One integrado com SAP' },
    { name: 'Integrações-OBI', description: 'Integrações OBI' },
    { name: 'DF-e', description: 'Sistema DF-e' }
  ];

  // Verifica se já existem
  let existing = [];
  try {
    const list = await databases.listDocuments(DATABASE_ID, 'products');
    existing = list.documents.map(d => d.name);
  } catch (e) { /* ignore */ }

  for (const product of products) {
    if (existing.includes(product.name)) {
      console.log(`  · ${product.name} (já existia)`);
      continue;
    }

    try {
      await databases.createDocument(
        DATABASE_ID,
        'products',
        ID.unique(),
        product
      );
      console.log(`  ✓ ${product.name}`);
    } catch (err) {
      console.error(`  ✗ ${product.name}: ${err.message}`);
    }
  }
}

async function main() {
  console.log('============================================================');
  console.log('  Setup Automático - Sistema de Gestão de Recursos TR');
  console.log('============================================================');
  console.log(`Endpoint:   ${process.env.APPWRITE_ENDPOINT}`);
  console.log(`Project:    ${process.env.APPWRITE_PROJECT_ID}`);
  console.log(`Database:   ${DATABASE_ID}`);
  console.log('============================================================');

  if (!process.env.APPWRITE_API_KEY || process.env.APPWRITE_API_KEY.includes('cole_aqui')) {
    console.error('\n❌ ERRO: APPWRITE_API_KEY não configurada no arquivo .env');
    console.error('\nComo criar a API Key:');
    console.error('  1. Acesse Appwrite Console → Integrations → API Keys');
    console.error('  2. Clique em "Create API Key"');
    console.error('  3. Selecione TODOS os scopes de "databases" e "users"');
    console.error('  4. Copie a key e cole em setup/.env\n');
    process.exit(1);
  }

  try {
    // await setupDatabase(); // Database já existe
    await setupProductsCollection();
    await setupUserProfilesCollection();
    await setupResourcesCollection();
    await setupExpensesCollection();
    await setupBudgetsCollection();
    await setupHistoryCollection();
    await seedProducts();

    console.log('\n============================================================');
    console.log('  ✅ Setup concluído com sucesso!');
    console.log('============================================================');
    console.log('\nPróximos passos:');
    console.log('  1. Crie seu usuário admin no Appwrite Console (Auth → Users)');
    console.log('  2. Copie o User ID gerado');
    console.log('  3. Inicie o sistema: cd ../frontend && npm start');
    console.log('  4. Vá em Usuários no sistema e crie o perfil admin com o User ID');
    console.log('\nOu use o script create-admin.js para fazer isso automaticamente:');
    console.log('  node create-admin.js seu@email.com SuaSenha123 "Seu Nome"\n');

    process.exit(0);
  } catch (err) {
    console.error('\n❌ Erro durante o setup:', err.message);
    if (err.response) {
      console.error('Detalhes:', err.response);
    }
    process.exit(1);
  }
}

main();
