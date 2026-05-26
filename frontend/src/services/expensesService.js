import { databases, DATABASE_ID, COLLECTIONS, ID, Query, client } from './appwrite';

export const expensesService = {
  // Listar despesas por produto
  async getByProduct(productId, year = null) {
    const queries = [
      Query.equal('product_id', productId),
      Query.orderDesc('year'),
      Query.orderDesc('month'),
      Query.limit(2000)
    ];

    if (year) {
      queries.push(Query.equal('year', parseInt(year)));
    }

    const [expensesRes, resourcesRes] = await Promise.all([
      databases.listDocuments(DATABASE_ID, COLLECTIONS.EXPENSES, queries),
      databases.listDocuments(DATABASE_ID, COLLECTIONS.RESOURCES, [Query.limit(500)])
    ]);

    const resourcesMap = {};
    resourcesRes.documents.forEach(r => { resourcesMap[r.$id] = r.name; });

    return expensesRes.documents.map(e => ({
      id: e.$id,
      ...e,
      resource_name: resourcesMap[e.resource_id] || 'Desconhecido'
    }));
  },

  // Totais mensais para gráfico
  async getMonthlyTotals(productId, year) {
    const queries = [
      Query.equal('product_id', productId),
      Query.equal('year', parseInt(year)),
      Query.limit(2000)
    ];

    const res = await databases.listDocuments(DATABASE_ID, COLLECTIONS.EXPENSES, queries);

    const monthly = {};
    res.documents.forEach(e => {
      if (!monthly[e.month]) {
        monthly[e.month] = { month: e.month, year: e.year, total: 0, count: 0 };
      }
      monthly[e.month].total += parseFloat(e.amount || 0);
      monthly[e.month].count += 1;
    });

    return Object.values(monthly).sort((a, b) => a.month - b.month);
  },

  // Criar despesa
  async create(data, currentUser) {
    const doc = await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.EXPENSES,
      ID.unique(),
      {
        resource_id: data.resource_id,
        product_id: data.product_id,
        month: parseInt(data.month),
        year: parseInt(data.year),
        amount: parseFloat(data.amount),
        description: data.description || '',
        created_by: currentUser?.$id || '',
        created_by_name: currentUser?.name || currentUser?.email || ''
      }
    );
    return { id: doc.$id, ...doc };
  },

  // Atualizar despesa + criar registro de histórico
  async update(id, data, currentUser) {
    // Buscar valores antigos
    const oldDoc = await databases.getDocument(DATABASE_ID, COLLECTIONS.EXPENSES, id);

    // Atualizar
    const doc = await databases.updateDocument(
      DATABASE_ID,
      COLLECTIONS.EXPENSES,
      id,
      {
        amount: parseFloat(data.amount),
        description: data.description || ''
      }
    );

    // Registrar histórico
    try {
      await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.HISTORY,
        ID.unique(),
        {
          table_name: 'expenses',
          record_id: id,
          action: 'update',
          old_values: JSON.stringify({ amount: oldDoc.amount, description: oldDoc.description }),
          new_values: JSON.stringify({ amount: data.amount, description: data.description }),
          changed_by: currentUser?.$id || '',
          changed_by_name: currentUser?.name || currentUser?.email || ''
        }
      );
    } catch (err) {
      console.warn('Não foi possível registrar histórico:', err);
    }

    return { id: doc.$id, ...doc };
  },

  async delete(id) {
    // Apagar histórico associado
    try {
      const historyRes = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.HISTORY,
        [
          Query.equal('table_name', 'expenses'),
          Query.equal('record_id', id),
          Query.limit(100)
        ]
      );

      await Promise.all(
        historyRes.documents.map(h =>
          databases.deleteDocument(DATABASE_ID, COLLECTIONS.HISTORY, h.$id)
        )
      );
    } catch (err) {
      console.warn('Erro ao limpar histórico:', err);
    }

    await databases.deleteDocument(DATABASE_ID, COLLECTIONS.EXPENSES, id);
    return { deleted: true };
  },

  // Buscar histórico de uma despesa
  async getHistory(expenseId) {
    const res = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.HISTORY,
      [
        Query.equal('table_name', 'expenses'),
        Query.equal('record_id', expenseId),
        Query.orderDesc('$createdAt'),
        Query.limit(100)
      ]
    );

    return res.documents.map(h => ({
      id: h.$id,
      ...h,
      changed_at: h.$createdAt
    }));
  },

  subscribe(callback) {
    return client.subscribe(
      `databases.${DATABASE_ID}.collections.${COLLECTIONS.EXPENSES}.documents`,
      (response) => callback(response)
    );
  }
};
