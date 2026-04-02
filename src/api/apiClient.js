import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || (import.meta.env.PROD ? "/api" : "http://localhost:3000/api");

export const apiClient = axios.create({
  baseURL: BACKEND_URL
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Smart App API client — semua request diarahkan ke self-hosted Node.js backend
export const smartApi = {
  auth: {
    login: async (identifier, password) => {
      const { data } = await apiClient.post("/auth/login", { identifier, password });
      if (data.token) {
        localStorage.setItem("token", data.token);
      }
      return data;
    },
    verify2FA: async (email, token) => {
      const { data } = await apiClient.post("/auth/verify-2fa", { email, token });
      if (data.token) {
        localStorage.setItem("token", data.token);
      }
      return data;
    },
    verifyOTP: async (email, otp) => {
      const { data } = await apiClient.post("/auth/verify-otp", { email, otp });
      if (data.token) {
        localStorage.setItem("token", data.token);
      }
      return data;
    },
    generate2FA: async () => {
      const { data } = await apiClient.get("/auth/2fa/generate");
      return data;
    },
    enable2FA: async (token) => {
      const { data } = await apiClient.post("/auth/2fa/enable", { token });
      return data;
    },
    disable2FA: async (token) => {
      const { data } = await apiClient.post("/auth/2fa/disable", { token });
      return data;
    },
    register: async (payload) => {
      const { data } = await apiClient.post("/auth/register", payload);
      localStorage.setItem("token", data.token);
      return data;
    },
    forgotPassword: async (email) => {
      const { data } = await apiClient.post("/auth/forgot-password", { email });
      return data;
    },
    resetPassword: async (token, newPassword) => {
      const { data } = await apiClient.post("/auth/reset-password", { token, newPassword });
      return data;
    },
    me: async () => {
      try {
        const { data } = await apiClient.get("/auth/me");
        return data;
      } catch (e) {
        throw new Error("auth_required");
      }
    },
    updateMe: async (payload) => {
      const { data } = await apiClient.patch("/auth/me", payload);
      return data;
    },
    logout: () => {
      localStorage.removeItem("token");
      window.location.href = "/login";
    },
    redirectToLogin: (path) => {
      window.location.href = `/login?redirect=${encodeURIComponent(path || '/')}`;
    }
  },
  integrations: {
    Core: {
      UploadFile: async (payload) => {
        // Upload logic maps to our simple backend endpoint
        const formData = new FormData();
        formData.append("file", payload.file);
        const { data } = await apiClient.post("/integrations/core/uploadfile", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        return data;
      },
      // SendEmail stub — currently opens WhatsApp as fallback (no SMTP configured)
      SendEmail: async ({ to, subject, body }) => {
        console.warn("[SendEmail] SMTP not configured. To:", to, "Subject:", subject);
        return { success: false, message: "Email not configured" };
      }
    }
  },
  entities: {}
};

// Dinamically create all entities that match smartApi
const models = ["User", "Mosque", "MosqueMember", "Transaction", "Activity", "Announcement", "Donation", "PrayerTime", "JumatOfficer", "AppSettings", "PlanFeatures"];

models.forEach(model => {
  smartApi.entities[model] = {
    list: async () => {
      const { data } = await apiClient.get(`/entities/${model}`);
      return data;
    },
    filter: async (filterObj, sortStr, limitInt) => {
      const params = new URLSearchParams();
      if (filterObj) params.append("filter", JSON.stringify(filterObj));
      if (sortStr) params.append("sort", sortStr);
      if (limitInt) params.append("limit", limitInt);
      
      const { data } = await apiClient.get(`/entities/${model}?${params.toString()}`);
      return data;
    },
    create: async (payload) => {
      const { data } = await apiClient.post(`/entities/${model}`, payload);
      return data;
    },
    update: async (id, payload) => {
      const { data } = await apiClient.patch(`/entities/${model}/${id}`, payload);
      return data;
    },
    delete: async (id) => {
      const { data } = await apiClient.delete(`/entities/${model}/${id}`);
      return data;
    }
  };
});

// Override Attendance with public endpoint (no auth required for QR scan form)
smartApi.entities.Attendance = {
  create: async (payload) => {
    const { data } = await apiClient.post("/attendance", payload);
    return data;
  },
  filter: async (filterObj) => {
    const params = new URLSearchParams();
    if (filterObj?.activity_id) params.append("activity_id", filterObj.activity_id);
    if (filterObj?.mosque_id) params.append("mosque_id", filterObj.mosque_id);
    const { data } = await apiClient.get(`/attendance?${params.toString()}`);
    return data;
  },
  list: async () => {
    const { data } = await apiClient.get("/attendance");
    return data;
  }
};
