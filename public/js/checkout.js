/**
 * MAGD MARKET — Checkout Page
 */
let cartData = null, couponData = null;

document.addEventListener('DOMContentLoaded', async () => {
  const user = await authManager.init();
  if (!user) { document.getElementById('authRequiredMsg').style.display='flex'; return; }
  document.getElementById('checkoutLayout').style.display='grid';
  await loadCartSummary();
  bindCoupon();
  bindForm();
});

async function loadCartSummary() {
  try {
    const res = await api.cart.get(); cartData = res.data;
    if (!cartData?.items?.length) { showToast('Your cart is empty','warning'); setTimeout(()=>window.location.href='cart.html',1500); return; }
    const stored = sessionStorage.getItem('cartSummary');
    if (stored) { const p=JSON.parse(stored); if(p.coupon){ couponData=p.coupon; applyStoredCoupon(); } }
    renderOrderSummary();
  } catch { showToast('Could not load cart','error'); }
}

function renderOrderSummary() {
  document.getElementById('checkoutItemsList').innerHTML = cartData.items.map(item => `
    <div class="checkout-item">
      <span class="checkout-item-name">${item.productId?.title||'Product'} <span class="checkout-item-qty">×${item.quantity}</span></span>
      <span class="checkout-item-price">${fmtPrice(item.price*item.quantity)}</span>
    </div>`).join('');
  recalcCheckoutSummary();
}

function recalcCheckoutSummary() {
  const subtotal = cartData?.totalPrice||0;
  let discount = 0;
  if (couponData) {
    discount = couponData.discountType==='percentage' ? subtotal*couponData.discountValue/100 : couponData.discountValue;
    discount = Math.min(discount, subtotal);
    document.getElementById('checkoutDiscountRow').style.display='flex';
    document.getElementById('checkoutDiscount').textContent=`-${fmtPrice(discount)}`;
  } else { document.getElementById('checkoutDiscountRow').style.display='none'; }
  document.getElementById('checkoutSubtotal').textContent = fmtPrice(subtotal);
  document.getElementById('checkoutTotal').textContent    = fmtPrice(Math.max(0,subtotal-discount));
}

function applyStoredCoupon() {
  if (couponData) {
    document.getElementById('couponAppliedInfo').style.display='flex';
    document.getElementById('couponAppliedText').textContent =
      `${couponData.code} — ${couponData.discountType==='percentage' ? couponData.discountValue+'% off' : '$'+couponData.discountValue+' off'}`;
    document.getElementById('couponInput').value=couponData.code;
  }
}

function bindCoupon() {
  document.getElementById('validateCouponBtn')?.addEventListener('click', validateCoupon);
  document.getElementById('removeCouponBtn')?.addEventListener('click', () => {
    couponData=null;
    document.getElementById('couponAppliedInfo').style.display='none';
    document.getElementById('couponInput').value='';
    document.getElementById('couponFeedback').textContent='';
    recalcCheckoutSummary();
  });
}

async function validateCoupon() {
  const code = document.getElementById('couponInput').value.trim();
  const fb   = document.getElementById('couponFeedback');
  if (!code) { fb.textContent='Enter a coupon code'; fb.className='coupon-feedback error'; return; }
  fb.textContent='Validating...'; fb.className='coupon-feedback';
  try {
    const res = await api.coupons.validate(code); couponData=res.data; fb.textContent='';
    document.getElementById('couponAppliedInfo').style.display='flex';
    document.getElementById('couponAppliedText').textContent=
      `${res.data.code} — ${res.data.discountType==='percentage'?res.data.discountValue+'% off':'$'+res.data.discountValue+' off'}`;
    recalcCheckoutSummary(); showToast('Coupon applied!','success');
  } catch (err) {
    couponData=null; fb.textContent=err.message||'Invalid coupon'; fb.className='coupon-feedback error'; recalcCheckoutSummary();
  }
}

function bindForm() {
  document.getElementById('checkoutForm')?.addEventListener('submit', placeOrder);
}

async function placeOrder(e) {
  e.preventDefault();
  const city   = document.getElementById('shipCity').value.trim();
  const street = document.getElementById('shipStreet').value.trim();
  const phone  = document.getElementById('shipPhone').value.trim();
  ['cityError','streetError','phoneError'].forEach(id => document.getElementById(id).textContent='');
  let valid=true;
  if(!city)   { document.getElementById('cityError').textContent='City is required';    valid=false; }
  if(!street) { document.getElementById('streetError').textContent='Street is required';valid=false; }
  if(!phone)  { document.getElementById('phoneError').textContent='Phone is required';  valid=false; }
  if(!valid) return;
  const btn=document.getElementById('placeOrderBtn');
  btn.disabled=true;
  document.getElementById('placeOrderBtnText').style.display='none';
  document.getElementById('placeOrderSpinner').style.display='inline-flex';
  try {
    const body = { shippingAddress:{city,street,phone}, ...(couponData?{couponCode:couponData.code}:{}) };
    const res  = await api.orders.create(body);
    sessionStorage.removeItem('cartSummary');
    document.getElementById('successOrderId').textContent = res.data._id.slice(-8).toUpperCase();
    document.getElementById('orderSuccessOverlay').style.display='flex';
    authManager.refreshCartBadge();
  } catch (err) {
    showToast(err.message||'Order failed. Please try again.','error');
    btn.disabled=false;
    document.getElementById('placeOrderBtnText').style.display='';
    document.getElementById('placeOrderSpinner').style.display='none';
  }
}
