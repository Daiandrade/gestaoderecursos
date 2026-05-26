import { databases, DATABASE_ID, COLLECTIONS, ID, Query, client } from './appwrite';

export const productsService = {
  // Listar produtos (com estatísticas de recursos e despesas)
  async getAll(productIdFilter = null) {
    const queries = [Query.orderAsc('name')];
    if (productIdFilter) {
      queries.push(Query.equal('$id', productIdFilter));
    }

    const productsRes = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.PRODUCTS,
      queries
    );

    // Buscar todos os recursos e despesas em paralelo
    const [resourcesRes, expensesRes] = await Promise.all([
      databases.listDocuments(DATABASE_ID, COLLECTIONS.RESOURCES, [Query.limit(500)]),
      databases.listDocuments(DATABASE_ID, COLLECTIONS.EXPENSES, [Query.limit(2000)])
    ]);

    // Mapear estatísticas
    return productsRes.documents.map(p => {
      const productResources = resourcesRes.documents.filter(r => r.product_id === p.$id);
      const productExpenses = expensesRes.documents.filter(e => e.product_id === p.$id);
      const totalExpenses = productExpenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);

      return {
        id: p.$id,
        ...p,
        total_resources: productResources.length,
        active_resources: productResources.filter(r => r.status === 'active').length,
        total_expenses: totalExpenses
      };
    });
  },

  async getById(id) {
    const doc = await databases.getDocument(DATABASE_ID, COLLECTIONS.PRODUCTS, id);
    return { id: doc.$id, ...doc };
  },

  async create({ name, description }) {
    const doc = await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.PRODUCTS,
      ID.unique(),
      { name, description }
    );
    return { id: doc.$id, ...doc };
  },

  async update(id, { name, description }) {
    const doc = await databases.updateDocument(
      DATABASE_ID,
      COLLECTIONS.PRODUCTS,
      id,
      { name, description }
    );
    return { id: doc.$id, ...doc };
  },

  // Realtime subscription
  subscribe(callback) {
    const unsubscribe = client.subscribe(
      `databases.${DATABASE_ID}.collections.${COLLECTIONS.PRODUCTS}.documents`,
      (response) => callback(response)
    );
    return unsubscribe;
  }
};
