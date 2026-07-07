// שכבת התמדה: קריאה/כתיבה ל-localStorage + מיגרציות סכימה
const STORAGE_KEY = 'budget_app_state';

function migrate(data) {
  if (!data.version || data.version < 2) {
    const defaultAccountId = 'acc-checking';
    data.accounts = data.accounts || [
      {
        id: defaultAccountId,
        name: 'עובר ושב',
        offBudget: false,
        closed: false,
        sortOrder: 0,
      },
    ];
    data.payees = data.payees || [];
    data.rules = data.rules || [];
    data.schedules = data.schedules || [];
    data.categoryGroups.forEach((g, i) => {
      if (g.hidden === undefined) g.hidden = false;
      if (g.sortOrder === undefined) g.sortOrder = i;
    });
    data.categories.forEach((c, i) => {
      if (c.hidden === undefined) c.hidden = false;
      if (c.notes === undefined) c.notes = '';
      if (c.carryover === undefined) c.carryover = false;
      if (c.sortOrder === undefined) c.sortOrder = i;
    });
    data.transactions.forEach(t => {
      if (t.accountId === undefined) t.accountId = data.accounts[0].id;
      if (t.cleared === undefined) t.cleared = false;
      if (t.reconciled === undefined) t.reconciled = false;
    });
    data.version = 2;
  }
  if (data.version < 3) {
    data.resetAvailable = data.resetAvailable || {};
    data.version = 3;
  }
  return data;
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    saveState(SEED_STATE);
    return structuredClone(SEED_STATE);
  }
  try {
    return migrate(JSON.parse(raw));
  } catch {
    // ponytail: JSON פגום -> חוזרים ל-seed במקום לקרוס
    saveState(SEED_STATE);
    return structuredClone(SEED_STATE);
  }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
