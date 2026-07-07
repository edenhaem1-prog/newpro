// מסך הדשבורד הראשי
function renderMonthLabel() {
  document.getElementById('current-month-label').textContent = currentMonth;
}

function renderDashboard() {
  const spent = spentByCategory(currentMonth);
  const budget = budgetForMonth(currentMonth);

  document.getElementById('summary-cards').innerHTML = `
    <div class="card"><div class="label">הכנסה החודש</div><div class="value">${fmt(state.income[currentMonth] || 0)}</div></div>
    <div class="card"><div class="label">סה"כ מתוקצב</div><div class="value">${fmt(totalBudgeted(currentMonth))}</div></div>
    <div class="card"><div class="label">סה"כ הוצאות בפועל</div><div class="value">${fmt(totalSpent(currentMonth))}</div></div>
    <div class="card"><div class="label">יתרה לא מתוקצבת</div><div class="value ${toBudget(currentMonth) < 0 ? 'negative' : ''}">${fmt(toBudget(currentMonth))}</div></div>
  `;

  const rows = [];
  for (const { group, categories } of categoriesByGroup()) {
    if (categories.length === 0) continue;
    rows.push(`<tr class="group-row"><td colspan="4">${group.name}</td></tr>`);
    for (const cat of categories) {
      const b = budget[cat.id] || 0;
      const s = spent[cat.id] || 0;
      const remaining = leftoverForCategory(currentMonth, cat.id);
      rows.push(`<tr>
        <td>${cat.name}</td>
        <td>${fmt(b)}</td>
        <td>${fmt(s)}</td>
        <td class="${remaining < 0 ? 'negative' : ''}">${fmt(remaining)}</td>
      </tr>`);
    }
  }
  document.getElementById('dashboard-table-body').innerHTML = rows.join('');

  const pieData = state.categoryGroups
    .map(g => ({
      label: g.name,
      value: state.categories
        .filter(c => c.groupId === g.id)
        .reduce((sum, c) => sum + (spent[c.id] || 0), 0),
    }))
    .filter(d => d.value > 0);
  drawPieChart(document.getElementById('dashboard-pie'), pieData);
}
