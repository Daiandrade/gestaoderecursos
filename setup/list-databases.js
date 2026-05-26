require('dotenv').config();
const { Client, Databases } = require('node-appwrite');

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

async function main() {
  const list = await databases.list();
  console.log('\n📦 Databases existentes:\n');
  list.databases.forEach(db => {
    console.log(`  ID: ${db.$id}`);
    console.log(`  Nome: ${db.name}`);
    console.log(`  ---`);
  });
}

main().catch(err => {
  console.error('Erro:', err.message);
  process.exit(1);
});
