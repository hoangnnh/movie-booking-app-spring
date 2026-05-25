import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/useAuth";

export default function OAuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { completeOAuthLogin } = useAuth();
  const hasHandled = useRef(false);

  const error = searchParams.get("error");

  useEffect(() => {
    if (hasHandled.current || error) {
      return;
    }

    const token = searchParams.get("token");
    const userId = searchParams.get("userId");
    const fullName = searchParams.get("fullName");
    const email = searchParams.get("email");
    const role = searchParams.get("role");
    const provider = searchParams.get("provider");

    if (!token || !userId || !fullName || !email || !role || !provider) {
      return;
    }

    hasHandled.current = true;

    completeOAuthLogin({
      accessToken: token,
      userId,
      fullName,
      email,
      role,
      provider,
    });

    navigate("/", { replace: true });
  }, [completeOAuthLogin, error, navigate, searchParams]);

  return (
    <div className="ticketor-container py-[96px]">
      <div className="mx-auto max-w-[520px] rounded-tk-8 border border-app-border bg-app-surface p-[24px] text-center">
        <h1 className="type-h4 text-app-text">Google Login</h1>
        <p className="type-body-m mt-[12px] text-app-text-muted">
          {error || "Finishing your sign-in..."}
        </p>
      </div>
    </div>
  );
}
