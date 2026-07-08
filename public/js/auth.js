/**
 * MAGD MARKET — Auth State Manager
 */
const authManager = {
  user: null,
  profile: null,

  async init() {
    try {
      const res = await api.auth.profile();
      this.user = res.user;
      this.profile = res.user;
      this._applyToNav();
      this._updateCartBadge();
    } catch {
      this.user = null;
      this._applyToNav();
    }
    return this.user;
  },

  isLoggedIn() { return !!this.user; },
  isAdmin()    { return this.user?.role === 'admin'; },

  async logout() {
    try { await api.auth.logout(); } catch {}
    this.user = null;
    this.profile = null;
    window.location.href = '/login.html';
  },

  _applyToNav() {
    const guestEl  = document.getElementById('guestLinks');
    const authEl   = document.getElementById('authLinks');
    const adminEl  = document.getElementById('adminLink');
    const logoutEl = document.getElementById('logoutBtn');
    if (!guestEl || !authEl) return;
    if (this.isLoggedIn()) {
      guestEl.style.display = 'none';
      authEl.style.display  = 'block';
      if (adminEl)  adminEl.style.display  = this.isAdmin() ? 'flex' : 'none';
      if (adminEl)  adminEl.href = '/admin.html';
      if (logoutEl) logoutEl.addEventListener('click', (e) => { e.preventDefault(); this.logout(); });
    } else {
      guestEl.style.display = 'block';
      authEl.style.display  = 'none';
    }
  },

  async _updateCartBadge() {
    const badge = document.getElementById('cartBadge');
    if (!badge || !this.isLoggedIn()) return;
    try {
      const res = await api.cart.get();
      const count = res.data?.items?.length || 0;
      badge.textContent = count;
      badge.style.display = count > 0 ? 'flex' : 'none';
    } catch { badge.style.display = 'none'; }
  },

  refreshCartBadge() { this._updateCartBadge(); },

  requireAuth(redirectBack = true) {
    if (!this.isLoggedIn()) {
      const back = redirectBack ? `?next=${encodeURIComponent(window.location.pathname)}` : '';
      window.location.href = '/login.html' + back;
      return false;
    }
    return true;
  },

  requireAdmin() {
    if (!this.isAdmin()) { window.location.href = '/index.html'; return false; }
    return true;
  },
};

document.addEventListener('DOMContentLoaded', () => {
  const hamburger = document.getElementById('navHamburger');
  const links     = document.getElementById('navLinks');
  if (hamburger && links) {
    hamburger.addEventListener('click', () => links.classList.toggle('open'));
    links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => links.classList.remove('open')));
  }
  authManager.init();
});

window.authManager = authManager;
