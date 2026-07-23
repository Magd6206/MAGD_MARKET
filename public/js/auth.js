/**
 * MAGD MARKET — Auth State Manager
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Responsibilities:
 *  - Fetch and cache the logged-in user's profile on every page load
 *  - Update the navbar to show guest vs. authenticated links
 *  - Provide helpers: isLoggedIn(), isAdmin(), requireAuth(), requireAdmin()
 *  - Handle logout (calls the backend, then clears local state)
 *  - Keep the cart badge count in sync
 *
 * Token / Cookie Strategy:
 *  The backend issues HTTP-only cookies (access + refresh tokens).
 *  This file never touches localStorage or sessionStorage for auth —
 *  cookies are sent automatically by the browser with credentials:'include'
 *  (already set in api.js for every request).
 *
 *  If the access token is expired, api.js's 401 interceptor redirects to
 *  /login.html. The refresh flow is handled server-side via the cookie.
 */

const authManager = {
  /** Cached user object — null when not logged in */
  user:    null,
  profile: null,

  // ─── Initialise ────────────────────────────────────────────────────────────
  /**
   * Called once per page in DOMContentLoaded.
   * Fetches the current user profile via the auth cookie.
   * Sets up the navbar and cart badge regardless of outcome.
   */
  async init() {
    try {
      const res    = await api.auth.profile();
      this.user    = res.user;
      this.profile = res.user;
    } catch (err) {
      // 401 → not logged in (api.js interceptor handles redirect on protected pages)
      // Any other error → treat as unauthenticated
      this.user    = null;
      this.profile = null;
    }

    this._applyToNav();
    this._updateCartBadge();
    return this.user;
  },

  // ─── State Helpers ─────────────────────────────────────────────────────────
  isLoggedIn() { return !!this.user; },
  isAdmin()    { return this.user?.role === 'admin'; },

  // ─── Logout ────────────────────────────────────────────────────────────────
  async logout() {
    try {
      await api.auth.logout();
    } catch {
      // Even if the request fails (e.g. already expired), clear client state
    }
    this.user    = null;
    this.profile = null;
    window.location.replace('/login.html');
  },

  // ─── Route Guards ──────────────────────────────────────────────────────────
  /**
   * Call at the top of any page that requires login.
   * Redirects to /login.html?next=<current path> if not authenticated.
   * Returns true if the user is allowed to stay on the page.
   */
  requireAuth() {
    if (!this.isLoggedIn()) {
      const next = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.replace(`/login.html?next=${next}`);
      return false;
    }
    return true;
  },

  /**
   * Call at the top of any admin-only page.
   * Redirects to /index.html if the user is not an admin.
   */
  requireAdmin() {
    if (!this.isAdmin()) {
      window.location.replace('/index.html');
      return false;
    }
    return true;
  },

  // ─── Cart Badge ────────────────────────────────────────────────────────────
  async _updateCartBadge() {
    const badge = document.getElementById('cartBadge');
    if (!badge) return;

    if (!this.isLoggedIn()) {
      badge.style.display = 'none';
      return;
    }

    try {
      const res   = await api.cart.get();
      const count = res.data?.items?.length || 0;
      badge.textContent   = count;
      badge.style.display = count > 0 ? 'flex' : 'none';
    } catch {
      badge.style.display = 'none';
    }
  },

  /** Re-fetch and update the cart badge — call after add/remove operations */
  refreshCartBadge() {
    this._updateCartBadge();
  },

  // ─── Navbar ────────────────────────────────────────────────────────────────
  _applyToNav() {
    const guestEl  = document.getElementById('guestLinks');
    const authEl   = document.getElementById('authLinks');
    const adminEl  = document.getElementById('adminLink');
    const logoutEl = document.getElementById('logoutBtn');

    if (!guestEl || !authEl) return;

    if (this.isLoggedIn()) {
      guestEl.style.display = 'none';
      authEl.style.display  = 'block';

      if (adminEl) {
        adminEl.style.display = this.isAdmin() ? 'flex' : 'none';
        adminEl.href          = '/admin.html';
      }

      // Attach logout only once — use a flag to avoid stacking listeners
      if (logoutEl && !logoutEl.dataset.listenerAttached) {
        logoutEl.dataset.listenerAttached = 'true';
        logoutEl.addEventListener('click', (e) => {
          e.preventDefault();
          this.logout();
        });
      }
    } else {
      guestEl.style.display = 'block';
      authEl.style.display  = 'none';
      if (adminEl) adminEl.style.display = 'none';
    }
  },
};

// ─── Bootstrap ───────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Mobile hamburger
  const hamburger = document.getElementById('navHamburger');
  const navLinks  = document.getElementById('navLinks');
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => navLinks.classList.toggle('open'));
    navLinks.querySelectorAll('a').forEach(a =>
      a.addEventListener('click', () => navLinks.classList.remove('open'))
    );
  }

  // auth.js initialises itself — page-specific JS files should await
  // authManager.init() inside their own DOMContentLoaded handler
  // (auth.js loads before them so authManager is already defined).
  authManager.init();
});

window.authManager = authManager;
