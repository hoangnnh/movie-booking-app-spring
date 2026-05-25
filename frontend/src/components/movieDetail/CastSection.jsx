import SectionHeader from "../home/SectionHeader";
import { useNavigate } from "react-router-dom";

export default function CastSection({ cast = [] }) {
  const navigate = useNavigate();

  if (!Array.isArray(cast) || cast.length === 0) {
    return null;
  }

  return (
    <section className="ticketor-container py-[40px]">
      <SectionHeader title="Cast" actionText="View All" />

      <div className="grid grid-cols-5 gap-[24px]">
        {cast.map((person) => (
          <button
            key={`${person.name}-${person.role || "cast"}`}
            type="button"
            onClick={() =>
              navigate(`/actors/${encodeURIComponent(person.name)}/movies`)
            }
            className="text-left transition-transform duration-200 hover:-translate-y-[2px]"
          >
            <div className="h-[220px] overflow-hidden rounded-card bg-app-surface">
              {person.imageUrl ? (
                <img
                  src={person.imageUrl}
                  alt={person.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center px-[16px] text-center type-body-s text-app-text-muted">
                  {person.name}
                </div>
              )}
            </div>

            <h3 className="type-body-s mt-[12px] text-app-text">
              {person.name}
            </h3>
            <p className="type-body-xs mt-[2px] text-app-text-muted">
              {person.role || "Cast"}
            </p>
          </button>
        ))}
      </div>
    </section>
  );
}
