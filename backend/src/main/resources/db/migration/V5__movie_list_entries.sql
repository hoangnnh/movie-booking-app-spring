CREATE TABLE IF NOT EXISTS movie_list_entries (
    id UUID PRIMARY KEY,
    category VARCHAR(80) NOT NULL,
    movie_id UUID NOT NULL REFERENCES movies(id),
    sort_order INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP,
    CONSTRAINT uk_movie_list_entry_category_movie UNIQUE (category, movie_id)
);

CREATE INDEX IF NOT EXISTS idx_movie_list_entries_category_sort
    ON movie_list_entries(category, sort_order);
