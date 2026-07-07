// עזרי תצוגה משותפים לכל המסכים
function fmt(n) {
  return n.toLocaleString("he-IL", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function categoryOptionsHtml() {
  return categoriesByGroup()
    .map(({ group, categories }) =>
      categories.length
        ? `<optgroup label="${group.name}">${categories.map((c) => `<option value="${c.id}">${c.name}</option>`).join("")}</optgroup>`
        : "",
    )
    .join("");
}
