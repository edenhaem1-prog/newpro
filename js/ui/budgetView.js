// מסך תקצוב חודשי מקצועי: quick-budget, balance menu, carryover, הערות, הסתרה, קיפול, גרירה
const collapsedGroups = new Set();

function groupTotals(categories, month) {
  const budget = budgetForMonth(month);
  let budgeted = 0,
    spent = 0,
    leftover = 0;
  for (const cat of categories) {
    budgeted += budget[cat.id] || 0;
    spent += spentByCategory(month)[cat.id] || 0;
    leftover += leftoverForCategory(month, cat.id);
  }
  return { budgeted, spent, leftover };
}

function renderBudget() {
  document.getElementById('income-input').value =
    state.income[currentMonth] || '';
  document.getElementById('reset-available-input').checked = !!(
    state.resetAvailable && state.resetAvailable[currentMonth]
  );
  document.getElementById('to-budget-value').textContent = fmt(
    toBudget(currentMonth),
  );

  const budget = budgetForMonth(currentMonth);
  const rows = [];
  for (const { group, categories } of categoriesByGroup()) {
    const collapsed = collapsedGroups.has(group.id);
    const totals = groupTotals(categories, currentMonth);
    rows.push(`<tr class="group-row" draggable="true" data-group-id="${group.id}">
      <td colspan="2">
        <button class="chevron-btn" data-toggle-collapse="${group.id}">${collapsed ? '◀' : '▼'}</button>
        ${group.name}
        <button class="small-btn" data-hide-group="${group.id}">הסתר קבוצה</button>
      </td>
      <td>${fmt(totals.budgeted)}</td>
      <td>${fmt(totals.spent)}</td>
      <td class="${totals.leftover < 0 ? 'negative' : ''}">${fmt(totals.leftover)}</td>
      <td></td>
    </tr>`);
    if (collapsed) continue;
    for (const cat of categories) {
      const b = budget[cat.id] || 0;
      const s = spentByCategory(currentMonth)[cat.id] || 0;
      const l = leftoverForCategory(currentMonth, cat.id);
      rows.push(`<tr class="category-row-budget" draggable="true" data-cat-id="${cat.id}" data-group-id="${group.id}">
        <td class="drag-handle">⠿ ${cat.name} <button class="small-btn" data-hide-cat="${cat.id}">הסתר</button></td>
        <td><button class="budgeted-cell" data-quick-budget="${cat.id}">${fmt(b)}</button></td>
        <td>${fmt(s)}</td>
        <td>
          <button class="balance-cell ${l < 0 ? 'negative' : ''}" data-balance-menu="${cat.id}">
            ${fmt(l)} ${cat.carryover ? '🔄' : ''}
          </button>
        </td>
        <td><input type="text" class="cat-notes-input" data-notes-cat="${cat.id}" value="${cat.notes || ''}" placeholder="הערה" /></td>
      </tr>`);
    }
  }
  document.getElementById('budget-table-body').innerHTML = rows.join('');
}

function quickBudgetMenuItems(categoryId) {
  const prevMonth = shiftMonth(currentMonth, -1);
  return [
    {
      label: 'העתק את תקציב החודש הקודם',
      onClick: () =>
        setBudget(
          currentMonth,
          categoryId,
          budgetForMonth(prevMonth)[categoryId] || 0,
        ),
    },
    {
      label: 'הגדר לממוצע 3 חודשים',
      onClick: () =>
        setBudget(
          currentMonth,
          categoryId,
          averageSpent(categoryId, currentMonth, 3),
        ),
    },
    {
      label: 'הגדר לממוצע 6 חודשים',
      onClick: () =>
        setBudget(
          currentMonth,
          categoryId,
          averageSpent(categoryId, currentMonth, 6),
        ),
    },
    {
      label: 'הגדר לממוצע 12 חודשים',
      onClick: () =>
        setBudget(
          currentMonth,
          categoryId,
          averageSpent(categoryId, currentMonth, 12),
        ),
    },
  ].map(item => ({
    label: item.label,
    onClick: () => {
      item.onClick();
      renderAll();
    },
  }));
}

function otherCategoryOptions(excludeId) {
  return categoriesByGroup().flatMap(({ categories }) =>
    categories
      .filter(c => c.id !== excludeId)
      .map(c => ({ value: c.id, label: c.name })),
  );
}

function balanceMenuItems(categoryId) {
  const cat = findCategory(categoryId);
  return [
    {
      label: 'העבר לקטגוריה אחרת',
      onClick: () =>
        openFormModal({
          title: 'העברה לקטגוריה אחרת',
          fields: [
            {
              name: 'toCategoryId',
              label: 'לקטגוריה',
              type: 'select',
              options: otherCategoryOptions(categoryId),
            },
            { name: 'amount', label: 'סכום', type: 'number' },
          ],
          onSubmit: data => {
            transferBudget(
              currentMonth,
              categoryId,
              data.toCategoryId,
              parseFloat(data.amount) || 0,
            );
            renderAll();
          },
        }),
    },
    {
      label: 'כסה חריגה מקטגוריה אחרת',
      onClick: () =>
        openFormModal({
          title: 'כיסוי חריגה',
          fields: [
            {
              name: 'fromCategoryId',
              label: 'מקטגוריה',
              type: 'select',
              options: otherCategoryOptions(categoryId),
            },
            {
              name: 'amount',
              label: 'סכום',
              type: 'number',
              value: Math.abs(
                Math.min(leftoverForCategory(currentMonth, categoryId), 0),
              ),
            },
          ],
          onSubmit: data => {
            transferBudget(
              currentMonth,
              data.fromCategoryId,
              categoryId,
              parseFloat(data.amount) || 0,
            );
            renderAll();
          },
        }),
    },
    {
      label: cat?.carryover
        ? 'בטל העברת יתרה לחודש הבא (rollover)'
        : 'העבר יתרה לחודש הבא (rollover)',
      onClick: () => {
        setCategoryCarryover(categoryId, !cat?.carryover);
        renderAll();
      },
    },
  ];
}
