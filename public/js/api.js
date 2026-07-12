/**
 * MAGD MARKET — API Service Layer
 * مُعدل ليتوافق مع الدمج (Monolith) على Render
 */

const isLocal =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

// إذا كنا محلياً نستخدم بورت 3000، وإذا كنا على السيرفر نستخدم الرابط مباشرة
const API_BASE = isLocal ? "http://localhost:3000" : "";

const api = {
  /** Generic fetch wrapper */
  async _request(method, path, body = null) {
    const opts = {
      method,
      credentials: "include", // إرسال الكوكيز والتوكنز
      headers: { "Content-Type": "application/json" },
    };
    if (body) opts.body = JSON.stringify(body);

    // المسار الآن يبدأ بـ /api/v1 دائماً عبر المتغير path
    const res = await fetch(`${API_BASE}${path}`, opts);

    // فحص الاستجابة للتأكد أنها JSON وليست HTML (صفحة خطأ)
    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw {
        status: res.status,
        message: "Server returned non-JSON response",
      };
    }

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

  // --- Auth (كل المسارات تبدأ بـ /api/v1) ---
  auth: {
    signup: (d) => api.post("/api/v1/auth/signup", d),
    login: (d) => api.post("/api/v1/auth/login", d),
    logout: () => api.post("/api/v1/auth/logout"),
    profile: () => api.get("/api/v1/auth/profile"),
    refresh: () => api.put("/api/v1/auth/refresh_Token"),
  },

  // --- Users ---
  users: {
    me: () => api.get("/api/v1/users/me"),
    updateMe: (d) => api.put("/api/v1/users/update-me", d),
    getAll: () => api.get("/api/v1/users/"),
    getById: (id) => api.get(`/api/v1/users/${id}`),
    delete: (id) => api.delete(`/api/v1/users/${id}`),
  },

  // --- Products ---
  products: {
    getAll: (q = {}) => api.get("/api/v1/prodects" + buildQuery(q)),
    getById: (id) => api.get(`/api/v1/prodects/${id}`),
    create: (d) => api.post("/api/v1/prodects", d),
    update: (id, d) => api.put(`/api/v1/prodects/${id}`, d),
    delete: (id) => api.delete(`/api/v1/prodects/${id}`),
  },

  // --- Cart ---
  cart: {
    get: () => api.get("/api/v1/carts/ByIdUser"),
    add: (d) => api.post("/api/v1/carts/creatCart", d),
    updateQty: (d) => api.put("/api/v1/carts/updateQuantity", d),
    remove: (d) => api.delete("/api/v1/carts/removeItem", d),
    clear: () => api.delete("/api/v1/carts/clear"),
  },

  // --- Orders ---
  orders: {
    create: (d) => api.post("/api/v1/orders/createOrder", d),
    myOrders: () => api.get("/api/v1/orders/my-orders"),
    cancel: (id) => api.put(`/api/v1/orders/cancel/${id}`),
    adminAll: () => api.get("/api/v1/orders/admin/all"),
    adminUpdate: (id, d) => api.put(`/api/v1/orders/admin/update/${id}`, d),
  },

  // --- Coupons & Reviews ---
  coupons: {
    validate: (code) => api.post("/api/v1/coupons/validate", { code }),
    create: (d) => api.post("/api/v1/coupons/admin/create", d),
    adminAll: () => api.get("/api/v1/coupons/admin/all"),
  },
  reviews: {
    add: (d) => api.post("/api/v1/reviews/add", d),
    delete: (id) => api.delete(`/api/v1/reviews/delete/${id}`),
    getByProduct: (pid) => api.get(`/api/v1/reviews/product/${pid}`),
  },
};

function buildQuery(params) {
  const parts = Object.entries(params)
    .filter(([, v]) => v !== "" && v !== null && v !== undefined)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`);
  return parts.length ? "?" + parts.join("&") : "";
}

window.api = api;
