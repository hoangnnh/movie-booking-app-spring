import { useCallback, useEffect, useRef, useState } from "react";
import {
  CalendarDays,
  Camera,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Phone,
  UserRound,
  X,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { authApi, notificationApi } from "../api/api";
import Button from "../components/common/Button";
import ProfileSidebar from "../components/dashboard/ProfileSidebar";
import NotificationAvatar from "../components/notifications/NotificationAvatar";
import { useAuth } from "../context/useAuth";
import { cn } from "../utils/cn";
import {
  NOTIFICATIONS_UPDATED_EVENT,
  notifyNotificationsUpdated,
} from "../utils/notificationEvents";

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
  const { user, isAuthenticated, updateUser } = useAuth();
  const [searchParams] = useSearchParams();
  const [profile, setProfile] = useState(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const activeSection = ["account", "notifications"].includes(searchParams.get("section"))
    ? searchParams.get("section")
    : "account";

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

    if (!file) return;

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
          <p className="type-label-m text-brand">PROFILE</p>
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
        <div className="grid grid-cols-12 gap-[28px] lg:gap-[48px]">
          <aside className="col-span-12 lg:col-span-3">
            <ProfileSidebar user={user} activeKey={activeSection} />
          </aside>

          <div className="col-span-12 lg:col-span-9">
            {error && (
              <div className="mb-[16px] rounded-tk-8 border border-error-500 bg-app-surface px-[16px] py-[12px] type-body-s text-error-500">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-[16px] flex items-center gap-[8px] rounded-tk-8 border border-success-500 bg-app-surface px-[16px] py-[12px] type-body-s text-success-400">
                <CheckCircle2 className="h-[18px] w-[18px]" />
                {success}
              </div>
            )}

            {loading ? (
              <div className="rounded-tk-8 border border-app-border bg-app-surface p-[24px] type-body-m text-app-text-muted">
                Loading your profile...
              </div>
            ) : (
              <>
                {activeSection === "account" && (
                  <PersonalInformationSection
                    profile={profile}
                    saving={saving}
                    onChange={updateField}
                    onSubmit={handleSubmit}
                    onOpenPasswordModal={() => setPasswordModalOpen(true)}
                    onAvatarChange={handleAvatarChange}
                    avatarSaving={avatarSaving}
                  />
                )}
                {activeSection === "notifications" && <NotificationsSection />}
              </>
            )}
          </div>
        </div>
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

function PersonalInformationSection({
  profile,
  saving,
  avatarSaving,
  onChange,
  onSubmit,
  onAvatarChange,
  onOpenPasswordModal,
}) {
  return (
    <form onSubmit={onSubmit} className="mt-[24px]">
      <section className="rounded-tk-8 border border-app-border bg-app-surface p-[20px] sm:p-[24px]">
        <div className="flex flex-wrap items-start justify-between gap-[16px]">
          <div>
          <p className="type-label-m text-brand">MY ACCOUNT</p>
          <h2 className="type-h5 mt-[6px] text-app-text">Your account details</h2>
          <p className="type-body-s mt-[6px] text-app-text-muted">
            Keep these details current so your booking account stays easy to identify.
          </p>
          </div>

          <label className="inline-flex cursor-pointer items-center gap-[6px] type-body-xs text-brand transition-colors hover:text-brand-hover">
            <Camera className="h-[15px] w-[15px]" />
            {avatarSaving ? "Saving photo..." : "Change profile photo"}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={onAvatarChange}
            />
          </label>
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
  const markingReadIdsRef = useRef(new Set());
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await notificationApi.getAll();
      setNotifications(Array.isArray(data?.notifications) ? data.notifications : []);
      setUnreadCount(Number(data?.unreadCount) || 0);
    } catch (loadError) {
      setError(loadError?.message || "We couldn't load your notifications right now.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(loadNotifications, 0);

    window.addEventListener(NOTIFICATIONS_UPDATED_EVENT, loadNotifications);

    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener(NOTIFICATIONS_UPDATED_EVENT, loadNotifications);
    };
  }, [loadNotifications]);

  async function markRead(notification) {
    if (notification.read || markingReadIdsRef.current.has(notification.id)) {
      return;
    }

    markingReadIdsRef.current.add(notification.id);

    try {
      await notificationApi.markRead(notification.id);
      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id ? { ...item, read: true } : item
        )
      );
      setUnreadCount((current) => Math.max(0, current - 1));
      notifyNotificationsUpdated();
    } catch {
      loadNotifications();
    } finally {
      markingReadIdsRef.current.delete(notification.id);
    }
  }

  async function markAllRead() {
    try {
      await notificationApi.markAllRead();
      setNotifications((current) =>
        current.map((notification) => ({ ...notification, read: true }))
      );
      setUnreadCount(0);
      notifyNotificationsUpdated();
    } catch {
      loadNotifications();
    }
  }

  return (
    <section className="rounded-tk-8 border border-app-border bg-app-surface p-[20px] sm:p-[24px]">
      <div className="flex items-center justify-between gap-[16px]">
        <div>
          <p className="type-label-m text-brand">NOTIFICATIONS</p>
          <p className="type-body-s mt-[8px] text-app-text-muted">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}` : "You're all caught up."}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button type="button" variant="outline" tone="base" size={32} onClick={markAllRead}>
            Mark all read
          </Button>
        )}
      </div>

      {loading && <p className="type-body-s mt-[18px] text-app-text-muted">Loading notifications...</p>}
      {!loading && error && <p className="type-body-s mt-[18px] text-error-500">{error}</p>}
      {!loading && !error && notifications.length === 0 && (
        <p className="type-body-s mt-[18px] text-app-text-muted">You don't have any notifications yet.</p>
      )}

      {!loading && !error && notifications.length > 0 && (
        <div className="mt-[18px] grid gap-[10px]">
          {notifications.map((notification) => (
            <Link
              key={notification.id}
              to={notification.actionUrl || "/profile"}
              onMouseEnter={() => markRead(notification)}
              className={cn(
                "flex items-start gap-[12px] rounded-tk-8 border border-app-border bg-app-background p-[14px] transition-colors hover:border-app-text",
                !notification.read && "border-brand/50 bg-brand/5"
              )}
            >
              <NotificationAvatar notification={notification} />
              <div className="min-w-0">
                <p className="type-body-s font-bold text-app-text">{notification.title}</p>
                <p className="type-body-xs mt-[4px] text-app-text-muted">{notification.message}</p>
                <p className="mt-[7px] text-[11px] text-app-text-subtle">
                  {formatNotificationDate(notification.createdAt)}
                </p>
              </div>
            </Link>
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
      notifyNotificationsUpdated();
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

function formatNotificationDate(value) {
  return value ? new Date(value).toLocaleString() : "";
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
