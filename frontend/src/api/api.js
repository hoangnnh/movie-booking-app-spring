const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

export async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
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
};

export const movieApi = {
  getAll: () => apiRequest("/movies"),

  getById: (movieId) => apiRequest(`/movies/${movieId}`),

  getShowtimes: (movieId) => apiRequest(`/movies/${movieId}/showtimes`),
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