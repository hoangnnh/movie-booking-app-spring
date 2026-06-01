UPDATE users
SET email_verified = TRUE
WHERE email = 'user@example.com'
  AND email_verified = FALSE;
