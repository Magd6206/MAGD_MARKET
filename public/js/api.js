const api = {
  async _request(method, path, body = null) {
    const opts = {
      method,
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    };
    if (body) opts.body = JSON.stringify(body);

    const res = await fetch(path, opts);
    const text = await res.text(); // قراءة الاستجابة كنص أولاً

    try {
      const data = JSON.parse(text); // محاولة تحويل النص إلى JSON
      if (!res.ok) throw data;
      return data;
    } catch (e) {
      // هنا سنعرف بالضبط ما هو الخطأ (مثلاً إذا استلمنا كود HTML)
      console.error("خطأ في الطلب للمسار:", path);
      console.error(
        "محتوى الاستجابة المستلم (قد يكون HTML):",
        text.substring(0, 200),
      );
      throw {
        status: res.status,
        message: "فشل في معالجة البيانات، تأكد من أن المسار يبدأ بـ /api/v1/",
      };
    }
  },

  get: (path) => api._request("GET", path),
  post: (path, body) => api._request("POST", path, body),
  put: (path, body) => api._request("PUT", path, body),
  delete: (path, body) => api._request("DELETE", path, body),

  // أمثلة للتأكد من المسارات
  auth: {
    signup: (d) => api.post("/api/v1/auth/signup", d),
    login: (d) => api.post("/api/v1/auth/login", d),
  },
  // تأكد أن جميع الدوال الأخرى في هذا الملف تبدأ بـ /api/v1/
};

window.api = api;
