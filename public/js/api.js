const API_BASE = ""; // فارغ لأننا في Monolith والفرونت والباك على نفس الرابط

const api = {
  async _request(method, path, body = null) {
    const opts = {
      method,
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    };
    if (body) opts.body = JSON.stringify(body);

    const res = await fetch(`${API_BASE}${path}`, opts);

    // فحص ذكي: هل الاستجابة JSON؟
    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      console.error(`خطأ: المتصفح استلم HTML بدل JSON من المسار: ${path}`);
      throw new Error(
        "سيرفر الـ API أرسل استجابة غير صحيحة (HTML بدلاً من JSON)",
      );
    }

    const data = await res.json();
    if (!res.ok) throw data;
    return data;
  },

  get: (path) => api._request("GET", path),
  post: (path, body) => api._request("POST", path, body),
  put: (path, body) => api._request("PUT", path, body),
  delete: (path, body) => api._request("DELETE", path, body),

  // --- تحديث المسارات لتكون كاملة ومباشرة ---
  auth: {
    signup: (d) => api.post("/api/v1/auth/signup", d),
    login: (d) => api.post("/api/v1/auth/login", d),
  },
  products: {
    getAll: (q = "") => api.get("/api/v1/prodects" + q),
    getById: (id) => api.get(`/api/v1/prodects/${id}`),
  },
  // أضف بقية الدوال بنفس الطريقة (تأكد أنها تبدأ بـ /api/v1/)
};

window.api = api;
