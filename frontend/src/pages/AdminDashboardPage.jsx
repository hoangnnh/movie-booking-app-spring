import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart3,
  CalendarClock,
  ChevronDown,
  CircleDollarSign,
  Download,
  EyeOff,
  Film,
  RefreshCw,
  Save,
  ShieldAlert,
  Ticket,
  Trash2,
  Users,
} from "lucide-react";
import { adminApi } from "../api/api";
import Button from "../components/common/Button";
import { useAuth } from "../context/useAuth";
import { cn } from "../utils/cn";
import { formatVnd } from "../utils/currency";

const tabs = [
  { key: "overview", label: "Overview", icon: BarChart3 },
  { key: "movies", label: "Movies", icon: Film },
  { key: "users", label: "Users", icon: Users },
  { key: "bookings", label: "Bookings", icon: Ticket },
];

const movieDisplayStatuses = ["SHOWING_NOW", "COMING_SOON", "HIDDEN"];
const ADMIN_PAGE_SIZE = 8;
const EMPTY_PAGE = {
  totalItems: 0,
  totalPages: 1,
  page: 0,
};

export default function AdminDashboardPage({ onRequireAuth }) {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [summary, setSummary] = useState(null);
  const [movies, setMovies] = useState([]);
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [movieMeta, setMovieMeta] = useState(EMPTY_PAGE);
  const [userMeta, setUserMeta] = useState(EMPTY_PAGE);
  const [bookingMeta, setBookingMeta] = useState(EMPTY_PAGE);
  const [movieQuery, setMovieQuery] = useState("");
  const [appliedMovieQuery, setAppliedMovieQuery] = useState("");
  const [editingMovieId, setEditingMovieId] = useState(null);
  const [movieDraft, setMovieDraft] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [moviePage, setMoviePage] = useState(1);
  const [userPage, setUserPage] = useState(1);
  const [bookingPage, setBookingPage] = useState(1);

  const isAdmin = user?.role === "ADMIN";

  const loadOverviewData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [summaryData, userData, bookingData] = await Promise.all([
        adminApi.getSummary(),
        adminApi.getRecentUsers(),
        adminApi.getRecentBookings(),
      ]);

      setSummary(summaryData);
      setRecentUsers(Array.isArray(userData) ? userData : []);
      setRecentBookings(Array.isArray(bookingData) ? bookingData : []);
    } catch (err) {
      setError(cleanError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMoviesPage = useCallback(async (nextPage = moviePage, nextQuery = appliedMovieQuery) => {
    try {
      setLoading(true);
      setError("");
      const data = await adminApi.getMovies({
        query: nextQuery,
        page: nextPage - 1,
        size: ADMIN_PAGE_SIZE,
      });
      setMovies(Array.isArray(data?.items) ? data.items : []);
      setMovieMeta(normalizePageMeta(data));
    } catch (err) {
      setError(cleanError(err));
    } finally {
      setLoading(false);
    }
  }, [appliedMovieQuery, moviePage]);

  const loadUsersPage = useCallback(async (nextPage = userPage) => {
    try {
      setLoading(true);
      setError("");
      const data = await adminApi.getUsers({
        page: nextPage - 1,
        size: ADMIN_PAGE_SIZE,
      });
      setUsers(Array.isArray(data?.items) ? data.items : []);
      setUserMeta(normalizePageMeta(data));
    } catch (err) {
      setError(cleanError(err));
    } finally {
      setLoading(false);
    }
  }, [userPage]);

  const loadBookingsPage = useCallback(async (nextPage = bookingPage) => {
    try {
      setLoading(true);
      setError("");
      const data = await adminApi.getBookings({
        page: nextPage - 1,
        size: ADMIN_PAGE_SIZE,
      });
      setBookings(Array.isArray(data?.items) ? data.items : []);
      setBookingMeta(normalizePageMeta(data));
    } catch (err) {
      setError(cleanError(err));
    } finally {
      setLoading(false);
    }
  }, [bookingPage]);

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) return;

    const timeoutId = window.setTimeout(() => {
      if (activeTab === "overview") loadOverviewData();
      if (activeTab === "movies") loadMoviesPage();
      if (activeTab === "users") loadUsersPage();
      if (activeTab === "bookings") loadBookingsPage();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [
    activeTab,
    isAuthenticated,
    isAdmin,
    loadBookingsPage,
    loadMoviesPage,
    loadOverviewData,
    loadUsersPage,
  ]);

  async function loadAdminData() {
    if (activeTab === "overview") await loadOverviewData();
    if (activeTab === "movies") await loadMoviesPage();
    if (activeTab === "users") await loadUsersPage();
    if (activeTab === "bookings") await loadBookingsPage();
  }

  async function searchMovies(event) {
    event.preventDefault();
    const nextQuery = movieQuery.trim();
    const shouldReloadDirectly = nextQuery === appliedMovieQuery && moviePage === 1;
    setAppliedMovieQuery(nextQuery);
    setMoviePage(1);

    if (shouldReloadDirectly) {
      await loadMoviesPage(1, nextQuery);
    }
  }

  function startMovieEdit(movie) {
    setEditingMovieId(movie.id);
    setMovieDraft({
      title: movie.title || "",
      description: movie.description || "",
      durationMinutes: movie.durationMinutes || 120,
      posterUrl: movie.posterUrl || "",
      backdropUrl: movie.backdropUrl || "",
      releaseDate: movie.releaseDate || "",
      rating: movie.rating || "",
      displayStatus: movie.displayStatus || "HIDDEN",
    });
  }

  async function saveMovie(movieId) {
    try {
      setError("");
      setMessage("");
      const updated = await adminApi.updateMovie(movieId, {
        ...movieDraft,
        durationMinutes: Number(movieDraft.durationMinutes) || null,
        rating: movieDraft.rating === "" ? null : Number(movieDraft.rating),
        releaseDate: movieDraft.releaseDate || null,
      });

      setMovies((current) =>
        current.map((movie) => (movie.id === movieId ? updated : movie))
      );
      setEditingMovieId(null);
      setMovieDraft(null);
      setMessage("Movie updated.");
    } catch (err) {
      setError(cleanError(err));
    }
  }

  async function deleteMovie(movieId) {
    try {
      setError("");
      setMessage("");
      await adminApi.deleteMovie(movieId);
      await loadMoviesPage();
      setMessage("Movie deleted.");
    } catch (err) {
      setError(cleanError(err));
    }
  }

  async function updateUserRole(userId, role) {
    try {
      setError("");
      const updated = await adminApi.updateUserRole(userId, role);
      setUsers((current) =>
        current.map((item) => (item.id === userId ? updated : item))
      );
      setMessage("User role updated.");
    } catch (err) {
      setError(cleanError(err));
    }
  }

  async function deleteUser(userId) {
    try {
      setError("");
      await adminApi.deleteUser(userId);
      await loadUsersPage();
      setMessage("User deleted.");
    } catch (err) {
      setError(cleanError(err));
    }
  }

  async function deleteBooking(bookingId) {
    try {
      setError("");
      await adminApi.deleteBooking(bookingId);
      await loadBookingsPage();
      setMessage("Booking removed.");
    } catch (err) {
      setError(cleanError(err));
    }
  }

  if (!isAuthenticated) {
    return (
      <AdminGate
        title="Admin sign in required"
        description="Sign in with an admin account to manage movies, users, and bookings."
        actionLabel="Sign In"
        onAction={onRequireAuth}
      />
    );
  }

  if (!isAdmin) {
    return (
      <AdminGate
        title="Admin access only"
        description="Your account does not have permission to access this dashboard."
      />
    );
  }

  return (
    <div className="min-h-screen bg-app-background text-app-text">
      <main className="ticketor-container py-[40px]">
        <div className="mb-[24px] flex flex-wrap items-center justify-between gap-[16px]">
          <div>
            <p className="type-label-m text-brand">ADMIN</p>
            <h1 className="type-h3 mt-[6px] text-app-text">Operations Dashboard</h1>
            <p className="type-body-s mt-[8px] text-app-text-muted">
              Control movie catalog data, user roles, bookings, and TMDB imports.
            </p>
          </div>

          <div className="flex gap-[8px]">
            <Button
              size={40}
              variant="outline"
              tone="base"
              leftIcon={<RefreshCw />}
              disabled={loading}
              onClick={loadAdminData}
            >
              Refresh
            </Button>
            <Button size={40} leftIcon={<Download />} onClick={() => navigate("/admin/imports")}>
              Import
            </Button>
          </div>
        </div>

        <div className="mb-[20px] flex gap-[8px] overflow-x-auto border-b border-app-border pb-[8px]">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const selected = activeTab === tab.key;

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "inline-flex h-[40px] shrink-0 items-center gap-[8px] rounded-tk-4 px-[14px] type-button-m transition-colors",
                  selected
                    ? "bg-primary-600 text-neutral-900"
                    : "text-app-text-muted hover:bg-app-surface hover:text-app-text"
                )}
              >
                <Icon className="h-[18px] w-[18px]" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {error && (
          <div className="mb-[16px] rounded-tk-8 border border-error-500 bg-app-background p-[14px] type-body-s text-error-500">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-[16px] rounded-tk-8 border border-primary-600 bg-app-surface p-[14px] type-body-s text-app-text-muted">
            {message}
          </div>
        )}

        {activeTab === "movies" && (
          <MoviesPanel
            movies={movies}
            currentPage={moviePage}
            totalPages={movieMeta.totalPages}
            totalItems={movieMeta.totalItems}
            onPageChange={setMoviePage}
            query={movieQuery}
            onQueryChange={setMovieQuery}
            onSearch={searchMovies}
            editingMovieId={editingMovieId}
            movieDraft={movieDraft}
            onEdit={startMovieEdit}
            onDraftChange={setMovieDraft}
            onCancelEdit={() => {
              setEditingMovieId(null);
              setMovieDraft(null);
            }}
            onSave={saveMovie}
            onDelete={deleteMovie}
            onImport={() => navigate("/admin/imports")}
          />
        )}

        {activeTab === "users" && (
          <UsersPanel
            users={users}
            currentPage={userPage}
            totalPages={userMeta.totalPages}
            totalItems={userMeta.totalItems}
            onPageChange={setUserPage}
            currentUserId={user?.userId}
            onRoleChange={updateUserRole}
            onDelete={deleteUser}
          />
        )}

        {activeTab === "bookings" && (
          <BookingsPanel
            bookings={bookings}
            currentPage={bookingPage}
            totalPages={bookingMeta.totalPages}
            totalItems={bookingMeta.totalItems}
            onPageChange={setBookingPage}
            onDelete={deleteBooking}
          />
        )}

        {activeTab === "overview" && (
          <OverviewPanel
            summary={summary}
            users={recentUsers}
            bookings={recentBookings}
            onOpenTab={setActiveTab}
            onImport={() => navigate("/admin/imports")}
          />
        )}
      </main>
    </div>
  );
}

function AdminGate({ title, description, actionLabel, onAction }) {
  return (
    <div className="min-h-screen bg-app-background text-app-text">
      <main className="ticketor-container py-[80px]">
        <div className="rounded-tk-8 border border-app-border bg-app-surface p-[32px] text-center">
          <ShieldAlert className="mx-auto h-[36px] w-[36px] text-brand" />
          <h1 className="type-h4 mt-[16px] text-app-text">{title}</h1>
          <p className="type-body-m mx-auto mt-[10px] max-w-[520px] text-app-text-muted">
            {description}
          </p>
          {actionLabel && (
            <Button className="mt-[20px]" onClick={onAction}>
              {actionLabel}
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}

function OverviewPanel({ summary, users, bookings, onOpenTab, onImport }) {
  const metrics = [
    { label: "Movies", value: summary?.movieCount || 0, icon: Film },
    { label: "Users", value: summary?.userCount || 0, icon: Users },
    { label: "Bookings", value: summary?.bookingCount || 0, icon: Ticket },
    { label: "Revenue", value: formatVnd(summary?.revenue || 0), icon: CircleDollarSign },
  ];
  const availability = [
    {
      label: "Showing now",
      value: summary?.showingNowMovieCount || 0,
      icon: Film,
      className: "text-success-500",
    },
    {
      label: "Coming soon",
      value: summary?.comingSoonMovieCount || 0,
      icon: CalendarClock,
      className: "text-brand",
    },
    {
      label: "Hidden",
      value: summary?.hiddenMovieCount || 0,
      icon: EyeOff,
      className: "text-app-text-muted",
    },
  ];
  const recentBookings = [...bookings]
    .sort((left, right) => getSortTime(right.createdAt || right.startTime) - getSortTime(left.createdAt || left.startTime))
    .slice(0, 5);
  const recentUsers = [...users]
    .sort((left, right) => getSortTime(right.createdAt) - getSortTime(left.createdAt))
    .slice(0, 5);

  return (
    <section className="grid gap-[16px]">
      <div className="grid gap-[16px] md:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;

          return (
          <div key={metric.label} className="rounded-tk-8 border border-app-border bg-app-surface p-[18px]">
            <div className="flex items-start justify-between gap-[12px]">
              <div>
                <p className="type-body-xs text-app-text-muted">{metric.label}</p>
                <p className="type-h4 mt-[8px] text-app-text">{metric.value}</p>
              </div>
              <Icon className="h-[20px] w-[20px] text-brand" />
            </div>
          </div>
          );
        })}
      </div>

      <div className="grid gap-[16px] lg:grid-cols-[minmax(0,1fr)_320px]">
        <DashboardSection
          title="Recent bookings"
          actionLabel="View all bookings"
          onAction={() => onOpenTab("bookings")}
        >
          {recentBookings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-left">
                <thead className="border-y border-app-border type-body-xs text-app-text-muted">
                  <tr>
                    <th className="py-[10px] pr-[12px] font-normal">Customer</th>
                    <th className="px-[12px] py-[10px] font-normal">Movie</th>
                    <th className="px-[12px] py-[10px] font-normal">Total</th>
                    <th className="py-[10px] pl-[12px] font-normal">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentBookings.map((booking) => (
                    <tr key={booking.id} className="border-b border-app-border last:border-b-0">
                      <td className="py-[12px] pr-[12px]">
                        <p className="type-body-s text-app-text">{booking.userName || "Unknown customer"}</p>
                        <p className="type-body-xs mt-[3px] text-app-text-muted">{formatDateTime(booking.startTime)}</p>
                      </td>
                      <td className="px-[12px] py-[12px] type-body-s text-app-text-muted">{booking.movieTitle || "Unknown movie"}</td>
                      <td className="px-[12px] py-[12px] type-body-s text-app-text-muted">{formatVnd(booking.totalAmount)}</td>
                      <td className="py-[12px] pl-[12px]">
                        <StatusBadge status={booking.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <DashboardEmptyState text="No bookings have been created yet." />
          )}
        </DashboardSection>

        <DashboardSection
          title="Catalog availability"
          actionLabel="Manage movies"
          onAction={() => onOpenTab("movies")}
        >
          <div className="grid gap-[12px]">
            {availability.map((item) => {
              const Icon = item.icon;

              return (
                <div key={item.label} className="flex items-center justify-between gap-[16px] border-b border-app-border pb-[12px] last:border-b-0 last:pb-0">
                  <div className="flex items-center gap-[10px]">
                    <Icon className={cn("h-[18px] w-[18px]", item.className)} />
                    <span className="type-body-s text-app-text-muted">{item.label}</span>
                  </div>
                  <span className="type-body-m font-bold text-app-text">{item.value}</span>
                </div>
              );
            })}
          </div>
        </DashboardSection>
      </div>

      <div className="grid gap-[16px] lg:grid-cols-[minmax(0,1fr)_320px]">
        <DashboardSection
          title="Recent users"
          actionLabel="View all users"
          onAction={() => onOpenTab("users")}
        >
          {recentUsers.length > 0 ? (
            <div className="grid gap-[4px]">
              {recentUsers.map((item) => (
                <div key={item.id} className="flex flex-wrap items-center justify-between gap-[12px] border-b border-app-border py-[10px] first:pt-0 last:border-b-0 last:pb-0">
                  <div>
                    <p className="type-body-s text-app-text">{item.fullName || "Unnamed user"}</p>
                    <p className="type-body-xs mt-[3px] text-app-text-muted">{item.email}</p>
                  </div>
                  <StatusBadge status={item.role || "USER"} />
                </div>
              ))}
            </div>
          ) : (
            <DashboardEmptyState text="No registered users are available yet." />
          )}
        </DashboardSection>

        <div className="rounded-tk-8 border border-app-border bg-app-surface p-[20px]">
          <p className="type-label-m text-brand">CATALOG TOOLS</p>
          <h2 className="type-h5 mt-[8px] text-app-text">TMDB imports</h2>
          <p className="type-body-s mt-[8px] text-app-text-muted">
            Add or refresh catalog entries from TMDB when your local movie data needs an update.
          </p>
          <Button className="mt-[16px]" leftIcon={<Download />} onClick={onImport}>
            Open Import Tools
          </Button>
        </div>
      </div>
    </section>
  );
}

function DashboardSection({ title, actionLabel, onAction, children }) {
  return (
    <section className="rounded-tk-8 border border-app-border bg-app-surface p-[20px]">
      <div className="mb-[16px] flex items-center justify-between gap-[16px]">
        <h2 className="type-h5 text-app-text">{title}</h2>
        <button
          type="button"
          onClick={onAction}
          className="shrink-0 type-button-s text-brand transition-colors hover:text-primary-300"
        >
          {actionLabel}
        </button>
      </div>
      {children}
    </section>
  );
}

function DashboardEmptyState({ text }) {
  return (
    <div className="rounded-tk-4 border border-dashed border-app-border px-[16px] py-[24px] text-center">
      <p className="type-body-s text-app-text-muted">{text}</p>
    </div>
  );
}

function StatusBadge({ status }) {
  const normalizedStatus = status || "UNKNOWN";
  const tone =
    normalizedStatus === "CONFIRMED" || normalizedStatus === "ADMIN"
      ? "border-success-500/50 bg-success-500/10 text-success-500"
      : normalizedStatus === "CANCELLED" || normalizedStatus === "EXPIRED"
        ? "border-error-500/50 bg-error-500/10 text-error-500"
        : "border-app-border bg-app-background text-app-text-muted";

  return (
    <span className={cn("inline-flex rounded-full border px-[9px] py-[4px] type-body-xs", tone)}>
      {normalizedStatus}
    </span>
  );
}

function MoviesPanel({
  movies,
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
  query,
  onQueryChange,
  onSearch,
  editingMovieId,
  movieDraft,
  onEdit,
  onDraftChange,
  onCancelEdit,
  onSave,
  onDelete,
  onImport,
}) {
  return (
    <section className="grid gap-[16px]">
      <form onSubmit={onSearch} className="flex flex-wrap gap-[10px] rounded-tk-8 border border-app-border bg-app-surface p-[14px]">
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search catalog"
          className="h-[40px] min-w-[260px] flex-1 rounded-tk-4 border border-app-border bg-app-background px-[12px] type-body-s text-app-text outline-none focus:border-brand"
        />
        <Button type="submit" size={40} variant="outline" tone="base">
          Search
        </Button>
        <Button size={40} leftIcon={<Download />} onClick={onImport}>
          Import
        </Button>
      </form>

      <div className="overflow-x-auto rounded-tk-8 border border-app-border bg-app-surface">
        <table className="w-full min-w-[980px] border-collapse text-left">
          <thead className="border-b border-app-border bg-app-background type-body-xs text-app-text-muted">
            <tr>
              <th className="px-[14px] py-[12px]">Movie</th>
              <th className="px-[14px] py-[12px]">Availability</th>
              <th className="px-[14px] py-[12px]">Release</th>
              <th className="px-[14px] py-[12px]">Rating</th>
              <th className="px-[14px] py-[12px]">Duration</th>
              <th className="px-[14px] py-[12px]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {movies.map((movie) => (
              <tr key={movie.id} className="border-b border-app-border last:border-b-0">
                <td className="px-[14px] py-[12px]">
                  {editingMovieId === movie.id ? (
                    <div className="grid gap-[8px]">
                      <input className="admin-input" value={movieDraft.title} onChange={(event) => onDraftChange({ ...movieDraft, title: event.target.value })} />
                      <textarea className="admin-input min-h-[72px]" value={movieDraft.description} onChange={(event) => onDraftChange({ ...movieDraft, description: event.target.value })} />
                      <input className="admin-input" value={movieDraft.posterUrl} onChange={(event) => onDraftChange({ ...movieDraft, posterUrl: event.target.value })} placeholder="Poster URL" />
                    </div>
                  ) : (
                    <div className="flex items-center gap-[12px]">
                      <div className="h-[64px] w-[44px] overflow-hidden rounded-tk-4 bg-neutral-700">
                        {movie.posterUrl && <img src={movie.posterUrl} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />}
                      </div>
                      <div>
                        <p className="type-body-s font-bold text-app-text">{movie.title}</p>
                        <p className="type-body-xs mt-[4px] max-w-[440px] truncate text-app-text-muted">{movie.description || "No description"}</p>
                      </div>
                    </div>
                  )}
                </td>
                <td className="px-[14px] py-[12px] type-body-s text-app-text-muted">
                  {editingMovieId === movie.id ? (
                    <AdminSelect value={movieDraft.displayStatus} onChange={(event) => onDraftChange({ ...movieDraft, displayStatus: event.target.value })}>
                      {movieDisplayStatuses.map((status) => (
                        <option key={status} value={status}>{formatMovieDisplayStatus(status)}</option>
                      ))}
                    </AdminSelect>
                  ) : (
                    formatMovieDisplayStatus(movie.displayStatus)
                  )}
                </td>
                <td className="px-[14px] py-[12px] type-body-s text-app-text-muted">
                  {editingMovieId === movie.id ? (
                    <input type="date" className="admin-input" value={movieDraft.releaseDate} onChange={(event) => onDraftChange({ ...movieDraft, releaseDate: event.target.value })} />
                  ) : (
                    movie.releaseDate || "TBA"
                  )}
                </td>
                <td className="px-[14px] py-[12px] type-body-s text-app-text-muted">
                  {editingMovieId === movie.id ? (
                    <input className="admin-input w-[90px]" value={movieDraft.rating} onChange={(event) => onDraftChange({ ...movieDraft, rating: event.target.value })} />
                  ) : (
                    movie.rating ? Number(movie.rating).toFixed(1) : "-"
                  )}
                </td>
                <td className="px-[14px] py-[12px] type-body-s text-app-text-muted">
                  {editingMovieId === movie.id ? (
                    <input className="admin-input w-[110px]" value={movieDraft.durationMinutes} onChange={(event) => onDraftChange({ ...movieDraft, durationMinutes: event.target.value })} />
                  ) : (
                    `${movie.durationMinutes || 0} min`
                  )}
                </td>
                <td className="px-[14px] py-[12px]">
                  {editingMovieId === movie.id ? (
                    <div className="flex gap-[8px]">
                      <Button size={32} leftIcon={<Save />} onClick={() => onSave(movie.id)}>Save</Button>
                      <Button size={32} variant="outline" tone="base" onClick={onCancelEdit}>Cancel</Button>
                    </div>
                  ) : (
                    <div className="flex gap-[8px]">
                      <Button size={32} variant="outline" tone="base" onClick={() => onEdit(movie)}>Edit</Button>
                      <Button size={32} variant="outline" tone="base" leftIcon={<Trash2 />} onClick={() => onDelete(movie.id)}>Delete</Button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <PaginationBar
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={ADMIN_PAGE_SIZE}
        totalItems={totalItems}
        label="movies"
        onPageChange={onPageChange}
      />
    </section>
  );
}

function UsersPanel({
  users,
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
  currentUserId,
  onRoleChange,
  onDelete,
}) {
  return (
    <section className="grid gap-[16px]">
      <TableShell headers={["Name", "Email", "Role", "Provider", "Verified", "Actions"]}>
        {users.map((item) => (
        <tr key={item.id} className="border-b border-app-border last:border-b-0">
          <td className="px-[14px] py-[12px] type-body-s text-app-text">{item.fullName}</td>
          <td className="px-[14px] py-[12px] type-body-s text-app-text-muted">{item.email}</td>
          <td className="px-[14px] py-[12px]">
            <AdminSelect value={item.role} onChange={(event) => onRoleChange(item.id, event.target.value)} disabled={item.id === currentUserId}>
              <option value="USER">USER</option>
              <option value="ADMIN">ADMIN</option>
            </AdminSelect>
          </td>
          <td className="px-[14px] py-[12px] type-body-s text-app-text-muted">{item.provider}</td>
          <td className="px-[14px] py-[12px] type-body-s text-app-text-muted">{item.emailVerified ? "Yes" : "No"}</td>
          <td className="px-[14px] py-[12px]">
            <Button size={32} variant="outline" tone="base" leftIcon={<Trash2 />} disabled={item.id === currentUserId} onClick={() => onDelete(item.id)}>
              Delete
            </Button>
          </td>
        </tr>
        ))}
      </TableShell>

      <PaginationBar
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={ADMIN_PAGE_SIZE}
        totalItems={totalItems}
        label="users"
        onPageChange={onPageChange}
      />
    </section>
  );
}

function BookingsPanel({
  bookings,
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
  onDelete,
}) {
  return (
    <section className="grid gap-[16px]">
      <TableShell headers={["Booking", "Customer", "Movie", "Schedule", "Payment", "Total", "Status", "Actions"]}>
        {bookings.map((booking) => (
        <tr key={booking.id} className="border-b border-app-border last:border-b-0">
          <td className="px-[14px] py-[12px] type-body-s text-app-text">{String(booking.id).slice(0, 8).toUpperCase()}</td>
          <td className="px-[14px] py-[12px]">
            <p className="type-body-s text-app-text">{booking.userName}</p>
            <p className="type-body-xs text-app-text-muted">{booking.userEmail}</p>
          </td>
          <td className="px-[14px] py-[12px] type-body-s text-app-text-muted">{booking.movieTitle}</td>
          <td className="px-[14px] py-[12px]">
            <p className="type-body-s text-app-text-muted">{formatDateTime(booking.startTime)}</p>
            <p className="type-body-xs text-app-text-muted">{booking.cinemaName} / {booking.roomName}</p>
          </td>
          <td className="px-[14px] py-[12px]">
            <p className="type-body-s text-app-text-muted">{formatPaymentMethod(booking.paymentMethod)}</p>
            <p className="type-body-xs text-app-text-muted">{booking.paymentStatus || "PAID"}</p>
          </td>
          <td className="px-[14px] py-[12px] type-body-s text-app-text-muted">{formatVnd(booking.totalAmount)}</td>
          <td className="px-[14px] py-[12px]">
            <StatusBadge status={booking.status} />
          </td>
          <td className="px-[14px] py-[12px]">
            <Button size={32} variant="outline" tone="base" leftIcon={<Trash2 />} onClick={() => onDelete(booking.id)}>
              Remove
            </Button>
          </td>
        </tr>
        ))}
      </TableShell>

      <PaginationBar
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={ADMIN_PAGE_SIZE}
        totalItems={totalItems}
        label="bookings"
        onPageChange={onPageChange}
      />
    </section>
  );
}

function AdminSelect({ children, className = "", ...props }) {
  return (
    <div className="relative inline-block">
      <select
        {...props}
        className={cn("admin-input appearance-none pr-[44px]", className)}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-[16px] top-1/2 h-[16px] w-[16px] -translate-y-1/2 text-app-text-muted" />
    </div>
  );
}

function TableShell({ headers, children }) {
  return (
    <div className="overflow-x-auto rounded-tk-8 border border-app-border bg-app-surface">
      <table className="w-full min-w-[900px] border-collapse text-left">
        <thead className="border-b border-app-border bg-app-background type-body-xs text-app-text-muted">
          <tr>
            {headers.map((header) => (
              <th key={header} className="px-[14px] py-[12px]">{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function PaginationBar({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  label,
  onPageChange,
}) {
  const start = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);

  return (
    <section className="flex flex-wrap items-center justify-between gap-[16px] rounded-tk-12 border border-app-border bg-app-surface p-[20px]">
      <p className="type-body-s text-app-text-muted">
        Showing {start}-{end} of {totalItems} {label}
      </p>

      <div className="flex items-center gap-[8px]">
        <Button
          size={40}
          variant="outline"
          tone="brand"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          Previous
        </Button>
        <div className="rounded-full border border-app-border px-[14px] py-[10px] type-body-s text-app-text">
          Page {currentPage} / {totalPages}
        </div>
        <Button
          size={40}
          variant="primary"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Next
        </Button>
      </div>
    </section>
  );
}

function normalizePageMeta(data) {
  return {
    totalItems: Number(data?.totalItems) || 0,
    totalPages: Math.max(1, Number(data?.totalPages) || 0),
    page: Number(data?.page) || 0,
  };
}

function formatDateTime(value) {
  if (!value) return "TBA";

  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getSortTime(value) {
  if (!value) return 0;

  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function formatPaymentMethod(value) {
  if (value === "VNPAY_QR") return "VNPAY QR";
  if (value === "MOMO_WALLET") return "MoMo Wallet";
  if (value === "DEMO_CARD") return "Demo Card";
  return value || "Demo Card";
}

function formatMovieDisplayStatus(value) {
  if (value === "SHOWING_NOW") return "Showing Now";
  if (value === "COMING_SOON") return "Coming Soon";
  return "Hidden";
}

function cleanError(error) {
  const message = error?.message || "Admin request failed.";

  if (message.includes("403")) return "You need an admin account for this action.";
  if (message.includes("booked tickets")) return "This movie has booked tickets and cannot be deleted.";
  if (message.includes("has bookings")) return "This user has bookings and cannot be deleted.";
  if (message.includes("constraint") || message.includes("violates foreign key")) {
    return "This user is still referenced by related data and cannot be deleted yet.";
  }

  return message;
}
