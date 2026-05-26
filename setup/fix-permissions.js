require('dotenv').config();
const { Client, Databases, Permission, Role } = require('node-appwrite');

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const DATABASE_ID = process.env.DATABASE_ID || 'gesstao_recursos';

const collections = [
  { id: 'products', name: 'Products' },
  { id: 'user_profiles', name: 'User Profiles' },
  { id: 'resources', name: 'Resources' },
  { id: 'expenses', name: 'Expenses' },
  { id: 'history', name: 'History' }
];

const permissions = [
  Permission.read(Role.any()),
  Permission.create(Role.users()),
  Permission.update(Role.users()),
  Permission.delete(Role.users())
];

async function main() {
  console.log('\n🔧 Atualizando permissões das collections...\n');

  for (const collection of collections) {
    try {
      await databases.updateCollection(
        DATABASE_ID,
        collection.id,
        collection.name,
        permissions,
        false,      // documentSecurity = false (usa permissões da collection)
        true        // enabled
      );
      console.log(`  ✓ ${collection.id}`);
    } catch (err) {
      console.error(`  ✗ ${collection.id}: ${err.message}`);
    }
  }

  console.log('\n✅ Permissões atualizadas! Agora qualquer usuário pode ler.\n');
}

main().catch(err => {
  console.error('❌ Erro:', err.message);
  process.exit(1);
});
