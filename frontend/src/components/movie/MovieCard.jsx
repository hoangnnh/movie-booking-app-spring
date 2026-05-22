import { Clock, Play, Star } from "lucide-react";
import Button from "../common/Button";
import { cn } from "../../utils/cn";

export default function MovieCard({
    title = "The Dark Knight",
    genres = "Action, Drama",
    duration = "2h 2m",
    rating = "8.5",
    ageRating = "PG-13",
    posterUrl = "",
    status = "released", // released | coming-soon
    releaseText = "Releases March 15, 2025",
    onBook,
    onTrailer,
    className = "",
}) {
    const isComingSoon = status === "coming-soon";

    return (
        <article
            className={cn(
                "group w-[172px] overflow-hidden bg-app-background text-app-text",
                className
            )}
        >
            <div className="relative h-[244px] w-full overflow-hidden bg-neutral-700">
                {posterUrl ? (
                    <img
                        src={posterUrl}
                        alt={title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-neutral-700 text-app-text-muted">
                        No Poster
                    </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-80" />

                <div className="absolute bottom-[8px] left-[8px] right-[8px] flex flex-col gap-[8px] opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    {!isComingSoon && (
                        <Button size={28} variant="primary" className="w-full" onClick={onBook}>
                            Book Now
                        </Button>
                    )}

                    <Button
                        size={28}
                        variant={isComingSoon ? "primary" : "text"}
                        tone={isComingSoon ? "brand" : "base"}
                        className="w-full"
                        leftIcon={<Play />}
                        onClick={onTrailer}
                    >
                        Watch Trailer
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

                    {!isComingSoon && (
                        <div className="flex shrink-0 items-center gap-[4px]">
                            <Star className="h-[12px] w-[12px] fill-brand text-brand" />
                            <span className="type-body-xs text-app-text">{rating}</span>
                        </div>
                    )}
                </div>

                {isComingSoon ? (
                    <p className="type-body-xs mt-[8px] text-app-text-muted">
                        {releaseText}
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
        </article>
    );
}