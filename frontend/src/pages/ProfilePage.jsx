import { useEffect, useState } from "react";
import {
  BellRing,
  CalendarDays,
  Camera,
  CheckCircle2,
  Clock3,
  CreditCard,
  Eye,
  EyeOff,
  History,
  LockKeyhole,
  Mail,
  MapPin,
  Phone,
  Ticket,
  UserRound,
  X,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { authApi, bookingApi } from "../api/api";
import Avatar from "../components/common/Avatar";
import Button from "../components/common/Button";
import { getPosterUrl } from "../components/home/homeUtils";
import { useAuth } from "../context/useAuth";
import { cn } from "../utils/cn";
import { formatVnd } from "../utils/currency";

const sections = [
  { id: "personal", label: "Personal Information", icon: UserRound },
  { id: "notifications", label: "Notifications", icon: BellRing },
  { id: "history", label: "History", icon: History },
];

const emptyProfile = {
  fullName: "",
  email: "",
  phoneNumber: "",
  dateOfBirth: "",
  gender: "",
  avatarUrl: "",
  provider: "",
};

const inputClassName =
  "h-[48px] w-full rounded-tk-8 border border-app-border bg-app-background px-[14px] type-body-m text-app-text outline-none transition-colors placeholder:text-app-text-subtle focus:border-brand disabled:cursor-not-allowed disabled:opacity-70";

export default function ProfilePage({ onRequireAuth }) {
  const navigate = useNavigate();
  const { user, isAuthenticated, updateUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [profile, setProfile] = useState(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [bookingsError, setBookingsError] = useState("");
  const [expandedBookingId, setExpandedBookingId] = useState("");
  const activeSection = sections.some((section) => section.id === searchParams.get("section"))
    ? searchParams.get("section")
    : "personal";

  useEffect(() => {
    let ignore = false;

    async function loadProfile() {
      if (!isAuthenticated) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");
        const data = await authApi.getProfile();

        if (!ignore) {
          setProfile(toProfileForm(data));
        }
      } catch (loadError) {
        if (!ignore) {
          setError(loadError?.message || "We couldn't load your profile right now.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      ignore = true;
    };
  }, [isAuthenticated]);

  useEffect(() => {
    let ignore = false;

    async function loadBookings() {
      if (!isAuthenticated || !user?.userId) {
        setBookings([]);
        setBookingsLoading(false);
        return;
      }

      try {
        setBookingsLoading(true);
        setBookingsError("");
        const data = await bookingApi.getUserBookings(user.userId);

        if (!ignore) {
          setBookings((Array.isArray(data) ? data : []).map(normalizeBooking));
        }
      } catch {
        if (!ignore) {
          setBookingsError("We couldn't load your booking history right now.");
        }
      } finally {
        if (!ignore) {
          setBookingsLoading(false);
        }
      }
    }

    loadBookings();

    return () => {
      ignore = true;
    };
  }, [isAuthenticated, user?.userId]);

  function updateField(field, value) {
    setProfile((currentProfile) => ({
      ...currentProfile,
      [field]: value,
    }));
    setSuccess("");
  }

  async function handleAvatarChange(event) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    try {
      setAvatarSaving(true);
      setError("");
      setSuccess("");
      const avatarUrl = await resizeAvatar(file);
      const updatedProfile = await authApi.updateAvatar(avatarUrl);
      setProfile((currentProfile) => ({
        ...currentProfile,
        avatarUrl: updatedProfile.avatarUrl || "",
      }));
      updateUser(updatedProfile);
      setSuccess("Your profile photo has been updated.");
    } catch (avatarError) {
      setError(avatarError?.message || "We couldn't use that profile photo.");
    } finally {
      setAvatarSaving(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");
      const updatedProfile = await authApi.updateProfile({
        fullName: profile.fullName,
        phoneNumber: profile.phoneNumber || null,
        dateOfBirth: profile.dateOfBirth || null,
        gender: profile.gender || null,
        avatarUrl: profile.avatarUrl || null,
      });

      setProfile(toProfileForm(updatedProfile));
      updateUser(updatedProfile);
      setSuccess("Your personal information has been updated.");
    } catch (saveError) {
      setError(saveError?.message || "We couldn't update your profile right now.");
    } finally {
      setSaving(false);
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="ticketor-container py-[72px]">
        <div className="rounded-card border border-app-border bg-app-surface p-[32px] text-center">
          <p className="type-label-m text-brand">PROFILE SETTINGS</p>
          <h1 className="type-h4 mt-[12px] text-app-text">Sign in to manage your profile.</h1>
          <p className="type-body-m mt-[12px] text-app-text-muted">
            Keep your personal details and account preferences in one place.
          </p>
          <div className="mt-[20px] flex justify-center">
            <Button size={40} onClick={onRequireAuth}>Sign In</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app-background text-app-text">
      <main className="ticketor-container py-[48px]">
        <section className="overflow-hidden rounded-tk-12 border border-app-border bg-app-surface">
          <div className="flex flex-col gap-[18px] border-b border-app-border p-[24px] sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-[16px]">
              <div className="grid shrink-0 justify-items-center gap-[6px]">
                <Avatar size={56} src={profile.avatarUrl || user?.avatarUrl} alt={user?.fullName} />
                <label className="flex cursor-pointer items-center gap-[4px] type-body-xs text-brand transition-colors hover:text-brand-hover">
                  <Camera className="h-[13px] w-[13px]" />
                  {avatarSaving ? "Saving..." : "Change"}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </label>
              </div>
              <div className="min-w-0">
                <p className="type-label-m text-brand">PROFILE SETTINGS</p>
                <h1 className="type-h4 mt-[4px] truncate text-app-text">{user?.fullName}</h1>
                <p className="type-body-s mt-[4px] truncate text-app-text-muted">{user?.email}</p>
              </div>
            </div>
            <span className="w-fit rounded-full border border-app-border bg-app-background px-[14px] py-[8px] type-body-xs text-app-text-muted">
              {formatProvider(user?.provider)}
            </span>
          </div>

          <nav className="flex overflow-x-auto px-[12px] sm:px-[20px]" aria-label="Profile sections">
            {sections.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;

              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setSearchParams({ section: section.id })}
                  className={cn(
                    "flex shrink-0 items-center gap-[8px] border-b-2 px-[14px] py-[16px] type-body-s transition-colors sm:px-[18px]",
                    isActive
                      ? "border-brand text-brand"
                      : "border-transparent text-app-text-muted hover:text-app-text"
                  )}
                >
                  <Icon className="h-[17px] w-[17px]" />
                  {section.label}
                </button>
              );
            })}
          </nav>
        </section>

        {error && (
          <div className="mt-[20px] rounded-tk-8 border border-error-500 bg-app-surface px-[16px] py-[12px] type-body-s text-error-500">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-[20px] flex items-center gap-[8px] rounded-tk-8 border border-success-500 bg-app-surface px-[16px] py-[12px] type-body-s text-success-400">
            <CheckCircle2 className="h-[18px] w-[18px]" />
            {success}
          </div>
        )}

        {loading ? (
          <div className="mt-[24px] rounded-tk-12 border border-app-border bg-app-surface p-[24px] type-body-m text-app-text-muted">
            Loading your profile...
          </div>
        ) : (
          <>
            {activeSection === "personal" && (
              <PersonalInformationSection
                profile={profile}
                saving={saving}
                onChange={updateField}
                onSubmit={handleSubmit}
                onOpenPasswordModal={() => setPasswordModalOpen(true)}
              />
            )}
            {activeSection === "notifications" && <NotificationsSection />}
            {activeSection === "history" && (
              <HistorySection
                bookings={bookings}
                loading={bookingsLoading}
                error={bookingsError}
                expandedBookingId={expandedBookingId}
                onBookingClick={(booking) => {
                  if (booking.isActive) {
                    navigate(`/my-booking/${booking.id}`);
                    return;
                  }

                  setExpandedBookingId((currentId) => currentId === booking.id ? "" : booking.id);
                }}
              />
            )}
          </>
        )}
      </main>

      {passwordModalOpen && (
        <PasswordChangeModal
          onClose={() => setPasswordModalOpen(false)}
          onChanged={() => {
            setPasswordModalOpen(false);
            setSuccess("Your password has been changed.");
          }}
        />
      )}
    </div>
  );
}

function PersonalInformationSection({ profile, saving, onChange, onSubmit, onOpenPasswordModal }) {
  return (
    <form onSubmit={onSubmit} className="mt-[24px]">
      <section className="rounded-tk-12 border border-app-border bg-app-surface p-[20px] sm:p-[24px]">
        <div>
          <p className="type-label-m text-brand">PERSONAL INFORMATION</p>
          <h2 className="type-h5 mt-[6px] text-app-text">Your account details</h2>
          <p className="type-body-s mt-[6px] text-app-text-muted">
            Keep these details current so your booking account stays easy to identify.
          </p>
        </div>

        <div className="mt-[22px] grid gap-[18px] md:grid-cols-2">
          <ProfileField label="Full name" icon={UserRound}>
            <input
              value={profile.fullName}
              onChange={(event) => onChange("fullName", event.target.value)}
              className={inputClassName}
              maxLength={150}
              required
            />
          </ProfileField>

          <ProfileField label="Date of birth" icon={CalendarDays}>
            <input
              type="date"
              value={profile.dateOfBirth}
              onChange={(event) => onChange("dateOfBirth", event.target.value)}
              className={inputClassName}
            />
          </ProfileField>

          <ProfileField label="Email" icon={Mail}>
            <input value={profile.email} className={inputClassName} disabled />
          </ProfileField>

          <ProfileField label="Phone number" icon={Phone}>
            <input
              type="tel"
              value={profile.phoneNumber}
              onChange={(event) => onChange("phoneNumber", event.target.value)}
              className={inputClassName}
              maxLength={30}
              placeholder="Add your phone number"
            />
          </ProfileField>

          <ProfileField label="Password" icon={LockKeyhole}>
            <div className="flex h-[48px] items-center gap-[10px] rounded-tk-8 border border-app-border bg-app-background px-[14px]">
              <span className="min-w-0 flex-1 truncate type-body-m tracking-[3px] text-app-text-muted">
                ************
              </span>
              <button
                type="button"
                onClick={onOpenPasswordModal}
                disabled={profile.provider !== "LOCAL"}
                className="shrink-0 type-button-s text-brand transition-colors hover:text-brand-hover disabled:cursor-not-allowed disabled:text-app-text-subtle"
              >
                Change
              </button>
            </div>
          </ProfileField>
        </div>

        <fieldset className="mt-[20px]">
          <legend className="type-body-s text-app-text-muted">Gender</legend>
          <div className="mt-[10px] flex flex-wrap gap-[14px]">
            {[
              ["MALE", "Male"],
              ["FEMALE", "Female"],
              ["OTHER", "Other"],
            ].map(([value, label]) => (
              <label
                key={value}
                className="flex items-center gap-[8px] rounded-full border border-app-border bg-app-background px-[14px] py-[9px] type-body-s text-app-text-muted"
              >
                <input
                  type="radio"
                  name="gender"
                  value={value}
                  checked={profile.gender === value}
                  onChange={(event) => onChange("gender", event.target.value)}
                  className="accent-primary-600"
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="mt-[24px] flex justify-end">
          <Button type="submit" size={40} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </section>

    </form>
  );
}

function NotificationsSection() {
  return (
    <section className="mt-[24px] rounded-tk-12 border border-app-border bg-app-surface p-[20px] sm:p-[24px]">
      <p className="type-label-m text-brand">NOTIFICATIONS</p>
      <p className="type-body-s mt-[8px] text-app-text-muted">You don't have any notifications yet.</p>
    </section>
  );
}

function HistorySection({ bookings, loading, error, expandedBookingId, onBookingClick }) {
  return (
    <section className="mt-[24px] rounded-tk-12 border border-app-border bg-app-surface p-[20px] sm:p-[24px]">
      <p className="type-label-m text-brand">HISTORY</p>

      {loading && <p className="type-body-s mt-[8px] text-app-text-muted">Loading your booking history...</p>}
      {!loading && error && <p className="type-body-s mt-[8px] text-error-500">{error}</p>}
      {!loading && !error && bookings.length === 0 && (
        <p className="type-body-s mt-[8px] text-app-text-muted">You don't have any booking history yet.</p>
      )}

      {!loading && !error && bookings.length > 0 && (
        <div className="mt-[18px] grid gap-[12px]">
          {bookings.map((booking) => (
            <div key={booking.id}>
              <button
                type="button"
                onClick={() => onBookingClick(booking)}
                className="flex w-full items-center justify-between gap-[16px] rounded-tk-8 border border-app-border bg-app-background p-[14px] text-left transition-colors hover:border-app-text"
              >
                <div className="flex min-w-0 items-center gap-[14px]">
                  <div className="h-[72px] w-[52px] shrink-0 overflow-hidden rounded-tk-4 bg-app-surface">
                    {booking.posterUrl ? (
                      <img src={booking.posterUrl} alt={booking.movieTitle} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full bg-neutral-700" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="type-h6 truncate text-app-text">{booking.movieTitle}</p>
                    <p className="type-body-xs mt-[4px] text-app-text-muted">{booking.dateTimeLabel}</p>
                    <p className="type-body-xs mt-[4px] truncate text-app-text-muted">{booking.cinemaName}</p>
                  </div>
                </div>

                <span className={cn(
                  "shrink-0 rounded-full border px-[10px] py-[5px] type-body-xs",
                  booking.isActive
                    ? "border-success-500 text-success-400"
                    : "border-app-border text-app-text-subtle"
                )}>
                  {booking.isActive ? "Upcoming" : "Expired"}
                </span>
              </button>

              {!booking.isActive && expandedBookingId === booking.id && (
                <ExpiredBookingDetails booking={booking} />
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function PasswordChangeModal({ onClose, onChanged }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [visibleFields, setVisibleFields] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    if (newPassword !== confirmNewPassword) {
      setError("New passwords do not match.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      await authApi.changePassword({
        currentPassword,
        newPassword,
        confirmNewPassword,
      });
      onChanged();
    } catch (saveError) {
      setError(saveError?.message || "We couldn't change your password right now.");
    } finally {
      setSaving(false);
    }
  }

  function toggleVisibility(field) {
    setVisibleFields((currentFields) => ({
      ...currentFields,
      [field]: !currentFields[field],
    }));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-[20px]">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="change-password-title"
        className="w-full max-w-[440px] rounded-tk-12 border border-app-border bg-app-surface p-[20px] shadow-[0_24px_70px_rgba(0,0,0,0.5)] sm:p-[24px]"
      >
        <div className="flex items-center justify-between gap-[16px]">
          <h2 id="change-password-title" className="type-h5 text-app-text">Change Password</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-[32px] w-[32px] items-center justify-center rounded-full bg-app-background text-app-text-muted transition-colors hover:text-app-text"
            aria-label="Close change password modal"
          >
            <X className="h-[18px] w-[18px]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-[20px] grid gap-[14px]">
          <PasswordInput
            label="Current password"
            value={currentPassword}
            visible={visibleFields.currentPassword}
            onChange={setCurrentPassword}
            onToggle={() => toggleVisibility("currentPassword")}
          />
          <PasswordInput
            label="New password"
            value={newPassword}
            visible={visibleFields.newPassword}
            onChange={setNewPassword}
            onToggle={() => toggleVisibility("newPassword")}
          />
          <PasswordInput
            label="Confirm new password"
            value={confirmNewPassword}
            visible={visibleFields.confirmNewPassword}
            onChange={setConfirmNewPassword}
            onToggle={() => toggleVisibility("confirmNewPassword")}
          />

          {error && <p className="type-body-xs text-error-500">{error}</p>}

          <Button type="submit" size={48} className="mt-[4px] w-full" disabled={saving}>
            {saving ? "Updating..." : "Update Password"}
          </Button>
        </form>
      </section>
    </div>
  );
}

function PasswordInput({ label, value, visible, onChange, onToggle }) {
  return (
    <label className="grid gap-[7px]">
      <span className="type-body-xs text-app-text-muted">{label}</span>
      <div className="flex h-[48px] items-center gap-[8px] rounded-tk-8 border border-app-border bg-app-background px-[14px] focus-within:border-brand">
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          minLength={8}
          required
          className="min-w-0 flex-1 bg-transparent type-body-m text-app-text outline-none placeholder:text-app-text-subtle"
          placeholder={`Enter ${label.toLowerCase()}`}
        />
        <button
          type="button"
          onClick={onToggle}
          className="text-app-text-muted transition-colors hover:text-app-text"
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
        >
          {visible ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
        </button>
      </div>
    </label>
  );
}

function ExpiredBookingDetails({ booking }) {
  return (
    <div className="mx-[8px] rounded-b-tk-8 border border-t-0 border-app-border bg-app-background px-[16px] py-[14px]">
      <div className="grid gap-[10px] sm:grid-cols-2">
        <HistoryDetail icon={Ticket} label="Seats" value={booking.seatsLabel} />
        <HistoryDetail icon={MapPin} label="Cinema" value={`${booking.cinemaName} / ${booking.roomName}`} />
        <HistoryDetail icon={CreditCard} label="Total" value={formatVnd(booking.totalAmount)} />
        <HistoryDetail icon={Clock3} label="Status" value={`${booking.status} / ${booking.paymentStatus}`} />
      </div>
    </div>
  );
}

function HistoryDetail({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-[8px]">
      <Icon className="mt-[1px] h-[15px] w-[15px] shrink-0 text-brand" />
      <div>
        <p className="type-body-xs text-app-text-subtle">{label}</p>
        <p className="type-body-s mt-[2px] text-app-text-muted">{value}</p>
      </div>
    </div>
  );
}

function ProfileField({ label, icon: Icon, children }) {
  return (
    <label className="grid gap-[8px]">
      <span className="flex items-center gap-[7px] type-body-s text-app-text-muted">
        <Icon className="h-[16px] w-[16px]" />
        {label}
      </span>
      {children}
    </label>
  );
}

function toProfileForm(profile) {
  return {
    fullName: profile?.fullName || "",
    email: profile?.email || "",
    phoneNumber: profile?.phoneNumber || "",
    dateOfBirth: profile?.dateOfBirth || "",
    gender: profile?.gender || "",
    avatarUrl: profile?.avatarUrl || "",
    provider: profile?.provider || "",
  };
}

function normalizeBooking(booking) {
  const startTime = booking?.startTime ? new Date(booking.startTime) : null;
  const ticketCount = booking?.tickets?.length || booking?.seatSummary?.split(",").length || 0;

  return {
    ...booking,
    posterUrl: getPosterUrl({ posterUrl: booking?.posterUrl }),
    dateTimeLabel: startTime ? formatBookingDate(startTime) : "Schedule pending",
    seatsLabel: booking?.seatSummary
      ? `${ticketCount} Ticket${ticketCount === 1 ? "" : "s"} - Seat ${booking.seatSummary}`
      : "Seats will appear after confirmation",
    isActive: Boolean(startTime) && startTime.getTime() >= Date.now() && booking?.status === "CONFIRMED",
  };
}

function formatBookingDate(value) {
  return value.toLocaleString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatProvider(provider) {
  return provider === "GOOGLE" ? "Google account" : "Email account";
}

function resizeAvatar(file) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Choose a JPG, PNG, or WebP image.");
  }

  if (file.size > 5_000_000) {
    throw new Error("Choose an image smaller than 5 MB.");
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error("We couldn't read that profile photo."));
    reader.onload = () => {
      const image = new Image();

      image.onerror = () => reject(new Error("Choose a valid image file."));
      image.onload = () => {
        const maxSize = 320;
        const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext("2d");

        if (!context) {
          reject(new Error("We couldn't resize that profile photo."));
          return;
        }

        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/webp", 0.82));
      };
      image.src = reader.result;
    };

    reader.readAsDataURL(file);
  });
}
