/**
 * Restaura os documentos de um backup gerado por backup-database.js.
 * Idempotente: documentos cujo $id já existir na collection são pulados.
 *
 * Uso:
 *   node restore-database.js backups/<timestamp>
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, Databases } = require('node-appwrite');

const [, , backupArg] = process.argv;

if (!backupArg) {
  console.error('❌ Uso: node restore-database.js <pasta-do-backup>');
  console.error('   Exemplo: node restore-database.js backups/2026-08-14T12-00-00-000Z');
  process.exit(1);
}

const backupDir = path.isAbsolute(backupArg) ? backupArg : path.join(__dirname, backupArg);

if (!fs.existsSync(backupDir)) {
  console.error(`❌ Pasta de backup não encontrada: ${backupDir}`);
  process.exit(1);
}

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const DATABASE_ID = process.env.DATABASE_ID || 'gesstao_recursos';

async function restoreCollection(collectionId, documents) {
  console.log(`\n📦 Restaurando: ${collectionId} (${documents.length} documento(s))`);

  let created = 0;
  let skipped = 0;

  for (const doc of documents) {
    const { $id, $collectionId, $databaseId, $createdAt, $updatedAt, $permissions, ...data } = doc;

    try {
      await databases.createDocument(DATABASE_ID, collectionId, $id, data, $permissions);
      created++;
    } catch (err) {
      if (err.code === 409) {
        skipped++;
      } else {
        console.error(`  ✗ ${$id}: ${err.message}`);
      }
    }
  }

  console.log(`  ✓ ${created} criado(s), ${skipped} já existia(m)`);
}

async function main() {
  console.log('\n============================================================');
  console.log('  Restore do banco Appwrite');
  console.log('============================================================');
  console.log(`Database:   ${DATABASE_ID}`);
  console.log(`Origem:     ${backupDir}`);
  console.log('============================================================');

  const files = fs.readdirSync(backupDir).filter(f => f.endsWith('.json') && f !== '_schema.json');

  for (const file of files) {
    const collectionId = file.replace(/\.json$/, '');
    const documents = JSON.parse(fs.readFileSync(path.join(backupDir, file), 'utf-8'));
    await restoreCollection(collectionId, documents);
  }

  console.log('\n============================================================');
  console.log('  ✅ Restore concluído');
  console.log('============================================================\n');
}

main().catch(err => {
  console.error('\n❌ Erro:', err.message);
  process.exit(1);
});
