// מנוע תקצוב מעטפתי (envelope): budgeted/spent/leftover/carryover/to-budget
function spentByCategory(month) {
  const totals = {};
  const add = (categoryId, amount) => {
    if (!categoryId || amount >= 0) return; // בלי transfer/הכנסה, רק הוצאות מקוטלגות
    totals[categoryId] = (totals[categoryId] || 0) + Math.abs(amount);
  };
  for (const t of transactionsForMonth(month)) {
    if (t.subtransactions) {
      t.subtransactions.forEach(s => add(s.categoryId, s.amount));
    } else {
      add(t.categoryId, t.amount);
    }
  }
  return totals;
}

function budgetForMonth(month) {
  return state.budgets[month] || {};
}

function totalBudgeted(month) {
  return Object.values(budgetForMonth(month)).reduce((a, b) => a + b, 0);
}

function totalSpent(month) {
  const totals = spentByCategory(month);
  return Object.values(totals).reduce((a, b) => a + b, 0);
}

// החודש המוקדם ביותר שיש לו נתונים כלשהם — נקודת העצירה של הרקורסיה של carryover/to-budget
function earliestMonth() {
  const months = [
    ...state.transactions.map(t => monthKey(t.date)),
    ...Object.keys(state.budgets),
    ...Object.keys(state.income),
  ];
  return months.length ? months.sort()[0] : todayMonth();
}

// leftover[cat][month] = budgeted - spent + carriedIn
// carriedIn = carryover מופעל ? leftover[cat][month-1] (גם שלילי) : max(leftover[cat][month-1], 0)
function leftoverForCategory(month, categoryId) {
  const budgeted = budgetForMonth(month)[categoryId] || 0;
  const spent = spentByCategory(month)[categoryId] || 0;
  if (month <= earliestMonth()) return budgeted - spent;

  const prevMonth = shiftMonth(month, -1);
  const prevLeftover = leftoverForCategory(prevMonth, categoryId);
  const cat = findCategory(categoryId);
  const carriedIn = cat?.carryover ? prevLeftover : Math.max(prevLeftover, 0);
  return budgeted - spent + carriedIn;
}

function remainingForCategory(month, categoryId) {
  return leftoverForCategory(month, categoryId);
}

// to-budget[month] = income + (מאופס? 0 : to-budget[month-1]) - total-budgeted
function toBudget(month) {
  const income = state.income[month] || 0;
  if (month <= earliestMonth()) return income - totalBudgeted(month);

  const prevMonth = shiftMonth(month, -1);
  const isReset = !!(state.resetAvailable && state.resetAvailable[month]);
  const prevToBudget = isReset ? 0 : toBudget(prevMonth);
  return income + prevToBudget - totalBudgeted(month);
}

function setBudget(month, categoryId, amount) {
  if (!state.budgets[month]) state.budgets[month] = {};
  state.budgets[month][categoryId] = amount;
  persist();
}

function transferBudget(month, fromCategoryId, toCategoryId, amount) {
  setBudget(
    month,
    fromCategoryId,
    (budgetForMonth(month)[fromCategoryId] || 0) - amount,
  );
  setBudget(
    month,
    toCategoryId,
    (budgetForMonth(month)[toCategoryId] || 0) + amount,
  );
}

function copyBudgetFromPreviousMonth(month) {
  const prev = shiftMonth(month, -1);
  state.budgets[month] = { ...state.budgets[prev] };
  persist();
}

// ממוצע ההוצאה בפועל בקטגוריה על פני n החודשים שקדמו ל-month (לא כולל month עצמו)
function averageSpent(categoryId, month, n) {
  let total = 0;
  let m = month;
  for (let i = 0; i < n; i++) {
    m = shiftMonth(m, -1);
    total += spentByCategory(m)[categoryId] || 0;
  }
  return Math.round(total / n);
}

function setIncome(month, amount) {
  state.income[month] = amount;
  persist();
}

function setResetAvailable(month, reset) {
  if (!state.resetAvailable) state.resetAvailable = {};
  state.resetAvailable[month] = reset;
  persist();
}
