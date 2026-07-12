/**
 * MAGD MARKET — API Service Layer
 * All HTTP calls to the Express backend
 */
// Backend runs on port 3000. Frontend runs on port 5000.
// These two processes are completely independent.
const isLocal =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

// إذا كنت تشتغل محلياً عبر بورت 5000، سيتوجه الطلب تلقائياً لبورت 3000 (الباك إند)
// وإذا رُفع على Render، سيتحدث مع نفس السيرفر المدمج تلقائياً
const API_BASE = isLocal ? "http://localhost:3000/api/v1" : "/api/v1";

const api = {
  /** Generic fetch wrapper */
  async _request(method, path, body = null) {
    const opts = {
      method,
      credentials: "include", // send/receive HTTP-only cookies
      headers: { "Content-Type": "application/json" },
    };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(`${API_BASE}${path}`, opts);
    const data = await res.json();
    if (!res.ok)
      throw {
        status: res.status,
        message: data.message || "Request failed",
        data,
      };
    return data;
  },

  get: (path) => api._request("GET", path),
  post: (path, body) => api._request("POST", path, body),
  put: (path, body) => api._request("PUT", path, body),
  delete: (path, body) => api._request("DELETE", path, body),

  // --- Auth ---
  auth: {
    signup: (d) => api.post("/auth/signup", d),
    login: (d) => api.post("/auth/login", d),
    logout: () => api.post("/auth/logout"),
    profile: () => api.get("/auth/profile"),
    refresh: () => api.put("/auth/refresh_Token"),
  },

  // --- Users ---
  users: {
    me: () => api.get("/users/me"),
    updateMe: (d) => api.put("/users/update-me", d),
    getAll: () => api.get("/users/"),
    getById: (id) => api.get(`/users/${id}`),
    delete: (id) => api.delete(`/users/${id}`),
  },

  // --- Products ---
  products: {
    getAll: (q = {}) => api.get("/prodects" + buildQuery(q)),
    getById: (id) => api.get(`/prodects/${id}`),
    create: (d) => api.post("/prodects", d),
    update: (id, d) => api.put(`/prodects/${id}`, d),
    delete: (id) => api.delete(`/prodects/${id}`),
    updateVariantStock: (productId, variantId, stock) =>
      api.put(`/prodects/${productId}/variants/${variantId}`, { stock }),
  },

  // --- Cart ---
  cart: {
    get: () => api.get("/carts/ByIdUser"),
    add: (d) => api.post("/carts/creatCart", d),
    updateQty: (d) => api.put("/carts/updateQuantity", d),
    remove: (d) => api.delete("/carts/removeItem", d),
    clear: () => api.delete("/carts/clear"),
  },

  // --- Orders ---
  orders: {
    create: (d) => api.post("/orders/createOrder", d),
    myOrders: () => api.get("/orders/my-orders"),
    cancel: (id) => api.put(`/orders/cancel/${id}`),
    adminAll: () => api.get("/orders/admin/all"),
    adminUpdate: (id, d) => api.put(`/orders/admin/update/${id}`, d),
  },

  // --- Coupons ---
  coupons: {
    validate: (code) => api.post("/coupons/validate", { code }),
    create: (d) => api.post("/coupons/admin/create", d),
    adminAll: () => api.get("/coupons/admin/all"),
  },

  // --- Reviews ---
  reviews: {
    add: (d) => api.post("/reviews/add", d),
    delete: (id) => api.delete(`/reviews/delete/${id}`),
    getByProduct: (pid) => api.get(`/reviews/product/${pid}`),
  },
};

/** Builds a query string from a plain object, ignoring empty/null values */
function buildQuery(params) {
  const parts = Object.entries(params)
    .filter(([, v]) => v !== "" && v !== null && v !== undefined)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`);
  return parts.length ? "?" + parts.join("&") : "";
}

window.api = api;
