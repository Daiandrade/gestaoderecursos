/**
 * Faz backup completo do banco Appwrite: todos os documentos de todas as
 * collections, mais o esquema (atributos, índices, permissões) de cada uma.
 *
 * Uso:
 *   node backup-database.js
 *
 * Gera setup/backups/<timestamp-ISO>/<collectionId>.json (documentos)
 * e setup/backups/<timestamp-ISO>/_schema.json (definições das collections).
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, Databases, Query } = require('node-appwrite');

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const DATABASE_ID = process.env.DATABASE_ID || 'gesstao_recursos';

async function fetchAllDocuments(collectionId) {
  const documents = [];
  let lastId = null;

  while (true) {
    const queries = [Query.limit(100)];
    if (lastId) queries.push(Query.cursorAfter(lastId));

    const res = await databases.listDocuments(DATABASE_ID, collectionId, queries);
    documents.push(...res.documents);

    if (res.documents.length < 100) break;
    lastId = res.documents[res.documents.length - 1].$id;
  }

  return documents;
}

async function main() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(__dirname, 'backups', timestamp);
  fs.mkdirSync(backupDir, { recursive: true });

  console.log('\n============================================================');
  console.log('  Backup do banco Appwrite');
  console.log('============================================================');
  console.log(`Database:   ${DATABASE_ID}`);
  console.log(`Destino:    ${backupDir}`);
  console.log('============================================================\n');

  const { collections } = await databases.listCollections(DATABASE_ID, [Query.limit(100)]);

  const schema = [];

  for (const collection of collections) {
    const documents = await fetchAllDocuments(collection.$id);

    fs.writeFileSync(
      path.join(backupDir, `${collection.$id}.json`),
      JSON.stringify(documents, null, 2)
    );

    schema.push({
      $id: collection.$id,
      name: collection.name,
      enabled: collection.enabled,
      documentSecurity: collection.documentSecurity,
      $permissions: collection.$permissions,
      attributes: collection.attributes,
      indexes: collection.indexes
    });

    console.log(`  ✓ ${collection.$id} (${documents.length} documento(s))`);
  }

  fs.writeFileSync(
    path.join(backupDir, '_schema.json'),
    JSON.stringify(schema, null, 2)
  );

  console.log('\n============================================================');
  console.log(`  ✅ Backup concluído: ${backupDir}`);
  console.log('============================================================\n');
}

main().catch(err => {
  console.error('\n❌ Erro:', err.message);
  process.exit(1);
});
