// חשבונות: CRUD + יתרה מחושבת
function allAccounts() {
  return state.accounts.slice().sort((a, b) => a.sortOrder - b.sortOrder);
}

function openAccounts() {
  return allAccounts().filter((a) => !a.closed);
}

function findAccount(accountId) {
  return state.accounts.find((a) => a.id === accountId);
}

function accountName(accountId) {
  return findAccount(accountId)?.name || "חשבון לא ידוע";
}

function addAccount(name, offBudget = false) {
  state.accounts.push({
    id: uid("acc"),
    name,
    offBudget,
    closed: false,
    sortOrder: state.accounts.length,
  });
  persist();
}

function closeAccount(accountId) {
  const acc = findAccount(accountId);
  if (acc) acc.closed = true;
  persist();
}

function reopenAccount(accountId) {
  const acc = findAccount(accountId);
  if (acc) acc.closed = false;
  persist();
}

function deleteAccount(accountId) {
  const hasTransactions = state.transactions.some((t) => t.accountId === accountId);
  if (hasTransactions) {
    closeAccount(accountId); // ponytail: לא מוחקים חשבון עם היסטוריה, סוגרים אותו במקום
    return;
  }
  state.accounts = state.accounts.filter((a) => a.id !== accountId);
  persist();
}

// יתרת חשבון: יתרת פתיחה 0 + סכום כל התנועות (כולל העברות) עד לתאריך כולל
function accountBalance(accountId, uptoDate) {
  return state.transactions
    .filter((t) => t.accountId === accountId && (!uptoDate || t.date <= uptoDate))
    .reduce((sum, t) => sum + t.amount, 0);
}
