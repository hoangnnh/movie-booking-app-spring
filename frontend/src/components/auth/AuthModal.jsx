import { useState } from "react";
import { Mail, X } from "lucide-react";
import { useAuth } from "../../context/useAuth";
import Button from "../common/Button";
import EmailField from "../common/EmailField";
import Logo from "../common/Logo";
import VerificationCodeInput from "../common/VerificationCodeInput";
import { cn } from "../../utils/cn";

export default function AuthModal({ mode = "login", onModeChange, onClose }) {
  const { login, register } = useAuth();
  const isLogin = mode === "login";

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [step, setStep] = useState("form");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (step === "verify") {
      if (verificationCode.length < 4) {
        setError("Enter the 4-digit verification code.");
        return;
      }

      onClose?.();
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
      }
    } catch (err) {
      setError(cleanError(err));
    } finally {
      setLoading(false);
    }
  }

  function switchMode(nextMode) {
    setStep("form");
    setError("");
    setVerificationCode("");
    onModeChange?.(nextMode);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-[24px] py-[32px]">
      <form
        onSubmit={handleSubmit}
        className="grid max-h-[92vh] w-full max-w-[940px] grid-cols-[0.95fr_1fr] overflow-hidden rounded-tk-8 border border-app-border bg-app-surface shadow-2xl"
      >
        <AuthArtwork />

        <section className="relative overflow-y-auto bg-app-background p-[36px]">
          <button
            type="button"
            aria-label="Close"
            className="absolute right-[20px] top-[20px] text-app-text-muted transition-colors hover:text-app-text"
            onClick={onClose}
          >
            <X className="h-[20px] w-[20px]" />
          </button>

          <Logo className="mb-[40px]" />

          {step === "verify" ? (
            <VerificationStep
              email={email}
              code={verificationCode}
              onCodeChange={setVerificationCode}
              onBack={() => setStep("form")}
            />
          ) : (
            <>
              <div className="mb-[28px]">
                <p className="type-label-s mb-[8px] text-brand">
                  {isLogin ? "WELCOME BACK" : "START WATCHING"}
                </p>
                <h2 className="type-h3 text-app-text">
                  {isLogin ? "Login to Ticketor" : "Create your account"}
                </h2>
                <p className="type-body-s mt-[10px] max-w-[360px] text-app-text-muted">
                  {isLogin
                    ? "Access your tickets, saved cinemas, and upcoming bookings."
                    : "Sign up to book seats faster and keep every ticket in one place."}
                </p>
              </div>

              <div className="mb-[22px] grid grid-cols-2 rounded-tk-8 border border-app-border bg-app-surface p-[4px]">
                <ModeButton active={isLogin} onClick={() => switchMode("login")}>
                  Login
                </ModeButton>
                <ModeButton active={!isLogin} onClick={() => switchMode("signup")}>
                  Sign Up
                </ModeButton>
              </div>

              <button
                type="button"
                className="mb-[22px] flex h-[48px] w-full items-center justify-center gap-[10px] rounded-tk-4 border border-app-border bg-app-surface type-button-m text-app-text transition-colors hover:border-brand hover:text-brand"
              >
                <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-neutral-50 type-label-s font-bold text-neutral-900">
                  G
                </span>
                Continue with Google
              </button>

              <div className="mb-[22px] flex items-center gap-[12px]">
                <span className="h-px flex-1 bg-app-border" />
                <span className="type-label-s text-app-text-muted">
                  OR CONTINUE WITH EMAIL
                </span>
                <span className="h-px flex-1 bg-app-border" />
              </div>

              <div className="grid gap-[16px]">
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
                <p className="type-body-xs mt-[10px] text-right text-app-text-muted">
                  Forgot password is coming later.
                </p>
              )}
            </>
          )}

          {error && (
            <div className="mt-[16px] rounded-tk-4 border border-error-500 bg-app-surface p-[12px] type-body-s text-error-500">
              {error}
            </div>
          )}

          <Button
            type="submit"
            size={48}
            variant="primary"
            disabled={loading}
            className="mt-[24px] w-full"
          >
            {getSubmitLabel({ isLogin, loading, step })}
          </Button>

          {step === "form" && (
            <div className="mt-[18px] text-center">
              <button
                type="button"
                className="type-body-s text-brand transition-colors hover:text-brand-hover"
                onClick={() => switchMode(isLogin ? "signup" : "login")}
              >
                {isLogin
                  ? "Do not have an account? Sign up"
                  : "Already have an account? Login"}
              </button>
            </div>
          )}
        </section>
      </form>
    </div>
  );
}

function AuthArtwork() {
  return (
    <aside className="relative min-h-[640px] overflow-hidden bg-neutral-900">
      <img
        src="/auth-cinema.png"
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-app-background via-app-background/15 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-[32px]">
        <p className="type-label-s text-brand">BOOK WITHOUT THE QUEUE</p>
        <h3 className="type-h3 mt-[8px] max-w-[320px] text-app-text">
          Your next cinema night starts here.
        </h3>
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
        active
          ? "bg-primary-600 text-neutral-900"
          : "text-app-text-muted hover:text-app-text"
      )}
    >
      {children}
    </button>
  );
}

function VerificationStep({ email, code, onCodeChange, onBack }) {
  return (
    <div>
      <div className="mb-[28px]">
        <span className="mb-[16px] flex h-[48px] w-[48px] items-center justify-center rounded-tk-8 bg-app-surface text-brand">
          <Mail className="h-[24px] w-[24px]" />
        </span>
        <p className="type-label-s mb-[8px] text-brand">VERIFY EMAIL</p>
        <h2 className="type-h3 text-app-text">Enter the code</h2>
        <p className="type-body-s mt-[10px] max-w-[360px] text-app-text-muted">
          We sent a 4-digit code to {email || "your email"}. For now, any code
          will complete the demo flow.
        </p>
      </div>

      <VerificationCodeInput
        value={code}
        onChange={onCodeChange}
        length={4}
        size={56}
      />

      <button
        type="button"
        className="type-body-s mt-[18px] text-brand transition-colors hover:text-brand-hover"
        onClick={onBack}
      >
        Back to sign up
      </button>
    </div>
  );
}

function getSubmitLabel({ isLogin, loading, step }) {
  if (loading) return "Please wait";
  if (step === "verify") return "Verify Account";
  return isLogin ? "Login" : "Create Account";
}

function cleanError(error) {
  const message = error?.message || "Authentication failed.";

  if (message.includes("Invalid email or password")) {
    return "Invalid email or password.";
  }

  if (message.includes("Email already exists")) {
    return "This email is already registered.";
  }

  return message;
}
