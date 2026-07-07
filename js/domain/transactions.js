// CRUD לתנועות: תומך בחשבונות, נהנים, פיצולים (splits) והעברות בין חשבונות
function transactionsForMonth(month, accountId) {
  return state.transactions.filter(
    t =>
      monthKey(t.date) === month && (!accountId || t.accountId === accountId),
  );
}

function transactionsForAccount(accountId) {
  return state.transactions.filter(t => t.accountId === accountId);
}

function splitSum(splits) {
  return splits.reduce((sum, s) => sum + s.amount, 0);
}

// input: { date, accountId, payeeId?, newPayeeName?, transferToAccountId?, categoryId?, amount, note, cleared, splits? }
function addTransaction(input) {
  const { date, accountId, note, cleared } = input;

  if (input.transferToAccountId) {
    const amount = input.amount;
    const txA = {
      id: uid('tx'),
      date,
      accountId,
      payeeId: transferPayeeFor(input.transferToAccountId),
      categoryId: null,
      amount,
      note: note || '',
      cleared: !!cleared,
      reconciled: false,
    };
    const txB = {
      id: uid('tx'),
      date,
      accountId: input.transferToAccountId,
      payeeId: transferPayeeFor(accountId),
      categoryId: null,
      amount: -amount,
      note: note || '',
      cleared: !!cleared,
      reconciled: false,
    };
    txA.transferId = txB.id;
    txB.transferId = txA.id;
    state.transactions.push(txA, txB);
    persist();
    return;
  }

  const payeeId =
    input.payeeId ||
    (input.newPayeeName ? findOrCreatePayeeByName(input.newPayeeName) : null);
  const splits =
    input.splits && input.splits.length > 1
      ? input.splits.map(s => ({ id: uid('split'), ...s }))
      : undefined;

  const tx = {
    id: uid('tx'),
    date,
    accountId,
    payeeId,
    categoryId: splits ? null : input.categoryId,
    amount: splits ? splitSum(splits) : input.amount,
    note: note || '',
    cleared: !!cleared,
    reconciled: false,
    subtransactions: splits,
  };
  const deletedByRule = applyRulesToObject(tx);
  if (!deletedByRule) state.transactions.push(tx);
  persist();
}

function updateTransaction(id, patch) {
  const tx = state.transactions.find(t => t.id === id);
  if (!tx) return;
  Object.assign(tx, patch);
  persist();
}

function deleteTransaction(id) {
  const tx = state.transactions.find(t => t.id === id);
  // ponytail: תנועת העברה נמחקת בזוג כדי לשמור על איזון בין שני החשבונות
  const idsToRemove = tx?.transferId ? [id, tx.transferId] : [id];
  state.transactions = state.transactions.filter(
    t => !idsToRemove.includes(t.id),
  );
  persist();
}

function setCleared(id, cleared) {
  updateTransaction(id, { cleared });
}

function reconcileTransactions(ids) {
  ids.forEach(id => updateTransaction(id, { cleared: true, reconciled: true }));
}
