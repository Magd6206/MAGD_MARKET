/**
 * MAGD MARKET — Home Page
 */
document.addEventListener('DOMContentLoaded', async () => {
  await authManager.init();
  loadFeaturedProducts();
});

async function loadFeaturedProducts() {
  const grid = document.getElementById('featuredGrid');
  if (!grid) return;
  try {
    const res = await api.products.getAll({});
    const products = (res.data || []).slice(0, 8);
    if (!products.length) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><i class="fa fa-box-open"></i><h3>No products yet</h3><p>Check back soon!</p></div>`;
      return;
    }
    grid.innerHTML = products.map(buildProductCard).join('');
  } catch {
    grid.innerHTML = buildDemoCards();
  }
}

function buildDemoCards() {
  const demos = [
    { title: 'Classic White Sneakers', category: 'Men · Shoes',       price: '$89.99',  rating: 4.5 },
    { title: 'Floral Summer Dress',    category: 'Women · Clothing',   price: '$64.99',  rating: 4.8 },
    { title: 'Kids Denim Jacket',      category: 'Kids · Clothing',    price: '$42.00',  rating: 4.2 },
    { title: 'Leather Chelsea Boots',  category: 'Women · Shoes',      price: '$129.00', rating: 4.7 },
  ];
  return demos.map(d => `
    <div class="product-card" onclick="window.location.href='login.html'">
      <div class="product-card-img-wrap">
        <div class="product-card-img-placeholder"><i class="fa fa-shirt"></i></div>
      </div>
      <div class="product-card-body">
        <div class="product-card-cats">${d.category}</div>
        <h3 class="product-card-title">${d.title}</h3>
        <div class="product-card-stars">
          <span class="stars">${renderStars(d.rating)}</span>
          <span class="stars-count">${d.rating}</span>
        </div>
        <div class="product-card-footer">
          <span class="product-card-price">${d.price}</span>
          <button class="btn-add-cart" onclick="event.stopPropagation();window.location.href='login.html'">
            <i class="fa fa-plus"></i> Add
          </button>
        </div>
      </div>
    </div>`).join('');
}
