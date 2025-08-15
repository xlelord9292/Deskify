let CACHE = [];
function applyTheme() {
  const pref = localStorage.getItem('theme') || 'dark';
  document.body.classList.toggle('light', pref === 'light');
}

async function refresh() {
  const list = document.getElementById('itemsList');
  list.innerHTML = '';
  CACHE = await window.api.list();
  renderFiltered();
}

function renderFiltered() {
  const q = (document.getElementById('search').value || '').toLowerCase();
  const list = document.getElementById('itemsList');
  list.innerHTML = '';
  CACHE.filter(i => !q || i.title.toLowerCase().includes(q) || (i.description||'').toLowerCase().includes(q))
    .forEach(item => {
      const tpl = document.getElementById('item-template');
      const node = tpl.content.firstElementChild.cloneNode(true);
      const title = node.querySelector('.edit-title');
      const desc = node.querySelector('.edit-description');
      title.value = item.title;
      desc.value = item.description || '';

      node.querySelector('.save').addEventListener('click', async () => {
        await window.api.update(item.id, { title: title.value, description: desc.value });
        await refresh();
      });
      node.querySelector('.delete').addEventListener('click', async () => {
        if (confirm('Delete this item?')) {
          await window.api.delete(item.id);
          await refresh();
        }
      });
      list.appendChild(node);
    });
}

document.getElementById('itemForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = document.getElementById('title');
  const description = document.getElementById('description');
  await window.api.create({ title: title.value, description: description.value });
  title.value = '';
  description.value = '';
  await refresh();
});

document.getElementById('search').addEventListener('input', renderFiltered);
document.getElementById('exportBtn').addEventListener('click', async () => {
  const res = await window.api.export();
  if (!res.canceled) alert('Exported to '+res.filePath);
});
document.getElementById('importFile').addEventListener('change', async (e) => {
  // electron can't directly read file from renderer sandbox, instruct main via hidden input? We'll rely on dialog approach only.
  alert('Use the Import button (will open native dialog).');
});
document.querySelector('.import-label').addEventListener('click', async (e) => {
  const res = await window.api.import();
  if (!res.canceled) {
    await refresh();
    alert(`Imported. Total items now: ${res.total}`);
  }
});
document.getElementById('themeToggle').addEventListener('click', () => {
  const current = localStorage.getItem('theme') || 'dark';
  const next = current === 'dark' ? 'light' : 'dark';
  localStorage.setItem('theme', next);
  applyTheme();
});

applyTheme();
refresh();
