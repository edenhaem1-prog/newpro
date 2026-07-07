// גרפים ב-Canvas טהור, בלי ספריית גרפים
// פלטת צבעים מאומתת (dataviz skill): סדר קבוע, לא רנדומלי, בטוח לעיוורי צבעים (CVD ΔE מינ' 24.2)
const CHART_COLORS = [
  '#2a78d6',
  '#1baf7a',
  '#eda100',
  '#008300',
  '#4a3aa7',
  '#e34948',
  '#e87ba4',
  '#eb6834',
];
const STATUS_GOOD = '#0ca30c';
const STATUS_CRITICAL = '#d03b3b';
const SEQUENTIAL_BLUE = ['#cde2fb', '#9ec5f4', '#5598e7', '#256abf', '#104281'];
const INK_SECONDARY = '#52514e';
const GRIDLINE = '#e1e0d9';

function noDataMessage(ctx, w, h, text = 'אין נתונים') {
  ctx.fillStyle = INK_SECONDARY;
  ctx.font = '13px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(text, w / 2, h / 2);
}

function drawPieChart(canvas, data) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width,
    h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  const total = data.reduce((a, d) => a + d.value, 0);
  if (total === 0) return noDataMessage(ctx, w, h, 'אין נתונים החודש');
  const cx = w / 2,
    cy = h / 2,
    radius = Math.min(w, h) / 2 - 10;
  let start = -Math.PI / 2;
  data.forEach((d, i) => {
    const slice = (d.value / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, start, start + slice);
    ctx.closePath();
    ctx.fillStyle = CHART_COLORS[i % CHART_COLORS.length];
    ctx.fill();
    start += slice;
  });
}

function drawBarChart(canvas, data) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width,
    h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  if (data.length === 0) return noDataMessage(ctx, w, h);
  const max = Math.max(...data.map(d => d.value), 1);
  const barWidth = w / data.length;
  data.forEach((d, i) => {
    const barHeight = (d.value / max) * (h - 30);
    const x = i * barWidth + barWidth * 0.15;
    const barW = barWidth * 0.7;
    ctx.fillStyle = CHART_COLORS[i % CHART_COLORS.length];
    ctx.fillRect(x, h - barHeight - 20, barW, barHeight);
    ctx.fillStyle = INK_SECONDARY;
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(d.label, x + barW / 2, h - 5);
  });
}

// גרף קו/שטח יחיד (סדרה אחת = בלי מקרא, לפי הכלל שסדרה בודדת לא צריכה legend)
function drawLineChart(canvas, data, { area = false } = {}) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width,
    h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  if (data.length === 0) return noDataMessage(ctx, w, h);

  const values = data.map(d => d.value);
  const max = Math.max(...values, 0);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const padTop = 10,
    padBottom = 24,
    padX = 10;
  const plotW = w - padX * 2;
  const plotH = h - padTop - padBottom;
  const x = i => padX + (i / Math.max(data.length - 1, 1)) * plotW;
  const y = v => padTop + (1 - (v - min) / range) * plotH;

  // ציר אפס
  ctx.strokeStyle = GRIDLINE;
  ctx.beginPath();
  ctx.moveTo(padX, y(0));
  ctx.lineTo(w - padX, y(0));
  ctx.stroke();

  if (area) {
    ctx.beginPath();
    ctx.moveTo(x(0), y(0));
    data.forEach((d, i) => ctx.lineTo(x(i), y(d.value)));
    ctx.lineTo(x(data.length - 1), y(0));
    ctx.closePath();
    ctx.fillStyle = CHART_COLORS[0] + '33';
    ctx.fill();
  }

  ctx.strokeStyle = CHART_COLORS[0];
  ctx.lineWidth = 2;
  ctx.beginPath();
  data.forEach((d, i) =>
    i === 0 ? ctx.moveTo(x(i), y(d.value)) : ctx.lineTo(x(i), y(d.value)),
  );
  ctx.stroke();
  ctx.lineWidth = 1;

  ctx.fillStyle = INK_SECONDARY;
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'center';
  data.forEach((d, i) => {
    if (i % Math.ceil(data.length / 12) === 0)
      {ctx.fillText(d.label, x(i), h - 6);}
  });
}

// עמודות מקובצות: הכנסה (ירוק) מול הוצאה (אדום) לכל תקופה — צבעי status, לא קטגוריאליים
function drawGroupedBarChart(canvas, data) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width,
    h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  if (data.length === 0) return noDataMessage(ctx, w, h);
  const max = Math.max(...data.flatMap(d => [d.income, d.expense]), 1);
  const groupWidth = w / data.length;
  data.forEach((d, i) => {
    const barW = groupWidth * 0.35;
    const gx = i * groupWidth + groupWidth * 0.15;
    const incomeH = (d.income / max) * (h - 30);
    const expenseH = (d.expense / max) * (h - 30);
    ctx.fillStyle = STATUS_GOOD;
    ctx.fillRect(gx, h - incomeH - 20, barW, incomeH);
    ctx.fillStyle = STATUS_CRITICAL;
    ctx.fillRect(gx + barW + 2, h - expenseH - 20, barW, expenseH);
    ctx.fillStyle = INK_SECONDARY;
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(d.label, gx + barW, h - 5);
  });
}

// Sankey מפושט: הכנסה -> קבוצות -> קטגוריות, ברוחב יחסי לסכום
function drawSankey(canvas, sankey) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width,
    h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  const total = sankey.groups.reduce((s, g) => s + g.value, 0);
  if (total === 0) return noDataMessage(ctx, w, h, 'אין הוצאות החודש');

  const col1X = 10,
    col2X = w / 2 - 60,
    col3X = w - 160;
  const nodeW = 140;
  const usableH = h - 20;

  ctx.fillStyle = CHART_COLORS[0];
  ctx.fillRect(col1X, 10, nodeW, usableH);
  ctx.fillStyle = '#fff';
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('הכנסה', col1X + nodeW / 2, h / 2);

  let groupY = 10;
  const groupPositions = sankey.groups.map((g, i) => {
    const gh = (g.value / total) * usableH;
    const pos = {
      y: groupY,
      h: gh,
      color: CHART_COLORS[i % CHART_COLORS.length],
    };
    groupY += gh;
    return pos;
  });

  sankey.groups.forEach((g, i) => {
    const pos = groupPositions[i];
    ctx.fillStyle = pos.color;
    ctx.fillRect(col2X, pos.y, nodeW, pos.h);
    if (pos.h > 14) {
      ctx.fillStyle = '#fff';
      ctx.font = '11px sans-serif';
      ctx.fillText(g.name, col2X + nodeW / 2, pos.y + pos.h / 2 + 4);
    }
    // רצועת חיבור מהכנסה לקבוצה
    ctx.fillStyle = pos.color + '55';
    ctx.beginPath();
    ctx.moveTo(col1X + nodeW, 10 + (pos.y / usableH) * usableH);
    ctx.lineTo(col2X, pos.y);
    ctx.lineTo(col2X, pos.y + pos.h);
    ctx.lineTo(col1X + nodeW, 10 + ((pos.y + pos.h) / usableH) * usableH);
    ctx.closePath();
    ctx.fill();

    // עמודה שלישית: קטגוריות בתוך הקבוצה
    let catY = pos.y;
    g.categories.forEach(cat => {
      const catH = (cat.value / g.value) * pos.h;
      ctx.fillStyle = pos.color;
      ctx.fillRect(col3X, catY, nodeW, Math.max(catH - 2, 1));
      if (catH > 12) {
        ctx.fillStyle = '#fff';
        ctx.font = '10px sans-serif';
        ctx.fillText(
          `${cat.name} (${Math.round(cat.value)})`,
          col3X + nodeW / 2,
          catY + catH / 2 + 3,
        );
      }
      ctx.fillStyle = pos.color + '55';
      ctx.beginPath();
      ctx.moveTo(col2X + nodeW, catY);
      ctx.lineTo(col3X, catY);
      ctx.lineTo(col3X, catY + catH);
      ctx.lineTo(col2X + nodeW, catY + catH);
      ctx.closePath();
      ctx.fill();
      catY += catH;
    });
  });
}
