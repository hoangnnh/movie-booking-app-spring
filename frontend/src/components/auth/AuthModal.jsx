import { useEffect, useState } from "react";
import { ArrowLeft, KeyRound, Mail, X } from "lucide-react";
import { authApi } from "../../api/api";
import { useAuth } from "../../context/useAuth";
import Button from "../common/Button";
import EmailField from "../common/EmailField";
import Logo from "../common/Logo";
import { cn } from "../../utils/cn";

export default function AuthModal({ mode = "login", onModeChange, onClose }) {
  const { login, register, loginWithGoogle, googleAuthEnabled } = useAuth();
  const isLogin = mode === "login";
  const [verifiedFromUrl] = useState(
    () => new URLSearchParams(window.location.search).get("verified") === "true"
  );

  const [step, setStep] = useState("form");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState(() =>
    verifiedFromUrl ? "Email verified! You can now log in." : ""
  );
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (verifiedFromUrl) {
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [verifiedFromUrl]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timeoutId = setTimeout(() => setResendCooldown((value) => value - 1), 1000);
    return () => clearTimeout(timeoutId);
  }, [resendCooldown]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccessMsg("");

    if (step === "verify" || step === "forgot-sent") {
      return;
    }

    if (step === "forgot") {
      if (!email.trim()) {
        setError("Please enter your email.");
        return;
      }

      try {
        setLoading(true);
        await authApi.forgotPassword({ email: email.trim() });
        setStep("forgot-sent");
      } catch (err) {
        setError(cleanError(err));
      } finally {
        setLoading(false);
      }
      return;
    }

    if (step === "reset") {
      if (!resetToken.trim() || !newPassword.trim()) {
        setError("Please fill in all fields.");
        return;
      }

      try {
        setLoading(true);
        await authApi.resetPassword({
          token: resetToken.trim(),
          newPassword: newPassword.trim(),
        });
        setSuccessMsg("Password reset! You can now log in.");
        setStep("form");
        setResetToken("");
        setNewPassword("");
        onModeChange?.("login");
      } catch (err) {
        setError(cleanError(err));
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!email.trim() || !password.trim() || (!isLogin && !fullName.trim())) {
      setError("Please fill in all required fields.");
      return;
    }

    try {
      setLoading(true);
      if (isLogin) {
        await login({ email: email.trim(), password });
        onClose?.();
      } else {
        await register({
          fullName: fullName.trim(),
          email: email.trim(),
          password,
        });
        setStep("verify");
        setSuccessMsg("Registration successful! Please check your email to verify your account.");
      }
    } catch (err) {
      setError(cleanError(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (resendCooldown > 0) return;

    try {
      setError("");
      setSuccessMsg("");
      setResendLoading(true);
      await authApi.resendVerification({ email: email.trim() });
      setResendCooldown(60);
      setSuccessMsg("Verification email resent!");
    } catch (err) {
      setError(cleanError(err));
    } finally {
      setResendLoading(false);
    }
  }

  function handleGoogleLogin() {
    setError("");
    try {
      loginWithGoogle();
    } catch (err) {
      setError(cleanError(err));
    }
  }

  function switchMode(nextMode) {
    setStep("form");
    setError("");
    setSuccessMsg("");
    onModeChange?.(nextMode);
  }

  function goToForgot() {
    setStep("forgot");
    setError("");
    setSuccessMsg("");
  }

  function backToForm() {
    setStep("form");
    setError("");
    setSuccessMsg("");
  }

  function submitLabel() {
    if (loading) return "Please wait...";
    if (step === "verify") return "Open Email App";
    if (step === "forgot") return "Send Reset Link";
    if (step === "forgot-sent") return "Close";
    if (step === "reset") return "Set New Password";
    return isLogin ? "Login" : "Create Account";
  }

  function handleFinalButton() {
    if (step === "forgot-sent") {
      onClose?.();
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/80"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose?.();
      }}
    >
      <div className="flex min-h-full items-center justify-center p-0 sm:p-[20px] lg:p-[32px]">
        <form
          onSubmit={step === "forgot-sent" ? (event) => {
            event.preventDefault();
            onClose?.();
          } : handleSubmit}
          className={cn(
            "relative grid w-full max-w-[940px] grid-cols-1",
            "bg-app-surface shadow-2xl",
            "min-h-screen sm:min-h-0",
            "rounded-none border-0",
            "sm:rounded-tk-8 sm:border sm:border-app-border",
            "lg:grid-cols-[0.95fr_1fr]"
          )}
        >
          <AuthArtwork />

          <section className="relative flex flex-col bg-app-background p-[20px] pb-[28px] pt-[56px] sm:p-[28px] sm:pb-[32px] sm:pt-[28px] lg:p-[36px] lg:pb-[40px] lg:pt-[36px]">
            <button
              type="button"
              aria-label="Close"
              className="absolute right-[14px] top-[14px] z-10 flex h-[32px] w-[32px] items-center justify-center rounded-full bg-app-surface/80 text-app-text-muted backdrop-blur-sm transition-colors hover:text-app-text sm:right-[18px] sm:top-[18px]"
              onClick={onClose}
            >
              <X className="h-[18px] w-[18px]" />
            </button>

            <Logo className="mb-[24px] sm:mb-[28px] lg:mb-[36px]" />

            {step === "verify" && (
              <VerifyEmailStep
                email={email}
                onResend={handleResend}
                resendLoading={resendLoading}
                resendCooldown={resendCooldown}
                onBack={backToForm}
              />
            )}

            {step === "forgot" && (
              <ForgotStep
                email={email}
                onEmailChange={(event) => setEmail(event.target.value)}
                onBack={backToForm}
              />
            )}

            {step === "forgot-sent" && <ForgotSentStep email={email} />}

            {step === "reset" && (
              <ResetStep
                token={resetToken}
                onTokenChange={(event) => setResetToken(event.target.value)}
                newPassword={newPassword}
                onPasswordChange={(event) => setNewPassword(event.target.value)}
                onBack={backToForm}
              />
            )}

            {step === "form" && (
              <>
                <div className="mb-[22px]">
                  <p className="type-label-s mb-[6px] text-brand">
                    {isLogin ? "WELCOME BACK" : "START WATCHING"}
                  </p>
                  <h2 className="type-h3 text-app-text">
                    {isLogin ? "Login to Ticketor" : "Create your account"}
                  </h2>
                  <p className="type-body-s mt-[8px] max-w-[360px] text-app-text-muted">
                    {isLogin
                      ? "Access your tickets, saved cinemas, and upcoming bookings."
                      : "Sign up to book seats faster and keep every ticket in one place."}
                  </p>
                </div>

                <div className="mb-[18px] grid grid-cols-2 rounded-tk-8 border border-app-border bg-app-surface p-[4px]">
                  <ModeButton active={isLogin} onClick={() => switchMode("login")}>
                    Login
                  </ModeButton>
                  <ModeButton active={!isLogin} onClick={() => switchMode("signup")}>
                    Sign Up
                  </ModeButton>
                </div>

                <button
                  type="button"
                  disabled={!googleAuthEnabled}
                  onClick={handleGoogleLogin}
                  className={cn(
                    "mb-[18px] flex h-[48px] w-full items-center justify-center gap-[10px] rounded-tk-4 border border-app-border bg-app-surface type-button-m transition-colors",
                    googleAuthEnabled
                      ? "text-app-text hover:border-brand hover:text-brand"
                      : "cursor-not-allowed text-app-text-muted opacity-60"
                  )}
                >
                  <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-neutral-50 type-label-s font-bold text-neutral-900">
                    G
                  </span>
                  Continue with Google
                </button>

                {!googleAuthEnabled && (
                  <p className="-mt-[6px] mb-[14px] type-body-xs text-app-text-muted">
                    Google login will appear here after the backend is started with valid Google OAuth credentials.
                  </p>
                )}

                <div className="mb-[18px] flex items-center gap-[12px]">
                  <span className="h-px flex-1 bg-app-border" />
                  <span className="type-label-s text-app-text-muted">OR CONTINUE WITH EMAIL</span>
                  <span className="h-px flex-1 bg-app-border" />
                </div>

                <div className="grid gap-[14px]">
                  {!isLogin && (
                    <EmailField
                      label="Full name"
                      type="text"
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      placeholder="Your name"
                      informationText=""
                    />
                  )}
                  <EmailField
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    informationText=""
                  />
                  <EmailField
                    label="Password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Password"
                    informationText={isLogin ? "" : "Use at least 6 characters."}
                  />
                </div>

                {isLogin && (
                  <button
                    type="button"
                    onClick={goToForgot}
                    className="mt-[10px] self-end type-body-xs text-brand transition-colors hover:text-brand-hover"
                  >
                    Forgot password?
                  </button>
                )}
              </>
            )}

            {successMsg && (
              <div className="mt-[14px] rounded-tk-4 border border-green-500 bg-app-surface p-[12px] type-body-s text-green-500">
                {successMsg}
              </div>
            )}

            {error && (
              <div className="mt-[14px] rounded-tk-4 border border-error-500 bg-app-surface p-[12px] type-body-s text-error-500">
                {error}
              </div>
            )}

            {step !== "verify" && (
              <Button
                type="submit"
                size={48}
                variant="primary"
                disabled={loading}
                onClick={step === "forgot-sent" ? handleFinalButton : undefined}
                className="mt-[20px] w-full"
              >
                {submitLabel()}
              </Button>
            )}

            {step === "form" && (
              <div className="mt-[16px] text-center">
                <button
                  type="button"
                  className="type-body-s text-brand transition-colors hover:text-brand-hover"
                  onClick={() => switchMode(isLogin ? "signup" : "login")}
                >
                  {isLogin
                    ? "Don't have an account? Sign up"
                    : "Already have an account? Login"}
                </button>
              </div>
            )}
          </section>
        </form>
      </div>
    </div>
  );
}

function AuthArtwork() {
  return (
    <aside className="relative hidden min-h-[600px] overflow-hidden bg-neutral-900 lg:block">
      <img src="/auth-cinema.png" alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-app-background via-app-background/15 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-[32px]">
        <p className="type-label-s text-brand">BOOK WITHOUT THE QUEUE</p>
        <h3 className="type-h3 mt-[8px] max-w-[320px] text-app-text">Your next cinema night starts here.</h3>
        <p className="type-body-s mt-[12px] max-w-[300px] text-app-text-muted">
          Login, pick a showtime, choose seats, and keep every ticket close.
        </p>
      </div>
    </aside>
  );
}

function ModeButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-[40px] rounded-tk-4 type-button-m transition-colors",
        active ? "bg-primary-600 text-neutral-900" : "text-app-text-muted hover:text-app-text"
      )}
    >
      {children}
    </button>
  );
}

function BackButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mb-[20px] flex items-center gap-[6px] type-body-s text-app-text-muted transition-colors hover:text-app-text"
    >
      <ArrowLeft className="h-[14px] w-[14px]" />
      Back to login
    </button>
  );
}

function VerifyEmailStep({ email, onResend, resendLoading, resendCooldown, onBack }) {
  return (
    <div>
      <BackButton onClick={onBack} />
      <span className="mb-[16px] flex h-[48px] w-[48px] items-center justify-center rounded-tk-8 bg-app-surface text-brand">
        <Mail className="h-[24px] w-[24px]" />
      </span>
      <p className="type-label-s mb-[8px] text-brand">CHECK YOUR EMAIL</p>
      <h2 className="type-h3 text-app-text">Verify your account</h2>
      <p className="type-body-s mt-[10px] max-w-[360px] text-app-text-muted">
        We sent a verification link to <span className="font-medium text-app-text">{email}</span>.
        Click the link to activate your account.
      </p>

      <div className="mt-[24px] rounded-tk-4 border border-app-border bg-app-surface p-[16px]">
        <p className="type-body-s text-app-text-muted">
          Didn't receive the email? Check your spam folder or{" "}
          <button
            type="button"
            disabled={resendLoading || resendCooldown > 0}
            onClick={onResend}
            className="text-brand hover:text-brand-hover disabled:opacity-50"
          >
            {resendCooldown > 0
              ? `resend in ${resendCooldown}s`
              : resendLoading
                ? "Sending..."
                : "resend verification email"}
          </button>
          .
        </p>
      </div>
    </div>
  );
}

function ForgotStep({ email, onEmailChange, onBack }) {
  return (
    <div>
      <BackButton onClick={onBack} />
      <span className="mb-[16px] flex h-[48px] w-[48px] items-center justify-center rounded-tk-8 bg-app-surface text-brand">
        <KeyRound className="h-[24px] w-[24px]" />
      </span>
      <p className="type-label-s mb-[8px] text-brand">FORGOT PASSWORD</p>
      <h2 className="type-h3 text-app-text">Reset your password</h2>
      <p className="type-body-s mb-[24px] mt-[10px] max-w-[360px] text-app-text-muted">
        Enter the email you registered with and we'll send you a reset link.
      </p>
      <EmailField
        label="Email"
        type="email"
        value={email}
        onChange={onEmailChange}
        placeholder="you@example.com"
        informationText=""
      />
    </div>
  );
}

function ForgotSentStep({ email }) {
  return (
    <div>
      <span className="mb-[16px] flex h-[48px] w-[48px] items-center justify-center rounded-tk-8 bg-app-surface text-brand">
        <Mail className="h-[24px] w-[24px]" />
      </span>
      <p className="type-label-s mb-[8px] text-brand">EMAIL SENT</p>
      <h2 className="type-h3 text-app-text">Check your inbox</h2>
      <p className="type-body-s mt-[10px] max-w-[360px] text-app-text-muted">
        A password reset link has been sent to <span className="font-medium text-app-text">{email}</span>.
        The link expires in <span className="font-medium text-app-text">15 minutes</span>.
      </p>
      <p className="type-body-xs mt-[14px] text-app-text-muted">
        If you don't see it, check your spam folder.
      </p>
    </div>
  );
}

function ResetStep({ token, onTokenChange, newPassword, onPasswordChange, onBack }) {
  return (
    <div>
      <BackButton onClick={onBack} />
      <span className="mb-[16px] flex h-[48px] w-[48px] items-center justify-center rounded-tk-8 bg-app-surface text-brand">
        <KeyRound className="h-[24px] w-[24px]" />
      </span>
      <p className="type-label-s mb-[8px] text-brand">RESET PASSWORD</p>
      <h2 className="type-h3 text-app-text">Set a new password</h2>
      <p className="type-body-s mb-[24px] mt-[10px] max-w-[360px] text-app-text-muted">
        Paste the reset token from your email and choose a new password.
      </p>
      <div className="grid gap-[14px]">
        <EmailField
          label="Reset token"
          type="text"
          value={token}
          onChange={onTokenChange}
          placeholder="Paste token from email"
          informationText=""
        />
        <EmailField
          label="New password"
          type="password"
          value={newPassword}
          onChange={onPasswordChange}
          placeholder="New password"
          informationText="Use at least 6 characters."
        />
      </div>
    </div>
  );
}

function cleanError(error) {
  const msg = error?.message || "Authentication failed.";
  if (msg.includes("Invalid email or password")) return "Invalid email or password.";
  if (msg.includes("Email already exists")) return "This email is already registered.";
  if (msg.includes("Please verify your email")) return "Please verify your email before logging in.";
  if (msg.includes("Email not found")) return "No account found with this email.";
  if (msg.includes("Email delivery is not configured correctly")) return "The server could not send email. Check the backend mail configuration.";
  if (msg.includes("Reset token has expired")) return "Reset link has expired. Please request a new one.";
  if (msg.includes("Invalid reset token")) return "Invalid reset token.";
  if (msg.includes("Email already verified")) return "This email is already verified.";
  if (msg.includes("Google login is not configured")) return "Google login is not configured on the server yet.";
  if (msg.includes("Google")) return "This account uses Google login. Password reset is not available.";
  return msg;
}
