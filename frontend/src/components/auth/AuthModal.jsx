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

    if (step === "verify" || step === "forgot-sent") return;

    if (step === "forgot") {
      if (!email.trim()) { setError("Please enter your email."); return; }
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
        await authApi.resetPassword({ token: resetToken.trim(), newPassword: newPassword.trim() });
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
        await register({ fullName: fullName.trim(), email: email.trim(), password });
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
    try { loginWithGoogle(); } catch (err) { setError(cleanError(err)); }
  }

  function switchMode(nextMode) {
    setStep("form");
    setError("");
    setSuccessMsg("");
    onModeChange?.(nextMode);
  }

  function goToForgot() { setStep("forgot"); setError(""); setSuccessMsg(""); }
  function backToForm() { setStep("form"); setError(""); setSuccessMsg(""); }

  function submitLabel() {
    if (loading) return "Please wait...";
    if (step === "verify") return "Open Email App";
    if (step === "forgot") return "Send Reset Link";
    if (step === "forgot-sent") return "Close";
    if (step === "reset") return "Set New Password";
    return isLogin ? "Login" : "Create Account";
  }

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/80"
      onClick={(event) => { if (event.target === event.currentTarget) onClose?.(); }}
    >
      {/* ↓ py-4 keeps a small top/bottom gap on tall screens */}
      <div className="flex min-h-full items-center justify-center p-0 sm:p-4 lg:py-6">
        <form
          onSubmit={
            step === "forgot-sent"
              ? (event) => { event.preventDefault(); onClose?.(); }
              : handleSubmit
          }
          className={cn(
            "relative grid w-full max-w-[860px] grid-cols-1",
            "bg-app-surface shadow-2xl",
            "min-h-screen sm:min-h-0",
            "rounded-none border-0",
            "sm:rounded-tk-8 sm:border sm:border-app-border",
            "lg:grid-cols-[0.9fr_1fr]"
          )}
        >
          <AuthArtwork />

          {/* ↓ Tightened padding on all breakpoints */}
          <section className="relative flex flex-col bg-app-background p-4 pb-6 pt-10 sm:p-5 sm:pt-5 lg:p-7 lg:pb-7 overflow-y-auto">
            <button
              type="button"
              aria-label="Close"
              className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-app-surface/80 text-app-text-muted backdrop-blur-sm transition-colors hover:text-app-text"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </button>

            {/* ↓ Reduced logo bottom margin */}
            <Logo className="mb-4 lg:mb-5" />

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
              <ForgotStep email={email} onEmailChange={(e) => setEmail(e.target.value)} onBack={backToForm} />
            )}
            {step === "forgot-sent" && <ForgotSentStep email={email} />}
            {step === "reset" && (
              <ResetStep
                token={resetToken}
                onTokenChange={(e) => setResetToken(e.target.value)}
                newPassword={newPassword}
                onPasswordChange={(e) => setNewPassword(e.target.value)}
                onBack={backToForm}
              />
            )}

            {step === "form" && (
              <>
                {/* ↓ Reduced heading block margin + removed subtitle text to save height */}
                <div className="mb-3">
                  <p className="type-label-s mb-1 text-brand">
                    {isLogin ? "WELCOME BACK" : "START WATCHING"}
                  </p>
                  <h2 className="type-h3 text-app-text">
                    {isLogin ? "Login to CinemaTick" : "Create your account"}
                  </h2>
                </div>

                {/* ↓ Mode switcher: reduced height + margin */}
                <div className="mb-3 grid grid-cols-2 rounded-tk-8 border border-app-border bg-app-surface p-[3px]">
                  <ModeButton active={isLogin} onClick={() => switchMode("login")}>Login</ModeButton>
                  <ModeButton active={!isLogin} onClick={() => switchMode("signup")}>Sign Up</ModeButton>
                </div>

                {/* ↓ Google button: h-10 instead of h-12, reduced margin */}
                <button
                  type="button"
                  disabled={!googleAuthEnabled}
                  onClick={handleGoogleLogin}
                  className={cn(
                    "mb-3 flex h-10 w-full items-center justify-center gap-2 rounded-tk-4 border border-app-border bg-app-surface type-button-m transition-colors",
                    googleAuthEnabled
                      ? "text-app-text hover:border-brand hover:text-brand"
                      : "cursor-not-allowed text-app-text-muted opacity-60"
                  )}
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-neutral-50 type-label-s font-bold text-neutral-900">
                    G
                  </span>
                  Continue with Google
                </button>

                {!googleAuthEnabled && (
                  <p className="-mt-1 mb-3 type-body-xs text-app-text-muted">
                    Google login will appear here after the backend is started with valid Google OAuth credentials.
                  </p>
                )}

                {/* ↓ Divider: reduced margin */}
                <div className="mb-3 flex items-center gap-3">
                  <span className="h-px flex-1 bg-app-border" />
                  <span className="type-label-s text-app-text-muted">OR CONTINUE WITH EMAIL</span>
                  <span className="h-px flex-1 bg-app-border" />
                </div>

                {/* ↓ Input stack: tighter gap */}
                <div className="grid gap-2.5">
                  {!isLogin && (
                    <EmailField
                      label="Full name"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Your name"
                      informationText=""
                    />
                  )}
                  <EmailField
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    informationText=""
                  />
                  <EmailField
                    label="Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    informationText={isLogin ? "" : "Use at least 6 characters."}
                  />
                </div>

                {isLogin && (
                  <button
                    type="button"
                    onClick={goToForgot}
                    className="mt-2 self-end type-body-xs text-brand transition-colors hover:text-brand-hover"
                  >
                    Forgot password?
                  </button>
                )}
              </>
            )}

            {successMsg && (
              <div className="mt-3 rounded-tk-4 border border-green-500 bg-app-surface p-3 type-body-s text-green-500">
                {successMsg}
              </div>
            )}
            {error && (
              <div className="mt-3 rounded-tk-4 border border-error-500 bg-app-surface p-3 type-body-s text-error-500">
                {error}
              </div>
            )}

            {/* ↓ Submit button: size 40 (was 48), reduced top margin */}
            {step !== "verify" && (
              <Button
                type="submit"
                size={40}
                variant="primary"
                disabled={loading}
                onClick={step === "forgot-sent" ? onClose : undefined}
                className="mt-4 w-full"
              >
                {submitLabel()}
              </Button>
            )}

            {step === "form" && (
              <div className="mt-3 text-center">
                <button
                  type="button"
                  className="type-body-s text-brand transition-colors hover:text-brand-hover"
                  onClick={() => switchMode(isLogin ? "signup" : "login")}
                >
                  {isLogin ? "Don't have an account? Sign up" : "Already have an account? Login"}
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
    /* ↓ min-h reduced from 600 to 480 */
    <aside className="relative hidden min-h-[480px] overflow-hidden bg-neutral-900 lg:block">
      <img src="/auth-cinema.png" alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-app-background via-app-background/15 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <p className="type-label-s text-brand">BOOK WITHOUT THE QUEUE</p>
        <h3 className="type-h3 mt-2 max-w-[300px] text-app-text">Your next cinema night starts here.</h3>
        <p className="type-body-s mt-2 max-w-[280px] text-app-text-muted">
          Login, pick a showtime, choose seats, and keep every ticket close.
        </p>
      </div>
    </aside>
  );
}

function ModeButton({ active, onClick, children }) {
  return (
    /* ↓ h-9 (36px) instead of h-10 (40px) */
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-9 rounded-tk-4 type-button-m transition-colors",
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
      className="mb-4 flex items-center gap-1.5 type-body-s text-app-text-muted transition-colors hover:text-app-text"
    >
      <ArrowLeft className="h-3.5 w-3.5" />
      Back to login
    </button>
  );
}

function VerifyEmailStep({ email, onResend, resendLoading, resendCooldown, onBack }) {
  return (
    <div>
      <BackButton onClick={onBack} />
      <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-tk-8 bg-app-surface text-brand">
        <Mail className="h-5 w-5" />
      </span>
      <p className="type-label-s mb-1.5 text-brand">CHECK YOUR EMAIL</p>
      <h2 className="type-h3 text-app-text">Verify your account</h2>
      <p className="type-body-s mt-2 max-w-[340px] text-app-text-muted">
        We sent a verification link to <span className="font-medium text-app-text">{email}</span>.
        Click the link to activate your account.
      </p>
      <div className="mt-4 rounded-tk-4 border border-app-border bg-app-surface p-3">
        <p className="type-body-s text-app-text-muted">
          Didn't receive the email? Check your spam folder or{" "}
          <button
            type="button"
            disabled={resendLoading || resendCooldown > 0}
            onClick={onResend}
            className="text-brand hover:text-brand-hover disabled:opacity-50"
          >
            {resendCooldown > 0 ? `resend in ${resendCooldown}s` : resendLoading ? "Sending..." : "resend verification email"}
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
      <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-tk-8 bg-app-surface text-brand">
        <KeyRound className="h-5 w-5" />
      </span>
      <p className="type-label-s mb-1.5 text-brand">FORGOT PASSWORD</p>
      <h2 className="type-h3 text-app-text">Reset your password</h2>
      <p className="type-body-s mb-4 mt-2 max-w-[340px] text-app-text-muted">
        Enter the email you registered with and we'll send you a reset link.
      </p>
      <EmailField label="Email" type="email" value={email} onChange={onEmailChange} placeholder="you@example.com" informationText="" />
    </div>
  );
}

function ForgotSentStep({ email }) {
  return (
    <div>
      <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-tk-8 bg-app-surface text-brand">
        <Mail className="h-5 w-5" />
      </span>
      <p className="type-label-s mb-1.5 text-brand">EMAIL SENT</p>
      <h2 className="type-h3 text-app-text">Check your inbox</h2>
      <p className="type-body-s mt-2 max-w-[340px] text-app-text-muted">
        A password reset link has been sent to <span className="font-medium text-app-text">{email}</span>.
        The link expires in <span className="font-medium text-app-text">15 minutes</span>.
      </p>
      <p className="type-body-xs mt-3 text-app-text-muted">If you don't see it, check your spam folder.</p>
    </div>
  );
}

function ResetStep({ token, onTokenChange, newPassword, onPasswordChange, onBack }) {
  return (
    <div>
      <BackButton onClick={onBack} />
      <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-tk-8 bg-app-surface text-brand">
        <KeyRound className="h-5 w-5" />
      </span>
      <p className="type-label-s mb-1.5 text-brand">RESET PASSWORD</p>
      <h2 className="type-h3 text-app-text">Set a new password</h2>
      <p className="type-body-s mb-4 mt-2 max-w-[340px] text-app-text-muted">
        Paste the reset token from your email and choose a new password.
      </p>
      <div className="grid gap-2.5">
        <EmailField label="Reset token" type="text" value={token} onChange={onTokenChange} placeholder="Paste token from email" informationText="" />
        <EmailField label="New password" type="password" value={newPassword} onChange={onPasswordChange} placeholder="New password" informationText="Use at least 6 characters." />
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
