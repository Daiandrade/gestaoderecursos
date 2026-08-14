import { databases, DATABASE_ID, COLLECTIONS, ID, Query, client } from './appwrite';

async function countEntregas(consultoriaId) {
  const res = await databases.listDocuments(
    DATABASE_ID,
    COLLECTIONS.ENTREGAS,
    [Query.equal('consultoria_id', consultoriaId), Query.limit(1)]
  );
  return res.total;
}

export const consultoriasService = {
  async getAll() {
    const res = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.CONSULTORIAS,
      [Query.orderDesc('$createdAt')]
    );

    const consultorias = res.documents.map(doc => ({ id: doc.$id, ...doc }));

    const counts = await Promise.all(consultorias.map(c => countEntregas(c.id)));
    return consultorias.map((c, idx) => ({ ...c, entregas_count: counts[idx] }));
  },

  async getById(id) {
    const doc = await databases.getDocument(DATABASE_ID, COLLECTIONS.CONSULTORIAS, id);
    return { id: doc.$id, ...doc };
  },

  async create({ nome, descricao }) {
    const doc = await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.CONSULTORIAS,
      ID.unique(),
      { nome, descricao }
    );
    return { id: doc.$id, ...doc };
  },

  async update(id, { nome, descricao }) {
    const doc = await databases.updateDocument(
      DATABASE_ID,
      COLLECTIONS.CONSULTORIAS,
      id,
      { nome, descricao }
    );
    return { id: doc.$id, ...doc };
  },

  async delete(id) {
    await databases.deleteDocument(DATABASE_ID, COLLECTIONS.CONSULTORIAS, id);
  },

  subscribe(callback) {
    const unsubscribe = client.subscribe(
      `databases.${DATABASE_ID}.collections.${COLLECTIONS.CONSULTORIAS}.documents`,
      (response) => callback(response)
    );
    return unsubscribe;
  }
};
