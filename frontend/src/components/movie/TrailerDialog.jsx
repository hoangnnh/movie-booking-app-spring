import { useEffect } from "react";
import { createPortal } from "react-dom";
import { getEmbeddedTrailerUrl } from "../movieDetail/trailerUtils";

export default function TrailerDialog({ title, trailerUrl, onClose }) {
  const trailerEmbedUrl = getEmbeddedTrailerUrl(trailerUrl);

  useEffect(() => {
    if (!trailerEmbedUrl) return undefined;

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, trailerEmbedUrl]);

  if (!trailerEmbedUrl) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-[20px]"
      role="dialog"
      aria-modal="true"
      aria-label={`${title} trailer`}
      onClick={(event) => {
        event.stopPropagation();
        onClose();
      }}
    >
      <div
        className="w-full max-w-[960px] overflow-hidden rounded-card border border-app-border bg-app-surface shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-app-border px-[20px] py-[16px]">
          <div>
            <p className="type-label-s text-app-text-subtle">Now playing</p>
            <h2 className="type-h5 text-app-text">{title}</h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-button border border-app-border px-[16px] py-[8px] type-button-m text-app-text transition-colors hover:bg-app-background"
          >
            Close
          </button>
        </div>

        <div className="aspect-video bg-black">
          <iframe
            src={trailerEmbedUrl}
            title={`${title} trailer`}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      </div>
    </div>,
    document.body
  );
}
