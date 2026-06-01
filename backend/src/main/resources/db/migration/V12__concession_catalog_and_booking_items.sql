CREATE TABLE IF NOT EXISTS food_items (
    id UUID PRIMARY KEY,
    slug VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    description VARCHAR(500),
    category VARCHAR(30) NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    image_url VARCHAR(500),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS booking_food_items (
    id UUID PRIMARY KEY,
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    food_item_id UUID REFERENCES food_items(id),
    item_name_snapshot VARCHAR(150) NOT NULL,
    unit_price_snapshot NUMERIC(10, 2) NOT NULL,
    quantity INTEGER NOT NULL,
    line_total NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_food_items_active_sort_order
    ON food_items(active, sort_order ASC);

CREATE INDEX IF NOT EXISTS idx_booking_food_items_booking_id
    ON booking_food_items(booking_id);

INSERT INTO food_items (id, slug, name, description, category, price, image_url, active, sort_order, created_at, updated_at)
VALUES
    ('10000000-0000-0000-0000-000000000001', 'sweet-popcorn', 'Sweet Popcorn', 'Classic cinema popcorn with a light sweet coating.', 'POPCORN', 65000, NULL, TRUE, 10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('10000000-0000-0000-0000-000000000002', 'caramel-popcorn', 'Caramel Popcorn', 'Crunchy popcorn finished with a caramel glaze.', 'POPCORN', 74000, NULL, TRUE, 20, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('10000000-0000-0000-0000-000000000003', 'cheese-popcorn', 'Cheese Popcorn', 'Cinema popcorn seasoned with a savory cheese flavor.', 'POPCORN', 80000, NULL, TRUE, 30, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('10000000-0000-0000-0000-000000000004', 'hot-dog', 'Hot Dog', 'Warm bun with a grilled sausage and classic sauce.', 'FOOD', 42000, NULL, TRUE, 40, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('10000000-0000-0000-0000-000000000005', 'sausage', 'Sausage', 'Grilled cinema snack sausage served hot.', 'FOOD', 32000, NULL, TRUE, 50, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('10000000-0000-0000-0000-000000000006', 'large-soft-drink', 'Large Soft Drink', 'A chilled large soft drink for your movie.', 'DRINK', 35000, NULL, TRUE, 60, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('10000000-0000-0000-0000-000000000007', 'bottled-water', 'Bottled Water', 'Refreshing bottled drinking water.', 'DRINK', 20000, NULL, TRUE, 70, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('10000000-0000-0000-0000-000000000008', 'my-combo', 'My Combo', 'One sweet popcorn and one large soft drink.', 'COMBO', 95000, NULL, TRUE, 80, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('10000000-0000-0000-0000-000000000009', 'couple-combo', 'Couple Combo', 'One sweet popcorn and two large soft drinks.', 'COMBO', 125000, NULL, TRUE, 90, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;
