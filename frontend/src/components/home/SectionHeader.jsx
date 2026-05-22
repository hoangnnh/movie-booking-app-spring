import Button from "../common/Button";

export default function SectionHeader({
  title,
  description,
  actionText = "View All",
  onAction,
}) {
  return (
    <div className="mb-[24px] flex items-end justify-between gap-[24px]">
      <div>
        <h2 className="type-h3 text-app-text">{title}</h2>

        {description && (
          <p className="type-body-m mt-[8px] text-app-text-muted">
            {description}
          </p>
        )}
      </div>

      {actionText && (
        <Button size={32} variant="text" tone="base" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  );
}