/**
 * MAGD MARKET — Cart Page
 */
let cartData = null, couponData = null;

document.addEventListener('DOMContentLoaded', async () => {
  const user = await authManager.init();
  if (!user) { document.getElementById('authRequiredMsg').style.display='flex'; return; }
  await loadCart();
  bindCoupon();
  document.getElementById('clearCartBtn')?.addEventListener('click', clearCart);
});

async function loadCart() {
  try {
    const res = await api.cart.get(); cartData = res.data; renderCart();
  } catch { showToast('Could not load cart','error'); }
}

function renderCart() {
  const layout = document.getElementById('cartLayout'), emptyDiv = document.getElementById('emptyCart');
  if (!cartData?.items?.length) { layout.style.display='none'; emptyDiv.style.display='flex'; return; }
  layout.style.display='grid'; emptyDiv.style.display='none';
  document.getElementById('cartItemCount').textContent = `(${cartData.items.length})`;
  renderItems(); recalcSummary();
}

function renderItems() {
  document.getElementById('cartItemsList').innerHTML = cartData.items.map(item => `
    <div class="cart-item">
      <div class="cart-item-img"><div class="no-img"><i class="fa fa-shirt"></i></div></div>
      <div class="cart-item-info">
        <div class="cart-item-name">${item.productId?.title || 'Product'}</div>
        <div class="cart-item-variant">Size: ${item.size} · Color: ${item.color}</div>
        <div class="cart-item-qty">
          <button class="cart-qty-btn" onclick="changeQty('${item.productId}','${item.size}','${item.color}',${item.quantity-1})">−</button>
          <span class="cart-qty-val">${item.quantity}</span>
          <button class="cart-qty-btn" onclick="changeQty('${item.productId}','${item.size}','${item.color}',${item.quantity+1})">+</button>
        </div>
      </div>
      <div class="cart-item-price-col">
        <div class="cart-item-price">${fmtPrice(item.price*item.quantity)}</div>
        <span class="cart-item-remove" onclick="removeItem('${item.productId}','${item.size}','${item.color}')">
          <i class="fa fa-trash"></i> Remove
        </span>
      </div>
    </div>`).join('');
}

function recalcSummary() {
  const subtotal = cartData.totalPrice || 0;
  let discount = 0;
  if (couponData) {
    discount = couponData.discountType==='percentage' ? subtotal*(couponData.discountValue/100) : couponData.discountValue;
    discount = Math.min(discount, subtotal);
    document.getElementById('discountRow').style.display='flex';
    document.getElementById('discountCode').textContent   = couponData.code;
    document.getElementById('discountAmount').textContent = `-${fmtPrice(discount)}`;
  } else { document.getElementById('discountRow').style.display='none'; }
  document.getElementById('summarySubtotal').textContent = fmtPrice(subtotal);
  document.getElementById('summaryTotal').textContent    = fmtPrice(Math.max(0, subtotal-discount));
  sessionStorage.setItem('cartSummary', JSON.stringify({ subtotal, discount, coupon: couponData||null }));
}

async function changeQty(productId, size, color, newQty) {
  if (newQty < 1) { await removeItem(productId, size, color); return; }
  try {
    const res = await api.cart.updateQty({ productId, size, color, quantity: newQty });
    cartData = res.data; renderItems(); recalcSummary(); authManager.refreshCartBadge();
  } catch (err) { showToast(err.message||'Could not update quantity','error'); }
}

async function removeItem(productId, size, color) {
  try {
    const res = await api.cart.remove({ productId, size, color });
    cartData = res.data; renderCart(); authManager.refreshCartBadge(); showToast('Item removed','success');
  } catch (err) { showToast(err.message||'Could not remove item','error'); }
}

async function clearCart() {
  if (!confirm('Clear your entire cart?')) return;
  try {
    await api.cart.clear();
    cartData = { items:[], totalPrice:0 }; renderCart(); authManager.refreshCartBadge(); showToast('Cart cleared','success');
  } catch (err) { showToast(err.message||'Could not clear cart','error'); }
}

function bindCoupon() {
  document.getElementById('applyCouponBtn')?.addEventListener('click', validateCoupon);
  document.getElementById('couponInput')?.addEventListener('keydown', e => { if(e.key==='Enter') validateCoupon(); });
}

async function validateCoupon() {
  const code = document.getElementById('couponInput').value.trim();
  const fb   = document.getElementById('couponFeedback');
  if (!code) { fb.textContent='Enter a coupon code'; fb.className='coupon-feedback error'; return; }
  fb.textContent='Validating...'; fb.className='coupon-feedback';
  try {
    const res = await api.coupons.validate(code); couponData = res.data;
    fb.textContent = `✓ ${res.data.code} — ${res.data.discountType==='percentage' ? res.data.discountValue+'% off' : '$'+res.data.discountValue+' off'}`;
    fb.className='coupon-feedback success'; recalcSummary(); showToast('Coupon applied!','success');
  } catch (err) {
    couponData=null; fb.textContent=err.message||'Invalid coupon code'; fb.className='coupon-feedback error'; recalcSummary();
  }
}
