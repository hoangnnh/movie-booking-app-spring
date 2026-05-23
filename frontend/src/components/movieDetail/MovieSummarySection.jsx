export default function MovieSummarySection({ movie }) {
  return (
    <section className="ticketor-container py-[56px]">
      <div className="grid grid-cols-12 gap-[24px]">
        <div className="col-span-8">
          <h2 className="type-h5 mb-[16px] text-app-text">Summary</h2>

          <p className="type-body-m leading-[1.7] text-app-text-muted">
            {movie.description ||
              "Dubbed the greatest that never was, the film follows a former racing talent returning for one last shot at saving his team and proving himself on the biggest stage."}
          </p>
        </div>

        <aside className="col-span-4 rounded-card border border-app-border bg-app-background p-[24px]">
          <div>
            <p className="type-body-s text-app-text-muted">Director</p>
            <p className="type-h6 mt-[4px] text-app-text">Joseph Kosinski</p>
          </div>

          <div className="mt-[24px]">
            <p className="type-body-s text-app-text-muted">Writers</p>
            <p className="type-h6 mt-[4px] text-app-text">
              Ehren Kruger · Joseph Kosinski
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}