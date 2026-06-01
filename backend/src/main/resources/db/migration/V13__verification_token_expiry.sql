ALTER TABLE users
    ADD COLUMN IF NOT EXISTS verification_token_expiry TIMESTAMP;
