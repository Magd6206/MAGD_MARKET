const api = {
  async _request(method, path, body = null) {
    // 🎯 إضافة السطر الذي طلبته لمراقبة المسار
    console.log("الرابط الذي يتم طلبه حالياً:", path);

    const opts = {
      method,
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    };
    if (body) opts.body = JSON.stringify(body);

    const res = await fetch(path, opts);
    const text = await res.text();

    try {
      const data = JSON.parse(text);
      if (!res.ok) throw data;
      return data;
    } catch (e) {
      console.error("خطأ في الطلب للمسار:", path);
      // إذا كان الخطأ هو HTML، فسنعرف الآن بوضوح من خلال الـ Console
      console.error("محتوى الاستجابة المستلم:", text.substring(0, 200));

      throw {
        status: res.status,
        message: `فشل في معالجة البيانات للمسار: ${path}`,
      };
    }
  },

  get: (path) => api._request("GET", path),
  post: (path, body) => api._request("POST", path, body),
  put: (path, body) => api._request("PUT", path, body),
  delete: (path, body) => api._request("DELETE", path, body),

  auth: {
    signup: (d) => api.post("/api/v1/auth/signup", d),
    login: (d) => api.post("/api/v1/auth/login", d),
  },
  products: {
    getAll: (q = "") => api.get("/api/v1/prodects" + q),
    getById: (id) => api.get(`/api/v1/prodects/${id}`),
  },
};

window.api = api;
