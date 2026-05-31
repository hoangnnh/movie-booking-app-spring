import { ArrowLeft, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Button from "../components/common/Button";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <main className="ticketor-container flex min-h-[calc(100vh-72px)] items-center justify-center py-[64px] text-app-text">
      <section className="w-full max-w-[680px] text-center">
        <p className="text-[88px] font-extrabold leading-none text-brand sm:text-[132px]">404</p>
        <h1 className="type-h2 mt-[16px]">Page not found</h1>
        <p className="type-body-m mx-auto mt-[12px] max-w-[520px] text-app-text-muted">
          The page you requested does not exist or may have been moved.
        </p>

        <div className="mt-[28px] flex flex-col justify-center gap-[12px] sm:flex-row">
          <Button variant="outline" tone="base" leftIcon={<ArrowLeft />} onClick={() => navigate(-1)}>
            Go Back
          </Button>
          <Button leftIcon={<Home />} onClick={() => navigate("/")}>
            Home
          </Button>
        </div>
      </section>
    </main>
  );
}
