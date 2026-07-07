// אגרגציות לדוחות: Net Worth, Cash Flow, Spending, Calendar, Sankey
function lastNMonths(month, n) {
  const months = [];
  let m = month;
  for (let i = 0; i < n; i++) {
    months.unshift(m);
    m = shiftMonth(m, -1);
  }
  return months;
}

function monthEndDate(month) {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(y, m, 0); // היום ה-0 של החודש הבא = היום האחרון של החודש הנוכחי
  return formatDate(d);
}

function netWorthSeries(month, n = 12) {
  return lastNMonths(month, n).map(m => ({
    label: m.slice(5),
    value: state.accounts.reduce(
      (sum, acc) => sum + accountBalance(acc.id, monthEndDate(m)),
      0,
    ),
  }));
}

function cashFlowSeries(month, n = 12) {
  return lastNMonths(month, n).map(m => {
    let income = 0,
      expense = 0;
    for (const t of transactionsForMonth(m)) {
      if (t.transferId) continue; // תזרים לא כולל העברות פנימיות בין חשבונות
      if (t.amount >= 0) income += t.amount;
      else expense += Math.abs(t.amount);
    }
    return { label: m.slice(5), income, expense, net: income - expense };
  });
}

function spentByCategoryInRange(fromDate, toDate) {
  const totals = {};
  const add = (categoryId, amount) => {
    if (!categoryId || amount >= 0) return;
    totals[categoryId] = (totals[categoryId] || 0) + Math.abs(amount);
  };
  for (const t of state.transactions) {
    if (t.date < fromDate || t.date > toDate) continue;
    if (t.subtransactions)
      {t.subtransactions.forEach(s => add(s.categoryId, s.amount));}
    else {add(t.categoryId, t.amount);}
  }
  return totals;
}

function calendarDailyTotals(month) {
  const totals = {};
  for (const t of transactionsForMonth(month)) {
    if (t.amount >= 0) continue;
    totals[t.date] = (totals[t.date] || 0) + Math.abs(t.amount);
  }
  return totals;
}

function sankeyData(month) {
  const spent = spentByCategory(month);
  const income = state.income[month] || 0;
  const groups = categoriesByGroup()
    .map(({ group, categories }) => {
      const cats = categories
        .map(c => ({ name: c.name, value: spent[c.id] || 0 }))
        .filter(c => c.value > 0);
      return {
        name: group.name,
        value: cats.reduce((s, c) => s + c.value, 0),
        categories: cats,
      };
    })
    .filter(g => g.value > 0);
  return { income, groups };
}
