// תנועות מתוזמנות/חוזרות: יומי/שבועי/חודשי/שנתי + מרווח + תאריך סיום + התאמת סופ"ש
function addMonthsClamped(date, months) {
  const targetMonthIndex = date.getMonth() + months;
  const targetYear = date.getFullYear() + Math.floor(targetMonthIndex / 12);
  const normMonth = ((targetMonthIndex % 12) + 12) % 12;
  const daysInTargetMonth = new Date(targetYear, normMonth + 1, 0).getDate();
  const day = Math.min(date.getDate(), daysInTargetMonth);
  return new Date(targetYear, normMonth, day);
}

function advanceDate(dateStr, frequency, interval) {
  const d = new Date(`${dateStr}T00:00:00`);
  let next;
  if (frequency === 'daily') {
    next = new Date(d);
    next.setDate(next.getDate() + interval);
  } else if (frequency === 'weekly') {
    next = new Date(d);
    next.setDate(next.getDate() + interval * 7);
  } else if (frequency === 'monthly') {
    next = addMonthsClamped(d, interval);
  } else {
    next = addMonthsClamped(d, interval * 12); // yearly
  }
  return formatDate(next);
}

// סופ"ש ישראלי: שישי/שבת
function isWeekendIL(dateStr) {
  const dow = dayOfWeek(dateStr);
  return dow === 5 || dow === 6;
}

function applyWeekendAdjust(dateStr, mode) {
  if (!mode || mode === 'none') return dateStr;
  let d = dateStr;
  const step = mode === 'before' ? -1 : 1;
  while (isWeekendIL(d)) d = addDays(d, step);
  return d;
}

function scheduleDisplayDate(schedule) {
  return applyWeekendAdjust(schedule.date, schedule.weekendAdjust);
}

function scheduleStatus(schedule) {
  if (schedule.completed) return 'completed';
  const displayDate = scheduleDisplayDate(schedule);
  const today = todayDate();
  if (displayDate < today) return 'missed';
  if (displayDate === today) return 'due';
  if (daysBetween(today, displayDate) <= 7) return 'upcoming';
  return 'scheduled';
}

// input: { accountId, payeeId?, newPayeeName?, categoryId, amount, note, frequency, interval, weekendAdjust, startDate, endMode, endOccurrences?, endDate? }
function addSchedule(input) {
  state.schedules.push({
    id: uid('sch'),
    accountId: input.accountId,
    payeeId:
      input.payeeId ||
      (input.newPayeeName ? findOrCreatePayeeByName(input.newPayeeName) : null),
    categoryId: input.categoryId,
    amount: input.amount,
    note: input.note || '',
    frequency: input.frequency,
    interval: input.interval || 1,
    weekendAdjust: input.weekendAdjust || 'none',
    date: input.startDate,
    endMode: input.endMode || 'never',
    endOccurrences:
      input.endMode === 'after_n' ? Number(input.endOccurrences) : undefined,
    endDate: input.endMode === 'on_date' ? input.endDate : undefined,
    completed: false,
  });
  persist();
}

function deleteSchedule(scheduleId) {
  state.schedules = state.schedules.filter(s => s.id !== scheduleId);
  persist();
}

function advanceScheduleAfterPost(schedule) {
  schedule.date = advanceDate(
    schedule.date,
    schedule.frequency,
    schedule.interval,
  );
  if (schedule.endMode === 'after_n') {
    schedule.endOccurrences -= 1;
    if (schedule.endOccurrences <= 0) schedule.completed = true;
  } else if (
    schedule.endMode === 'on_date' &&
    schedule.date > schedule.endDate
  ) {
    schedule.completed = true;
  }
}

function postSchedule(scheduleId, dateOverride) {
  const schedule = state.schedules.find(s => s.id === scheduleId);
  if (!schedule) return;
  addTransaction({
    date: dateOverride || scheduleDisplayDate(schedule),
    accountId: schedule.accountId,
    payeeId: schedule.payeeId,
    categoryId: schedule.categoryId,
    amount: schedule.amount,
    note: schedule.note,
    cleared: false,
  });
  advanceScheduleAfterPost(schedule);
  persist();
}

function postScheduleToday(scheduleId) {
  postSchedule(scheduleId, todayDate());
}

function skipSchedule(scheduleId) {
  const schedule = state.schedules.find(s => s.id === scheduleId);
  if (!schedule) return;
  advanceScheduleAfterPost(schedule);
  persist();
}

// תזמונים שההופעה הבאה שלהם נופלת בחודש הנתון — לצורך שורות תצוגה מקדימה ב-register
function upcomingSchedulesForMonth(month) {
  return state.schedules.filter(
    s => !s.completed && monthKey(scheduleDisplayDate(s)) === month,
  );
}
