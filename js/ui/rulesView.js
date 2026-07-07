// מסך מנוע כללים: בניית תנאים/פעולות + רשימת כללים קיימים
function valueInputHtml(fieldKey) {
  const field = RULE_FIELD_INFO[fieldKey];
  if (field.type === 'id') {
    return `<select class="rc-value">${field
      .options()
      .map(o => `<option value="${o.value}">${o.label}</option>`)
      .join('')}</select>`;
  }
  const inputType =
    field.type === 'number'
      ? 'number'
      : field.type === 'date'
        ? 'date'
        : 'text';
  return `<input type="${inputType}" class="rc-value" ${inputType === 'number' ? 'step="0.01"' : ''} />`;
}

function conditionRowHtml() {
  const fieldOptions = Object.entries(RULE_FIELD_INFO)
    .map(([key, f]) => `<option value="${key}">${f.label}</option>`)
    .join('');
  const opOptions = RULE_OPERATORS[RULE_FIELD_INFO.payee.type]
    .map(([op, label]) => `<option value="${op}">${label}</option>`)
    .join('');
  return `<div class="rule-row">
    <select class="rc-field">${fieldOptions}</select>
    <select class="rc-op">${opOptions}</select>
    <span class="rc-value-wrap">${valueInputHtml('payee')}</span>
    <button type="button" class="small-btn danger" data-remove-condition>הסר</button>
  </div>`;
}

function refreshConditionOperators(row) {
  const fieldKey = row.querySelector('.rc-field').value;
  const field = RULE_FIELD_INFO[fieldKey];
  row.querySelector('.rc-op').innerHTML = RULE_OPERATORS[field.type]
    .map(([op, label]) => `<option value="${op}">${label}</option>`)
    .join('');
  row.querySelector('.rc-value-wrap').innerHTML = valueInputHtml(fieldKey);
}

function actionParamsHtml(actionType) {
  if (actionType === 'set-category') {
    return `<select class="ra-category">${state.categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}</select>`;
  }
  if (actionType === 'append-note' || actionType === 'prepend-note') {
    return `<input type="text" class="ra-value" placeholder="טקסט" />`;
  }
  return '';
}

function actionRowHtml() {
  const typeOptions = RULE_ACTION_TYPES.map(
    ([type, label]) => `<option value="${type}">${label}</option>`,
  ).join('');
  return `<div class="rule-row">
    <select class="ra-type">${typeOptions}</select>
    <span class="ra-params-wrap">${actionParamsHtml(RULE_ACTION_TYPES[0][0])}</span>
    <button type="button" class="small-btn danger" data-remove-action>הסר</button>
  </div>`;
}

function refreshActionParams(row) {
  row.querySelector('.ra-params-wrap').innerHTML = actionParamsHtml(
    row.querySelector('.ra-type').value,
  );
}

function readRuleForm() {
  const conditionsOp = document.getElementById('rule-conditions-op').value;
  const conditions = Array.from(
    document.querySelectorAll('#rule-conditions-list .rule-row'),
  ).map(row => ({
    field: row.querySelector('.rc-field').value,
    op: row.querySelector('.rc-op').value,
    value: row.querySelector('.rc-value').value,
  }));
  const actions = Array.from(
    document.querySelectorAll('#rule-actions-list .rule-row'),
  ).map(row => {
    const type = row.querySelector('.ra-type').value;
    if (type === 'set-category')
      {return { type, categoryId: row.querySelector('.ra-category').value };}
    if (type === 'append-note' || type === 'prepend-note')
      {return { type, value: row.querySelector('.ra-value').value };}
    return { type };
  });
  return { conditionsOp, conditions, actions };
}

function renderRulesList() {
  const rows = state.rules.map(
    rule => `<div class="rule-item">
      <span>${ruleSentence(rule)}</span>
      <button class="small-btn danger" data-delete-rule="${rule.id}">מחק</button>
    </div>`,
  );
  document.getElementById('rules-list').innerHTML =
    rows.join('') || '<p>אין כללים עדיין.</p>';
}

function renderRules() {
  renderRulesList();
}
