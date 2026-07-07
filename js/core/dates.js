// עזרי תאריך/חודש משותפים
// ponytail: כל תאריך מפורמט לפי שעון מקומי (getFullYear/getMonth/getDate), לעולם לא toISOString() —
// toISOString ממיר ל-UTC ובאזורי זמן קדימים מ-UTC (כמו ישראל) זה מזיז את התאריך יום אחורה.
function formatDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function monthKey(date) {
  return date.slice(0, 7); // 'YYYY-MM-DD' -> 'YYYY-MM'
}

function todayMonth() {
  return formatDate(new Date()).slice(0, 7);
}

function todayDate() {
  return formatDate(new Date());
}

function shiftMonth(month, delta) {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function addDays(date, days) {
  const d = new Date(date + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return formatDate(d);
}

function daysBetween(dateA, dateB) {
  const a = new Date(dateA + 'T00:00:00');
  const b = new Date(dateB + 'T00:00:00');
  return Math.round((b - a) / 86400000);
}

function dayOfWeek(date) {
  return new Date(date + 'T00:00:00').getDay(); // 0=ראשון ... 6=שבת
}
