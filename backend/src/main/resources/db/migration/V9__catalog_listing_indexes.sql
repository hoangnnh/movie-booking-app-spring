CREATE INDEX IF NOT EXISTS idx_movies_display_status_created_at_title
    ON movies(display_status, created_at DESC, title ASC);

CREATE INDEX IF NOT EXISTS idx_bookings_created_at
    ON bookings(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_users_created_at
    ON users(created_at DESC);
