/**
 * MAGD MARKET — Product Detail Page
 */
let product = null, selectedSize = null, selectedColor = null, reviewRating = 0, currentUserId = null;

document.addEventListener('DOMContentLoaded', async () => {
  const user = await authManager.init();
  currentUserId = user?._id || user?.id;
  const id = new URLSearchParams(window.location.search).get('id');
  if (!id) { window.location.href = 'shop.html'; return; }
  await loadProduct(id);
  await loadReviews(id);
  bindReviewUI();
});

async function loadProduct(id) {
  try {
    const res = await api.products.getById(id);
    product = res.data;
    renderProduct();
  } catch {
    document.getElementById('productSkeleton').innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <i class="fa fa-exclamation-circle"></i><h3>Product not found</h3>
        <a href="shop.html" class="btn btn-primary">Back to Shop</a>
      </div>`;
  }
}

function renderProduct() {
  document.getElementById('productSkeleton').style.display = 'none';
  document.getElementById('productDetail').style.display   = 'grid';
  document.getElementById('breadcrumbName').textContent    = product.title;
  document.getElementById('productBreadcrumbTitle').textContent = product.title;
  document.title = `${product.title} — MAGD MARKET`;

  const mainImg = document.getElementById('mainImage');
  const thumbs  = document.getElementById('galleryThumbs');
  if (product.images?.length) {
    mainImg.src = product.images[0]; mainImg.alt = product.title;
    thumbs.innerHTML = product.images.map((src, i) => `
      <div class="gallery-thumb${i===0?' active':''}" onclick="setMainImage('${src}',this)">
        <img src="${src}" alt="View ${i+1}" loading="lazy" />
      </div>`).join('');
    document.getElementById('galleryMain').addEventListener('click', () => openLightbox(mainImg.src));
  } else {
    document.getElementById('galleryMain').innerHTML = `
      <div class="product-card-img-placeholder" style="height:400px">
        <i class="fa fa-shirt" style="font-size:5rem;color:var(--primary);opacity:0.4"></i>
      </div>`;
  }

  document.getElementById('productBadges').innerHTML =
    `<span class="badge badge-main">${product.mainCategory}</span><span class="badge badge-sub">${product.subCategory}</span>`;
  document.getElementById('productTitle').textContent = product.title;
  const rating = product.avgRating || 0;
  document.getElementById('productStarsDisplay').innerHTML = renderStars(rating);
  document.getElementById('productRatingScore').textContent = rating > 0 ? rating.toFixed(1) : '';
  document.getElementById('reviewCountLink').textContent    = 'See reviews';
  document.getElementById('productPrice').textContent       = `$${product.price.toFixed(2)}`;
  document.getElementById('productDescription').textContent = product.description;

  buildSizeSelector(); buildColorSelector(); updateStockInfo();

  document.getElementById('productMeta').innerHTML = `
    <span class="meta-tag"><i class="fa fa-tag"></i> ${product.mainCategory}</span>
    <span class="meta-tag"><i class="fa fa-layer-group"></i> ${product.subCategory}</span>
    <span class="meta-tag"><i class="fa fa-star"></i> ${rating > 0 ? rating.toFixed(1)+' / 5' : 'Not rated'}</span>`;

  document.getElementById('qtyMinus').addEventListener('click', () => {
    const inp = document.getElementById('qtyInput'); if (+inp.value > 1) inp.value = +inp.value - 1;
  });
  document.getElementById('qtyPlus').addEventListener('click', () => {
    const inp = document.getElementById('qtyInput'); inp.value = +inp.value + 1;
  });
  document.getElementById('addToCartBtn').addEventListener('click', addToCart);
}

function setMainImage(src, el) {
  document.getElementById('mainImage').src = src;
  document.querySelectorAll('.gallery-thumb').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
}
function openLightbox(src) {
  document.getElementById('lightboxImg').src = src;
  document.getElementById('lightbox').style.display = 'flex';
  document.body.style.overflow = 'hidden';
}
function closeLightbox() {
  document.getElementById('lightbox').style.display = 'none';
  document.body.style.overflow = '';
}
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('lightboxClose')?.addEventListener('click', closeLightbox);
  document.getElementById('lightbox')?.addEventListener('click', e => { if (e.target.id==='lightbox') closeLightbox(); });
});

function buildSizeSelector() {
  const sizes = [...new Set(product.variants.map(v => v.size))];
  document.getElementById('sizeSelector').innerHTML = sizes.map(size => {
    const ok = product.variants.some(v => v.size===size && v.stock>0);
    return `<button class="size-btn${!ok?' out-of-stock':''}" data-size="${size}" ${!ok?'disabled':''} onclick="selectSize('${size}',this)">${size}</button>`;
  }).join('');
}
function buildColorSelector() {
  const colors = [...new Set(product.variants.map(v => v.color))];
  document.getElementById('colorSelector').innerHTML = colors.map(color => {
    const ok = product.variants.some(v => v.color===color && v.stock>0);
    const bg = colorNameToHex(color);
    return `<button class="color-btn${!ok?' out-of-stock':''}" style="background:${bg}" data-color="${color}" ${!ok?'disabled':''} onclick="selectColor('${color}',this)" title="${color}"><span>${color}</span></button>`;
  }).join('');
}
function selectSize(size, el) {
  selectedSize = size;
  document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active')); el.classList.add('active');
  document.getElementById('sizeHint').textContent = size;
  const avail = product.variants.filter(v => v.size===size && v.stock>0).map(v => v.color);
  document.querySelectorAll('.color-btn').forEach(b => b.classList.toggle('out-of-stock', !avail.includes(b.dataset.color)));
  updateStockInfo();
}
function selectColor(color, el) {
  selectedColor = color;
  document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active')); el.classList.add('active');
  document.getElementById('colorHint').textContent = color;
  const avail = product.variants.filter(v => v.color===color && v.stock>0).map(v => v.size);
  document.querySelectorAll('.size-btn').forEach(b => b.classList.toggle('out-of-stock', !avail.includes(b.dataset.size)));
  updateStockInfo();
}
function updateStockInfo() {
  const el = document.getElementById('stockInfo');
  if (!selectedSize || !selectedColor) { el.innerHTML=''; el.className='stock-info'; return; }
  const v = product.variants.find(x => x.size===selectedSize && x.color===selectedColor);
  if (!v) { el.innerHTML='<i class="fa fa-times-circle"></i> Variant not available'; el.className='stock-info out-of-stock'; return; }
  if (v.stock===0)     { el.innerHTML='<i class="fa fa-times-circle"></i> Out of stock';                             el.className='stock-info out-of-stock'; }
  else if (v.stock<=5) { el.innerHTML=`<i class="fa fa-exclamation-circle"></i> Only ${v.stock} left in stock`;     el.className='stock-info low-stock'; }
  else                 { el.innerHTML=`<i class="fa fa-check-circle"></i> In stock (${v.stock} available)`;         el.className='stock-info in-stock'; }
}

async function addToCart() {
  if (!authManager.isLoggedIn()) { showToast('Please login to add items to cart','warning'); window.location.href='login.html'; return; }
  if (!selectedSize)  { showToast('Please select a size','warning');  return; }
  if (!selectedColor) { showToast('Please select a color','warning'); return; }
  const qty = +document.getElementById('qtyInput').value || 1;
  const btn = document.getElementById('addToCartBtn');
  btn.disabled = true; btn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Adding...';
  try {
    await api.cart.add({ productId: product._id, size: selectedSize, color: selectedColor, quantity: qty });
    showToast('Added to cart!','success'); authManager.refreshCartBadge();
    btn.innerHTML = '<i class="fa fa-check"></i> Added!'; btn.style.background = 'var(--secondary)';
    setTimeout(() => { btn.innerHTML='<i class="fa fa-shopping-bag"></i> Add to Cart'; btn.style.background=''; btn.disabled=false; }, 2000);
  } catch (err) {
    showToast(err.message||'Failed to add to cart','error'); btn.innerHTML='<i class="fa fa-shopping-bag"></i> Add to Cart'; btn.disabled=false;
  }
}

async function loadReviews(productId) {
  const list = document.getElementById('reviewsList');
  try {
    const res  = await api.reviews.getByProduct(productId);
    const revs = res.data || [];
    const total = revs.length, avg = total ? revs.reduce((s,r)=>s+r.stars,0)/total : 0;
    document.getElementById('scoreNumber').textContent = avg>0 ? avg.toFixed(1) : '0';
    document.getElementById('scoreStars').innerHTML    = renderStars(avg);
    document.getElementById('scoreCount').textContent  = `${total} review${total!==1?'s':''}`;
    if (!total) { list.innerHTML='<p style="color:var(--text-muted);text-align:center;padding:24px">No reviews yet. Be the first!</p>'; return; }
    list.innerHTML = revs.map(buildReviewCard).join('');
  } catch { list.innerHTML='<p style="color:var(--text-muted);padding:24px">Could not load reviews.</p>'; }
}

function buildReviewCard(r) {
  const isOwn = currentUserId && (r.userId?._id===currentUserId || r.userId===currentUserId);
  const name = r.userId?.name || 'Anonymous';
  return `
    <div class="review-card" id="review-${r._id}">
      <div class="review-card-header">
        <div class="review-author">
          <div class="review-avatar">${name.charAt(0).toUpperCase()}</div>
          <div><div class="review-name">${name}</div><div class="review-date">${formatDate(r.createdAt)}</div></div>
        </div>
        <div style="display:flex;align-items:center;gap:10px">
          <div class="review-stars">${renderStars(r.stars)}</div>
          ${isOwn?`<button class="review-delete-btn" onclick="deleteReview('${r._id}')"><i class="fa fa-trash"></i> Delete</button>`:''}
        </div>
      </div>
      <p class="review-comment">${r.comment}</p>
    </div>`;
}

function bindReviewUI() {
  if (!authManager.isLoggedIn()) {
    document.getElementById('addReviewCard').style.opacity='0.6';
    document.getElementById('addReviewCard').style.pointerEvents='none';
    document.getElementById('reviewLoginHint').style.display='block';
    document.getElementById('submitReviewBtn').style.display='none'; return;
  }
  const stars = document.querySelectorAll('.star-pick');
  stars.forEach(s => {
    s.addEventListener('mouseover', () => stars.forEach((x,i) => x.classList.toggle('active', i<+s.dataset.val)));
    s.addEventListener('mouseout',  () => stars.forEach((x,i) => x.classList.toggle('active', i<reviewRating)));
    s.addEventListener('click',     () => { reviewRating=+s.dataset.val; stars.forEach((x,i)=>x.classList.toggle('active',i<reviewRating)); });
  });
  document.getElementById('submitReviewBtn').addEventListener('click', submitReview);
}

async function submitReview() {
  if (!reviewRating) { showToast('Please select a star rating','warning'); return; }
  const comment = document.getElementById('reviewComment').value.trim();
  if (!comment) { showToast('Please write a comment','warning'); return; }
  const btn = document.getElementById('submitReviewBtn');
  btn.disabled=true; btn.innerHTML='<i class="fa fa-spinner fa-spin"></i> Submitting...';
  try {
    await api.reviews.add({ productId: product._id, stars: reviewRating, comment });
    showToast('Review submitted!','success');
    document.getElementById('reviewComment').value=''; reviewRating=0;
    document.querySelectorAll('.star-pick').forEach(s=>s.classList.remove('active'));
    await loadReviews(product._id); await loadProduct(product._id);
  } catch (err) { showToast(err.message||'Could not submit review','error'); }
  finally { btn.disabled=false; btn.innerHTML='<i class="fa fa-paper-plane"></i> Submit Review'; }
}

async function deleteReview(reviewId) {
  if (!confirm('Delete your review?')) return;
  try {
    await api.reviews.delete(reviewId);
    showToast('Review deleted','success');
    document.getElementById(`review-${reviewId}`)?.remove();
    await loadReviews(product._id); await loadProduct(product._id);
  } catch (err) { showToast(err.message||'Could not delete review','error'); }
}

const COLOR_MAP = {
  black:'#2c2c2c',white:'#f5f5f5',red:'#e05252',blue:'#5588cc',green:'#52a87a',yellow:'#f5c842',
  pink:'#f48fb1',purple:'#8b7cc9',orange:'#f0924a',brown:'#8d6e63',gray:'#9e9e9e',grey:'#9e9e9e',
  navy:'#1a237e',beige:'#f5e6d3',cream:'#fff8f0',khaki:'#c3b18a',teal:'#00897b',coral:'#ff6b6b',
  mint:'#98e0c1',gold:'#ffc107',
};
function colorNameToHex(name) {
  return COLOR_MAP[name.toLowerCase()] || '#a0c4ff';
}
