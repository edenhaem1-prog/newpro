let currentMonth = todayMonth();

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => switchView(btn.dataset.view));
});

document.getElementById('prev-month').addEventListener('click', () => {
  currentMonth = shiftMonth(currentMonth, -1);
  renderAll();
});
document.getElementById('next-month').addEventListener('click', () => {
  currentMonth = shiftMonth(currentMonth, 1);
  renderAll();
});

let splitMode = false;

document
  .getElementById('tx-account')
  .addEventListener('change', refreshPayeeOptions);

document
  .getElementById('register-account-filter')
  .addEventListener('change', e => {
    if (e.target.value) {
      document.getElementById('tx-account').value = e.target.value;
    }
    refreshPayeeOptions();
    renderTransactions();
  });

document.getElementById('tx-split-toggle').addEventListener('click', () => {
  splitMode = !splitMode;
  document.getElementById('tx-split-rows').hidden = !splitMode;
  document.getElementById('tx-category').disabled = splitMode;
  document.getElementById('tx-amount').disabled = splitMode;
  if (
    splitMode &&
    document.querySelectorAll('#tx-split-rows-list .split-row').length === 0
  ) {
    document.getElementById('tx-split-rows-list').innerHTML =
      splitRowHtml() + splitRowHtml();
  }
});

document.getElementById('tx-split-add-row').addEventListener('click', () => {
  document
    .getElementById('tx-split-rows-list')
    .insertAdjacentHTML('beforeend', splitRowHtml());
});

document.getElementById('tx-split-rows-list').addEventListener('click', e => {
  if (e.target.dataset.removeSplitRow !== undefined) {
    e.target.closest('.split-row').remove();
    updateSplitTotal();
  }
});
document
  .getElementById('tx-split-rows-list')
  .addEventListener('input', updateSplitTotal);

document.getElementById('tx-form').addEventListener('submit', e => {
  e.preventDefault();
  const payeeValue = document.getElementById('tx-payee-select').value;
  const input = {
    date: document.getElementById('tx-date').value,
    accountId: document.getElementById('tx-account').value,
    note: document.getElementById('tx-note').value,
    cleared: document.getElementById('tx-cleared').checked,
  };

  if (payeeValue.startsWith('transfer:')) {
    input.transferToAccountId = payeeValue.slice('transfer:'.length);
    input.amount = parseFloat(document.getElementById('tx-amount').value) || 0;
  } else {
    input.payeeId = payeeValue || null;
    input.newPayeeName =
      document.getElementById('tx-payee-new').value.trim() || null;
    if (splitMode) {
      input.splits = readSplitRows();
    } else {
      input.categoryId = document.getElementById('tx-category').value;
      input.amount =
        parseFloat(document.getElementById('tx-amount').value) || 0;
    }
  }

  addTransaction(input);
  e.target.reset();
  splitMode = false;
  document.getElementById('tx-split-rows').hidden = true;
  document.getElementById('tx-split-rows-list').innerHTML = '';
  document.getElementById('tx-category').disabled = false;
  document.getElementById('tx-amount').disabled = false;
  renderAll();
});

document.getElementById('tx-table-body').addEventListener('click', e => {
  const id = e.target.dataset.deleteTx;
  if (!id) return;
  if (
    confirm(
      'למחוק את התנועה? אם זו העברה, שתי התנועות (בשני החשבונות) יימחקו יחד.',
    )
  ) {
    deleteTransaction(id);
    renderAll();
  }
});

document.getElementById('tx-table-body').addEventListener('change', e => {
  const id = e.target.dataset.toggleCleared;
  if (!id) return;
  setCleared(id, e.target.checked);
  renderAll();
});

document.getElementById('account-form').addEventListener('submit', e => {
  e.preventDefault();
  const name = document.getElementById('account-name').value.trim();
  addAccount(name, document.getElementById('account-offbudget').checked);
  e.target.reset();
  renderAll();
});

document.getElementById('accounts-list').addEventListener('click', e => {
  if (e.target.dataset.closeAccount) {
    closeAccount(e.target.dataset.closeAccount);
    renderAll();
  } else if (e.target.dataset.reopenAccount) {
    reopenAccount(e.target.dataset.reopenAccount);
    renderAll();
  }
});

document
  .getElementById('reconcile-btn')
  .addEventListener('click', openReconcileModal);
document.getElementById('reconcile-cancel').addEventListener('click', () => {
  document.getElementById('reconcile-modal').hidden = true;
});
document
  .getElementById('reconcile-balance')
  .addEventListener('input', updateReconcileDiff);
document
  .getElementById('reconcile-list')
  .addEventListener('change', updateReconcileDiff);
document.getElementById('reconcile-finish').addEventListener('click', () => {
  const checkedIds = Array.from(
    document.querySelectorAll('.reconcile-check:checked'),
  ).map(el => el.dataset.txId);
  reconcileTransactions(checkedIds);
  document.getElementById('reconcile-modal').hidden = true;
  renderAll();
});

document.getElementById('income-input').addEventListener('change', e => {
  setIncome(currentMonth, parseFloat(e.target.value) || 0);
  renderAll();
});

document
  .getElementById('reset-available-input')
  .addEventListener('change', e => {
    setResetAvailable(currentMonth, e.target.checked);
    renderAll();
  });

document.getElementById('copy-prev-budget').addEventListener('click', () => {
  copyBudgetFromPreviousMonth(currentMonth);
  renderAll();
});

document.getElementById('budget-table-body').addEventListener('click', e => {
  const quickBudgetCat = e.target.dataset.quickBudget;
  const balanceMenuCat = e.target.dataset.balanceMenu;
  const collapseGroup = e.target.dataset.toggleCollapse;
  const hideGroup = e.target.dataset.hideGroup;
  const hideCat = e.target.dataset.hideCat;

  if (quickBudgetCat) {
    openDropdown(e.target, quickBudgetMenuItems(quickBudgetCat));
  } else if (balanceMenuCat) {
    openDropdown(e.target, balanceMenuItems(balanceMenuCat));
  } else if (collapseGroup) {
    collapsedGroups.has(collapseGroup)
      ? collapsedGroups.delete(collapseGroup)
      : collapsedGroups.add(collapseGroup);
    renderBudget();
  } else if (hideGroup) {
    setCategoryGroupHidden(hideGroup, true);
    renderAll();
  } else if (hideCat) {
    setCategoryHidden(hideCat, true);
    renderAll();
  }
});

document.getElementById('budget-table-body').addEventListener('change', e => {
  if (!e.target.classList.contains('cat-notes-input')) return;
  setCategoryNotes(e.target.dataset.notesCat, e.target.value);
});

// גרירה-ושחרור לסידור מחדש של קטגוריות/קבוצות בטבלת התקציב
let draggedCatId = null;
let draggedGroupId = null;

document
  .getElementById('budget-table-body')
  .addEventListener('dragstart', e => {
    const catRow = e.target.closest('tr.category-row-budget');
    const groupRow = e.target.closest('tr.group-row');
    if (catRow) draggedCatId = catRow.dataset.catId;
    else if (groupRow) draggedGroupId = groupRow.dataset.groupId;
  });

document.getElementById('budget-table-body').addEventListener('dragover', e => {
  const row = e.target.closest('tr.category-row-budget, tr.group-row');
  if (!row) return;
  e.preventDefault();
  row.classList.add('drag-over');
});

document
  .getElementById('budget-table-body')
  .addEventListener('dragleave', e => {
    const row = e.target.closest('tr.category-row-budget, tr.group-row');
    if (row) row.classList.remove('drag-over');
  });

document.getElementById('budget-table-body').addEventListener('drop', e => {
  e.preventDefault();
  const catRow = e.target.closest('tr.category-row-budget');
  const groupRow = e.target.closest('tr.group-row');
  document
    .querySelectorAll('.drag-over')
    .forEach(el => el.classList.remove('drag-over'));

  if (
    draggedCatId &&
    catRow &&
    catRow.dataset.groupId === findCategory(draggedCatId).groupId
  ) {
    const targetCat = findCategory(catRow.dataset.catId);
    reorderCategory(draggedCatId, targetCat.sortOrder);
    renderBudget();
  } else if (draggedGroupId && groupRow) {
    const targetGroup = state.categoryGroups.find(
      g => g.id === groupRow.dataset.groupId,
    );
    if (targetGroup) {
      reorderCategoryGroup(draggedGroupId, targetGroup.sortOrder);
    }
    renderBudget();
  }
  draggedCatId = null;
  draggedGroupId = null;
});

document.getElementById('group-form').addEventListener('submit', e => {
  e.preventDefault();
  const input = document.getElementById('group-name');
  addCategoryGroup(input.value.trim());
  input.value = '';
  renderAll();
});

document.getElementById('categories-list').addEventListener('click', e => {
  if (e.target.dataset.deleteGroup) {
    if (confirm('למחוק את הקבוצה וכל הקטגוריות שבה?')) {
      deleteCategoryGroup(e.target.dataset.deleteGroup);
      renderAll();
    }
  } else if (e.target.dataset.deleteCat) {
    if (confirm('למחוק את הקטגוריה? תנועות קיימות יישארו ללא קטגוריה.')) {
      deleteCategory(e.target.dataset.deleteCat);
      renderAll();
    }
  } else if (e.target.dataset.toggleGroupHidden) {
    const grp = state.categoryGroups.find(
      g => g.id === e.target.dataset.toggleGroupHidden,
    );
    setCategoryGroupHidden(grp.id, !grp.hidden);
    renderAll();
  } else if (e.target.dataset.toggleCatHidden) {
    const cat = findCategory(e.target.dataset.toggleCatHidden);
    setCategoryHidden(cat.id, !cat.hidden);
    renderAll();
  }
});

document.getElementById('categories-list').addEventListener('submit', e => {
  e.preventDefault();
  const groupId = e.target.dataset.addCatGroup;
  if (!groupId) return;
  const input = e.target.querySelector('input');
  addCategory(groupId, input.value.trim());
  renderAll();
});

// --- מנוע כללים ---
function resetRuleForm() {
  document.getElementById('rule-conditions-list').innerHTML =
    conditionRowHtml();
  document.getElementById('rule-actions-list').innerHTML = actionRowHtml();
  document.getElementById('rule-conditions-op').value = 'and';
}
resetRuleForm();

document.getElementById('rule-add-condition').addEventListener('click', () => {
  document
    .getElementById('rule-conditions-list')
    .insertAdjacentHTML('beforeend', conditionRowHtml());
});
document.getElementById('rule-conditions-list').addEventListener('click', e => {
  if (e.target.dataset.removeCondition !== undefined) {
    e.target.closest('.rule-row').remove();
  }
});
document
  .getElementById('rule-conditions-list')
  .addEventListener('change', e => {
    if (e.target.classList.contains('rc-field')) {
      refreshConditionOperators(e.target.closest('.rule-row'));
    }
  });

document.getElementById('rule-add-action').addEventListener('click', () => {
  document
    .getElementById('rule-actions-list')
    .insertAdjacentHTML('beforeend', actionRowHtml());
});
document.getElementById('rule-actions-list').addEventListener('click', e => {
  if (e.target.dataset.removeAction !== undefined) {
    e.target.closest('.rule-row').remove();
  }
});
document.getElementById('rule-actions-list').addEventListener('change', e => {
  if (e.target.classList.contains('ra-type')) {
    refreshActionParams(e.target.closest('.rule-row'));
  }
});

document.getElementById('rule-form').addEventListener('submit', e => {
  e.preventDefault();
  const rule = readRuleForm();
  if (rule.conditions.length === 0 || rule.actions.length === 0) {
    alert('כלל חייב לפחות תנאי אחד ופעולה אחת');
    return;
  }
  addRule(rule);
  resetRuleForm();
  renderAll();
});

document.getElementById('rules-list').addEventListener('click', e => {
  const id = e.target.dataset.deleteRule;
  if (!id) return;
  deleteRule(id);
  renderAll();
});

document.getElementById('apply-rules-btn').addEventListener('click', () => {
  if (
    confirm(
      'להריץ את כל הכללים על כל התנועות הקיימות? פעולה זו יכולה לשנות/למחוק תנועות.',
    )
  ) {
    applyRulesToAllTransactions();
    renderAll();
  }
});

// --- תנועות מתוזמנות/חוזרות ---
document.getElementById('schedule-end-mode').addEventListener('change', e => {
  document.getElementById('schedule-end-occurrences').hidden =
    e.target.value !== 'after_n';
  document.getElementById('schedule-end-date').hidden =
    e.target.value !== 'on_date';
});

document.getElementById('schedule-form').addEventListener('submit', e => {
  e.preventDefault();
  addSchedule({
    accountId: document.getElementById('schedule-account').value,
    newPayeeName:
      document.getElementById('schedule-payee-new').value.trim() || null,
    categoryId: document.getElementById('schedule-category').value,
    amount: parseFloat(document.getElementById('schedule-amount').value) || 0,
    note: document.getElementById('schedule-note').value,
    frequency: document.getElementById('schedule-frequency').value,
    interval:
      parseInt(document.getElementById('schedule-interval').value, 10) || 1,
    weekendAdjust: document.getElementById('schedule-weekend-adjust').value,
    startDate: document.getElementById('schedule-start').value,
    endMode: document.getElementById('schedule-end-mode').value,
    endOccurrences: document.getElementById('schedule-end-occurrences').value,
    endDate: document.getElementById('schedule-end-date').value,
  });
  e.target.reset();
  renderAll();
});

function handleScheduleActionClick(e) {
  if (e.target.dataset.postSchedule) {
    postSchedule(e.target.dataset.postSchedule);
    renderAll();
  } else if (e.target.dataset.postTodaySchedule) {
    postScheduleToday(e.target.dataset.postTodaySchedule);
    renderAll();
  } else if (e.target.dataset.skipSchedule) {
    skipSchedule(e.target.dataset.skipSchedule);
    renderAll();
  } else if (e.target.dataset.deleteSchedule) {
    if (confirm('למחוק את התזמון?')) {
      deleteSchedule(e.target.dataset.deleteSchedule);
      renderAll();
    }
  }
}
document
  .getElementById('schedules-list')
  .addEventListener('click', handleScheduleActionClick);
document
  .getElementById('tx-table-body')
  .addEventListener('click', handleScheduleActionClick);

// --- דוחות ---
document.querySelectorAll('.report-tab-btn').forEach(btn => {
  btn.addEventListener('click', () => switchReport(btn.dataset.report));
});

document
  .getElementById('spending-from')
  .addEventListener('change', renderSpendingReport);
document
  .getElementById('spending-to')
  .addEventListener('change', renderSpendingReport);

document.getElementById('calendar-grid').addEventListener('click', e => {
  const date = e.target.closest('[data-cal-day]')?.dataset.calDay;
  if (date) showCalendarDayDetail(date);
});

renderAll();
