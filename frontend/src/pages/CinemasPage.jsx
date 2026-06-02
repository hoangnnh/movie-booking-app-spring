import { useEffect, useMemo, useState } from "react";
import { MapPin, Phone } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { cinemaApi } from "../api/api";

const filterLabels = {
  all: "All Theaters",
  "3d": "3D Theaters",
  special: "Special Theaters",
};

export default function CinemasPage() {
  const [searchParams] = useSearchParams();
  const [cinemas, setCinemas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const requestedType = searchParams.get("type");
  const type = requestedType === "3d" || requestedType === "special" ? requestedType : "all";

  useEffect(() => {
    async function loadCinemas() {
      try {
        setLoading(true);
        setError("");
        const data = await cinemaApi.getAll();
        setCinemas(Array.isArray(data) ? data : []);
      } catch {
        setError("Cannot load cinemas from server.");
      } finally {
        setLoading(false);
      }
    }

    loadCinemas();
  }, []);

  const visibleCinemas = useMemo(() => {
    if (type === "all") return cinemas;

    return cinemas.filter((cinema) => {
      const amenities = Array.isArray(cinema.amenities) ? cinema.amenities.join(" ").toLowerCase() : "";

      return type === "3d"
        ? amenities.includes("3d")
        : amenities.includes("imax") || amenities.includes("premium") || amenities.includes("special");
    });
  }, [cinemas, type]);

  return (
    <main className="ticketor-container min-h-screen py-[48px] text-app-text">
      <p className="type-label-m text-brand">CINEMAS</p>
      <h1 className="type-h2 mt-[8px]">{filterLabels[type]}</h1>
      <p className="type-body-m mt-[8px] text-app-text-muted">
        Find a theater and choose the cinema experience for your next booking.
      </p>

      {loading && <p className="mt-[32px] type-body-m text-app-text-muted">Loading cinemas...</p>}
      {error && <p className="mt-[32px] type-body-m text-error-500">{error}</p>}

      {!loading && !error && (
        <section className="mt-[32px] grid gap-[16px] md:grid-cols-2">
          {visibleCinemas.map((cinema) => (
            <article key={cinema.id} className="rounded-tk-8 border border-app-border bg-app-surface p-[20px]">
              <p className="type-body-xs text-brand">{cinema.brand || "CinemaTick Cinema"}</p>
              <h2 className="type-h5 mt-[4px]">{cinema.name}</h2>
              <p className="mt-[14px] flex gap-[8px] type-body-s text-app-text-muted">
                <MapPin className="h-[18px] w-[18px] shrink-0" />
                {cinema.address}
              </p>
              {cinema.hotline && (
                <p className="mt-[8px] flex gap-[8px] type-body-s text-app-text-muted">
                  <Phone className="h-[18px] w-[18px] shrink-0" />
                  {cinema.hotline}
                </p>
              )}
              {cinema.amenities?.length > 0 && (
                <div className="mt-[16px] flex flex-wrap gap-[8px]">
                  {cinema.amenities.map((amenity) => (
                    <span key={amenity} className="rounded-tk-4 border border-app-border px-[8px] py-[4px] type-body-xs text-app-text-muted">
                      {amenity}
                    </span>
                  ))}
                </div>
              )}
            </article>
          ))}

          {visibleCinemas.length === 0 && (
            <p className="type-body-m text-app-text-muted">No cinemas match this category yet.</p>
          )}
        </section>
      )}
    </main>
  );
}
