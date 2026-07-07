// ניווט בין מסכים (טאבים)
function switchView(viewName) {
  document
    .querySelectorAll('.tab-btn')
    .forEach(b => b.classList.toggle('active', b.dataset.view === viewName));
  document
    .querySelectorAll('.view')
    .forEach(v => v.classList.toggle('active', v.id === `view-${viewName}`));
}

function renderAll() {
  renderMonthLabel();
  renderDashboard();
  renderAccounts();
  renderRegisterAccountFilter();
  renderTxForm();
  renderTransactions();
  renderBudget();
  renderCategories();
  renderRules();
  renderSchedules();
  renderReports();
}
