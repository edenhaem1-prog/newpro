// תפריט נפתח גנרי (quick-budget menu, balance menu וכו')
let activeDropdown = null;

function closeDropdown() {
  if (activeDropdown) {
    activeDropdown.remove();
    activeDropdown = null;
    document.removeEventListener('click', closeDropdownOnOutsideClick, true);
  }
}

function closeDropdownOnOutsideClick(e) {
  if (activeDropdown && !activeDropdown.contains(e.target)) closeDropdown();
}

function openDropdown(anchorEl, items) {
  closeDropdown();
  const menu = document.createElement('div');
  menu.className = 'dropdown-menu';
  menu.innerHTML = items
    .map(
      (item, i) =>
        `<button type="button" class="dropdown-item" data-idx="${i}">${item.label}</button>`,
    )
    .join('');
  document.body.appendChild(menu);

  const rect = anchorEl.getBoundingClientRect();
  menu.style.top = `${rect.bottom + window.scrollY + 4}px`;
  menu.style.left = `${rect.left + window.scrollX}px`;

  menu.addEventListener('click', e => {
    const idx = e.target.dataset.idx;
    if (idx === undefined) return;
    closeDropdown();
    items[idx].onClick();
  });

  activeDropdown = menu;
  setTimeout(
    () => document.addEventListener('click', closeDropdownOnOutsideClick, true),
    0,
  );
}
