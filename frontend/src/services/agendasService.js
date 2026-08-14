import { databases, DATABASE_ID, COLLECTIONS, ID, Query, client } from './appwrite';
import { entregasService } from './entregasService';

function toAgenda(doc) {
  return {
    id: doc.$id,
    ...doc,
    participantes: doc.participantes
      ? doc.participantes.split(',').map(p => p.trim()).filter(Boolean)
      : []
  };
}

export const agendasService = {
  async getByEntrega(entregaId) {
    const res = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.AGENDAS,
      [Query.equal('entrega_id', entregaId), Query.orderDesc('$createdAt')]
    );
    return res.documents.map(toAgenda);
  },

  async create({ entrega_id, tema, data_agenda, participantes = [], ata = '', pontos_discutidos = '', proximos_passos = '' }) {
    // Rebusca a entrega (e sua contagem atual de agendas) pra não validar contra
    // estado desatualizado em memória, já que o limite pode ter mudado em outra aba.
    const entrega = await entregasService.getById(entrega_id);

    if (participantes.length > entrega.limite_participantes) {
      throw new Error(`Limite de ${entrega.limite_participantes} participante(s) por agenda excedido`);
    }
    if (entrega.agendas_usadas >= entrega.quantidade_agendas) {
      throw new Error('Não há mais agendas disponíveis nesta entrega');
    }

    const doc = await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.AGENDAS,
      ID.unique(),
      {
        entrega_id,
        tema,
        data_agenda: data_agenda || null,
        participantes: participantes.filter(Boolean).join(','),
        ata,
        pontos_discutidos,
        proximos_passos
      }
    );
    return toAgenda(doc);
  },

  async update(id, { tema, data_agenda, participantes = [], ata = '', pontos_discutidos = '', proximos_passos = '' }) {
    const doc = await databases.updateDocument(
      DATABASE_ID,
      COLLECTIONS.AGENDAS,
      id,
      {
        tema,
        data_agenda: data_agenda || null,
        participantes: participantes.filter(Boolean).join(','),
        ata,
        pontos_discutidos,
        proximos_passos
      }
    );
    return toAgenda(doc);
  },

  async delete(id) {
    await databases.deleteDocument(DATABASE_ID, COLLECTIONS.AGENDAS, id);
  },

  subscribe(callback) {
    const unsubscribe = client.subscribe(
      `databases.${DATABASE_ID}.collections.${COLLECTIONS.AGENDAS}.documents`,
      (response) => callback(response)
    );
    return unsubscribe;
  }
};
