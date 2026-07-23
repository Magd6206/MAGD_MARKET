/**
 * MAGD MARKET — API Service Layer
 * ════════════════════════════════════════════════════════════════════════════
 *
 * UNIFIED DEPLOYMENT — RELATIVE PATHS ONLY
 * ─────────────────────────────────────────
 * This project is deployed as a single unified app on Render:
 *   - One server, one port, one domain
 *   - Express serves both /api/v1/* and the static public/ folder
 *
 * Because the frontend and backend share the same origin, ALL fetch calls
 * use RELATIVE paths (e.g. /api/v1/auth/login).
 *
 * This means:
 *   • Locally   → requests go to http://localhost:3000/api/v1/...
 *   • On Render → requests go to https://your-app.onrender.com/api/v1/...
 *
 * No hardcoded hostnames. No environment variables. No meta tags.
 * It just works wherever the app is served from.
 * ════════════════════════════════════════════════════════════════════════════
 */

(function () {
  'use strict';

  // ─── Base Path ───────────────────────────────────────────────────────────
  // Pure relative path — works on any domain, any port, any environment.
  const API_BASE = '/api/v1';

  // ─── HTTP Error Class ────────────────────────────────────────────────────
  class ApiError extends Error {
    constructor(status, message, data) {
      super(message);
      this.name   = 'ApiError';
      this.status = status;
      this.data   = data;
    }
  }

  // ─── Core Request ────────────────────────────────────────────────────────
  /**
   * Every API call flows through here.
   *
   * Guarantees:
   *  ✓ credentials: 'include' — HTTP-only cookies sent on every request
   *  ✓ Content-Type: application/json — correct header for all requests
   *  ✓ Typed errors — every non-2xx becomes an ApiError with .status + .data
   *  ✓ 401 → auto-redirect to /login.html (skipped on auth pages)
   *  ✓ 403 → toast: permission denied
   *  ✓ 429 → toast: rate limited
   *  ✓ 5xx → toast: server error
   *  ✓ Network failure → toast: no connection
   */
  async function request(method, endpoint, body = null) {
    const url  = API_BASE + endpoint;
    const opts = {
      method,
      credentials: 'include',   // required for HTTP-only auth cookies
      headers: { 'Content-Type': 'application/json' },
    };

    if (body !== null && body !== undefined) {
      opts.body = JSON.stringify(body);
    }

    // ── Network-level error (offline, DNS, CORS preflight blocked) ──────────
    let res;
    try {
      res = await fetch(url, opts);
    } catch (networkErr) {
      console.error('[API] Network error:', url, networkErr);
      _toast('Could not reach the server. Check your connection.', 'error');
      throw new ApiError(0, 'Network error — please check your connection.', null);
    }

    // ── Parse response body ──────────────────────────────────────────────────
    let data;
    try {
      const text = await res.text();
      data = text ? JSON.parse(text) : {};
    } catch {
      // Server returned non-JSON (e.g. an HTML error page from a proxy)
      data = { message: `Unexpected server response (HTTP ${res.status})` };
    }

    // ── Success ──────────────────────────────────────────────────────────────
    if (res.ok) return data;

    // ── HTTP error intercepts ────────────────────────────────────────────────
    const message = data?.message || `Request failed (${res.status})`;

    switch (res.status) {
      case 401:
        _handle401();
        break;
      case 403:
        _toast('You do not have permission to perform this action.', 'error');
        break;
      case 429:
        _toast('Too many requests — please wait a moment and try again.', 'warning');
        break;
      default:
        if (res.status >= 500) {
          _toast('A server error occurred. Please try again later.', 'error');
        }
        // 400 / 422 validation errors: let the calling page handle + display them
    }

    throw new ApiError(res.status, message, data);
  }

  // ─── 401 Handler ─────────────────────────────────────────────────────────
  function _handle401() {
    const AUTH_PAGES = ['/login.html', '/signup.html'];
    const onAuthPage = AUTH_PAGES.some(p => window.location.pathname.endsWith(p));
    if (!onAuthPage) {
      const next = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.replace(`/login.html?next=${next}`);
    }
  }

  // ─── Toast Helper ────────────────────────────────────────────────────────
  // Uses ui.js showToast() when available; falls back to a minimal DOM toast.
  function _toast(message, type) {
    if (typeof window.showToast === 'function') {
      window.showToast(message, type);
      return;
    }
    // Minimal fallback (before ui.js has loaded)
    let container = document.getElementById('toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      container.style.cssText =
        'position:fixed;bottom:24px;right:24px;z-index:99999;' +
        'display:flex;flex-direction:column;gap:8px;';
      document.body.appendChild(container);
    }
    const COLORS = { error: '#e05252', warning: '#FFB6A6', info: '#67A2C5', success: '#9BCEC1' };
    const el = document.createElement('div');
    el.style.cssText =
      `background:#fff;border-left:4px solid ${COLORS[type] || COLORS.info};` +
      'padding:12px 18px;border-radius:10px;box-shadow:0 4px 16px rgba(0,0,0,.15);' +
      'font-size:.9rem;font-family:Inter,sans-serif;max-width:320px;';
    el.textContent = message;
    container.appendChild(el);
    setTimeout(() => el.remove(), 4000);
  }

  // ─── Query String Builder ─────────────────────────────────────────────────
  function _buildQuery(params) {
    const parts = Object.entries(params)
      .filter(([, v]) => v !== '' && v !== null && v !== undefined)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`);
    return parts.length ? '?' + parts.join('&') : '';
  }

  // ─── Public API Surface ───────────────────────────────────────────────────
  const api = {
    /** Raw HTTP methods — use for any endpoint not listed below */
    get:    (endpoint)        => request('GET',    endpoint),
    post:   (endpoint, body)  => request('POST',   endpoint, body),
    put:    (endpoint, body)  => request('PUT',    endpoint, body),
    delete: (endpoint, body)  => request('DELETE', endpoint, body),

    // ── Auth ─────────────────────────────────────────────────────────────
    auth: {
      signup:  (d) => request('POST', '/auth/signup',        d),
      login:   (d) => request('POST', '/auth/login',         d),
      logout:  ()  => request('POST', '/auth/logout'),
      profile: ()  => request('GET',  '/auth/profile'),
      refresh: ()  => request('PUT',  '/auth/refresh_Token'),
    },

    // ── Users ────────────────────────────────────────────────────────────
    users: {
      me:       ()      => request('GET',    '/users/me'),
      updateMe: (d)     => request('PUT',    '/users/update-me', d),
      getAll:   ()      => request('GET',    '/users/'),
      getById:  (id)    => request('GET',    `/users/${id}`),
      delete:   (id)    => request('DELETE', `/users/${id}`),
    },

    // ── Products ─────────────────────────────────────────────────────────
    products: {
      getAll:   (q = {}) => request('GET',    '/prodects' + _buildQuery(q)),
      getById:  (id)     => request('GET',    `/prodects/${id}`),
      create:   (d)      => request('POST',   '/prodects', d),
      update:   (id, d)  => request('PUT',    `/prodects/${id}`, d),
      delete:   (id)     => request('DELETE', `/prodects/${id}`),
      updateVariantStock: (pid, vid, stock) =>
        request('PUT', `/prodects/${pid}/variants/${vid}`, { stock }),
    },

    // ── Cart ─────────────────────────────────────────────────────────────
    cart: {
      get:       ()  => request('GET',    '/carts/ByIdUser'),
      add:       (d) => request('POST',   '/carts/creatCart', d),
      updateQty: (d) => request('PUT',    '/carts/updateQuantity', d),
      remove:    (d) => request('DELETE', '/carts/removeItem', d),
      clear:     ()  => request('DELETE', '/carts/clear'),
    },

    // ── Orders ───────────────────────────────────────────────────────────
    orders: {
      create:      (d)     => request('POST', '/orders/createOrder', d),
      myOrders:    ()      => request('GET',  '/orders/my-orders'),
      cancel:      (id)    => request('PUT',  `/orders/cancel/${id}`),
      adminAll:    ()      => request('GET',  '/orders/admin/all'),
      adminUpdate: (id, d) => request('PUT',  `/orders/admin/update/${id}`, d),
    },

    // ── Coupons ──────────────────────────────────────────────────────────
    coupons: {
      validate: (code) => request('POST', '/coupons/validate',     { code }),
      create:   (d)    => request('POST', '/coupons/admin/create', d),
      adminAll: ()     => request('GET',  '/coupons/admin/all'),
    },

    // ── Reviews ──────────────────────────────────────────────────────────
    reviews: {
      add:          (d)   => request('POST',   '/reviews/add', d),
      delete:       (id)  => request('DELETE', `/reviews/delete/${id}`),
      getByProduct: (pid) => request('GET',    `/reviews/product/${pid}`),
    },
  };

  // ─── Expose Globally ─────────────────────────────────────────────────────
  window.api      = api;
  window.ApiError = ApiError;

})();
