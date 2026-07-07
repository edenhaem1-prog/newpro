// מסך תנועות (register): חשבונות, נהנים, פיצולים, נפרע/התאמה
function renderRegisterAccountFilter() {
  const select = document.getElementById('register-account-filter');
  const current = select.value;
  select.innerHTML = `<option value="">כל החשבונות</option>${allAccounts()
    .map(a => `<option value="${a.id}">${a.name}</option>`)
    .join('')}`;
  select.value = current;
}

function renderTxAccountSelect() {
  document.getElementById('tx-account').innerHTML = accountOptionsHtml();
}

function refreshPayeeOptions() {
  const accountId = document.getElementById('tx-account').value;
  const payeeOptions = allPayees()
    .map(p => `<option value="${p.id}">${p.name}</option>`)
    .join('');
  const transferOptions = openAccounts()
    .filter(a => a.id !== accountId)
    .map(a => `<option value="transfer:${a.id}">העברה ל: ${a.name}</option>`)
    .join('');
  document.getElementById('tx-payee-select').innerHTML = `
    <option value="">— בחר נהנה —</option>
    ${payeeOptions}
    ${transferOptions ? `<optgroup label="העברה בין חשבונות">${transferOptions}</optgroup>` : ''}
  `;
}

function renderTxForm() {
  renderTxAccountSelect();
  refreshPayeeOptions();
  document.getElementById('tx-category').innerHTML = categoryOptionsHtml();
}

function splitRowHtml() {
  return `<div class="split-row">
    <select class="split-category">${categoryOptionsHtml()}</select>
    <input type="number" step="0.01" class="split-amount" placeholder="סכום" />
    <button type="button" class="small-btn danger" data-remove-split-row>הסר</button>
  </div>`;
}

function readSplitRows() {
  return Array.from(document.querySelectorAll('#tx-split-rows-list .split-row'))
    .map(row => ({
      categoryId: row.querySelector('.split-category').value,
      amount: parseFloat(row.querySelector('.split-amount').value) || 0,
    }))
    .filter(s => s.amount !== 0);
}

function updateSplitTotal() {
  const total = splitSum(readSplitRows());
  document.getElementById('tx-split-total').textContent = `סה"כ: ${fmt(total)}`;
}

function payeeLabel(t) {
  if (t.transferId) {
    const other = state.transactions.find(o => o.id === t.transferId);
    return `העברה ל: ${accountName(other?.accountId)}`;
  }
  return t.payeeId ? payeeName(t.payeeId) : '';
}

function renderTransactions() {
  const accountFilter = document.getElementById(
    'register-account-filter',
  ).value;
  const rows = transactionsForMonth(currentMonth, accountFilter || undefined)
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))
    .map(t => {
      const categoryLabel = t.subtransactions
        ? `פיצול (${t.subtransactions.length})`
        : t.categoryId
          ? categoryName(t.categoryId)
          : t.transferId
            ? '—'
            : 'ללא קטגוריה';
      return `<tr>
        <td>${t.date}</td>
        <td>${accountName(t.accountId)}</td>
        <td>${payeeLabel(t)}</td>
        <td>${categoryLabel}</td>
        <td class="${t.amount < 0 ? 'negative' : ''}">${fmt(t.amount)}</td>
        <td><input type="checkbox" data-toggle-cleared="${t.id}" ${t.cleared ? 'checked' : ''} ${t.reconciled ? 'disabled' : ''} /></td>
        <td>${t.note}</td>
        <td><button class="small-btn danger" data-delete-tx="${t.id}">מחק</button></td>
      </tr>`;
    });

  const previewRows = upcomingSchedulesForMonth(currentMonth)
    .filter(s => !accountFilter || s.accountId === accountFilter)
    .map(s => {
      const status = scheduleStatus(s);
      return `<tr class="preview-row status-${status}">
        <td>${scheduleDisplayDate(s)}</td>
        <td>${accountName(s.accountId)}</td>
        <td>${s.payeeId ? payeeName(s.payeeId) : ''}</td>
        <td>${categoryName(s.categoryId)}</td>
        <td class="${s.amount < 0 ? 'negative' : ''}">${fmt(s.amount)}</td>
        <td><span class="status-badge status-${status}">${SCHEDULE_STATUS_LABELS[status]}</span></td>
        <td>${s.note}</td>
        <td>${scheduleActionsHtml(s.id)}</td>
      </tr>`;
    });

  document.getElementById('tx-table-body').innerHTML =
    rows.join('') + previewRows.join('');
}

// --- התאמת חשבון (reconciliation) ---
function openReconcileModal() {
  const accountId = document.getElementById('register-account-filter').value;
  if (!accountId) {
    alert('בחר חשבון ספציפי (לא "כל החשבונות") כדי להתאים אותו');
    return;
  }
  document.getElementById('reconcile-modal').hidden = false;
  document.getElementById('reconcile-modal').dataset.accountId = accountId;
  document.getElementById('reconcile-date').value = todayDate();
  renderReconcileList();
}

function renderReconcileList() {
  const accountId =
    document.getElementById('reconcile-modal').dataset.accountId;
  const rows = transactionsForAccount(accountId)
    .filter(t => !t.reconciled)
    .sort((a, b) => b.date.localeCompare(a.date))
    .map(
      t => `<tr>
        <td><input type="checkbox" class="reconcile-check" data-tx-id="${t.id}" ${t.cleared ? 'checked' : ''} /></td>
        <td>${t.date}</td>
        <td>${payeeLabel(t)}</td>
        <td class="${t.amount < 0 ? 'negative' : ''}">${fmt(t.amount)}</td>
      </tr>`,
    );
  document.getElementById('reconcile-list').innerHTML = rows.join('');
  updateReconcileDiff();
}

function updateReconcileDiff() {
  const accountId =
    document.getElementById('reconcile-modal').dataset.accountId;
  const statementBalance =
    parseFloat(document.getElementById('reconcile-balance').value) || 0;
  const alreadyReconciled = state.transactions
    .filter(t => t.accountId === accountId && t.reconciled)
    .reduce((sum, t) => sum + t.amount, 0);
  const checkedIds = Array.from(
    document.querySelectorAll('.reconcile-check:checked'),
  ).map(el => el.dataset.txId);
  const checkedSum = state.transactions
    .filter(t => checkedIds.includes(t.id))
    .reduce((sum, t) => sum + t.amount, 0);
  const diff = statementBalance - (alreadyReconciled + checkedSum);
  const el = document.getElementById('reconcile-diff');
  el.textContent =
    Math.abs(diff) < 0.005 ? 'תואם! אפשר לסיים התאמה.' : `הפרש: ${fmt(diff)}`;
  el.className = `reconcile-diff ${Math.abs(diff) < 0.005 ? 'ok' : 'negative'}`;
  document.getElementById('reconcile-finish').disabled =
    Math.abs(diff) >= 0.005;
}
