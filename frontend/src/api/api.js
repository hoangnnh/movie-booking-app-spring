export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

export const AUTH_STORAGE_KEY = "ticketor.auth";

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
      ...getAuthHeaders(),
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "API request failed");
  }

  if (response.status === 204) return null;

  return response.json();
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
};

export const movieApi = {
  getAll: () => apiRequest("/movies"),

  search: (query) => apiRequest(`/movies?query=${encodeURIComponent(query)}`),

  autocomplete: (query, limit = 6) =>
    apiRequest(
      `/movies/autocomplete?query=${encodeURIComponent(query)}&limit=${limit}`
    ),

  getById: (movieId) => apiRequest(`/movies/${movieId}`),

  getByActorName: (actorName) =>
    apiRequest(`/movies/by-actor?actorName=${encodeURIComponent(actorName)}`),

  getShowtimes: (movieId) => apiRequest(`/movies/${movieId}/showtimes`),
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

export const showtimeApi = {
  getById: (showtimeId) => apiRequest(`/showtimes/${showtimeId}`),
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
