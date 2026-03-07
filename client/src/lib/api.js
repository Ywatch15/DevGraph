import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

// Request interceptor — attach JWT token
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("devgraph_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor — handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("devgraph_token");
        localStorage.removeItem("devgraph_user");
        // Don't redirect if already on login/register
        if (
          !window.location.pathname.includes("/login") &&
          !window.location.pathname.includes("/register")
        ) {
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  },
);

// Auth API
export const authAPI = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  getMe: () => api.get("/auth/me"),
};

// Notes API
export const notesAPI = {
  create: (data) => api.post("/notes", data),
  getAll: (params) => api.get("/notes", { params }),
  getById: (id) => api.get(`/notes/${id}`),
  update: (id, data) => api.put(`/notes/${id}`, data),
  delete: (id) => api.delete(`/notes/${id}`),
  getStats: () => api.get("/notes/stats"),
  getRelated: (id) => api.get(`/notes/${id}/related`),
};

// Tags API
export const tagsAPI = {
  getAll: (params) => api.get("/tags", { params }),
  suggest: (q) => api.get("/tags/suggest", { params: { q } }),
  getPopular: (limit) => api.get("/tags/popular", { params: { limit } }),
};

// Search API
export const searchAPI = {
  search: (params) => api.get("/search", { params }),
  matchError: (errorText) => api.post("/search/error-match", { errorText }),
  suggest: (text) => api.post("/search/suggest", { text }),
};

// Graph API
export const graphAPI = {
  getGraph: () => api.get("/graph"),
  generate: () => api.post("/graph/generate"),
  getPatterns: () => api.get("/graph/patterns"),
};

// Public API
export const publicAPI = {
  getFeed: (params) => api.get("/public/feed", { params }),
};

export default api;
