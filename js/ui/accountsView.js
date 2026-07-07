// מסך חשבונות
function renderAccounts() {
  const rows = allAccounts().map((acc) => {
    const balance = accountBalance(acc.id);
    return `<div class="account-row ${acc.closed ? "closed" : ""}">
      <span class="account-name">${acc.name}${acc.offBudget ? " <em>(מחוץ לתקציב)</em>" : ""}</span>
      <span class="account-balance ${balance < 0 ? "negative" : ""}">${fmt(balance)}</span>
      ${
        acc.closed
          ? `<button class="small-btn" data-reopen-account="${acc.id}">פתח מחדש</button>`
          : `<button class="small-btn danger" data-close-account="${acc.id}">סגור חשבון</button>`
      }
    </div>`;
  });
  document.getElementById("accounts-list").innerHTML = rows.join("");
}

function accountOptionsHtml() {
  return openAccounts()
    .map((a) => `<option value="${a.id}">${a.name}</option>`)
    .join("");
}
