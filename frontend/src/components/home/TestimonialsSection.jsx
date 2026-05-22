import { Star } from "lucide-react";
import Avatar from "../common/Avatar";
import { testimonials } from "./homeData";

export default function TestimonialsSection() {
  return (
    <section className="ticketor-container py-[64px]">
      <div className="mb-[32px] text-center">
        <h2 className="type-h3 text-app-text">Happy Customers</h2>
        <p className="type-body-m mt-[8px] text-app-text-muted">
          Hear what our satisfied moviegoers have to say.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-[16px]">
        {testimonials.map((item, index) => (
          <article
            key={item.name}
            className="rounded-card border border-app-border bg-app-background p-[24px]"
          >
            <div className="mb-[12px] flex items-center gap-[4px] text-brand">
              {Array.from({ length: 5 }).map((_, starIndex) => (
                <Star
                  key={starIndex}
                  className="h-[14px] w-[14px] fill-brand"
                />
              ))}
            </div>

            <p className="type-body-s min-h-[96px] text-app-text-muted">
              “{item.text}”
            </p>

            <div className="mt-[20px] flex items-center gap-[12px]">
              <Avatar
                size={40}
                src={`https://i.pravatar.cc/100?img=${index + 10}`}
              />

              <div>
                <p className="type-body-s font-bold text-app-text">
                  {item.name}
                </p>
                <p className="type-body-xs text-app-text-muted">
                  {item.role}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}