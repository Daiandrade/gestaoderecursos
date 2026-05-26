require('dotenv').config();
const { Client, Databases, Query } = require('node-appwrite');

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const DATABASE_ID = process.env.DATABASE_ID || 'gesstao_recursos';

async function main() {
  console.log(`\n📦 Verificando produtos no database: ${DATABASE_ID}\n`);

  try {
    const list = await databases.listDocuments(DATABASE_ID, 'products');

    if (list.documents.length === 0) {
      console.log('❌ Nenhum produto encontrado!');
    } else {
      console.log(`✅ ${list.documents.length} produtos encontrados:\n`);
      list.documents.forEach(doc => {
        console.log(`  - ${doc.name} (ID: ${doc.$id})`);
      });
    }
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}

main();
