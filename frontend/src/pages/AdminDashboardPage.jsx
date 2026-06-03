import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart3,
  CalendarClock,
  CheckSquare,
  ChevronDown,
  CircleDollarSign,
  Download,
  EyeOff,
  Film,
  ListFilter,
  Plus,
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
  { key: "showtimes", label: "Showtimes", icon: CalendarClock },
  { key: "users", label: "Users", icon: Users },
  { key: "bookings", label: "Bookings", icon: Ticket },
];

const movieDisplayStatuses = ["SHOWING_NOW", "COMING_SOON", "HIDDEN"];
const ADMIN_PAGE_SIZE = 8;
const SHOWTIME_PAGE_SIZE = 50;
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
  const [showtimes, setShowtimes] = useState([]);
  const [movieOptions, setMovieOptions] = useState([]);
  const [roomOptions, setRoomOptions] = useState([]);
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [movieMeta, setMovieMeta] = useState(EMPTY_PAGE);
  const [showtimeMeta, setShowtimeMeta] = useState(EMPTY_PAGE);
  const [userMeta, setUserMeta] = useState(EMPTY_PAGE);
  const [bookingMeta, setBookingMeta] = useState(EMPTY_PAGE);
  const [movieQuery, setMovieQuery] = useState("");
  const [appliedMovieQuery, setAppliedMovieQuery] = useState("");
  const [showtimeFilters, setShowtimeFilters] = useState(createDefaultShowtimeFilters());
  const [editingMovieId, setEditingMovieId] = useState(null);
  const [movieDraft, setMovieDraft] = useState(null);
  const [editingShowtimeId, setEditingShowtimeId] = useState(null);
  const [showtimeDraft, setShowtimeDraft] = useState(createEmptyShowtimeDraft());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [moviePage, setMoviePage] = useState(1);
  const [showtimePage, setShowtimePage] = useState(1);
  const [userPage, setUserPage] = useState(1);
  const [bookingPage, setBookingPage] = useState(1);
  const [selectedMovieIds, setSelectedMovieIds] = useState([]);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [selectedBookingIds, setSelectedBookingIds] = useState([]);
  const [passwordDialog, setPasswordDialog] = useState(null);

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
      setSelectedMovieIds([]);
    } catch (err) {
      setError(cleanError(err));
    } finally {
      setLoading(false);
    }
  }, [appliedMovieQuery, moviePage]);

  const loadShowtimeOptions = useCallback(async () => {
    const [moviesData, roomsData] = await Promise.all([
      adminApi.getMovieOptions(),
      adminApi.getRooms(),
    ]);

    setMovieOptions(Array.isArray(moviesData) ? moviesData : []);
    setRoomOptions(Array.isArray(roomsData) ? roomsData : []);
  }, []);

  const loadShowtimesPage = useCallback(async (nextPage = showtimePage, filters = showtimeFilters) => {
    try {
      setLoading(true);
      setError("");
      const [data] = await Promise.all([
        adminApi.getShowtimes({
          page: nextPage - 1,
          size: SHOWTIME_PAGE_SIZE,
          ...filters,
        }),
        loadShowtimeOptions(),
      ]);
      setShowtimes(Array.isArray(data?.items) ? data.items : []);
      setShowtimeMeta(normalizePageMeta(data));
    } catch (err) {
      setError(cleanError(err));
    } finally {
      setLoading(false);
    }
  }, [loadShowtimeOptions, showtimeFilters, showtimePage]);

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
      setSelectedUserIds([]);
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
      setSelectedBookingIds([]);
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
      if (activeTab === "showtimes") loadShowtimesPage();
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
    loadShowtimesPage,
    loadOverviewData,
    loadUsersPage,
  ]);

  async function loadAdminData() {
    if (activeTab === "overview") await loadOverviewData();
    if (activeTab === "movies") await loadMoviesPage();
    if (activeTab === "showtimes") await loadShowtimesPage();
    if (activeTab === "users") await loadUsersPage();
    if (activeTab === "bookings") await loadBookingsPage();
  }

  async function applyShowtimeFilters(nextFilters) {
    setShowtimeFilters(nextFilters);
    setShowtimePage(1);
    await loadShowtimesPage(1, nextFilters);
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

  async function deleteSelectedMovies(password) {
    try {
      setError("");
      setMessage("");
      await adminApi.deleteMovies({ ids: selectedMovieIds, password });
      await loadMoviesPage();
      setMessage(`${selectedMovieIds.length} movies deleted.`);
      setSelectedMovieIds([]);
    } catch (err) {
      setError(cleanError(err));
      throw err;
    }
  }

  function startShowtimeCreate() {
    setEditingShowtimeId("new");
    setShowtimeDraft(createEmptyShowtimeDraft(movieOptions[0], roomOptions[0]));
  }

  function startShowtimeEdit(showtime) {
    setEditingShowtimeId(showtime.id);
    setShowtimeDraft({
      movieId: showtime.movieId || "",
      roomId: showtime.roomId || "",
      startTime: toDateTimeLocalValue(showtime.startTime),
      endTime: toDateTimeLocalValue(showtime.endTime),
      price: showtime.price || "",
    });
  }

  async function saveShowtime() {
    try {
      setError("");
      setMessage("");

      const payload = {
        movieId: showtimeDraft.movieId,
        roomId: showtimeDraft.roomId,
        startTime: showtimeDraft.startTime || null,
        endTime: showtimeDraft.endTime || null,
        price: showtimeDraft.price === "" ? null : Number(showtimeDraft.price),
      };

      if (editingShowtimeId === "new") {
        await adminApi.createShowtime(payload);
        setMessage("Showtime created.");
      } else {
        await adminApi.updateShowtime(editingShowtimeId, payload);
        setMessage("Showtime updated.");
      }

      setEditingShowtimeId(null);
      setShowtimeDraft(createEmptyShowtimeDraft());
      await loadShowtimesPage();
    } catch (err) {
      setError(cleanError(err));
    }
  }

  async function deleteShowtime(showtimeId) {
    try {
      setError("");
      setMessage("");
      await adminApi.deleteShowtime(showtimeId);
      await loadShowtimesPage();
      setMessage("Showtime deleted.");
    } catch (err) {
      setError(cleanError(err));
    }
  }

  async function previewBulkShowtimes(data) {
    return adminApi.createShowtimesBulk({ ...data, previewOnly: true });
  }

  async function createBulkShowtimes(data) {
    try {
      setError("");
      setMessage("");
      const result = await adminApi.createShowtimesBulk({ ...data, previewOnly: false });
      await loadShowtimesPage(1);
      setShowtimePage(1);
      setMessage(`Created ${result.createdCount} showtimes. ${result.conflictCount} conflicts skipped.`);
      return result;
    } catch (err) {
      setError(cleanError(err));
      throw err;
    }
  }

  async function cleanupExpiredShowtimes(password) {
    try {
      setError("");
      setMessage("");
      const result = await adminApi.deleteExpiredUnbookedShowtimes({
        password,
        before: new Date().toISOString().slice(0, 19),
      });
      await loadShowtimesPage(1);
      setShowtimePage(1);
      setMessage(`Deleted ${result.createdCount} expired unbooked showtimes.`);
    } catch (err) {
      setError(cleanError(err));
      throw err;
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

  async function deleteSelectedUsers(password) {
    try {
      setError("");
      setMessage("");
      await adminApi.deleteUsers({ ids: selectedUserIds, password });
      await loadUsersPage();
      setMessage(`${selectedUserIds.length} users deleted.`);
      setSelectedUserIds([]);
    } catch (err) {
      setError(cleanError(err));
      throw err;
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

  async function deleteSelectedBookings(password) {
    try {
      setError("");
      setMessage("");
      await adminApi.deleteBookings({ ids: selectedBookingIds, password });
      await loadBookingsPage();
      setMessage(`${selectedBookingIds.length} bookings removed.`);
      setSelectedBookingIds([]);
    } catch (err) {
      setError(cleanError(err));
      throw err;
    }
  }

  function openPasswordDialog({ title, description, confirmLabel, onConfirm }) {
    setPasswordDialog({ title, description, confirmLabel, onConfirm });
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
            selectedIds={selectedMovieIds}
            onSelectedIdsChange={setSelectedMovieIds}
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
            onBulkDelete={() => openPasswordDialog({
              title: "Delete selected movies",
              description: `This will delete ${selectedMovieIds.length} selected movies after verifying your admin password.`,
              confirmLabel: "Delete Movies",
              onConfirm: deleteSelectedMovies,
            })}
            onImport={() => navigate("/admin/imports")}
          />
        )}

        {activeTab === "showtimes" && (
          <ShowtimesPanel
            showtimes={showtimes}
            movieOptions={movieOptions}
            roomOptions={roomOptions}
            filters={showtimeFilters}
            onApplyFilters={applyShowtimeFilters}
            currentPage={showtimePage}
            totalPages={showtimeMeta.totalPages}
            totalItems={showtimeMeta.totalItems}
            onPageChange={setShowtimePage}
            editingShowtimeId={editingShowtimeId}
            showtimeDraft={showtimeDraft}
            onDraftChange={setShowtimeDraft}
            onCreate={startShowtimeCreate}
            onEdit={startShowtimeEdit}
            onSave={saveShowtime}
            onCancel={() => {
              setEditingShowtimeId(null);
              setShowtimeDraft(createEmptyShowtimeDraft());
            }}
            onDelete={deleteShowtime}
            onPreviewBulk={previewBulkShowtimes}
            onCreateBulk={createBulkShowtimes}
            onCleanupExpired={() => openPasswordDialog({
              title: "Delete expired unbooked showtimes",
              description: "This will delete expired showtimes that have no tickets after verifying your admin password.",
              confirmLabel: "Delete Expired",
              onConfirm: cleanupExpiredShowtimes,
            })}
          />
        )}

        {activeTab === "users" && (
          <UsersPanel
            users={users}
            selectedIds={selectedUserIds}
            onSelectedIdsChange={setSelectedUserIds}
            currentPage={userPage}
            totalPages={userMeta.totalPages}
            totalItems={userMeta.totalItems}
            onPageChange={setUserPage}
            currentUserId={user?.userId}
            onRoleChange={updateUserRole}
            onDelete={deleteUser}
            onBulkDelete={() => openPasswordDialog({
              title: "Delete selected users",
              description: `This will delete ${selectedUserIds.length} selected users after verifying your admin password.`,
              confirmLabel: "Delete Users",
              onConfirm: deleteSelectedUsers,
            })}
          />
        )}

        {activeTab === "bookings" && (
          <BookingsPanel
            bookings={bookings}
            selectedIds={selectedBookingIds}
            onSelectedIdsChange={setSelectedBookingIds}
            currentPage={bookingPage}
            totalPages={bookingMeta.totalPages}
            totalItems={bookingMeta.totalItems}
            onPageChange={setBookingPage}
            onDelete={deleteBooking}
            onBulkDelete={() => openPasswordDialog({
              title: "Remove selected bookings",
              description: `This will remove ${selectedBookingIds.length} selected bookings after verifying your admin password.`,
              confirmLabel: "Remove Bookings",
              onConfirm: deleteSelectedBookings,
            })}
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

        {passwordDialog && (
          <PasswordConfirmDialog
            {...passwordDialog}
            onClose={() => setPasswordDialog(null)}
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
                      <td className="px-[12px] py-[12px]">
                        <p className="type-body-s text-app-text-muted">{formatVnd(booking.totalAmount)}</p>
                        <FoodItemSummary foodItems={booking.foodItems} />
                      </td>
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
  selectedIds,
  onSelectedIdsChange,
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
  onBulkDelete,
  onImport,
}) {
  const selectableIds = movies.map((movie) => movie.id);

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

      <BulkActionBar
        selectedCount={selectedIds.length}
        itemLabel="movies"
        onClear={() => onSelectedIdsChange([])}
        onDelete={onBulkDelete}
      />

      <div className="overflow-x-auto rounded-tk-8 border border-app-border bg-app-surface">
        <table className="w-full min-w-[980px] border-collapse text-left">
          <thead className="border-b border-app-border bg-app-background type-body-xs text-app-text-muted">
            <tr>
              <th className="px-[14px] py-[12px]">
                <SelectionCheckbox
                  checked={isAllSelected(selectableIds, selectedIds)}
                  disabled={selectableIds.length === 0}
                  onChange={() => toggleAll(selectableIds, selectedIds, onSelectedIdsChange)}
                  label="Select all movies"
                />
              </th>
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
                <td className="px-[14px] py-[12px] align-top">
                  <SelectionCheckbox
                    checked={selectedIds.includes(movie.id)}
                    onChange={() => toggleSelected(movie.id, selectedIds, onSelectedIdsChange)}
                    label={`Select ${movie.title}`}
                  />
                </td>
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
  selectedIds,
  onSelectedIdsChange,
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
  currentUserId,
  onRoleChange,
  onDelete,
  onBulkDelete,
}) {
  const selectableIds = users
    .filter((item) => item.id !== currentUserId)
    .map((item) => item.id);

  return (
    <section className="grid gap-[16px]">
      <BulkActionBar
        selectedCount={selectedIds.length}
        itemLabel="users"
        onClear={() => onSelectedIdsChange([])}
        onDelete={onBulkDelete}
      />

      <TableShell
        headers={[
          <SelectionCheckbox
            key="select-users"
            checked={isAllSelected(selectableIds, selectedIds)}
            disabled={selectableIds.length === 0}
            onChange={() => toggleAll(selectableIds, selectedIds, onSelectedIdsChange)}
            label="Select all users"
          />,
          "Name",
          "Email",
          "Role",
          "Provider",
          "Verified",
          "Actions",
        ]}
      >
        {users.map((item) => (
        <tr key={item.id} className="border-b border-app-border last:border-b-0">
          <td className="px-[14px] py-[12px]">
            <SelectionCheckbox
              checked={selectedIds.includes(item.id)}
              disabled={item.id === currentUserId}
              onChange={() => toggleSelected(item.id, selectedIds, onSelectedIdsChange)}
              label={`Select ${item.fullName}`}
            />
          </td>
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
  selectedIds,
  onSelectedIdsChange,
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
  onDelete,
  onBulkDelete,
}) {
  const selectableIds = bookings.map((booking) => booking.id);

  return (
    <section className="grid gap-[16px]">
      <BulkActionBar
        selectedCount={selectedIds.length}
        itemLabel="bookings"
        onClear={() => onSelectedIdsChange([])}
        onDelete={onBulkDelete}
      />

      <TableShell
        headers={[
          <SelectionCheckbox
            key="select-bookings"
            checked={isAllSelected(selectableIds, selectedIds)}
            disabled={selectableIds.length === 0}
            onChange={() => toggleAll(selectableIds, selectedIds, onSelectedIdsChange)}
            label="Select all bookings"
          />,
          "Booking",
          "Customer",
          "Movie",
          "Schedule",
          "Payment",
          "Total",
          "Status",
          "Actions",
        ]}
      >
        {bookings.map((booking) => (
        <tr key={booking.id} className="border-b border-app-border last:border-b-0">
          <td className="px-[14px] py-[12px]">
            <SelectionCheckbox
              checked={selectedIds.includes(booking.id)}
              onChange={() => toggleSelected(booking.id, selectedIds, onSelectedIdsChange)}
              label={`Select booking ${String(booking.id).slice(0, 8).toUpperCase()}`}
            />
          </td>
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
          <td className="px-[14px] py-[12px]">
            <p className="type-body-s text-app-text-muted">{formatVnd(booking.totalAmount)}</p>
            <FoodItemSummary foodItems={booking.foodItems} />
          </td>
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

function ShowtimesPanel({
  showtimes,
  movieOptions,
  roomOptions,
  filters,
  onApplyFilters,
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
  editingShowtimeId,
  showtimeDraft,
  onDraftChange,
  onCreate,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  onPreviewBulk,
  onCreateBulk,
  onCleanupExpired,
}) {
  const isEditing = Boolean(editingShowtimeId);
  const [filterDraft, setFilterDraft] = useState(filters);
  const [builderDraft, setBuilderDraft] = useState(createDefaultScheduleBuilder(movieOptions[0], roomOptions[0]));
  const [bulkPreview, setBulkPreview] = useState(null);
  const groupedShowtimes = groupShowtimes(showtimes);
  const cinemaOptions = getCinemaOptions(roomOptions);

  async function handlePreviewBuilder() {
    try {
      const preview = await onPreviewBulk(toBulkPayload(builderDraft));
      setBulkPreview(preview);
    } catch {
      setBulkPreview(null);
    }
  }

  async function handleCreateBuilder() {
    try {
      const result = await onCreateBulk(toBulkPayload(builderDraft));
      setBulkPreview(result);
    } catch {
      setBulkPreview(null);
    }
  }

  return (
    <section className="grid gap-[16px]">
      <div className="flex flex-wrap items-center justify-between gap-[12px] rounded-tk-8 border border-app-border bg-app-surface p-[14px]">
        <div>
          <h2 className="type-h5 text-app-text">Showtime Editor</h2>
          <p className="type-body-xs mt-[4px] text-app-text-muted">
            Filter schedules, generate batches, and clean expired unbooked rows.
          </p>
        </div>
        <div className="flex flex-wrap gap-[8px]">
          <Button size={40} variant="outline" tone="base" leftIcon={<Trash2 />} onClick={onCleanupExpired}>
            Clean Expired
          </Button>
          <Button
            size={40}
            leftIcon={<Plus />}
            onClick={onCreate}
            disabled={isEditing || movieOptions.length === 0 || roomOptions.length === 0}
          >
            Single Showtime
          </Button>
        </div>
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          onApplyFilters(filterDraft);
        }}
        className="grid gap-[12px] rounded-tk-8 border border-app-border bg-app-surface p-[14px] lg:grid-cols-6"
      >
        <AdminSelect value={filterDraft.movieId} onChange={(event) => setFilterDraft({ ...filterDraft, movieId: event.target.value })} className="w-full">
          <option value="">All movies</option>
          {movieOptions.map((movie) => (
            <option key={movie.id} value={movie.id}>{movie.title}</option>
          ))}
        </AdminSelect>
        <AdminSelect
          value={filterDraft.cinemaId}
          onChange={(event) => setFilterDraft({ ...filterDraft, cinemaId: event.target.value, roomId: "" })}
          className="w-full"
        >
          <option value="">All cinemas</option>
          {cinemaOptions.map((cinema) => (
            <option key={cinema.id} value={cinema.id}>{cinema.name}</option>
          ))}
        </AdminSelect>
        <AdminSelect value={filterDraft.roomId} onChange={(event) => setFilterDraft({ ...filterDraft, roomId: event.target.value })} className="w-full">
          <option value="">All rooms</option>
          {roomOptions
            .filter((room) => !filterDraft.cinemaId || room.cinemaId === filterDraft.cinemaId)
            .map((room) => (
              <option key={room.id} value={room.id}>{room.cinemaName} / {room.name}</option>
            ))}
        </AdminSelect>
        <input type="date" className="admin-input" value={filterDraft.fromDate} onChange={(event) => setFilterDraft({ ...filterDraft, fromDate: event.target.value })} />
        <input type="date" className="admin-input" value={filterDraft.toDate} onChange={(event) => setFilterDraft({ ...filterDraft, toDate: event.target.value })} />
        <div className="flex items-center gap-[8px]">
          <label className="flex items-center gap-[8px] type-body-xs text-app-text-muted">
            <input
              type="checkbox"
              checked={filterDraft.includeExpired}
              onChange={(event) => setFilterDraft({ ...filterDraft, includeExpired: event.target.checked })}
              className="admin-checkbox"
            />
            Expired
          </label>
          <Button type="submit" size={40} leftIcon={<ListFilter />}>Apply</Button>
        </div>
      </form>

      <section className="rounded-tk-8 border border-app-border bg-app-surface p-[14px]">
        <div className="mb-[14px] flex flex-wrap items-center justify-between gap-[12px]">
          <div>
            <h3 className="type-h5 text-app-text">Schedule Builder</h3>
            <p className="type-body-xs mt-[4px] text-app-text-muted">
              Generate repeated showtimes across rooms, dates, and start times.
            </p>
          </div>
          <div className="flex gap-[8px]">
            <Button size={40} variant="outline" tone="base" onClick={handlePreviewBuilder}>Preview</Button>
            <Button size={40} onClick={handleCreateBuilder}>Create Batch</Button>
          </div>
        </div>

        <div className="grid gap-[12px] lg:grid-cols-6">
          <AdminSelect value={builderDraft.movieId} onChange={(event) => setBuilderDraft({ ...builderDraft, movieId: event.target.value })} className="w-full lg:col-span-2">
            <option value="">Select movie</option>
            {movieOptions.map((movie) => (
              <option key={movie.id} value={movie.id}>{movie.title}</option>
            ))}
          </AdminSelect>
          <input type="date" className="admin-input" value={builderDraft.startDate} onChange={(event) => setBuilderDraft({ ...builderDraft, startDate: event.target.value })} />
          <input type="date" className="admin-input" value={builderDraft.endDate} onChange={(event) => setBuilderDraft({ ...builderDraft, endDate: event.target.value })} />
          <input className="admin-input" value={builderDraft.startTimesText} onChange={(event) => setBuilderDraft({ ...builderDraft, startTimesText: event.target.value })} placeholder="09:30, 12:15, 21:45" />
          <input type="number" min="0" step="1000" className="admin-input" value={builderDraft.price} onChange={(event) => setBuilderDraft({ ...builderDraft, price: event.target.value })} />
        </div>

        <div className="mt-[12px] grid gap-[8px] md:grid-cols-2 xl:grid-cols-3">
          {roomOptions.map((room) => (
            <label key={room.id} className="flex items-center gap-[8px] rounded-tk-4 border border-app-border bg-app-background px-[10px] py-[8px] type-body-xs text-app-text-muted">
              <input
                type="checkbox"
                checked={builderDraft.roomIds.includes(room.id)}
                onChange={() => setBuilderDraft({
                  ...builderDraft,
                  roomIds: toggleArrayValue(builderDraft.roomIds, room.id),
                })}
                className="admin-checkbox"
              />
              {room.cinemaName} / {room.name}
            </label>
          ))}
        </div>

        {bulkPreview && (
          <div className="mt-[12px] rounded-tk-4 border border-app-border bg-app-background p-[12px]">
            <p className="type-body-s text-app-text">
              {bulkPreview.candidateCount} candidates, {bulkPreview.createdCount} created, {bulkPreview.conflictCount} conflicts.
            </p>
            {bulkPreview.conflicts?.length > 0 && (
              <p className="type-body-xs mt-[6px] text-app-text-muted">
                First conflict: {bulkPreview.conflicts[0].cinemaName} / {bulkPreview.conflicts[0].roomName} at {formatDateTime(bulkPreview.conflicts[0].startTime)}
              </p>
            )}
          </div>
        )}
      </section>

      {editingShowtimeId === "new" && (
        <ShowtimeEditorRow
          movieOptions={movieOptions}
          roomOptions={roomOptions}
          draft={showtimeDraft}
          onDraftChange={onDraftChange}
          onSave={onSave}
          onCancel={onCancel}
          mode="create"
        />
      )}

      <div className="grid gap-[14px]">
        {groupedShowtimes.map((dayGroup) => (
          <section key={dayGroup.dateKey} className="rounded-tk-8 border border-app-border bg-app-surface p-[14px]">
            <h3 className="type-h5 text-app-text">{dayGroup.label}</h3>
            <div className="mt-[12px] grid gap-[12px]">
              {dayGroup.cinemas.map((cinemaGroup) => (
                <div key={cinemaGroup.name} className="rounded-tk-4 border border-app-border bg-app-background p-[12px]">
                  <p className="type-body-s font-bold text-app-text">{cinemaGroup.name}</p>
                  <div className="mt-[10px] grid gap-[10px]">
                    {cinemaGroup.rooms.map((roomGroup) => (
                      <div key={roomGroup.name}>
                        <p className="type-label-s mb-[6px] text-app-text-muted">{roomGroup.name}</p>
                        <div className="grid gap-[8px] md:grid-cols-2 xl:grid-cols-3">
                          {roomGroup.items.map((showtime) => (
                            <ShowtimeCard
                              key={showtime.id}
                              showtime={showtime}
                              isEditing={editingShowtimeId === showtime.id}
                              editingDisabled={isEditing && editingShowtimeId !== showtime.id}
                              movieOptions={movieOptions}
                              roomOptions={roomOptions}
                              draft={showtimeDraft}
                              onDraftChange={onDraftChange}
                              onEdit={onEdit}
                              onSave={onSave}
                              onCancel={onCancel}
                              onDelete={onDelete}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
        {groupedShowtimes.length === 0 && (
          <DashboardEmptyState text="No showtimes match the current filters." />
        )}
      </div>

      <PaginationBar
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={SHOWTIME_PAGE_SIZE}
        totalItems={totalItems}
        label="showtimes"
        onPageChange={onPageChange}
      />
    </section>
  );
}

function ShowtimeEditorRow({
  movieOptions,
  roomOptions,
  draft,
  onDraftChange,
  onSave,
  onCancel,
}) {
  return (
    <div className="overflow-x-auto rounded-tk-8 border border-app-border bg-app-surface">
      <table className="w-full min-w-[900px] border-collapse text-left">
        <thead className="border-b border-app-border bg-app-background type-body-xs text-app-text-muted">
          <tr>
            {["Movie", "Cinema / Room", "Start", "End", "Price", "Tickets", "Actions"].map((header) => (
              <th key={header} className="px-[14px] py-[12px]">{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <ShowtimeEditorCells
              movieOptions={movieOptions}
              roomOptions={roomOptions}
              draft={draft}
              onDraftChange={onDraftChange}
            />
            <td className="px-[14px] py-[12px]">
              <div className="flex gap-[8px]">
                <Button size={32} leftIcon={<Save />} onClick={onSave}>Create</Button>
                <Button size={32} variant="outline" tone="base" onClick={onCancel}>Cancel</Button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function ShowtimeCard({
  showtime,
  isEditing,
  editingDisabled,
  movieOptions,
  roomOptions,
  draft,
  onDraftChange,
  onEdit,
  onSave,
  onCancel,
  onDelete,
}) {
  if (isEditing) {
    return (
      <div className="rounded-tk-4 border border-primary-600 bg-app-surface p-[12px]">
        <div className="grid gap-[8px]">
          <AdminSelect value={draft.movieId} onChange={(event) => onDraftChange({ ...draft, movieId: event.target.value })} className="w-full">
            {movieOptions.map((movie) => (
              <option key={movie.id} value={movie.id}>{movie.title}</option>
            ))}
          </AdminSelect>
          <AdminSelect value={draft.roomId} onChange={(event) => onDraftChange({ ...draft, roomId: event.target.value })} className="w-full">
            {roomOptions.map((room) => (
              <option key={room.id} value={room.id}>{room.cinemaName} / {room.name}</option>
            ))}
          </AdminSelect>
          <div className="grid gap-[8px] sm:grid-cols-2">
            <input type="datetime-local" className="admin-input" value={draft.startTime} onChange={(event) => onDraftChange({ ...draft, startTime: event.target.value })} />
            <input type="datetime-local" className="admin-input" value={draft.endTime} onChange={(event) => onDraftChange({ ...draft, endTime: event.target.value })} />
          </div>
          <input type="number" min="0" step="1000" className="admin-input" value={draft.price} onChange={(event) => onDraftChange({ ...draft, price: event.target.value })} />
          <div className="flex gap-[8px]">
            <Button size={32} leftIcon={<Save />} onClick={onSave}>Save</Button>
            <Button size={32} variant="outline" tone="base" onClick={onCancel}>Cancel</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <article className="rounded-tk-4 border border-app-border bg-app-surface p-[12px]">
      <div className="flex items-start justify-between gap-[12px]">
        <div>
          <p className="type-body-s font-bold text-app-text">{formatTimeOnly(showtime.startTime)} - {showtime.movieTitle}</p>
          <p className="type-body-xs mt-[4px] text-app-text-muted">
            Ends {formatTimeOnly(showtime.endTime)} / {formatVnd(showtime.price)}
          </p>
          <p className="type-body-xs mt-[4px] text-app-text-subtle">{showtime.ticketCount || 0} tickets</p>
        </div>
        <div className="flex shrink-0 gap-[6px]">
          <Button size={32} variant="outline" tone="base" disabled={editingDisabled} onClick={() => onEdit(showtime)}>Edit</Button>
          <Button
            size={32}
            variant="outline"
            tone="base"
            leftIcon={<Trash2 />}
            disabled={editingDisabled || Number(showtime.ticketCount) > 0}
            onClick={() => onDelete(showtime.id)}
          >
            Delete
          </Button>
        </div>
      </div>
    </article>
  );
}

function ShowtimeEditorCells({
  movieOptions,
  roomOptions,
  draft,
  onDraftChange,
}) {
  return (
    <>
      <td className="px-[14px] py-[12px]">
        <AdminSelect
          value={draft.movieId}
          onChange={(event) => {
            const movie = movieOptions.find((item) => item.id === event.target.value);
            onDraftChange({
              ...draft,
              movieId: event.target.value,
              endTime: inferEndTime(draft.startTime, movie?.durationMinutes) || draft.endTime,
            });
          }}
          className="max-w-[220px]"
        >
          <option value="">Select movie</option>
          {movieOptions.map((movie) => (
            <option key={movie.id} value={movie.id}>{movie.title}</option>
          ))}
        </AdminSelect>
      </td>
      <td className="px-[14px] py-[12px]">
        <AdminSelect
          value={draft.roomId}
          onChange={(event) => onDraftChange({ ...draft, roomId: event.target.value })}
          className="max-w-[220px]"
        >
          <option value="">Select room</option>
          {roomOptions.map((room) => (
            <option key={room.id} value={room.id}>
              {room.cinemaName} / {room.name}
            </option>
          ))}
        </AdminSelect>
      </td>
      <td className="px-[14px] py-[12px]">
        <input
          type="datetime-local"
          className="admin-input"
          value={draft.startTime}
          onChange={(event) => {
            const movie = movieOptions.find((item) => item.id === draft.movieId);
            onDraftChange({
              ...draft,
              startTime: event.target.value,
              endTime: inferEndTime(event.target.value, movie?.durationMinutes) || draft.endTime,
            });
          }}
        />
      </td>
      <td className="px-[14px] py-[12px]">
        <input
          type="datetime-local"
          className="admin-input"
          value={draft.endTime}
          onChange={(event) => onDraftChange({ ...draft, endTime: event.target.value })}
        />
      </td>
      <td className="px-[14px] py-[12px]">
        <input
          type="number"
          min="0"
          step="1000"
          className="admin-input w-[130px]"
          value={draft.price}
          onChange={(event) => onDraftChange({ ...draft, price: event.target.value })}
        />
      </td>
      <td className="px-[14px] py-[12px] type-body-s text-app-text-muted">-</td>
    </>
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

function BulkActionBar({ selectedCount, itemLabel, onClear, onDelete }) {
  if (selectedCount === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-[12px] rounded-tk-8 border border-primary-600 bg-app-surface p-[14px]">
      <div className="flex items-center gap-[10px]">
        <CheckSquare className="h-[18px] w-[18px] text-brand" />
        <p className="type-body-s text-app-text">
          {selectedCount} {itemLabel} selected
        </p>
      </div>

      <div className="flex gap-[8px]">
        <Button size={32} variant="outline" tone="base" onClick={onClear}>
          Clear
        </Button>
        <Button size={32} variant="outline" tone="base" leftIcon={<Trash2 />} onClick={onDelete}>
          Delete Selected
        </Button>
      </div>
    </div>
  );
}

function SelectionCheckbox({ checked, disabled = false, onChange, label }) {
  return (
    <label className={cn("inline-flex h-[20px] w-[20px] items-center justify-center", disabled && "opacity-40")}>
      <span className="sr-only">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        className="admin-checkbox"
      />
    </label>
  );
}

function PasswordConfirmDialog({ title, description, confirmLabel, onConfirm, onClose }) {
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setSubmitting(true);
      setError("");
      await onConfirm(password);
      onClose();
    } catch (err) {
      setError(cleanError(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-[20px]" role="dialog" aria-modal="true">
      <form onSubmit={handleSubmit} className="w-full max-w-[440px] rounded-tk-8 border border-app-border bg-app-surface p-[24px] shadow-2xl">
        <h2 className="type-h5 text-app-text">{title}</h2>
        <p className="type-body-s mt-[8px] text-app-text-muted">{description}</p>

        <label className="mt-[18px] block">
          <span className="type-label-s text-app-text-muted">Admin password</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoFocus
            className="admin-input mt-[6px] w-full"
          />
        </label>

        {error && (
          <p className="type-body-xs mt-[10px] text-error-500">{error}</p>
        )}

        <div className="mt-[20px] flex justify-end gap-[8px]">
          <Button type="button" size={40} variant="outline" tone="base" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size={40} leftIcon={<Trash2 />} disabled={submitting || !password}>
            {submitting ? "Checking..." : confirmLabel}
          </Button>
        </div>
      </form>
    </div>
  );
}

function TableShell({ headers, children }) {
  return (
    <div className="overflow-x-auto rounded-tk-8 border border-app-border bg-app-surface">
      <table className="w-full min-w-[900px] border-collapse text-left">
        <thead className="border-b border-app-border bg-app-background type-body-xs text-app-text-muted">
          <tr>
            {headers.map((header, index) => (
              <th key={typeof header === "string" ? header : index} className="px-[14px] py-[12px]">{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function isAllSelected(selectableIds, selectedIds) {
  return selectableIds.length > 0 && selectableIds.every((id) => selectedIds.includes(id));
}

function toggleAll(selectableIds, selectedIds, onSelectedIdsChange) {
  if (isAllSelected(selectableIds, selectedIds)) {
    onSelectedIdsChange((current) => current.filter((id) => !selectableIds.includes(id)));
    return;
  }

  onSelectedIdsChange((current) => Array.from(new Set([...current, ...selectableIds])));
}

function toggleSelected(id, selectedIds, onSelectedIdsChange) {
  onSelectedIdsChange(
    selectedIds.includes(id)
      ? selectedIds.filter((selectedId) => selectedId !== id)
      : [...selectedIds, id]
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

function createEmptyShowtimeDraft(movie, room) {
  return {
    movieId: movie?.id || "",
    roomId: room?.id || "",
    startTime: "",
    endTime: "",
    price: 120000,
  };
}

function createDefaultShowtimeFilters() {
  const today = new Date();
  const endDate = new Date(today);
  endDate.setDate(today.getDate() + 14);

  return {
    movieId: "",
    cinemaId: "",
    roomId: "",
    fromDate: toDateInputValue(today),
    toDate: toDateInputValue(endDate),
    includeExpired: false,
  };
}

function createDefaultScheduleBuilder(movie, room) {
  const today = new Date();
  const endDate = new Date(today);
  endDate.setDate(today.getDate() + 6);

  return {
    movieId: movie?.id || "",
    roomIds: room?.id ? [room.id] : [],
    startDate: toDateInputValue(today),
    endDate: toDateInputValue(endDate),
    startTimesText: "09:30, 12:15, 15:00, 18:30, 21:45",
    price: 105000,
  };
}

function toBulkPayload(draft) {
  return {
    movieId: draft.movieId || null,
    roomIds: draft.roomIds,
    startDate: draft.startDate || null,
    endDate: draft.endDate || null,
    startTimes: draft.startTimesText
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
    price: draft.price === "" ? null : Number(draft.price),
  };
}

function toDateInputValue(value) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function toDateTimeLocalValue(value) {
  if (!value) {
    return "";
  }

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      return "";
    }

    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    const hours = String(value.getHours()).padStart(2, "0");
    const minutes = String(value.getMinutes()).padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  return String(value).slice(0, 16);
}

function formatTimeOnly(value) {
  if (!value) return "TBA";

  return new Date(value).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function groupShowtimes(showtimes) {
  const dayMap = new Map();

  showtimes.forEach((showtime) => {
    const date = new Date(showtime.startTime);
    const dateKey = Number.isNaN(date.getTime())
      ? "TBA"
      : date.toISOString().slice(0, 10);
    const dayLabel = Number.isNaN(date.getTime())
      ? "TBA"
      : date.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
        });

    if (!dayMap.has(dateKey)) {
      dayMap.set(dateKey, { dateKey, label: dayLabel, cinemaMap: new Map() });
    }

    const dayGroup = dayMap.get(dateKey);
    const cinemaName = showtime.cinemaName || "Unknown cinema";

    if (!dayGroup.cinemaMap.has(cinemaName)) {
      dayGroup.cinemaMap.set(cinemaName, { name: cinemaName, roomMap: new Map() });
    }

    const cinemaGroup = dayGroup.cinemaMap.get(cinemaName);
    const roomName = showtime.roomName || "Unknown room";

    if (!cinemaGroup.roomMap.has(roomName)) {
      cinemaGroup.roomMap.set(roomName, { name: roomName, items: [] });
    }

    cinemaGroup.roomMap.get(roomName).items.push(showtime);
  });

  return Array.from(dayMap.values()).map((dayGroup) => ({
    dateKey: dayGroup.dateKey,
    label: dayGroup.label,
    cinemas: Array.from(dayGroup.cinemaMap.values()).map((cinemaGroup) => ({
      name: cinemaGroup.name,
      rooms: Array.from(cinemaGroup.roomMap.values()).map((roomGroup) => ({
        ...roomGroup,
        items: roomGroup.items.sort((left, right) => getSortTime(left.startTime) - getSortTime(right.startTime)),
      })),
    })),
  }));
}

function getCinemaOptions(roomOptions) {
  const cinemaMap = new Map();

  roomOptions.forEach((room) => {
    if (room.cinemaId && !cinemaMap.has(room.cinemaId)) {
      cinemaMap.set(room.cinemaId, { id: room.cinemaId, name: room.cinemaName });
    }
  });

  return Array.from(cinemaMap.values()).sort((left, right) => left.name.localeCompare(right.name));
}

function toggleArrayValue(values, value) {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}

function inferEndTime(startTime, durationMinutes) {
  if (!startTime || !durationMinutes) {
    return "";
  }

  const startDate = new Date(startTime);

  if (Number.isNaN(startDate.getTime())) {
    return "";
  }

  startDate.setMinutes(startDate.getMinutes() + Number(durationMinutes));
  return toDateTimeLocalValue(startDate);
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
  if (value === "DEMO_CARD") return "Demo Card";
  return value || "Demo Card";
}

function FoodItemSummary({ foodItems }) {
  if (!Array.isArray(foodItems) || foodItems.length === 0) {
    return null;
  }

  return (
    <p className="type-body-xs mt-[3px] max-w-[180px] text-app-text-subtle">
      {foodItems.map((item) => `${item.quantity}x ${item.name}`).join(", ")}
    </p>
  );
}

function formatMovieDisplayStatus(value) {
  if (value === "SHOWING_NOW") return "Showing Now";
  if (value === "COMING_SOON") return "Coming Soon";
  return "Hidden";
}

function cleanError(error) {
  const message = error?.message || "Admin request failed.";

  if (message.includes("403")) return "You need an admin account for this action.";
  if (message.includes("Admin password")) return "Admin password is incorrect.";
  if (message.includes("Showtime has booked tickets")) return "This showtime has booked tickets and cannot be deleted.";
  if (message.includes("booked tickets")) return "This movie has booked tickets and cannot be deleted.";
  if (message.includes("Room already has a showtime")) return "That room already has a showtime in this time range.";
  if (message.includes("has bookings")) return "This user has bookings and cannot be deleted.";
  if (message.includes("constraint") || message.includes("violates foreign key")) {
    return "This user is still referenced by related data and cannot be deleted yet.";
  }

  return message;
}
