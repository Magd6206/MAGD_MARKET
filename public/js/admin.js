/**
 * MAGD MARKET — Admin Dashboard
 */
let currentOrderId = null;

document.addEventListener('DOMContentLoaded', async () => {
  const user = await authManager.init();
  if (!user || !authManager.isAdmin()) {
    document.getElementById('adminAuthGuard').style.display='flex';
    document.querySelectorAll('.admin-panel').forEach(p=>p.classList.remove('active'));
    return;
  }
  bindNav(); bindSidebar(); loadDashboard(); bindOrderModal(); bindCouponForm();
  document.getElementById('adminLogoutBtn')?.addEventListener('click', e => { e.preventDefault(); authManager.logout(); });
});

function bindNav() {
  document.querySelectorAll('.admin-nav-item[data-panel]').forEach(item => {
    item.addEventListener('click', e => { e.preventDefault(); switchPanel(item); });
  });
}

function switchPanel(el) {
  const panel = el.dataset?.panel || el.getAttribute('data-panel');
  if (!panel) return;
  document.querySelectorAll('.admin-panel').forEach(p=>p.classList.remove('active'));
  document.getElementById(`panel-${panel}`)?.classList.add('active');
  document.querySelectorAll('.admin-nav-item').forEach(n=>n.classList.remove('active'));
  document.querySelectorAll(`[data-panel="${panel}"]`).forEach(n=>n.classList.add('active'));
  document.getElementById('adminPanelTitle').textContent =
    {dashboard:'Dashboard',orders:'Orders',coupons:'Coupons',users:'Users',products:'Products'}[panel]||panel;
  if(panel==='orders')   loadAllOrders();
  if(panel==='coupons')  { loadAllCoupons(); setMinCouponDate(); }
  if(panel==='users')    loadAllUsers();
  if(panel==='products') loadAllProducts();
}
window.switchPanel = switchPanel;

function bindSidebar() {
  document.getElementById('adminHamburger')?.addEventListener('click', () => {
    document.getElementById('adminSidebar').classList.toggle('open');
  });
}

/* --- Dashboard --- */
async function loadDashboard() {
  try {
    const res = await api.orders.adminAll(); const orders = res.data||[];
    const delivered  = orders.filter(o=>o.orderStatus==='Delivered').length;
    const processing = orders.filter(o=>o.orderStatus==='Processing').length;
    const revenue    = orders.filter(o=>o.paymentStatus==='Paid').reduce((s,o)=>s+o.totalAmount,0);
    document.getElementById('statTotalOrders').textContent = orders.length;
    document.getElementById('statDelivered').textContent   = delivered;
    document.getElementById('statProcessing').textContent  = processing;
    document.getElementById('statRevenue').textContent     = fmtPrice(revenue);
    const tbody = document.getElementById('dashboardOrdersBody');
    tbody.innerHTML = orders.slice(0,8).map(o=>`
      <tr>
        <td><span class="order-id-short">#${o._id.slice(-8).toUpperCase()}</span></td>
        <td>${o.userId?.name||'—'}</td>
        <td>${fmtPrice(o.totalAmount)}</td>
        <td>${orderStatusBadge(o.orderStatus)}</td>
        <td>${formatDate(o.createdAt)}</td>
      </tr>`).join('');
  } catch(err) { console.error('Dashboard error:',err); }
}

/* --- Orders --- */
async function loadAllOrders(filter='') {
  const tbody=document.getElementById('allOrdersBody');
  tbody.innerHTML='<tr><td colspan="8" style="text-align:center;padding:24px"><i class="fa fa-spinner fa-spin"></i> Loading...</td></tr>';
  try {
    const res=await api.orders.adminAll(); let orders=res.data||[];
    if(filter) orders=orders.filter(o=>o.orderStatus===filter);
    document.getElementById('ordersTableEmpty').style.display=orders.length?'none':'flex';
    tbody.innerHTML=orders.map(o=>`
      <tr>
        <td><span class="order-id-short">#${o._id.slice(-8).toUpperCase()}</span></td>
        <td>${o.userId?.name||'—'}<br><small style="color:var(--text-muted)">${o.userId?.email||''}</small></td>
        <td>${o.items.length} item${o.items.length!==1?'s':''}</td>
        <td>${fmtPrice(o.totalAmount)}</td>
        <td>${paymentStatusBadge(o.paymentStatus)}</td>
        <td>${orderStatusBadge(o.orderStatus)}</td>
        <td>${formatDate(o.createdAt)}</td>
        <td><button class="btn btn-outline btn-sm" onclick="openOrderModal('${o._id}','${o.orderStatus}','${o.paymentStatus}')"><i class="fa fa-edit"></i> Update</button></td>
      </tr>`).join('');
  } catch { tbody.innerHTML='<tr><td colspan="8" style="text-align:center;color:var(--text-muted)">Failed to load orders</td></tr>'; }
}

document.getElementById('refreshOrdersBtn')?.addEventListener('click', () => loadAllOrders(document.getElementById('orderStatusFilter').value));
document.getElementById('orderStatusFilter')?.addEventListener('change', e => loadAllOrders(e.target.value));

/* --- Order Modal --- */
function bindOrderModal() {
  document.getElementById('closeOrderModal')?.addEventListener('click', closeOrderModal);
  document.getElementById('cancelOrderModalBtn')?.addEventListener('click', closeOrderModal);
  document.getElementById('saveOrderStatusBtn')?.addEventListener('click', saveOrderStatus);
  document.getElementById('orderStatusModal')?.addEventListener('click', e => { if(e.target.id==='orderStatusModal') closeOrderModal(); });
}
function openOrderModal(orderId, curStatus, curPayment) {
  currentOrderId=orderId;
  document.getElementById('modalOrderId').textContent='#'+orderId.slice(-8).toUpperCase();
  document.getElementById('modalOrderStatus').value   = curStatus;
  document.getElementById('modalPaymentStatus').value = curPayment;
  document.getElementById('orderStatusModal').style.display='flex';
}
window.openOrderModal=openOrderModal;
function closeOrderModal() { document.getElementById('orderStatusModal').style.display='none'; currentOrderId=null; }
async function saveOrderStatus() {
  if(!currentOrderId) return;
  const os=document.getElementById('modalOrderStatus').value, ps=document.getElementById('modalPaymentStatus').value;
  const btn=document.getElementById('saveOrderStatusBtn');
  btn.disabled=true; btn.innerHTML='<i class="fa fa-spinner fa-spin"></i> Saving...';
  try {
    const body={}; if(os) body.orderStatus=os; if(ps) body.paymentStatus=ps;
    await api.orders.adminUpdate(currentOrderId, body);
    showToast('Order updated!','success'); closeOrderModal();
    loadAllOrders(document.getElementById('orderStatusFilter')?.value||''); loadDashboard();
  } catch(err) { showToast(err.message||'Update failed','error'); }
  finally { btn.disabled=false; btn.innerHTML='Save Changes'; }
}

/* --- Coupons --- */
function setMinCouponDate() {
  document.getElementById('couponExpiry').min = new Date().toISOString().split('T')[0];
}
function bindCouponForm() {
  document.getElementById('createCouponForm')?.addEventListener('submit', createCoupon);
  document.getElementById('refreshCouponsBtn')?.addEventListener('click', loadAllCoupons);
}
async function createCoupon(e) {
  e.preventDefault();
  const fb=document.getElementById('couponCreateFeedback'); fb.style.display='none';
  const code=document.getElementById('couponCode').value.trim().toUpperCase();
  const type=document.getElementById('couponType').value;
  const value=document.getElementById('couponValue').value;
  const expiry=document.getElementById('couponExpiry').value;
  if(!code||!type||!value||!expiry){ fb.className='alert alert-error'; fb.innerHTML='<i class="fa fa-exclamation-circle"></i> Please fill all fields'; fb.style.display='flex'; return; }
  try {
    await api.coupons.create({code, discountType:type, discountValue:+value, expiryDate:expiry});
    fb.className='alert alert-success'; fb.innerHTML='<i class="fa fa-check-circle"></i> Coupon created!'; fb.style.display='flex';
    e.target.reset(); loadAllCoupons(); setTimeout(()=>fb.style.display='none', 3000);
  } catch(err){ fb.className='alert alert-error'; fb.innerHTML=`<i class="fa fa-exclamation-circle"></i> ${err.message||'Failed'}`; fb.style.display='flex'; }
}
async function loadAllCoupons() {
  const list=document.getElementById('couponsList'), empty=document.getElementById('couponsEmpty');
  list.innerHTML='<div style="padding:20px;text-align:center"><i class="fa fa-spinner fa-spin"></i></div>';
  try {
    const res=await api.coupons.adminAll(); const coupons=res.data||[];
    if(!coupons.length){ list.innerHTML=''; empty.style.display='flex'; return; }
    empty.style.display='none';
    list.innerHTML=coupons.map(c=>{
      const expired=new Date(c.expiryDate)<new Date();
      return `<div class="coupon-item">
        <div>
          <div class="coupon-item-code">${c.code}</div>
          <div class="coupon-item-details">${c.discountType==='percentage'?c.discountValue+'% off':'$'+c.discountValue+' off'} · Expires ${formatDate(c.expiryDate)}${expired?'<span style="color:#e05252;margin-left:6px">(Expired)</span>':''}</div>
        </div>
        <label class="toggle-switch" title="${c.isActive?'Active':'Inactive'}">
          <input type="checkbox" ${c.isActive?'checked':''} onchange="toggleCoupon('${c._id}',this.checked)" />
          <span class="toggle-slider"></span>
        </label>
      </div>`;
    }).join('');
  } catch(err){ if(err.status===404){list.innerHTML='';empty.style.display='flex';}
    else list.innerHTML='<div style="padding:20px;color:var(--text-muted)">Failed to load coupons</div>'; }
}
function toggleCoupon(id, active) { showToast(`Coupon ${active?'activated':'deactivated'}`, 'info'); }
window.toggleCoupon=toggleCoupon;

/* --- Users --- */
async function loadAllUsers() {
  const tbody=document.getElementById('usersTableBody'), empty=document.getElementById('usersEmpty');
  tbody.innerHTML='<tr><td colspan="5" style="text-align:center;padding:24px"><i class="fa fa-spinner fa-spin"></i></td></tr>';
  try {
    const res=await api.users.getAll(); const users=res.data||[];
    if(!users.length){ tbody.innerHTML=''; empty.style.display='flex'; return; }
    empty.style.display='none';
    tbody.innerHTML=users.map(u=>`
      <tr>
        <td>${u.name||'—'}</td><td>${u.email}</td><td>${u.phone||'—'}</td><td>${formatDate(u.createdAt)}</td>
        <td><button class="btn btn-ghost btn-sm" style="color:#e05252" onclick="deleteUser('${u._id}')"><i class="fa fa-trash"></i></button></td>
      </tr>`).join('');
  } catch { tbody.innerHTML='<tr><td colspan="5" style="text-align:center;color:var(--text-muted)">Failed to load users</td></tr>'; }
}
document.getElementById('refreshUsersBtn')?.addEventListener('click', loadAllUsers);
async function deleteUser(id) {
  if(!confirm('Permanently delete this user?')) return;
  try { await api.users.delete(id); showToast('User deleted','success'); loadAllUsers(); }
  catch(err){ showToast(err.message||'Could not delete user','error'); }
}
window.deleteUser=deleteUser;

/* --- Products --- */
async function loadAllProducts() {
  const tbody=document.getElementById('productsTableBody'), empty=document.getElementById('productsEmpty');
  tbody.innerHTML='<tr><td colspan="5" style="text-align:center;padding:24px"><i class="fa fa-spinner fa-spin"></i></td></tr>';
  try {
    const res=await api.products.getAll({}); const products=res.data||[];
    if(!products.length){ tbody.innerHTML=''; empty.style.display='flex'; return; }
    empty.style.display='none';
    tbody.innerHTML=products.map(p=>`
      <tr>
        <td><strong>${p.title}</strong></td><td>${p.mainCategory} · ${p.subCategory}</td>
        <td>${fmtPrice(p.price)}</td><td>${p.avgRating?p.avgRating.toFixed(1)+' ★':'—'}</td>
        <td>
          <a href="product.html?id=${p._id}" class="btn btn-outline btn-sm" target="_blank"><i class="fa fa-eye"></i></a>
          <button class="btn btn-ghost btn-sm" style="color:#e05252" onclick="deleteProduct('${p._id}')"><i class="fa fa-trash"></i></button>
        </td>
      </tr>`).join('');
  } catch { tbody.innerHTML='<tr><td colspan="5" style="text-align:center;color:var(--text-muted)">Failed to load products</td></tr>'; }
}
document.getElementById('refreshProductsBtn')?.addEventListener('click', loadAllProducts);
async function deleteProduct(id) {
  if(!confirm('Permanently delete this product?')) return;
  try { await api.products.delete(id); showToast('Product deleted','success'); loadAllProducts(); }
  catch(err){ showToast(err.message||'Could not delete product','error'); }
}
window.deleteProduct=deleteProduct;
