// מנוע כללים: תנאים (שדה+אופרטור) + פעולות, מופעל אוטומטית על תנועה חדשה + "הרץ על קיימות"
const RULE_FIELD_INFO = {
  payee: {
    type: 'id',
    label: 'נהנה',
    getValue: t => t.payeeId,
    options: () => allPayees().map(p => ({ value: p.id, label: p.name })),
  },
  note: { type: 'string', label: 'פתק', getValue: t => t.note || '' },
  amount: { type: 'number', label: 'סכום', getValue: t => t.amount },
  category: {
    type: 'id',
    label: 'קטגוריה',
    getValue: t => t.categoryId,
    options: () => state.categories.map(c => ({ value: c.id, label: c.name })),
  },
  account: {
    type: 'id',
    label: 'חשבון',
    getValue: t => t.accountId,
    options: () => allAccounts().map(a => ({ value: a.id, label: a.name })),
  },
  date: { type: 'date', label: 'תאריך', getValue: t => t.date },
};

const RULE_OPERATORS = {
  string: [
    ['is', 'שווה ל'],
    ['contains', 'מכיל'],
    ['doesNotContain', 'לא מכיל'],
    ['isNot', 'שונה מ'],
  ],
  id: [
    ['is', 'שווה ל'],
    ['isNot', 'שונה מ'],
  ],
  number: [
    ['is', 'שווה ל'],
    ['gt', 'גדול מ'],
    ['gte', 'גדול או שווה ל'],
    ['lt', 'קטן מ'],
    ['lte', 'קטן או שווה ל'],
  ],
  date: [
    ['is', 'ביום'],
    ['gt', 'אחרי'],
    ['gte', 'מתאריך'],
    ['lt', 'לפני'],
    ['lte', 'עד תאריך'],
  ],
};

const RULE_ACTION_TYPES = [
  ['set-category', 'הגדר קטגוריה'],
  ['append-note', 'הוסף להערה (בסוף)'],
  ['prepend-note', 'הוסף להערה (בהתחלה)'],
  ['set-cleared', 'סמן כנפרע'],
  ['delete-transaction', 'מחק את התנועה'],
];

function conditionMatches(cond, tx) {
  const field = RULE_FIELD_INFO[cond.field];
  const value = field.getValue(tx);
  switch (cond.op) {
    case 'is':
      return String(value ?? '') === String(cond.value ?? '');
    case 'isNot':
      return String(value ?? '') !== String(cond.value ?? '');
    case 'contains':
      return String(value ?? '').includes(cond.value);
    case 'doesNotContain':
      return !String(value ?? '').includes(cond.value);
    case 'gt':
      return (
        value > (field.type === 'number' ? Number(cond.value) : cond.value)
      );
    case 'gte':
      return (
        value >= (field.type === 'number' ? Number(cond.value) : cond.value)
      );
    case 'lt':
      return (
        value < (field.type === 'number' ? Number(cond.value) : cond.value)
      );
    case 'lte':
      return (
        value <= (field.type === 'number' ? Number(cond.value) : cond.value)
      );
    default:
      return false;
  }
}

function ruleMatches(rule, tx) {
  if (rule.conditions.length === 0) return false;
  const results = rule.conditions.map(c => conditionMatches(c, tx));
  return rule.conditionsOp === 'or'
    ? results.some(Boolean)
    : results.every(Boolean);
}

// מפעיל את הפעולות של הכלל על tx (מוטציה ישירה). מחזיר true אם התנועה צריכה להימחק.
function applyRuleActions(rule, tx) {
  let deleted = false;
  for (const action of rule.actions) {
    switch (action.type) {
      case 'set-category':
        tx.categoryId = action.categoryId;
        break;
      case 'append-note':
        tx.note = tx.note ? `${tx.note} ${action.value}` : action.value;
        break;
      case 'prepend-note':
        tx.note = tx.note ? `${action.value} ${tx.note}` : action.value;
        break;
      case 'set-cleared':
        tx.cleared = true;
        break;
      case 'delete-transaction':
        deleted = true;
        break;
    }
  }
  return deleted;
}

function applyRulesToObject(tx) {
  let deleted = false;
  for (const rule of state.rules) {
    if (ruleMatches(rule, tx) && applyRuleActions(rule, tx)) deleted = true;
  }
  return deleted;
}

function applyRulesToAllTransactions() {
  const toDelete = new Set();
  for (const tx of state.transactions) {
    if (tx.transferId) continue; // ponytail: לא מריצים כללים על רגלי העברה, כדי לא לשבור איזון
    if (applyRulesToObject(tx)) toDelete.add(tx.id);
  }
  state.transactions = state.transactions.filter(t => !toDelete.has(t.id));
  persist();
}

function addRule(rule) {
  state.rules.push({
    id: uid('rule'),
    conditionsOp: 'and',
    conditions: [],
    actions: [],
    ...rule,
  });
  persist();
}

function deleteRule(ruleId) {
  state.rules = state.rules.filter(r => r.id !== ruleId);
  persist();
}

function ruleSentence(rule) {
  const condText = rule.conditions
    .map(c => {
      const field = RULE_FIELD_INFO[c.field];
      const opLabel =
        (RULE_OPERATORS[field.type].find(([op]) => op === c.op) || [])[1] ||
        c.op;
      const displayValue = field.options
        ? field.options().find(o => o.value === c.value)?.label || c.value
        : c.value;
      return `${field.label} ${opLabel} "${displayValue}"`;
    })
    .join(rule.conditionsOp === 'or' ? ' או ' : ' וגם ');

  const actionText = rule.actions
    .map(a => {
      const label = RULE_ACTION_TYPES.find(([t]) => t === a.type)[1];
      if (a.type === 'set-category')
        {return `${label}: ${categoryName(a.categoryId)}`;}
      if (a.type === 'append-note' || a.type === 'prepend-note')
        {return `${label}: "${a.value}"`;}
      return label;
    })
    .join(', ');

  return `אם ${condText || '(אין תנאים)'} — אז ${actionText || '(אין פעולות)'}`;
}
