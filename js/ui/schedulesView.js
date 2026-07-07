// מסך תנועות מתוזמנות/חוזרות
const SCHEDULE_STATUS_LABELS = {
  completed: 'הושלם',
  missed: 'הוחמץ',
  due: 'מגיע היום',
  upcoming: 'קרוב',
  scheduled: 'מתוזמן',
};

function scheduleActionsHtml(scheduleId) {
  return `
    <button class="small-btn" data-post-schedule="${scheduleId}">פרסם</button>
    <button class="small-btn" data-post-today-schedule="${scheduleId}">פרסם היום</button>
    <button class="small-btn" data-skip-schedule="${scheduleId}">דלג</button>
    <button class="small-btn danger" data-delete-schedule="${scheduleId}">מחק</button>
  `;
}

function scheduleRowHtml(schedule) {
  const status = scheduleStatus(schedule);
  return `<div class="schedule-item status-${status}">
    <span>
      <strong>${scheduleDisplayDate(schedule)}</strong> ·
      ${accountName(schedule.accountId)} ·
      ${schedule.payeeId ? payeeName(schedule.payeeId) : ''} ·
      ${categoryName(schedule.categoryId)} ·
      <span class="${schedule.amount < 0 ? 'negative' : ''}">${fmt(schedule.amount)}</span>
    </span>
    <span class="status-badge status-${status}">${SCHEDULE_STATUS_LABELS[status]}</span>
    <span>${scheduleActionsHtml(schedule.id)}</span>
  </div>`;
}

function renderScheduleForm() {
  document.getElementById('schedule-account').innerHTML = accountOptionsHtml();
  document.getElementById('schedule-category').innerHTML =
    categoryOptionsHtml();
}

function renderSchedules() {
  renderScheduleForm();
  const rows = state.schedules.map(scheduleRowHtml);
  document.getElementById('schedules-list').innerHTML =
    rows.join('') || '<p>אין תנועות מתוזמנות.</p>';
}
