export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

export const AUTH_STORAGE_KEY = "ticketor.auth";

function getTunnelHeaders() {
  try {
    const hostname = new URL(API_BASE_URL).hostname;

    if (hostname.endsWith(".ngrok-free.app") || hostname.endsWith(".ngrok-free.dev")) {
      return {
        "ngrok-skip-browser-warning": "true",
      };
    }
  } catch {
    return {};
  }

  return {};
}

export function loadStoredAuth() {
  const storedValue = localStorage.getItem(AUTH_STORAGE_KEY);

  if (!storedValue) {
    return null;
  }

  try {
    return JSON.parse(storedValue);
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

export function persistStoredAuth(value) {
  if (!value) {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return;
  }

  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(value));
}

export function getBackendBaseUrl() {
  return API_BASE_URL.endsWith("/api")
    ? API_BASE_URL.slice(0, -4)
    : API_BASE_URL;
}

function getAuthHeaders() {
  const accessToken = loadStoredAuth()?.accessToken;

  return accessToken
    ? {
        Authorization: `Bearer ${accessToken}`,
      }
    : {};
}

export async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...getTunnelHeaders(),
      ...getAuthHeaders(),
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(extractApiErrorMessage(errorText));
  }

  if (response.status === 204) return null;
  const responseText = await response.text();

  if (!responseText) {
    return null;
  }

  return JSON.parse(responseText);
}

function extractApiErrorMessage(errorText) {
  if (!errorText) {
    return "API request failed";
  }

  try {
    const error = JSON.parse(errorText);
    return error.detail || error.message || error.error || errorText;
  } catch {
    return errorText;
  }
}

export const authApi = {
  login: (data) =>
    apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  register: (data) =>
    apiRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  resendVerification: (data) =>
    apiRequest("/auth/resend-verification", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  forgotPassword: (data) =>
    apiRequest("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  resetPassword: (data) =>
    apiRequest("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getSettings: () => apiRequest("/auth/settings"),

  getCurrentUser: () => apiRequest("/auth/me"),

  getProfile: () => apiRequest("/auth/profile"),

  updateProfile: (data) =>
    apiRequest("/auth/profile", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  updateAvatar: (avatarUrl) =>
    apiRequest("/auth/profile/avatar", {
      method: "PATCH",
      body: JSON.stringify({ avatarUrl }),
    }),

  changePassword: (data) =>
    apiRequest("/auth/password", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
};

export const movieApi = {
  getCatalog: ({ status, query = "", genre = "", page = 0, size = 12 }) => {
    const params = new URLSearchParams({
      status,
      page: String(page),
      size: String(size),
    });

    if (query) params.set("query", query);
    if (genre && genre !== "all") params.set("genre", genre);

    return apiRequest(`/movies?${params.toString()}`);
  },

  getNowPlaying: (limit = 10) => apiRequest(`/movies/now-playing?limit=${limit}`),

  getComingSoon: (limit = 10) => apiRequest(`/movies/coming-soon?limit=${limit}`),

  getTrendingThisWeek: (limit = 10) =>
    apiRequest(`/movies/trending/week?limit=${limit}`),

  getGenres: (status) =>
    apiRequest(`/movies/genres?status=${encodeURIComponent(status)}`),

  autocomplete: (query, limit = 6) =>
    apiRequest(
      `/movies/autocomplete?query=${encodeURIComponent(query)}&limit=${limit}`
    ),

  getById: (movieRef) => apiRequest(`/movies/${movieRef}`),

  getByActorName: (actorName) =>
    apiRequest(`/movies/by-actor?actorName=${encodeURIComponent(actorName)}`),

  getShowtimes: (movieId) => apiRequest(`/movies/${movieId}/showtimes`),

  getSimilar: (movieId, limit = 8) =>
    apiRequest(`/movies/${movieId}/similar?limit=${limit}`),

  getRecommendations: (userId, limit = 10) =>
    apiRequest(`/users/${userId}/recommendations?limit=${limit}`),
};

export const cinemaApi = {
  getAll: () => apiRequest("/cinemas"),

  getById: (cinemaId) => apiRequest(`/cinemas/${cinemaId}`),
};

export const tmdbApi = {
  searchMovies: (query) =>
    apiRequest(`/tmdb/movies/search?query=${encodeURIComponent(query)}`),

  importMovie: (tmdbId) =>
    apiRequest(`/tmdb/movies/${tmdbId}/import`, {
      method: "POST",
    }),

  importMovieList: ({ list, pages }) =>
    apiRequest(
      `/tmdb/movies/import?list=${encodeURIComponent(list)}&pages=${pages}`,
      {
        method: "POST",
      }
    ),
};

export const adminApi = {
  getSummary: () => apiRequest("/admin/summary"),

  getMovies: ({ query = "", page = 0, size = 20 } = {}) => {
    const params = new URLSearchParams({
      page: String(page),
      size: String(size),
    });

    if (query) params.set("query", query);

    return apiRequest(`/admin/movies?${params.toString()}`);
  },

  updateMovie: (movieId, data) =>
    apiRequest(`/admin/movies/${movieId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteMovie: (movieId) =>
    apiRequest(`/admin/movies/${movieId}`, {
      method: "DELETE",
    }),

  getUsers: ({ page = 0, size = 20 } = {}) =>
    apiRequest(`/admin/users?page=${page}&size=${size}`),

  getRecentUsers: () => apiRequest("/admin/users/recent"),

  updateUserRole: (userId, role) =>
    apiRequest(`/admin/users/${userId}/role`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    }),

  deleteUser: (userId) =>
    apiRequest(`/admin/users/${userId}`, {
      method: "DELETE",
    }),

  getBookings: ({ page = 0, size = 20 } = {}) =>
    apiRequest(`/admin/bookings?page=${page}&size=${size}`),

  getRecentBookings: () => apiRequest("/admin/bookings/recent"),

  deleteBooking: (bookingId) =>
    apiRequest(`/admin/bookings/${bookingId}`, {
      method: "DELETE",
    }),
};

export const showtimeApi = {
  getById: (showtimeId) => apiRequest(`/showtimes/${showtimeId}`),
};

export const concessionApi = {
  getByShowtime: (showtimeId) => apiRequest(`/showtimes/${showtimeId}/food-items`),
};

export const bookingApi = {
  getSeats: (showtimeId) => apiRequest(`/showtimes/${showtimeId}/seats`),

  createBooking: (data) =>
    apiRequest("/bookings", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getUserBookings: (userId) => apiRequest(`/users/${userId}/bookings`),

};

export const notificationApi = {
  getAll: () => apiRequest("/notifications"),

  markRead: (notificationId) =>
    apiRequest(`/notifications/${notificationId}/read`, {
      method: "PATCH",
    }),

  markAllRead: () =>
    apiRequest("/notifications/read-all", {
      method: "PATCH",
    }),
};
