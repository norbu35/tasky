-- Apple Sign-In support: add apple_sub column to users table.
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS apple_sub text;
CREATE INDEX IF NOT EXISTS idx_users_apple_sub ON public.users (apple_sub) WHERE apple_sub IS NOT NULL;
