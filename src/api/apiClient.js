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
    changePassword: async (currentPassword, newPassword) => {
      const { data } = await apiClient.post("/auth/change-password", { currentPassword, newPassword });
      return data;
    },
    adminChangePassword: async ({ userId, email, newPassword }) => {
      const payload = { newPassword };
      if (userId) payload.userId = userId;
      if (email) payload.email = email;
      const { data } = await apiClient.post("/auth/admin-change-password", payload);
      return data;
    },
    me: async () => {
      try {
        const { data } = await apiClient.get("/auth/me");
        return data;
      } catch (e) {
        if (e.response && e.response.status === 401) {
          throw new Error("auth_required");
        }
        throw e; // Rethrow other errors (500, timeout, etc.)
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
    },
    getRoles: () => apiClient.get("/auth/roles").then(r => r.data),
    saveRole: (data) => apiClient.post("/auth/roles", data).then(r => r.data),
    deleteRole: (roleName, isLocal) => apiClient.delete(`/auth/roles/${roleName}${isLocal ? '?is_local=true' : ''}`).then(r => r.data)
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
  mosque: {
    getByDomain: async (domain) => {
      const { data } = await apiClient.get(`/public/mosque-by-domain?domain=${domain}`);
      return data;
    }
  },
  entities: {}
};

// Dinamically create all entities that match smartApi
const models = [
  "User", "Mosque", "MosqueMember", "Transaction", "Activity", "Announcement", 
  "Donation", "PrayerTime", "JumatOfficer", "AppSettings", "PlanFeatures", 
  "RolePermission", "Voucher", "License", "AuditLog", "Mustahik", 
  "AidDistribution", "QurbanAnimal", "QurbanParticipant", "Asset", 
  "Inventory", "Jamaah", "ServiceRequirement"
];

models.forEach(model => {
  smartApi.entities[model] = {
    list: async () => {
      const { data } = await apiClient.get(`/entities/${model}`);
      return data;
    },
    filter: async (filterObj, sortOrOptions, limitInt, includeObj) => {
      const params = new URLSearchParams();
      if (filterObj) params.append("filter", JSON.stringify(filterObj));
      
      let sort = sortOrOptions;
      let limit = limitInt;
      let include = includeObj;
      
      // Support options object as the second argument
      if (typeof sortOrOptions === 'object' && sortOrOptions !== null) {
        sort = sortOrOptions.sort;
        limit = sortOrOptions.limit;
        include = sortOrOptions.include;
      }
      
      if (sort) params.append("sort", sort);
      if (limit) params.append("limit", limitInt || limit);
      if (include) params.append("include", JSON.stringify(include));
      
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
  filter: async (filterObj, sortStr, limitInt) => {
    const params = new URLSearchParams();
    if (filterObj?.activity_id) params.append("activity_id", filterObj.activity_id);
    if (filterObj?.mosque_id) params.append("mosque_id", filterObj.mosque_id);
    if (sortStr) params.append("sort", sortStr);
    if (limitInt) params.append("limit", limitInt);
    
    const { data } = await apiClient.get(`/attendance?${params.toString()}`);
    return data;
  },
  list: async () => {
    const { data } = await apiClient.get("/attendance");
    return data;
  }
};

// Tambah TelegramSettings entity
smartApi.telegram = {
  getSettings: async (mosqueId) => {
    const { data } = await apiClient.get(`/telegram/settings?mosque_id=${mosqueId}`);
    return data;
  },
  saveSettings: async (payload) => {
    const { data } = await apiClient.post("/telegram/settings", payload);
    return data;
  },
  testBot: async (mosqueId, botToken) => {
    const { data } = await apiClient.post("/telegram/test-bot", { mosque_id: mosqueId, bot_token: botToken });
    return data;
  },
  testSend: async (mosqueId, chatId) => {
    const { data } = await apiClient.post("/telegram/test-send", { mosque_id: mosqueId, chat_id: chatId });
    return data;
  },
  sendNotification: async (mosqueId, message) => {
    const { data } = await apiClient.post("/telegram/send-notification", { mosque_id: mosqueId, message });
    return data;
  },
  analyzeReceipt: async (mosqueId, file) => {
    const formData = new FormData();
    formData.append("receipt", file);
    formData.append("mosque_id", mosqueId);
    const { data } = await apiClient.post("/telegram/analyze-receipt", formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
    return data;
  }
};

smartApi.users = {
  inviteUser: async (email, role) => {
    const { data } = await apiClient.post("/users/invite", { email, role });
    return data;
  }
};

