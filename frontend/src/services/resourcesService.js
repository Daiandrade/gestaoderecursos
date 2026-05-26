import { databases, DATABASE_ID, COLLECTIONS, ID, Query, client } from './appwrite';

export const resourcesService = {
  // Listar recursos (com nome do produto e despesas totais)
  async getAll(productIdFilter = null) {
    const queries = [Query.orderAsc('name'), Query.limit(500)];
    if (productIdFilter) {
      queries.push(Query.equal('product_id', productIdFilter));
    }

    const [resourcesRes, productsRes, expensesRes] = await Promise.all([
      databases.listDocuments(DATABASE_ID, COLLECTIONS.RESOURCES, queries),
      databases.listDocuments(DATABASE_ID, COLLECTIONS.PRODUCTS, [Query.limit(50)]),
      databases.listDocuments(DATABASE_ID, COLLECTIONS.EXPENSES, [Query.limit(2000)])
    ]);

    const productsMap = {};
    productsRes.documents.forEach(p => { productsMap[p.$id] = p.name; });

    return resourcesRes.documents.map(r => {
      const resourceExpenses = expensesRes.documents.filter(e => e.resource_id === r.$id);
      const totalExpenses = resourceExpenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);

      return {
        id: r.$id,
        ...r,
        product_name: productsMap[r.product_id] || 'Desconhecido',
        total_expenses: totalExpenses,
        expense_count: resourceExpenses.length
      };
    });
  },

  async getById(id) {
    const doc = await databases.getDocument(DATABASE_ID, COLLECTIONS.RESOURCES, id);
    return { id: doc.$id, ...doc };
  },

  async create(data) {
    const doc = await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.RESOURCES,
      ID.unique(),
      {
        name: data.name,
        product_id: data.product_id,
        job_title: data.job_title,
        job_description: data.job_description || '',
        allocation_percentage: parseInt(data.allocation_percentage) || 100,
        status: data.status || 'active'
      }
    );
    return { id: doc.$id, ...doc };
  },

  async update(id, data) {
    const doc = await databases.updateDocument(
      DATABASE_ID,
      COLLECTIONS.RESOURCES,
      id,
      {
        name: data.name,
        job_title: data.job_title,
        job_description: data.job_description || '',
        allocation_percentage: parseInt(data.allocation_percentage) || 100,
        status: data.status
      }
    );
    return { id: doc.$id, ...doc };
  },

  // Deletar recurso E todas as despesas/histórico associados
  async delete(id) {
    // Buscar e apagar despesas do recurso
    const expenses = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.EXPENSES,
      [Query.equal('resource_id', id), Query.limit(500)]
    );

    // Apagar despesas em paralelo
    await Promise.all(
      expenses.documents.map(e =>
        databases.deleteDocument(DATABASE_ID, COLLECTIONS.EXPENSES, e.$id)
      )
    );

    // Apagar histórico das despesas
    const historyDocs = await Promise.all(
      expenses.documents.map(e =>
        databases.listDocuments(DATABASE_ID, COLLECTIONS.HISTORY, [
          Query.equal('table_name', 'expenses'),
          Query.equal('record_id', e.$id),
          Query.limit(100)
        ])
      )
    );

    await Promise.all(
      historyDocs.flatMap(r => r.documents).map(h =>
        databases.deleteDocument(DATABASE_ID, COLLECTIONS.HISTORY, h.$id)
      )
    );

    // Apagar o recurso
    await databases.deleteDocument(DATABASE_ID, COLLECTIONS.RESOURCES, id);
    return { deleted: true };
  },

  subscribe(callback) {
    return client.subscribe(
      `databases.${DATABASE_ID}.collections.${COLLECTIONS.RESOURCES}.documents`,
      (response) => callback(response)
    );
  }
};
