// מסך דוחות: שווי נטו, תזרים מזומנים, הוצאות לפי קטגוריה, לוח שנה, Sankey
function switchReport(reportName) {
  document
    .querySelectorAll('.report-tab-btn')
    .forEach(b =>
      b.classList.toggle('active', b.dataset.report === reportName),
    );
  document
    .querySelectorAll('.report-panel')
    .forEach(p =>
      p.classList.toggle('active', p.id === `report-${reportName}`),
    );
}

function renderNetWorthReport() {
  drawLineChart(
    document.getElementById('networth-chart'),
    netWorthSeries(currentMonth, 12),
    { area: true },
  );
}

function renderCashFlowReport() {
  drawGroupedBarChart(
    document.getElementById('cashflow-chart'),
    cashFlowSeries(currentMonth, 12),
  );
}

function renderSpendingReport() {
  const from =
    document.getElementById('spending-from').value || `${currentMonth}-01`;
  const to =
    document.getElementById('spending-to').value || monthEndDate(currentMonth);
  const totals = spentByCategoryInRange(from, to);
  const data = Object.entries(totals)
    .map(([categoryId, value]) => ({ label: categoryName(categoryId), value }))
    .sort((a, b) => b.value - a.value);
  drawBarChart(document.getElementById('spending-chart'), data);
}

function calendarCellColor(value, max) {
  if (value === 0) return 'transparent';
  const steps = SEQUENTIAL_BLUE;
  const idx = Math.min(
    steps.length - 1,
    Math.floor((value / max) * steps.length),
  );
  return steps[idx];
}

const WEEKDAY_LABELS = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];

function renderCalendarReport() {
  const totals = calendarDailyTotals(currentMonth);
  const max = Math.max(...Object.values(totals), 1);
  const [y, m] = currentMonth.split('-').map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();
  const firstDayOfWeek = new Date(y, m - 1, 1).getDay();

  const cells = WEEKDAY_LABELS.map(
    label => `<div class="cal-cell cal-weekday-header">${label}</div>`,
  );
  for (let i = 0; i < firstDayOfWeek; i++) {
    cells.push('<div class="cal-cell empty"></div>');
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const date = `${currentMonth}-${String(day).padStart(2, '0')}`;
    const value = totals[date] || 0;
    cells.push(
      `<div class="cal-cell" data-cal-day="${date}" style="background:${calendarCellColor(value, max)}"><span>${day}</span>${value ? `<small>${fmt(value)}</small>` : ''}</div>`,
    );
  }
  document.getElementById('calendar-grid').innerHTML = cells.join('');
  document.getElementById('calendar-day-detail').innerHTML = '';
}

function showCalendarDayDetail(date) {
  const rows = state.transactions
    .filter(t => t.date === date && t.amount < 0)
    .map(
      t =>
        `<div>${categoryName(t.categoryId)} — ${fmt(t.amount)} ${t.note ? `(${t.note})` : ''}</div>`,
    );
  document.getElementById('calendar-day-detail').innerHTML =
    `<h4>${date}</h4>${rows.join('') || '<p>אין הוצאות ביום זה.</p>'}`;
}

function renderSankeyReport() {
  drawSankey(document.getElementById('sankey-chart'), sankeyData(currentMonth));
}

function renderReports() {
  renderNetWorthReport();
  renderCashFlowReport();
  renderSpendingReport();
  renderCalendarReport();
  renderSankeyReport();
}
