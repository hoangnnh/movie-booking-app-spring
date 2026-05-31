ALTER TABLE movies
    ADD COLUMN IF NOT EXISTS display_status VARCHAR(30);

UPDATE movies
SET display_status = CASE
    WHEN EXISTS (
        SELECT 1
        FROM movie_list_entries entry
        WHERE entry.movie_id = movies.id
          AND entry.category = 'now_playing'
    ) THEN 'SHOWING_NOW'
    WHEN EXISTS (
        SELECT 1
        FROM movie_list_entries entry
        WHERE entry.movie_id = movies.id
          AND entry.category = 'upcoming'
    ) OR release_date > CURRENT_DATE THEN 'COMING_SOON'
    ELSE 'HIDDEN'
END
WHERE display_status IS NULL;

ALTER TABLE movies
    ALTER COLUMN display_status SET DEFAULT 'HIDDEN',
    ALTER COLUMN display_status SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_movies_display_status
    ON movies(display_status);
