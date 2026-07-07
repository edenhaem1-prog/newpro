// מסך ניהול קטגוריות (כולל מוסתרות, לצורך שחזור)
function renderCategories() {
  const html = allCategoriesByGroup()
    .map(
      ({ group, categories }) => `
    <div class="category-group-block ${group.hidden ? 'hidden-block' : ''}">
      <h3>
        ${group.name}${group.hidden ? ' <em>(מוסתרת)</em>' : ''}
        <span>
          <button class="small-btn" data-toggle-group-hidden="${group.id}">${group.hidden ? 'הצג' : 'הסתר'}</button>
          <button class="small-btn danger" data-delete-group="${group.id}">מחק קבוצה</button>
        </span>
      </h3>
      ${categories
        .map(
          c => `<div class="category-row ${c.hidden ? 'hidden-block' : ''}">
            <span>${c.name}${c.hidden ? ' <em>(מוסתרת)</em>' : ''}</span>
            <span>
              <button class="small-btn" data-toggle-cat-hidden="${c.id}">${c.hidden ? 'הצג' : 'הסתר'}</button>
              <button class="small-btn danger" data-delete-cat="${c.id}">מחק</button>
            </span>
          </div>`,
        )
        .join('')}
      <form class="add-category-form" data-add-cat-group="${group.id}">
        <input type="text" placeholder="קטגוריה חדשה" required />
        <button type="submit" class="small-btn">הוסף</button>
      </form>
    </div>`,
    )
    .join('');
  document.getElementById('categories-list').innerHTML = html;
}
