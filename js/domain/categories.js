// קבוצות קטגוריה + קטגוריות: CRUD, סדר, הסתרה, הערות
function categoriesByGroup() {
  return state.categoryGroups
    .filter(g => !g.hidden)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(group => ({
      group,
      categories: state.categories
        .filter(c => c.groupId === group.id && !c.hidden)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    }));
}

// לרבות קבוצות/קטגוריות מוסתרות — לשימוש במסך ניהול קטגוריות
function allCategoriesByGroup() {
  return state.categoryGroups
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(group => ({
      group,
      categories: state.categories
        .filter(c => c.groupId === group.id)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    }));
}

function addCategoryGroup(name) {
  state.categoryGroups.push({
    id: uid('grp'),
    name,
    hidden: false,
    sortOrder: state.categoryGroups.length,
  });
  persist();
}

function addCategory(groupId, name) {
  const siblingCount = state.categories.filter(
    c => c.groupId === groupId,
  ).length;
  state.categories.push({
    id: uid('cat'),
    groupId,
    name,
    hidden: false,
    notes: '',
    carryover: false,
    sortOrder: siblingCount,
  });
  persist();
}

function deleteCategory(categoryId) {
  state.categories = state.categories.filter(c => c.id !== categoryId);
  persist();
}

function deleteCategoryGroup(groupId) {
  state.categoryGroups = state.categoryGroups.filter(g => g.id !== groupId);
  state.categories = state.categories.filter(c => c.groupId !== groupId);
  persist();
}

function setCategoryHidden(categoryId, hidden) {
  const cat = state.categories.find(c => c.id === categoryId);
  if (cat) cat.hidden = hidden;
  persist();
}

function setCategoryGroupHidden(groupId, hidden) {
  const grp = state.categoryGroups.find(g => g.id === groupId);
  if (grp) grp.hidden = hidden;
  persist();
}

function setCategoryNotes(categoryId, notes) {
  const cat = state.categories.find(c => c.id === categoryId);
  if (cat) cat.notes = notes;
  persist();
}

function setCategoryCarryover(categoryId, carryover) {
  const cat = state.categories.find(c => c.id === categoryId);
  if (cat) cat.carryover = carryover;
  persist();
}

function reorderCategory(categoryId, targetSortOrder) {
  const cat = state.categories.find(c => c.id === categoryId);
  if (!cat) return;
  const siblings = state.categories
    .filter(c => c.groupId === cat.groupId && c.id !== categoryId)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  siblings.splice(targetSortOrder, 0, cat);
  siblings.forEach((c, i) => (c.sortOrder = i));
  persist();
}

function reorderCategoryGroup(groupId, targetSortOrder) {
  const grp = state.categoryGroups.find(g => g.id === groupId);
  if (!grp) return;
  const siblings = state.categoryGroups
    .filter(g => g.id !== groupId)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  siblings.splice(targetSortOrder, 0, grp);
  siblings.forEach((g, i) => (g.sortOrder = i));
  persist();
}

function categoryName(categoryId) {
  return state.categories.find(c => c.id === categoryId)?.name || 'ללא קטגוריה';
}

function findCategory(categoryId) {
  return state.categories.find(c => c.id === categoryId);
}
