const stats = [
  {
    value: "500+",
    label: "Movies Available",
  },
  {
    value: "150+",
    label: "Cinema Locations",
  },
  {
    value: "1M+",
    label: "Happy Customers",
  },
];

export default function StatsSection() {
  return (
    <section className="ticketor-container py-[40px]">
      <div className="grid gap-[16px] sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-card border border-app-border bg-app-background p-[24px] text-center"
          >
            <p className="type-h3 text-brand">{stat.value}</p>
            <p className="type-body-s mt-[4px] text-app-text-muted">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
