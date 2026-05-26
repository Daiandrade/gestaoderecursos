require('dotenv').config();
const { Client, Databases, ID, Permission, Role } = require('node-appwrite');

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const DATABASE_ID = process.env.DATABASE_ID || 'gesstao_recursos';

async function main() {
  console.log('\n🔧 Corrigindo permissões dos produtos...\n');

  const products = [
    { name: 'Tax One', description: 'Sistema Tax One' },
    { name: 'Tax One For SAP', description: 'Tax One integrado com SAP' },
    { name: 'Integrações-OBI', description: 'Integrações OBI' },
    { name: 'DF-e', description: 'Sistema DF-e' }
  ];

  // Listar produtos existentes
  const existing = await databases.listDocuments(DATABASE_ID, 'products');

  // Deletar produtos existentes
  for (const doc of existing.documents) {
    await databases.deleteDocument(DATABASE_ID, 'products', doc.$id);
    console.log(`  ✓ Deletado: ${doc.name}`);
  }

  // Recriar com permissões corretas
  const permissions = [
    Permission.read(Role.users()),
    Permission.update(Role.users()),
    Permission.delete(Role.users())
  ];

  for (const product of products) {
    await databases.createDocument(
      DATABASE_ID,
      'products',
      ID.unique(),
      product,
      permissions
    );
    console.log(`  ✓ Recriado: ${product.name}`);
  }

  console.log('\n✅ Permissões corrigidas!\n');
}

main().catch(err => {
  console.error('❌ Erro:', err.message);
  process.exit(1);
});
