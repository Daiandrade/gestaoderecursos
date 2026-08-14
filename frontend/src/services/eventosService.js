import { databases, DATABASE_ID, COLLECTIONS, ID, Query, client } from './appwrite';

function toEvento(doc) {
  return { id: doc.$id, ...doc };
}

export const eventosService = {
  async getAll() {
    const res = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.EVENTOS,
      [Query.orderAsc('data_hora'), Query.limit(100)]
    );
    return res.documents.map(toEvento);
  },

  async getByRange(startISO, endISOExclusive) {
    const res = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.EVENTOS,
      [
        Query.greaterThanEqual('data_hora', startISO),
        Query.lessThan('data_hora', endISOExclusive),
        Query.orderAsc('data_hora'),
        Query.limit(100)
      ]
    );
    return res.documents.map(toEvento);
  },

  async getById(id) {
    const doc = await databases.getDocument(DATABASE_ID, COLLECTIONS.EVENTOS, id);
    return toEvento(doc);
  },

  async create({ nome, formato, data_hora, responsavel, tipo_evento, status, publico }) {
    const doc = await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.EVENTOS,
      ID.unique(),
      { nome, formato, data_hora, responsavel, tipo_evento, status, publico }
    );
    return toEvento(doc);
  },

  async update(id, { nome, formato, data_hora, responsavel, tipo_evento, status, publico }) {
    const doc = await databases.updateDocument(
      DATABASE_ID,
      COLLECTIONS.EVENTOS,
      id,
      { nome, formato, data_hora, responsavel, tipo_evento, status, publico }
    );
    return toEvento(doc);
  },

  async delete(id) {
    await databases.deleteDocument(DATABASE_ID, COLLECTIONS.EVENTOS, id);
  },

  subscribe(callback) {
    const unsubscribe = client.subscribe(
      `databases.${DATABASE_ID}.collections.${COLLECTIONS.EVENTOS}.documents`,
      (response) => callback(response)
    );
    return unsubscribe;
  }
};
