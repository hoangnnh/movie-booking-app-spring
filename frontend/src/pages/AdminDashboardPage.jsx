import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart3,
  Download,
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

const bookingStatuses = ["PENDING", "CONFIRMED", "CANCELLED", "EXPIRED"];
const ADMIN_PAGE_SIZE = 8;

export default function AdminDashboardPage({ onRequireAuth }) {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [summary, setSummary] = useState(null);
  const [movies, setMovies] = useState([]);
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [movieQuery, setMovieQuery] = useState("");
  const [editingMovieId, setEditingMovieId] = useState(null);
  const [movieDraft, setMovieDraft] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [moviePage, setMoviePage] = useState(1);
  const [userPage, setUserPage] = useState(1);
  const [bookingPage, setBookingPage] = useState(1);

  const isAdmin = user?.role === "ADMIN";
  const paginatedMovies = usePaginatedItems(movies, moviePage, ADMIN_PAGE_SIZE);
  const paginatedUsers = usePaginatedItems(users, userPage, ADMIN_PAGE_SIZE);
  const paginatedBookings = usePaginatedItems(bookings, bookingPage, ADMIN_PAGE_SIZE);

  async function loadAdminData() {
    try {
      setLoading(true);
      setError("");
      const [summaryData, movieData, userData, bookingData] = await Promise.all([
        adminApi.getSummary(),
        adminApi.getMovies(movieQuery),
        adminApi.getUsers(),
        adminApi.getBookings(),
      ]);

      setSummary(summaryData);
      setMovies(Array.isArray(movieData) ? movieData : []);
      setUsers(Array.isArray(userData) ? userData : []);
      setBookings(Array.isArray(bookingData) ? bookingData : []);
      setMoviePage(1);
      setUserPage(1);
      setBookingPage(1);
    } catch (err) {
      setError(cleanError(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      return undefined;
    }

    let ignore = false;

    async function loadInitialAdminData() {
      try {
        setLoading(true);
        setError("");
        const [summaryData, movieData, userData, bookingData] = await Promise.all([
          adminApi.getSummary(),
          adminApi.getMovies(),
          adminApi.getUsers(),
          adminApi.getBookings(),
        ]);

        if (!ignore) {
          setSummary(summaryData);
          setMovies(Array.isArray(movieData) ? movieData : []);
          setUsers(Array.isArray(userData) ? userData : []);
          setBookings(Array.isArray(bookingData) ? bookingData : []);
        }
      } catch (err) {
        if (!ignore) {
          setError(cleanError(err));
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadInitialAdminData();

    return () => {
      ignore = true;
    };
  }, [isAuthenticated, isAdmin]);

  async function searchMovies(event) {
    event.preventDefault();
    try {
      setLoading(true);
      setError("");
      const data = await adminApi.getMovies(movieQuery.trim());
      setMovies(Array.isArray(data) ? data : []);
      setMoviePage(1);
    } catch (err) {
      setError(cleanError(err));
    } finally {
      setLoading(false);
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
      setMovies((current) => current.filter((movie) => movie.id !== movieId));
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
      setUsers((current) => current.filter((item) => item.id !== userId));
      setMessage("User deleted.");
    } catch (err) {
      setError(cleanError(err));
    }
  }

  async function updateBookingStatus(bookingId, status) {
    try {
      setError("");
      const updated = await adminApi.updateBookingStatus(bookingId, status);
      setBookings((current) =>
        current.map((booking) => (booking.id === bookingId ? updated : booking))
      );
      setMessage("Booking status updated.");
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
            currentPage={paginatedMovies.currentPage}
            totalPages={paginatedMovies.totalPages}
            visibleMovies={paginatedMovies.visibleItems}
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
            currentPage={paginatedUsers.currentPage}
            totalPages={paginatedUsers.totalPages}
            visibleUsers={paginatedUsers.visibleItems}
            onPageChange={setUserPage}
            currentUserId={user?.userId}
            onRoleChange={updateUserRole}
            onDelete={deleteUser}
          />
        )}

        {activeTab === "bookings" && (
          <BookingsPanel
            bookings={bookings}
            currentPage={paginatedBookings.currentPage}
            totalPages={paginatedBookings.totalPages}
            visibleBookings={paginatedBookings.visibleItems}
            onPageChange={setBookingPage}
            onStatusChange={updateBookingStatus}
          />
        )}

        {activeTab === "overview" && (
          <OverviewPanel
            summary={summary}
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

function OverviewPanel({ summary, onImport }) {
  const metrics = [
    { label: "Movies", value: summary?.movieCount || 0 },
    { label: "Users", value: summary?.userCount || 0 },
    { label: "Bookings", value: summary?.bookingCount || 0 },
    { label: "Revenue", value: formatVnd(summary?.revenue || 0) },
  ];

  return (
    <section className="grid gap-[16px]">
      <div className="grid gap-[16px] md:grid-cols-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-tk-8 border border-app-border bg-app-surface p-[18px]">
            <p className="type-body-xs text-app-text-muted">{metric.label}</p>
            <p className="type-h4 mt-[8px] text-app-text">{metric.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-tk-8 border border-app-border bg-app-surface p-[20px]">
        <h2 className="type-h5 text-app-text">Home catalog workflow</h2>
        <p className="type-body-s mt-[8px] max-w-[760px] text-app-text-muted">
          Refresh TMDB lists from the import tool, then public home sections read
          local database rows instead of calling TMDB on every page load.
        </p>
        <Button className="mt-[16px]" leftIcon={<Download />} onClick={onImport}>
          Open Import Tools
        </Button>
      </div>
    </section>
  );
}

function MoviesPanel({
  movies,
  visibleMovies,
  currentPage,
  totalPages,
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
              <th className="px-[14px] py-[12px]">Release</th>
              <th className="px-[14px] py-[12px]">Rating</th>
              <th className="px-[14px] py-[12px]">Duration</th>
              <th className="px-[14px] py-[12px]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visibleMovies.map((movie) => (
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
                        {movie.posterUrl && <img src={movie.posterUrl} alt="" className="h-full w-full object-cover" />}
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
        totalItems={movies.length}
        label="movies"
        onPageChange={onPageChange}
      />
    </section>
  );
}

function UsersPanel({
  users,
  visibleUsers,
  currentPage,
  totalPages,
  onPageChange,
  currentUserId,
  onRoleChange,
  onDelete,
}) {
  return (
    <section className="grid gap-[16px]">
      <TableShell headers={["Name", "Email", "Role", "Provider", "Verified", "Actions"]}>
        {visibleUsers.map((item) => (
        <tr key={item.id} className="border-b border-app-border last:border-b-0">
          <td className="px-[14px] py-[12px] type-body-s text-app-text">{item.fullName}</td>
          <td className="px-[14px] py-[12px] type-body-s text-app-text-muted">{item.email}</td>
          <td className="px-[14px] py-[12px]">
            <select className="admin-input" value={item.role} onChange={(event) => onRoleChange(item.id, event.target.value)} disabled={item.id === currentUserId}>
              <option value="USER">USER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
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
        totalItems={users.length}
        label="users"
        onPageChange={onPageChange}
      />
    </section>
  );
}

function BookingsPanel({
  bookings,
  visibleBookings,
  currentPage,
  totalPages,
  onPageChange,
  onStatusChange,
}) {
  return (
    <section className="grid gap-[16px]">
      <TableShell headers={["Booking", "Customer", "Movie", "Schedule", "Payment", "Total", "Status"]}>
        {visibleBookings.map((booking) => (
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
            <select className="admin-input" value={booking.status} onChange={(event) => onStatusChange(booking.id, event.target.value)}>
              {bookingStatuses.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </td>
        </tr>
        ))}
      </TableShell>

      <PaginationBar
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={ADMIN_PAGE_SIZE}
        totalItems={bookings.length}
        label="bookings"
        onPageChange={onPageChange}
      />
    </section>
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

function usePaginatedItems(items, page, pageSize) {
  return useMemo(() => {
    const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
    const currentPage = Math.min(page, totalPages);
    const startIndex = (currentPage - 1) * pageSize;

    return {
      currentPage,
      totalPages,
      visibleItems: items.slice(startIndex, startIndex + pageSize),
    };
  }, [items, page, pageSize]);
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

function formatPaymentMethod(value) {
  if (value === "VNPAY_QR") return "VNPAY QR";
  if (value === "MOMO_WALLET") return "MoMo Wallet";
  if (value === "DEMO_CARD") return "Demo Card";
  return value || "Demo Card";
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
