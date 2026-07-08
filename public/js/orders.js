/**
 * MAGD MARKET — My Orders Page
 */
document.addEventListener('DOMContentLoaded', async () => {
  const user = await authManager.init();
  if (!user) { document.getElementById('authRequiredMsg').style.display='flex'; return; }
  document.getElementById('ordersContent').style.display='block';
  await loadOrders();
});

async function loadOrders() {
  try {
    const res    = await api.orders.myOrders();
    const orders = res.data || [];
    if (!orders.length) { document.getElementById('ordersEmpty').style.display='flex'; return; }
    document.getElementById('ordersList').innerHTML = orders.map(buildOrderCard).join('');
  } catch (err) {
    if (err.status===404) document.getElementById('ordersEmpty').style.display='flex';
    else showToast('Could not load orders','error');
  }
}

function buildOrderCard(order) {
  const items = order.items.map(item => `
    <div class="order-item">
      <div class="order-item-info">
        <div class="order-item-name">${item.title}</div>
        <div class="order-item-variant">Size: ${item.size} · Color: ${item.color} · Qty: ${item.quantity}</div>
      </div>
      <div class="order-item-price">${fmtPrice(item.price*item.quantity)}</div>
    </div>`).join('');
  const canCancel = order.orderStatus==='Processing';
  return `
    <div class="order-card" id="order-${order._id}">
      <div class="order-card-header">
        <div class="order-card-id">Order <strong>#${order._id.slice(-8).toUpperCase()}</strong></div>
        <div class="order-date">${formatDate(order.createdAt)}</div>
        <div style="margin-left:auto;display:flex;gap:8px;align-items:center">
          ${orderStatusBadge(order.orderStatus)}
          ${paymentStatusBadge(order.paymentStatus)}
        </div>
      </div>
      <div class="order-card-body"><div class="order-items-list">${items}</div></div>
      <div class="order-card-footer">
        <div>
          <div class="order-total">${fmtPrice(order.totalAmount)}</div>
          <div class="order-address">${order.shippingAddress?.city}, ${order.shippingAddress?.street} · ${order.shippingAddress?.phone}</div>
        </div>
        ${canCancel?`<button class="btn btn-outline btn-sm" onclick="cancelOrder('${order._id}')"><i class="fa fa-times"></i> Cancel Order</button>`:''}
      </div>
    </div>`;
}

async function cancelOrder(orderId) {
  if (!confirm('Cancel this order?')) return;
  try {
    await api.orders.cancel(orderId); showToast('Order cancelled','success'); await loadOrders();
  } catch (err) { showToast(err.message||'Could not cancel order','error'); }
}
