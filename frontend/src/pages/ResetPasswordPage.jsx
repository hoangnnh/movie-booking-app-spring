import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { authApi } from "../api/api";
import Button from "../components/common/Button";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get("token") || "";
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const hasToken = useMemo(() => tokenFromUrl.trim().length > 0, [tokenFromUrl]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!hasToken) {
      setError("This reset link is missing its token. Please request a new one.");
      return;
    }

    if (!newPassword.trim() || !confirmPassword.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Your new password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setSubmitting(true);
      await authApi.resetPassword({
        token: tokenFromUrl,
        newPassword,
      });
      setSuccess("Password reset successful. You can now log in.");
      window.setTimeout(() => {
        navigate("/", { replace: true });
      }, 1200);
    } catch (err) {
      const message = err?.message || "Could not reset password.";
      if (message.includes("Reset token has expired")) {
        setError("This reset link has expired. Please request a new one.");
      } else if (message.includes("Invalid reset token")) {
        setError("This reset link is invalid. Please request a new one.");
      } else {
        setError(message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-app-background px-[20px] py-[40px] text-app-text">
      <div className="mx-auto max-w-[520px] rounded-tk-12 border border-app-border bg-app-surface p-[24px] shadow-[0_24px_60px_rgba(0,0,0,0.25)] sm:p-[32px]">
        <p className="type-label-s text-brand">PASSWORD RESET</p>
        <h1 className="type-h3 mt-[8px]">Set a new password</h1>
        <p className="type-body-s mt-[10px] text-app-text-muted">
          Choose a new password for your account. This page only works from a valid reset email link.
        </p>

        {!hasToken && (
          <div className="mt-[20px] rounded-tk-8 border border-error-500 bg-app-background p-[14px] type-body-s text-error-500">
            This reset link is invalid or incomplete.
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-[24px] grid gap-[14px]">
          <label className="grid gap-[6px]">
            <span className="type-body-xs text-app-text-muted">New password</span>
            <input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="Enter a new password"
              className="h-[48px] rounded-tk-8 border border-app-border bg-app-background px-[16px] type-body-m text-app-text outline-none transition-colors placeholder:text-app-text-muted focus:border-brand"
            />
          </label>

          <label className="grid gap-[6px]">
            <span className="type-body-xs text-app-text-muted">Confirm password</span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Re-enter the new password"
              className="h-[48px] rounded-tk-8 border border-app-border bg-app-background px-[16px] type-body-m text-app-text outline-none transition-colors placeholder:text-app-text-muted focus:border-brand"
            />
          </label>

          {error && (
            <div className="rounded-tk-8 border border-error-500 bg-app-background p-[14px] type-body-s text-error-500">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-tk-8 border border-green-500 bg-app-background p-[14px] type-body-s text-green-500">
              {success}
            </div>
          )}

          <Button type="submit" size={48} disabled={submitting || !hasToken}>
            {submitting ? "Updating..." : "Update Password"}
          </Button>
        </form>

        <div className="mt-[20px]">
          <Link
            to="/"
            className="type-body-s text-brand transition-colors hover:text-brand-hover"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
