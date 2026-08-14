import { databases, DATABASE_ID, COLLECTIONS, ID, Query, client } from './appwrite';

function toGrupo(doc) {
  return {
    id: doc.$id,
    ...doc,
    participantes_fixos: doc.participantes_fixos
      ? doc.participantes_fixos.split(',').map(p => p.trim()).filter(Boolean)
      : [],
    participantes_suplentes: doc.participantes_suplentes
      ? doc.participantes_suplentes.split(',').map(p => p.trim()).filter(Boolean)
      : []
  };
}

export const gruposService = {
  async getAll() {
    const res = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.GRUPOS,
      [Query.orderAsc('nome'), Query.limit(100)]
    );
    return res.documents.map(toGrupo);
  },

  async getById(id) {
    const doc = await databases.getDocument(DATABASE_ID, COLLECTIONS.GRUPOS, id);
    return toGrupo(doc);
  },

  async create({ nome, tipo, responsavel, participantes_fixos = [], participantes_suplentes = [] }) {
    const doc = await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.GRUPOS,
      ID.unique(),
      {
        nome,
        tipo,
        responsavel,
        participantes_fixos: participantes_fixos.filter(Boolean).join(','),
        participantes_suplentes: participantes_suplentes.filter(Boolean).join(',')
      }
    );
    return toGrupo(doc);
  },

  async update(id, { nome, tipo, responsavel, participantes_fixos = [], participantes_suplentes = [] }) {
    const doc = await databases.updateDocument(
      DATABASE_ID,
      COLLECTIONS.GRUPOS,
      id,
      {
        nome,
        tipo,
        responsavel,
        participantes_fixos: participantes_fixos.filter(Boolean).join(','),
        participantes_suplentes: participantes_suplentes.filter(Boolean).join(',')
      }
    );
    return toGrupo(doc);
  },

  async delete(id) {
    await databases.deleteDocument(DATABASE_ID, COLLECTIONS.GRUPOS, id);
  },

  subscribe(callback) {
    const unsubscribe = client.subscribe(
      `databases.${DATABASE_ID}.collections.${COLLECTIONS.GRUPOS}.documents`,
      (response) => callback(response)
    );
    return unsubscribe;
  }
};
