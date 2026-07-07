// נהנים (payees): CRUD + נהנה-מיוחד לצורך העברות בין חשבונות
function allPayees() {
  return state.payees.filter((p) => !p.transferAccountId);
}

function findPayee(payeeId) {
  return state.payees.find((p) => p.id === payeeId);
}

function payeeName(payeeId) {
  return findPayee(payeeId)?.name || "";
}

function findOrCreatePayeeByName(name) {
  if (!name) return null;
  const existing = state.payees.find((p) => p.name === name && !p.transferAccountId);
  if (existing) return existing.id;
  const payee = { id: uid("payee"), name, transferAccountId: null };
  state.payees.push(payee);
  persist();
  return payee.id;
}

function deletePayee(payeeId) {
  state.payees = state.payees.filter((p) => p.id !== payeeId);
  persist();
}

// נהנה-העברה: "מייצג" חשבון יעד להעברה. נוצר לפי דרישה (lazy) ולא מוצג ברשימת הנהנים הרגילה.
function transferPayeeFor(accountId) {
  const existing = state.payees.find((p) => p.transferAccountId === accountId);
  if (existing) return existing.id;
  const payee = {
    id: uid("payee"),
    name: `העברה: ${accountName(accountId)}`,
    transferAccountId: accountId,
  };
  state.payees.push(payee);
  persist();
  return payee.id;
}

function transferOptionsHtml(excludeAccountId) {
  return openAccounts()
    .filter((a) => a.id !== excludeAccountId)
    .map((a) => `<option value="__transfer__${a.id}">העברה ל: ${a.name}</option>`)
    .join("");
}
