require('dotenv').config();
const { Client, Databases } = require('node-appwrite');

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const DATABASE_ID = process.env.DATABASE_ID || 'gesstao_recursos';

async function main() {
  console.log('\n🔧 Aumentando limite do campo product_id...\n');

  try {
    // Atualizar o atributo product_id para 500 caracteres (suporta ~20 produtos)
    await databases.updateStringAttribute(
      DATABASE_ID,
      'user_profiles',
      'product_id',
      500,  // novo tamanho
      false // não obrigatório
    );

    console.log('✅ Campo product_id atualizado para 500 caracteres!');
    console.log('   Agora suporta até ~20 produtos por gerente.\n');
  } catch (err) {
    console.error('❌ Erro:', err.message);
    process.exit(1);
  }
}

main();
