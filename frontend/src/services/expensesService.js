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

    const [expensesRes, resourcesRes, budgetsRes] = await Promise.all([
      databases.listDocuments(DATABASE_ID, COLLECTIONS.EXPENSES, queries),
      databases.listDocuments(DATABASE_ID, COLLECTIONS.RESOURCES, [Query.limit(500)]),
      databases.listDocuments(DATABASE_ID, COLLECTIONS.BUDGETS, [Query.limit(500)])
    ]);

    const resourcesMap = {};
    resourcesRes.documents.forEach(r => { resourcesMap[r.$id] = r.name; });

    const ratesMap = {};
    budgetsRes.documents.forEach(b => { ratesMap[b.$id] = parseFloat(b.exchange_rate) || 0; });

    return expensesRes.documents.map(e => {
      const ownRate = parseFloat(e.exchange_rate) || 0;
      const rate = ownRate > 0 ? ownRate : (e.budget_id ? (ratesMap[e.budget_id] || 0) : 0);
      const amountUsd = parseFloat(e.amount || 0);
      return {
        id: e.$id,
        ...e,
        resource_name: resourcesMap[e.resource_id] || 'Desconhecido',
        exchange_rate: rate,
        amount_brl: rate > 0 ? amountUsd * rate : null
      };
    });
  },

  // Todas as despesas de um ano, de todos os produtos (visão consolidada)
  async getByYear(year) {
    const queries = [
      Query.equal('year', parseInt(year)),
      Query.limit(2000)
    ];

    const [res, budgetsRes] = await Promise.all([
      databases.listDocuments(DATABASE_ID, COLLECTIONS.EXPENSES, queries),
      databases.listDocuments(DATABASE_ID, COLLECTIONS.BUDGETS, [Query.limit(500)])
    ]);

    const ratesMap = {};
    budgetsRes.documents.forEach(b => { ratesMap[b.$id] = parseFloat(b.exchange_rate) || 0; });

    return res.documents.map(e => {
      const ownRate = parseFloat(e.exchange_rate) || 0;
      const rate = ownRate > 0 ? ownRate : (e.budget_id ? (ratesMap[e.budget_id] || 0) : 0);
      const amountUsd = parseFloat(e.amount || 0);
      return {
        id: e.$id,
        ...e,
        exchange_rate: rate,
        amount_brl: rate > 0 ? amountUsd * rate : null
      };
    });
  },

  // Totais mensais para gráfico
  async getMonthlyTotals(productId, year) {
    const queries = [
      Query.equal('product_id', productId),
      Query.equal('year', parseInt(year)),
      Query.limit(2000)
    ];

    const [res, budgetsRes] = await Promise.all([
      databases.listDocuments(DATABASE_ID, COLLECTIONS.EXPENSES, queries),
      databases.listDocuments(DATABASE_ID, COLLECTIONS.BUDGETS, [Query.limit(500)])
    ]);

    const ratesMap = {};
    budgetsRes.documents.forEach(b => { ratesMap[b.$id] = parseFloat(b.exchange_rate) || 0; });

    const monthly = {};
    res.documents.forEach(e => {
      if (!monthly[e.month]) {
        monthly[e.month] = { month: e.month, year: e.year, total: 0, totalBrl: 0, count: 0 };
      }
      const amountUsd = parseFloat(e.amount || 0);
      monthly[e.month].total += amountUsd;
      const ownRate = parseFloat(e.exchange_rate) || 0;
      const rate = ownRate > 0 ? ownRate : (e.budget_id ? (ratesMap[e.budget_id] || 0) : 0);
      if (rate > 0) monthly[e.month].totalBrl += amountUsd * rate;
      monthly[e.month].count += 1;
    });

    return Object.values(monthly).sort((a, b) => a.month - b.month);
  },

  // Criar despesa (grava snapshot do budget atual do recurso)
  async create(data, currentUser) {
    let budgetIdSnapshot = null;
    try {
      const resourceDoc = await databases.getDocument(DATABASE_ID, COLLECTIONS.RESOURCES, data.resource_id);
      budgetIdSnapshot = resourceDoc.budget_id || null;
    } catch (err) {
      console.warn('Não foi possível obter o budget do recurso para snapshot:', err);
    }

    const currency = data.currency === 'BRL' ? 'BRL' : 'USD';
    const rate = parseFloat(data.exchange_rate) || 0;
    const rawAmount = parseFloat(data.amount) || 0;
    const amountUsd = currency === 'BRL' ? (rate > 0 ? rawAmount / rate : rawAmount) : rawAmount;

    const doc = await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.EXPENSES,
      ID.unique(),
      {
        resource_id: data.resource_id,
        product_id: data.product_id,
        budget_id: budgetIdSnapshot,
        month: parseInt(data.month),
        year: parseInt(data.year),
        amount: amountUsd,
        currency,
        exchange_rate: rate,
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

    const currency = data.currency === 'BRL' ? 'BRL' : 'USD';
    const rate = parseFloat(data.exchange_rate) || 0;
    const rawAmount = parseFloat(data.amount) || 0;
    const amountUsd = currency === 'BRL' ? (rate > 0 ? rawAmount / rate : rawAmount) : rawAmount;

    // Atualizar
    const doc = await databases.updateDocument(
      DATABASE_ID,
      COLLECTIONS.EXPENSES,
      id,
      {
        amount: amountUsd,
        currency,
        exchange_rate: rate,
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
          new_values: JSON.stringify({ amount: amountUsd, description: data.description }),
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
