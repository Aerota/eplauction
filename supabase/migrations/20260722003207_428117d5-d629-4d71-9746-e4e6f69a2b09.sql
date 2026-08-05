
-- Enums
CREATE TYPE public.app_role AS ENUM ('admin', 'team_manager', 'player');
CREATE TYPE public.player_gender AS ENUM ('male', 'female');
CREATE TYPE public.player_role AS ENUM ('batsman', 'bowler', 'all_rounder', 'wicket_keeper');
CREATE TYPE public.player_category AS ENUM ('A', 'B', 'C');
CREATE TYPE public.player_status AS ENUM ('pending', 'available', 'sold', 'unsold', 'pre_assigned');

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are viewable by authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- User roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, app_role) TO authenticated;

-- Auction settings (single row)
CREATE TABLE public.auction_settings (
  id INT PRIMARY KEY DEFAULT 1,
  team_budget NUMERIC NOT NULL DEFAULT 100,
  players_per_team INT NOT NULL DEFAULT 11,
  base_price_a NUMERIC NOT NULL DEFAULT 2,
  base_price_b NUMERIC NOT NULL DEFAULT 1,
  base_price_c NUMERIC NOT NULL DEFAULT 0.5,
  bid_increment NUMERIC NOT NULL DEFAULT 0.5,
  current_player_id UUID,
  current_bid NUMERIC DEFAULT 0,
  current_bid_team_id UUID,
  auction_round INT NOT NULL DEFAULT 0,
  is_live BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);
INSERT INTO public.auction_settings (id) VALUES (1);
GRANT SELECT ON public.auction_settings TO authenticated, anon;
GRANT ALL ON public.auction_settings TO service_role;
ALTER TABLE public.auction_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view auction settings" ON public.auction_settings FOR SELECT USING (true);
CREATE POLICY "Admins can update auction settings" ON public.auction_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Teams
CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  manager_name TEXT NOT NULL,
  team_name TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  budget_remaining NUMERIC NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (manager_id)
);
GRANT SELECT ON public.teams TO authenticated, anon;
GRANT INSERT, UPDATE ON public.teams TO authenticated;
GRANT ALL ON public.teams TO service_role;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view teams" ON public.teams FOR SELECT TO anon USING (true);
CREATE POLICY "Managers can insert own team" ON public.teams FOR INSERT TO authenticated WITH CHECK (auth.uid() = manager_id);
CREATE POLICY "Managers can update own team" ON public.teams FOR UPDATE TO authenticated USING (auth.uid() = manager_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete teams" ON public.teams FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Players
CREATE TABLE public.players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  age INT,
  gender player_gender NOT NULL DEFAULT 'male',
  photo_url TEXT,
  primary_role player_role NOT NULL DEFAULT 'batsman',
  batting_style TEXT,
  bowling_style TEXT,
  years_experience INT DEFAULT 0,
  matches_played INT DEFAULT 0,
  batting_average NUMERIC DEFAULT 0,
  bowling_average NUMERIC DEFAULT 0,
  highest_score INT DEFAULT 0,
  best_bowling TEXT,
  fitness_notes TEXT,
  achievements TEXT,
  extra_info TEXT,
  -- AI results
  skill_level INT DEFAULT 0, -- 0-100
  fitness_level INT DEFAULT 0, -- 0-100
  category player_category,
  ai_summary TEXT,
  base_price NUMERIC,
  -- Auction state
  status player_status NOT NULL DEFAULT 'pending',
  sold_to_team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  sold_price NUMERIC,
  auction_round INT DEFAULT 0,
  is_pre_assigned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.players TO authenticated, anon;
GRANT INSERT, UPDATE ON public.players TO authenticated;
GRANT ALL ON public.players TO service_role;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view players" ON public.players FOR SELECT USING (true);
CREATE POLICY "Anyone authenticated can register as player" ON public.players FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Players can update own record" ON public.players FOR UPDATE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete players" ON public.players FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Bids history (for live streaming)
CREATE TABLE public.bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.bids TO authenticated, anon;
GRANT INSERT ON public.bids TO authenticated;
GRANT ALL ON public.bids TO service_role;
ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view bids" ON public.bids FOR SELECT USING (true);
CREATE POLICY "Team managers can insert bids" ON public.bids FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.teams WHERE id = team_id AND manager_id = auth.uid())
);

-- Handle new user -> profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Claim admin role for the designated admin email
CREATE OR REPLACE FUNCTION public.claim_admin_role()
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_email TEXT;
BEGIN
  SELECT email INTO v_email FROM auth.users WHERE id = auth.uid();
  IF v_email IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF lower(v_email) <> 'methvinbinuka@gmail.com' THEN
    RAISE EXCEPTION 'Not authorized to claim admin role';
  END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (auth.uid(), 'admin')
  ON CONFLICT DO NOTHING;
  RETURN true;
END;
$$;
GRANT EXECUTE ON FUNCTION public.claim_admin_role() TO authenticated;

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.auction_settings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.players;
ALTER PUBLICATION supabase_realtime ADD TABLE public.teams;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bids;
