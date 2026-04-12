ALTER TABLE profiles
  ADD COLUMN last_active_at TIMESTAMPTZ;

UPDATE profiles p
  SET last_active_at = u.created_at
  FROM users u
  WHERE p.user_id = u.id
    AND p.last_active_at IS NULL;
