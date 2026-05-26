import { databases, DATABASE_ID, COLLECTIONS, ID, Query } from './appwrite';

// Para o caso desse sistema, "users" representa os user_profiles (dados extras).
// A criação real de usuários (auth) é feita pelo admin no painel Appwrite
// ou via convite por email. Aqui gerenciamos apenas o profile.
export const usersService = {
  async getAll() {
    const [profilesRes, productsRes] = await Promise.all([
      databases.listDocuments(DATABASE_ID, COLLECTIONS.USER_PROFILES, [
        Query.limit(200), Query.orderDesc('$createdAt')
      ]),
      databases.listDocuments(DATABASE_ID, COLLECTIONS.PRODUCTS, [Query.limit(50)])
    ]);

    const productsMap = {};
    productsRes.documents.forEach(p => { productsMap[p.$id] = p.name; });

    return profilesRes.documents.map(p => ({
      id: p.$id,
      ...p,
      product_name: productsMap[p.product_id] || null,
      created_at: p.$createdAt
    }));
  },

  // Cria perfil (precisa que a conta Auth já exista — criada via painel Appwrite ou auto-cadastro)
  async createProfile(data) {
    const doc = await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.USER_PROFILES,
      ID.unique(),
      {
        user_id: data.user_id,
        username: data.username,
        email: data.email,
        role: data.role,
        product_id: data.role === 'admin' ? null : data.product_id
      }
    );
    return { id: doc.$id, ...doc };
  },

  async updateProfile(id, data) {
    const doc = await databases.updateDocument(
      DATABASE_ID,
      COLLECTIONS.USER_PROFILES,
      id,
      {
        username: data.username,
        email: data.email,
        role: data.role,
        product_id: data.role === 'admin' ? null : data.product_id
      }
    );
    return { id: doc.$id, ...doc };
  },

  async deleteProfile(id) {
    await databases.deleteDocument(DATABASE_ID, COLLECTIONS.USER_PROFILES, id);
    return { deleted: true };
  }
};
