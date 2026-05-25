CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_movies_search_vector
    ON movies
    USING GIN (
        to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(description, ''))
    );

CREATE INDEX IF NOT EXISTS idx_movies_title_trgm
    ON movies
    USING GIN (lower(title) gin_trgm_ops);
