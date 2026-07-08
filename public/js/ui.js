/**
 * MAGD MARKET — Shared UI Utilities
 */

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const icons  = { success: 'fa-check-circle', error: 'fa-exclamation-circle', warning: 'fa-triangle-exclamation', info: 'fa-circle-info' };
  const colors = { success: '#9BCEC1', error: '#e05252', warning: '#FFB6A6', info: '#67A2C5' };
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.style.borderLeftColor = colors[type] || colors.info;
  toast.innerHTML = `<i class="fa ${icons[type] || icons.info}" style="color:${colors[type]};font-size:1.1rem"></i><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => { if (toast.parentNode) toast.remove(); }, 3200);
}

function renderStars(rating, max = 5) {
  let html = '';
  for (let i = 1; i <= max; i++) {
    if (i <= Math.floor(rating)) html += '<i class="fa fa-star"></i>';
    else if (i - 0.5 <= rating) html += '<i class="fa fa-star-half-stroke"></i>';
    else html += '<i class="fa fa-regular fa-star"></i>';
  }
  return html;
}

function buildProductCard(product) {
  const img     = product.images?.[0];
  const rating  = product.avgRating || 0;
  const price   = `$${product.price.toFixed(2)}`;
  const inStock = product.variants?.some(v => v.stock > 0);
  return `
    <div class="product-card" onclick="window.location.href='product.html?id=${product._id}'">
      <div class="product-card-img-wrap">
        ${img
          ? `<img src="${img}" alt="${product.title}" class="product-card-img" loading="lazy" />`
          : `<div class="product-card-img-placeholder"><i class="fa fa-shirt"></i><span>${product.subCategory}</span></div>`
        }
        ${rating >= 4 ? `<span class="product-card-badge">Top Rated</span>` : ''}
        ${!inStock ? `<span class="product-card-badge" style="background:#e05252">Out of Stock</span>` : ''}
      </div>
      <div class="product-card-body">
        <div class="product-card-cats">${product.mainCategory} · ${product.subCategory}</div>
        <h3 class="product-card-title">${product.title}</h3>
        <div class="product-card-stars">
          <span class="stars">${renderStars(rating)}</span>
          <span class="stars-count">${rating > 0 ? rating.toFixed(1) : 'No reviews'}</span>
        </div>
        <div class="product-card-footer">
          <span class="product-card-price">${price}</span>
          <button class="btn-add-cart" onclick="quickAddToCart(event,'${product._id}',${JSON.stringify(product.variants||[]).replace(/"/g,'&quot;')})">
            <i class="fa fa-plus"></i> Add
          </button>
        </div>
      </div>
    </div>`;
}

async function quickAddToCart(e, productId, variants) {
  e.stopPropagation();
  const inStock = variants.filter(v => v.stock > 0);
  if (inStock.length === 0) { showToast('This product is out of stock', 'warning'); return; }
  const sizes  = [...new Set(variants.map(v => v.size))];
  const colors = [...new Set(variants.map(v => v.color))];
  if (sizes.length === 1 && colors.length === 1) {
    if (!authManager.isLoggedIn()) { showToast('Please login to add items to cart', 'warning'); window.location.href='/login.html'; return; }
    try {
      await api.cart.add({ productId, size: sizes[0], color: colors[0], quantity: 1 });
      showToast('Added to cart!', 'success');
      authManager.refreshCartBadge();
    } catch (err) { showToast(err.message || 'Could not add to cart', 'error'); }
    return;
  }
  window.location.href = `product.html?id=${productId}`;
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function fmtPrice(amount) { return `$${Number(amount || 0).toFixed(2)}`; }

function orderStatusBadge(status) { return `<span class="order-status-badge status-${status}">${status}</span>`; }
function paymentStatusBadge(status) { return `<span class="order-status-badge payment-${status}">${status}</span>`; }

function setLoading(btnEl, textEl, spinnerEl, loading) {
  btnEl.disabled = loading;
  if (textEl)    textEl.style.display    = loading ? 'none' : '';
  if (spinnerEl) spinnerEl.style.display = loading ? 'inline-flex' : 'none';
}

window.showToast         = showToast;
window.renderStars       = renderStars;
window.buildProductCard  = buildProductCard;
window.quickAddToCart    = quickAddToCart;
window.formatDate        = formatDate;
window.fmtPrice          = fmtPrice;
window.orderStatusBadge  = orderStatusBadge;
window.paymentStatusBadge = paymentStatusBadge;
window.setLoading        = setLoading;
