ALTER TABLE bookings
    ADD COLUMN IF NOT EXISTS ticket_amount NUMERIC(10, 2),
    ADD COLUMN IF NOT EXISTS food_amount NUMERIC(10, 2),
    ADD COLUMN IF NOT EXISTS payment_method VARCHAR(40),
    ADD COLUMN IF NOT EXISTS payment_status VARCHAR(30),
    ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(80);

UPDATE bookings
SET
    ticket_amount = COALESCE(ticket_amount, total_amount),
    food_amount = COALESCE(food_amount, 0),
    payment_method = COALESCE(payment_method, 'DEMO_CARD'),
    payment_status = COALESCE(payment_status, 'PAID'),
    payment_reference = COALESCE(payment_reference, 'PAY-DEMO')
WHERE ticket_amount IS NULL
   OR food_amount IS NULL
   OR payment_method IS NULL
   OR payment_status IS NULL
   OR payment_reference IS NULL;
