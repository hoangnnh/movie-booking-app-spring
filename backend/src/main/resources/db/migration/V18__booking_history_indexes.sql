CREATE INDEX IF NOT EXISTS idx_bookings_user_created_at
    ON bookings(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tickets_booking_id
    ON tickets(booking_id);
