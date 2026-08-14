/**
 * Corrige as permissões do banco Appwrite em produção:
 *
 * 1. Reverte a leitura pública (read: any) para leitura só de usuários logados
 *    (read: users) em products, user_profiles, resources, expenses, history —
 *    alinhando com o padrão que as demais collections já seguem.
 * 2. Cria (se não existir) o Team "admins" no Appwrite, adiciona como membro
 *    todo usuário cujo user_profiles.role === 'admin', e restringe
 *    create/update/delete de user_profiles só a esse Team — hoje qualquer
 *    usuário autenticado pode escrever em user_profiles, o que permite
 *    auto-promoção a admin.
 *
 * Uso:
 *   node fix-permissions-v2.js
 */
require('dotenv').config();
const { Client, Databases, Teams, Permission, Role, Query } = require('node-appwrite');

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const teams = new Teams(client);
const DATABASE_ID = process.env.DATABASE_ID || 'gesstao_recursos';
const ADMINS_TEAM_ID = 'admins';

const PUBLIC_READ_COLLECTIONS = ['products', 'user_profiles', 'resources', 'expenses', 'history'];

async function printPermissions(label) {
  console.log(`\n--- Permissões (${label}) ---`);
  for (const id of PUBLIC_READ_COLLECTIONS) {
    const col = await databases.getCollection(DATABASE_ID, id);
    console.log(`  ${id}: ${JSON.stringify(col.$permissions)}`);
  }
}

async function ensureAdminsTeam() {
  try {
    const team = await teams.create(ADMINS_TEAM_ID, 'Admins');
    console.log(`  ✓ Team "admins" criado (${team.$id})`);
    return team.$id;
  } catch (err) {
    if (err.code === 409) {
      console.log('  · Team "admins" já existia');
      return ADMINS_TEAM_ID;
    }
    throw err;
  }
}

async function backfillAdminMemberships(teamId) {
  const res = await databases.listDocuments(DATABASE_ID, 'user_profiles', [
    Query.equal('role', 'admin'),
    Query.limit(200)
  ]);

  console.log(`\n👥 Backfill de membership: ${res.documents.length} perfil(is) com role=admin`);

  for (const profile of res.documents) {
    if (!profile.user_id) {
      console.log(`  ✗ Perfil ${profile.$id} sem user_id, pulando`);
      continue;
    }
    try {
      await teams.createMembership(teamId, [], undefined, profile.user_id);
      console.log(`  ✓ Membership adicionada para user_id ${profile.user_id}`);
    } catch (err) {
      if (err.code === 409) {
        console.log(`  · user_id ${profile.user_id} já era membro`);
      } else {
        console.error(`  ✗ user_id ${profile.user_id}: ${err.message}`);
      }
    }
  }
}

async function fixPublicRead() {
  console.log('\n🔒 Revertendo leitura pública -> leitura de usuários logados');
  for (const id of PUBLIC_READ_COLLECTIONS) {
    const col = await databases.getCollection(DATABASE_ID, id);
    await databases.updateCollection(
      DATABASE_ID,
      id,
      col.name,
      [
        Permission.read(Role.users()),
        Permission.create(Role.users()),
        Permission.update(Role.users()),
        Permission.delete(Role.users())
      ],
      col.documentSecurity,
      col.enabled
    );
    console.log(`  ✓ ${id}`);
  }
}

async function lockUserProfilesToAdmins(teamId) {
  console.log('\n🔐 Restringindo escrita de user_profiles ao Team "admins"');
  const col = await databases.getCollection(DATABASE_ID, 'user_profiles');
  await databases.updateCollection(
    DATABASE_ID,
    'user_profiles',
    col.name,
    [
      Permission.read(Role.users()),
      Permission.create(Role.team(teamId)),
      Permission.update(Role.team(teamId)),
      Permission.delete(Role.team(teamId))
    ],
    col.documentSecurity,
    col.enabled
  );
  console.log('  ✓ user_profiles');
}

async function main() {
  console.log('============================================================');
  console.log('  Corrigindo permissões do banco Appwrite');
  console.log('============================================================');

  await printPermissions('ANTES');

  const teamId = await ensureAdminsTeam();
  await backfillAdminMemberships(teamId);
  await fixPublicRead();
  await lockUserProfilesToAdmins(teamId);

  await printPermissions('DEPOIS');

  console.log('\n============================================================');
  console.log('  ✅ Permissões corrigidas');
  console.log('============================================================\n');
}

main().catch(err => {
  console.error('\n❌ Erro:', err.message);
  process.exit(1);
});
