/**
 * MAGD MARKET — Shop Page
 */
let allProducts = [];
let activeFilters = { mainCategory: '', subCategory: '', minPrice: '', maxPrice: '' };

document.addEventListener('DOMContentLoaded', async () => {
  await authManager.init();
  parseURLFilters();
  applyChipActiveStates();
  await loadProducts();
  bindFilters();
});

function parseURLFilters() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('mainCategory')) activeFilters.mainCategory = params.get('mainCategory');
  if (params.get('subCategory'))  activeFilters.subCategory  = params.get('subCategory');
}

function applyChipActiveStates() {
  document.querySelectorAll('.chip').forEach(chip => {
    const f = chip.dataset.filter, v = chip.dataset.value;
    chip.classList.toggle('chip--active', f && activeFilters[f] === v);
  });
}

async function loadProducts() {
  const grid  = document.getElementById('shopGrid');
  const count = document.getElementById('shopCount');
  const empty = document.getElementById('shopEmpty');
  grid.innerHTML = Array(6).fill('<div class="skeleton-card"></div>').join('');
  if (empty) empty.style.display = 'none';
  try {
    const res = await api.products.getAll(activeFilters);
    allProducts = res.data || [];
    renderProducts(allProducts);
    if (count) count.textContent = `${allProducts.length} product${allProducts.length !== 1 ? 's' : ''} found`;
  } catch (err) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
      <i class="fa fa-lock"></i>
      <h3>Login to view products</h3>
      <p>Please <a href="login.html" style="color:var(--primary)">login</a> to browse our catalogue.</p>
    </div>`;
    if (count) count.textContent = '';
  }
}

function renderProducts(products) {
  const grid  = document.getElementById('shopGrid');
  const empty = document.getElementById('shopEmpty');
  if (!products.length) { grid.innerHTML = ''; if (empty) empty.style.display = 'flex'; return; }
  if (empty) empty.style.display = 'none';
  grid.innerHTML = products.map(buildProductCard).join('');
}

function bindFilters() {
  document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      chip.closest('.filter-chips').querySelectorAll('.chip').forEach(c => c.classList.remove('chip--active'));
      chip.classList.add('chip--active');
      activeFilters[chip.dataset.filter] = chip.dataset.value;
      loadProducts();
    });
  });

  document.getElementById('applyPrice')?.addEventListener('click', () => {
    activeFilters.minPrice = document.getElementById('minPrice').value;
    activeFilters.maxPrice = document.getElementById('maxPrice').value;
    loadProducts();
  });

  document.getElementById('clearFilters')?.addEventListener('click', () => {
    activeFilters = { mainCategory: '', subCategory: '', minPrice: '', maxPrice: '' };
    document.getElementById('minPrice').value = '';
    document.getElementById('maxPrice').value = '';
    document.querySelectorAll('.chip').forEach(c => c.classList.toggle('chip--active', c.dataset.value === ''));
    loadProducts();
  });

  let searchTimer;
  document.getElementById('searchInput')?.addEventListener('input', (e) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      const q = e.target.value.toLowerCase().trim();
      if (!q) { renderProducts(allProducts); return; }
      const filtered = allProducts.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.mainCategory?.toLowerCase().includes(q) ||
        p.subCategory?.toLowerCase().includes(q)
      );
      renderProducts(filtered);
      const count = document.getElementById('shopCount');
      if (count) count.textContent = `${filtered.length} result${filtered.length !== 1 ? 's' : ''} for "${e.target.value}"`;
    }, 300);
  });

  const filterBtn = document.getElementById('filterToggleBtn');
  const sidebar   = document.getElementById('shopSidebar');
  const overlay   = document.getElementById('sidebarOverlay');
  const closeBtn  = document.getElementById('sidebarClose');
  const open  = () => { sidebar?.classList.add('open');    overlay?.classList.add('show'); };
  const close = () => { sidebar?.classList.remove('open'); overlay?.classList.remove('show'); };
  filterBtn?.addEventListener('click', open);
  overlay?.addEventListener('click', close);
  closeBtn?.addEventListener('click', close);
}
