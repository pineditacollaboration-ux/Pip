-- Schema para pip en Supabase (PostgreSQL)

-- 1. Usuarios
CREATE TABLE IF NOT EXISTS public.users (
  id BIGSERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW())::BIGINT,
  discord_id TEXT UNIQUE,
  discord_name TEXT,
  discord_avatar TEXT,
  discord_banner TEXT,
  discord_decoration TEXT
);

CREATE INDEX IF NOT EXISTS idx_users_username_lower ON public.users (LOWER(username));

-- 2. Sesiones
CREATE TABLE IF NOT EXISTS public.sessions (
  token_hash TEXT PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  expires_at BIGINT NOT NULL
);

-- 3. Perfiles
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id BIGINT PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT '',
  bio TEXT NOT NULL DEFAULT '',
  accent TEXT NOT NULL DEFAULT '#F2F2F2',
  background TEXT NOT NULL DEFAULT 'aurora',
  avatar TEXT NOT NULL DEFAULT '',
  banner TEXT NOT NULL DEFAULT '',
  bg_media TEXT NOT NULL DEFAULT '',
  bg_blur INTEGER NOT NULL DEFAULT 0,
  bg_opacity INTEGER NOT NULL DEFAULT 100,
  bg_vignette INTEGER NOT NULL DEFAULT 40,
  particles INTEGER NOT NULL DEFAULT 1,
  splash INTEGER NOT NULL DEFAULT 0,
  splash_text TEXT NOT NULL DEFAULT 'Haz clic para entrar',
  settings JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- 4. Enlaces
CREATE TABLE IF NOT EXISTS public.links (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  clicks INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_links_user ON public.links(user_id, position);

-- 5. Visitas diarias
CREATE TABLE IF NOT EXISTS public.views (
  user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  day DATE NOT NULL DEFAULT CURRENT_DATE,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, day)
);

-- 6. Visitantes únicos
CREATE TABLE IF NOT EXISTS public.visitors (
  user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  day DATE NOT NULL DEFAULT CURRENT_DATE,
  hash TEXT NOT NULL,
  PRIMARY KEY (user_id, day, hash)
);

-- 7. Visitas por hora
CREATE TABLE IF NOT EXISTS public.hours (
  user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  hour INTEGER NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, hour)
);
