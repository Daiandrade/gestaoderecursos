import { databases, DATABASE_ID, COLLECTIONS, ID, Query, client } from './appwrite';

export const iaBoasPraticasService = {
  async getAll() {
    const res = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.IA_BOAS_PRATICAS,
      [Query.orderDesc('$createdAt')]
    );
    return res.documents.map(doc => ({ id: doc.$id, ...doc }));
  },

  async getById(id) {
    const doc = await databases.getDocument(DATABASE_ID, COLLECTIONS.IA_BOAS_PRATICAS, id);
    return { id: doc.$id, ...doc };
  },

  async create({ titulo, prompt, skill_texto, funcionalidade, beneficio, como_usar, autor_user_id, autor_nome }) {
    const doc = await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.IA_BOAS_PRATICAS,
      ID.unique(),
      { titulo, prompt, skill_texto, funcionalidade, beneficio, como_usar, autor_user_id, autor_nome }
    );
    return { id: doc.$id, ...doc };
  },

  async update(id, { titulo, prompt, skill_texto, funcionalidade, beneficio, como_usar }) {
    const doc = await databases.updateDocument(
      DATABASE_ID,
      COLLECTIONS.IA_BOAS_PRATICAS,
      id,
      { titulo, prompt, skill_texto, funcionalidade, beneficio, como_usar }
    );
    return { id: doc.$id, ...doc };
  },

  async delete(id) {
    await databases.deleteDocument(DATABASE_ID, COLLECTIONS.IA_BOAS_PRATICAS, id);
  },

  subscribe(callback) {
    const unsubscribe = client.subscribe(
      `databases.${DATABASE_ID}.collections.${COLLECTIONS.IA_BOAS_PRATICAS}.documents`,
      (response) => callback(response)
    );
    return unsubscribe;
  }
};
