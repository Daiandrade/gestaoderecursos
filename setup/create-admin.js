/**
 * Cria um usuário admin automaticamente (Auth + Profile)
 *
 * Uso:
 *   node create-admin.js email@thomsonreuters.com Senha123 "Seu Nome"
 */
require('dotenv').config();
const { Client, Users, Databases, ID } = require('node-appwrite');

const [, , email, password, name] = process.argv;

if (!email || !password || !name) {
  console.error('❌ Uso: node create-admin.js <email> <senha> "<nome>"');
  console.error('   Exemplo: node create-admin.js admin@tr.com Admin123 "Admin TR"');
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
  console.log('\n👤 Criando usuário admin...\n');

  let userId;

  // 1. Criar usuário Auth
  try {
    const user = await users.create(ID.unique(), email, undefined, password, name);
    userId = user.$id;
    console.log(`✓ Usuário Auth criado`);
    console.log(`  User ID: ${userId}`);
    console.log(`  Email:   ${email}`);
  } catch (err) {
    if (err.code === 409) {
      // Já existe - busca pelo email
      const list = await users.list();
      const existing = list.users.find(u => u.email === email);
      if (!existing) throw err;
      userId = existing.$id;
      console.log(`· Usuário Auth já existia (User ID: ${userId})`);
    } else {
      throw err;
    }
  }

  // 2. Criar profile com role=admin
  try {
    await databases.createDocument(
      DATABASE_ID,
      'user_profiles',
      ID.unique(),
      {
        user_id: userId,
        username: name,
        email: email,
        role: 'admin',
        product_id: null
      }
    );
    console.log(`✓ Perfil admin criado`);
  } catch (err) {
    if (err.code === 409 || err.message?.includes('already exists')) {
      console.log(`· Perfil já existia para este usuário`);
    } else {
      throw err;
    }
  }

  console.log('\n✅ Pronto! Você pode fazer login com:');
  console.log(`   Email: ${email}`);
  console.log(`   Senha: ${password}\n`);
}

main().catch(err => {
  console.error('\n❌ Erro:', err.message);
  process.exit(1);
});
