// מודל טופס גנרי (Transfer to category / Cover overspending וכו')
function openFormModal({ title, fields, onSubmit }) {
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `
    <div class="modal">
      <h3>${title}</h3>
      <form class="modal-form">
        ${fields
          .map(f =>
            f.type === 'select'
              ? `<label>${f.label}<select name="${f.name}">${f.options.map(o => `<option value="${o.value}">${o.label}</option>`).join('')}</select></label>`
              : `<label>${f.label}<input type="${f.type}" name="${f.name}" step="0.01" value="${f.value ?? ''}" /></label>`,
          )
          .join('')}
        <div class="inline-form">
          <button type="submit">אישור</button>
          <button type="button" class="small-btn" data-cancel>ביטול</button>
        </div>
      </form>
    </div>`;
  document.body.appendChild(backdrop);

  const close = () => backdrop.remove();
  backdrop.querySelector('[data-cancel]').addEventListener('click', close);
  backdrop.addEventListener('click', e => {
    if (e.target === backdrop) close();
  });
  backdrop.querySelector('.modal-form').addEventListener('submit', e => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    close();
    onSubmit(data);
  });
}
