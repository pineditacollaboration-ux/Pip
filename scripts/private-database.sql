-- Apply in the Supabase SQL Editor as the database owner.
-- The Node server must use SUPABASE_SERVICE_KEY; never expose it in public/.
BEGIN;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hours ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.users, public.sessions, public.profiles, public.links, public.views, public.visitors, public.hours FROM anon, authenticated;
COMMIT;
