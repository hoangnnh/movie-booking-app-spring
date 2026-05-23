import SectionHeader from "../home/SectionHeader";
import { fallbackCast } from "./movieDetailData";

export default function CastSection({ cast = fallbackCast }) {
  return (
    <section className="ticketor-container py-[40px]">
      <SectionHeader title="Cast" actionText="View All" />

      <div className="grid grid-cols-5 gap-[24px]">
        {cast.map((person) => (
          <article key={`${person.name}-${person.role}`}>
            <div className="h-[220px] overflow-hidden rounded-card bg-app-surface">
              <img
                src={person.image}
                alt={person.name}
                className="h-full w-full object-cover"
              />
            </div>

            <h3 className="type-body-s mt-[12px] text-app-text">
              {person.name}
            </h3>
            <p className="type-body-xs mt-[2px] text-app-text-muted">
              {person.role}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}