CREATE TABLE IF NOT EXISTS movie_reviews (
    id UUID PRIMARY KEY,
    movie_id UUID NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    score INTEGER NOT NULL CHECK (score BETWEEN 1 AND 10),
    title VARCHAR(120) NOT NULL,
    body TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP,
    CONSTRAINT uk_movie_reviews_movie_user UNIQUE (movie_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_movie_reviews_movie_created_at
    ON movie_reviews (movie_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_movie_reviews_user
    ON movie_reviews (user_id);
