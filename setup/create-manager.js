/**
 * Cria um gerente de produto automaticamente (Auth + Profile)
 *
 * Uso:
 *   node create-manager.js email@tr.com Senha123 "Nome Gerente" "Tax One"
 *   node create-manager.js email@tr.com Senha123 "Nome Gerente" "Tax One,DF-e"
 *
 * Produtos válidos: "Tax One", "Tax One For SAP", "Integrações-OBI", "DF-e"
 * Para múltiplos produtos, separe por vírgula (sem espaços)
 */
require('dotenv').config();
const { Client, Users, Databases, ID, Query } = require('node-appwrite');

const [, , email, password, name, productNames] = process.argv;

if (!email || !password || !name || !productNames) {
  console.error('❌ Uso: node create-manager.js <email> <senha> "<nome>" "<nome_produto(s)>"');
  console.error('   Exemplo: node create-manager.js joao@tr.com Senha123 "João Silva" "Tax One"');
  console.error('   Exemplo (múltiplos): node create-manager.js joao@tr.com Senha123 "João" "Tax One,DF-e"');
  console.error('\nProdutos válidos:');
  console.error('   "Tax One", "Tax One For SAP", "Integrações-OBI", "DF-e"');
  process.exit(1);
}

if (password.length < 8) {
  console.error('❌ A senha precisa ter no mínimo 8 caracteres');
  process.exit(1);
}

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const users = new Users(client);
const databases = new Databases(client);
const DATABASE_ID = process.env.DATABASE_ID || 'gestao_recursos';

async function main() {
  const productNamesArray = productNames.split(',').map(n => n.trim());
  console.log(`\n👤 Criando gerente para: ${productNamesArray.join(', ')}...\n`);

  // 1. Buscar todos os produtos
  const allProducts = await databases.listDocuments(DATABASE_ID, 'products', [Query.limit(50)]);

  const productIds = [];
  for (const pName of productNamesArray) {
    const found = allProducts.documents.find(p => p.name === pName);
    if (!found) {
      console.error(`❌ Produto "${pName}" não encontrado.`);
      console.error('Execute primeiro: node setup.js');
      process.exit(1);
    }
    productIds.push(found.$id);
    console.log(`✓ Produto encontrado: ${pName}`);
  }

  const productIdsString = productIds.join(',');

  // 2. Criar usuário Auth
  let userId;
  try {
    const user = await users.create(ID.unique(), email, undefined, password, name);
    userId = user.$id;
    console.log(`✓ Usuário Auth criado (${email})`);
  } catch (err) {
    if (err.code === 409) {
      const list = await users.list();
      const existing = list.users.find(u => u.email === email);
      if (!existing) throw err;
      userId = existing.$id;
      console.log(`· Usuário Auth já existia (User ID: ${userId})`);
    } else {
      throw err;
    }
  }

  // 3. Criar profile com role=product_manager
  try {
    await databases.createDocument(
      DATABASE_ID,
      'user_profiles',
      ID.unique(),
      {
        user_id: userId,
        username: name,
        email: email,
        role: 'product_manager',
        product_id: productIdsString
      }
    );
    console.log(`✓ Perfil de gerente criado (produtos: ${productNamesArray.join(', ')})`);
  } catch (err) {
    if (err.code === 409 || err.message?.includes('already exists')) {
      console.log(`· Perfil já existia para este usuário`);
    } else {
      throw err;
    }
  }

  console.log('\n✅ Pronto! O gerente pode fazer login com:');
  console.log(`   Email:    ${email}`);
  console.log(`   Senha:    ${password}`);
  console.log(`   Produtos: ${productNamesArray.join(', ')}\n`);
}

main().catch(err => {
  console.error('\n❌ Erro:', err.message);
  process.exit(1);
});
