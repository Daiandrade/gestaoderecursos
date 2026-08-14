import { databases, DATABASE_ID, COLLECTIONS, ID, Query, client } from './appwrite';

async function countAgendas(entregaId) {
  const res = await databases.listDocuments(
    DATABASE_ID,
    COLLECTIONS.AGENDAS,
    [Query.equal('entrega_id', entregaId), Query.limit(1)]
  );
  return res.total;
}

function withTotais(entrega, agendasUsadas) {
  const quantidade = entrega.quantidade_agendas || 0;
  return {
    ...entrega,
    agendas_usadas: agendasUsadas,
    agendas_restantes: Math.max(0, quantidade - agendasUsadas)
  };
}

export const entregasService = {
  async getByConsultoria(consultoriaId) {
    const res = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.ENTREGAS,
      [Query.equal('consultoria_id', consultoriaId), Query.orderDesc('$createdAt')]
    );

    const entregas = res.documents.map(doc => ({ id: doc.$id, ...doc }));
    const usadas = await Promise.all(entregas.map(e => countAgendas(e.id)));
    return entregas.map((e, idx) => withTotais(e, usadas[idx]));
  },

  async getById(id) {
    const doc = await databases.getDocument(DATABASE_ID, COLLECTIONS.ENTREGAS, id);
    const entrega = { id: doc.$id, ...doc };
    const usadas = await countAgendas(entrega.id);
    return withTotais(entrega, usadas);
  },

  async create({ consultoria_id, nome, descricao, quantidade_agendas, limite_participantes }) {
    const doc = await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.ENTREGAS,
      ID.unique(),
      { consultoria_id, nome, descricao, quantidade_agendas, limite_participantes }
    );
    return { id: doc.$id, ...doc };
  },

  async update(id, { nome, descricao, quantidade_agendas, limite_participantes }) {
    const doc = await databases.updateDocument(
      DATABASE_ID,
      COLLECTIONS.ENTREGAS,
      id,
      { nome, descricao, quantidade_agendas, limite_participantes }
    );
    return { id: doc.$id, ...doc };
  },

  async delete(id) {
    await databases.deleteDocument(DATABASE_ID, COLLECTIONS.ENTREGAS, id);
  },

  subscribe(callback) {
    const unsubscribe = client.subscribe(
      `databases.${DATABASE_ID}.collections.${COLLECTIONS.ENTREGAS}.documents`,
      (response) => callback(response)
    );
    return unsubscribe;
  }
};
