import { databases, DATABASE_ID, COLLECTIONS, ID, Query, client } from './appwrite';

export const budgetsService = {
  // Listar budgets (geral, não vinculado a produto)
  async getAll() {
    const budgetsRes = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.BUDGETS,
      [Query.orderDesc('period_start'), Query.limit(500)]
    );

    return budgetsRes.documents.map(b => ({
      id: b.$id,
      ...b
    }));
  },

  // Listar budgets já enriquecidos com gasto real (via despesas vinculadas), status de alerta
  // e o detalhamento das despesas que compõem o gasto (para exibir ao clicar na barra de progresso)
  async getAllWithSpending() {
    const [budgetsRes, expensesRes, resourcesRes] = await Promise.all([
      databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.BUDGETS,
        [Query.orderDesc('period_start'), Query.limit(500)]
      ),
      databases.listDocuments(DATABASE_ID, COLLECTIONS.EXPENSES, [Query.limit(2000)]),
      databases.listDocuments(DATABASE_ID, COLLECTIONS.RESOURCES, [Query.limit(500)])
    ]);

    const resourcesMap = {};
    resourcesRes.documents.forEach(r => { resourcesMap[r.$id] = r.name; });

    const expensesByBudget = {};
    expensesRes.documents.forEach(e => {
      if (!e.budget_id) return;
      if (!expensesByBudget[e.budget_id]) expensesByBudget[e.budget_id] = [];
      expensesByBudget[e.budget_id].push(e);
    });

    return budgetsRes.documents.map(b => {
      const budgetRate = parseFloat(b.exchange_rate) || 0;
      const linkedExpenses = expensesByBudget[b.$id] || [];

      let spentUsd = 0;
      let spentBrl = 0;
      const expenses = linkedExpenses
        .map(e => {
          const amountUsd = parseFloat(e.amount || 0);
          const ownRate = parseFloat(e.exchange_rate) || 0;
          const rate = ownRate > 0 ? ownRate : budgetRate;
          const amountBrl = rate > 0 ? amountUsd * rate : null;
          spentUsd += amountUsd;
          if (amountBrl !== null) spentBrl += amountBrl;
          return {
            id: e.$id,
            resource_id: e.resource_id,
            resource_name: resourcesMap[e.resource_id] || 'Desconhecido',
            month: e.month,
            year: e.year,
            amount_usd: amountUsd,
            amount_brl: amountBrl,
            exchange_rate: rate,
            description: e.description || ''
          };
        })
        .sort((a, b2) => (b2.year - a.year) || (b2.month - a.month));

      const amountUsd = parseFloat(b.amount_usd) || 0;
      const remainingUsd = amountUsd - spentUsd;
      const percentUsed = amountUsd > 0 ? (spentUsd / amountUsd) * 100 : 0;

      let statusLevel = 'ok';
      if (amountUsd <= 0) {
        statusLevel = spentUsd > 0 ? 'critical' : 'unknown';
      } else if (percentUsed >= 100) {
        statusLevel = 'critical';
      } else if (percentUsed >= 80) {
        statusLevel = 'warning';
      }

      return {
        id: b.$id,
        ...b,
        spent_brl: spentBrl,
        spent_usd: spentUsd,
        remaining_usd: remainingUsd,
        percent_used: percentUsed,
        status_level: statusLevel,
        expenses
      };
    });
  },

  // Quantos recursos/despesas estão vinculados a este budget (usado para avisar antes de excluir)
  async getUsage(id) {
    const [resourcesRes, expensesRes] = await Promise.all([
      databases.listDocuments(DATABASE_ID, COLLECTIONS.RESOURCES, [Query.equal('budget_id', id), Query.limit(500)]),
      databases.listDocuments(DATABASE_ID, COLLECTIONS.EXPENSES, [Query.equal('budget_id', id), Query.limit(2000)])
    ]);

    return {
      resourceCount: resourcesRes.total,
      expenseCount: expensesRes.total
    };
  },

  async create(data, currentUser) {
    const exchangeRate = parseFloat(data.exchange_rate) || 0;
    const monthlyValues = data.monthly_values || [];
    const amountUsd = monthlyValues.reduce((s, m) => s + (parseFloat(m.amount_usd) || 0), 0);
    const sorted = [...monthlyValues].sort((a, b) => (a.year - b.year) || (a.month - b.month));
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const periodStart = new Date(first.year, first.month - 1, 1).toISOString();
    const periodEnd = new Date(last.year, last.month, 0).toISOString();

    const doc = await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.BUDGETS,
      ID.unique(),
      {
        description: data.description || '',
        requested_by: data.requested_by,
        approved_by: data.approved_by || '',
        approval_date: data.approval_date || null,
        month: first.month,
        year: first.year,
        month_end: last.month,
        year_end: last.year,
        monthly_values: JSON.stringify(monthlyValues),
        period_start: periodStart,
        period_end: periodEnd,
        approved_resources: parseInt(data.approved_resources) || 0,
        amount_usd: amountUsd,
        exchange_rate: exchangeRate,
        amount_brl: amountUsd * exchangeRate,
        created_by: currentUser?.$id || '',
        created_by_name: currentUser?.name || currentUser?.email || ''
      }
    );
    return { id: doc.$id, ...doc };
  },

  async update(id, data) {
    const exchangeRate = parseFloat(data.exchange_rate) || 0;
    const monthlyValues = data.monthly_values || [];
    const amountUsd = monthlyValues.reduce((s, m) => s + (parseFloat(m.amount_usd) || 0), 0);
    const sorted = [...monthlyValues].sort((a, b) => (a.year - b.year) || (a.month - b.month));
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const periodStart = new Date(first.year, first.month - 1, 1).toISOString();
    const periodEnd = new Date(last.year, last.month, 0).toISOString();

    const doc = await databases.updateDocument(
      DATABASE_ID,
      COLLECTIONS.BUDGETS,
      id,
      {
        description: data.description || '',
        requested_by: data.requested_by,
        approved_by: data.approved_by || '',
        approval_date: data.approval_date || null,
        month: first.month,
        year: first.year,
        month_end: last.month,
        year_end: last.year,
        monthly_values: JSON.stringify(monthlyValues),
        period_start: periodStart,
        period_end: periodEnd,
        approved_resources: parseInt(data.approved_resources) || 0,
        amount_usd: amountUsd,
        exchange_rate: exchangeRate,
        amount_brl: amountUsd * exchangeRate
      }
    );
    return { id: doc.$id, ...doc };
  },

  async delete(id) {
    await databases.deleteDocument(DATABASE_ID, COLLECTIONS.BUDGETS, id);
    return { deleted: true };
  },

  subscribe(callback) {
    return client.subscribe(
      `databases.${DATABASE_ID}.collections.${COLLECTIONS.BUDGETS}.documents`,
      (response) => callback(response)
    );
  }
};
