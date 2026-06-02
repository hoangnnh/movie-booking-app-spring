import { useState } from "react";
import { Clock, Play, Star } from "lucide-react";
import Button from "../common/Button";
import { cn } from "../../utils/cn";
import { getEmbeddedTrailerUrl } from "../movieDetail/trailerUtils";
import TrailerDialog from "./TrailerDialog";

export default function MovieCard({
    title = "The Dark Knight",
    genres = "Action, Drama",
    duration = "2h 2m",
    rating = "8.5",
    ageRating = "T13",
    posterUrl = "",
    trailerUrl = "",
    status = "released", // released | coming-soon | hidden
    releaseText = "Releases March 15, 2025",
    onBook,
    onOpenDetails,
    className = "",
    style,
}) {
    const [isTrailerOpen, setIsTrailerOpen] = useState(false);
    const isComingSoon = status === "coming-soon";
    const isHidden = status === "hidden";
    const trailerAvailable = Boolean(getEmbeddedTrailerUrl(trailerUrl));

    function openDetails(event) {
        if (event?.target.closest("button")) return;

        onOpenDetails?.();
    }

    function handleCardKeyDown(event) {
        if (
            event.target === event.currentTarget &&
            (event.key === "Enter" || event.key === " ")
        ) {
            event.preventDefault();
            openDetails();
        }
    }

    return (
        <article
            role="link"
            tabIndex={0}
            onClick={openDetails}
            onKeyDown={handleCardKeyDown}
            style={style}
            className={cn(
                "group w-[172px] shrink-0 cursor-pointer overflow-hidden bg-app-background text-app-text outline-none transition-transform focus-visible:ring-2 focus-visible:ring-brand",
                className
            )}
        >
            <div className="relative aspect-[2/3] w-full overflow-hidden bg-neutral-700">
                {posterUrl ? (
                    <img
                        src={posterUrl}
                        alt={title}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-neutral-700 text-app-text-muted">
                        No Poster
                    </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-80" />

                <div className="absolute bottom-[8px] left-[8px] right-[8px] flex flex-col gap-[8px] opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    {!isComingSoon && !isHidden && (
                        <Button
                            size={28}
                            variant="primary"
                            className="w-full"
                            onClick={(event) => {
                                event.stopPropagation();
                                onBook?.();
                            }}
                        >
                            Book Now
                        </Button>
                    )}

                    <Button
                        size={28}
                        variant={isComingSoon || isHidden ? "primary" : "text"}
                        tone={isComingSoon || isHidden ? "brand" : "base"}
                        disabled={!trailerAvailable}
                        className={cn(
                            "w-full",
                            !isComingSoon &&
                                !isHidden &&
                                "bg-black/55 text-white hover:bg-black/75 hover:text-white"
                        )}
                        leftIcon={<Play />}
                        onClick={(event) => {
                            event.stopPropagation();
                            setIsTrailerOpen(true);
                        }}
                    >
                        {trailerAvailable ? "Watch Trailer" : "Trailer Unavailable"}
                    </Button>
                </div>
            </div>

            <div className="pt-[8px]">
                <div className="flex items-start justify-between gap-[8px]">
                    <div className="min-w-0">
                        <h3 className="type-h6 truncate text-app-text">{title}</h3>
                        <p className="type-body-xs mt-[2px] truncate text-app-text-muted">
                            {genres}
                        </p>
                    </div>

                    {!isComingSoon && !isHidden && (
                        <div className="flex shrink-0 items-center gap-[4px]">
                            <Star className="h-[12px] w-[12px] fill-brand text-brand" />
                            <span className="type-body-xs text-app-text">{rating}</span>
                        </div>
                    )}
                </div>

                {isComingSoon || isHidden ? (
                    <p className="type-body-xs mt-[8px] text-app-text-muted">
                        {isHidden ? "Currently unavailable" : releaseText}
                    </p>
                ) : (
                    <div className="mt-[8px] flex items-center justify-between">
                        <div className="flex items-center gap-[4px] text-app-text-muted">
                            <Clock className="h-[12px] w-[12px]" />
                            <span className="type-body-xs">{duration}</span>
                        </div>

                        <span className="rounded-tk-4 border border-app-border px-[6px] py-[2px] type-body-xs text-app-text-muted">
                            {ageRating}
                        </span>
                    </div>
                )}
            </div>

            {isTrailerOpen && (
                <TrailerDialog
                    title={title}
                    trailerUrl={trailerUrl}
                    onClose={() => setIsTrailerOpen(false)}
                />
            )}
        </article>
    );
}
