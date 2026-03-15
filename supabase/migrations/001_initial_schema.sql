-- ============================================================
-- SynchroPlan — Initial Database Schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- ─── EVENTS ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS events (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  location         TEXT NOT NULL DEFAULT '',
  start_time       TIMESTAMPTZ NOT NULL,
  end_time         TIMESTAMPTZ NOT NULL,
  priority         TEXT NOT NULL DEFAULT 'medium'
                     CHECK (priority IN ('high', 'medium', 'low')),
  type             TEXT NOT NULL DEFAULT 'meeting'
                     CHECK (type IN ('meeting', 'task', 'travel', 'personal')),
  latitude         NUMERIC(10, 7),
  longitude        NUMERIC(10, 7),
  notes            TEXT,
  has_conflict     BOOLEAN DEFAULT false,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "events: users access own rows"
  ON events FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_events_user_time ON events (user_id, start_time);

-- ─── ROUTES ─────────────────────────────────────────────────
-- Note: "from" and "to" are SQL reserved words — stored as
-- from_location / to_location and mapped back in the API layer.

CREATE TABLE IF NOT EXISTS routes (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  from_location    TEXT NOT NULL,
  to_location      TEXT NOT NULL,
  mode             TEXT NOT NULL
                     CHECK (mode IN ('driving', 'transit', 'walking', 'cycling')),
  duration         INTEGER NOT NULL,          -- minutes
  distance         NUMERIC(8, 2) NOT NULL,    -- km
  cost             NUMERIC(10, 2) NOT NULL DEFAULT 0,
  arrival_time     TIMESTAMPTZ,
  status           TEXT NOT NULL DEFAULT 'normal'
                     CHECK (status IN ('optimal', 'delayed', 'normal')),
  traffic_level    TEXT CHECK (traffic_level IN ('low', 'medium', 'high')),
  created_at       TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE routes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "routes: users access own rows"
  ON routes FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_routes_user ON routes (user_id);

-- ─── EXPENSES ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS expenses (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category          TEXT NOT NULL
                      CHECK (category IN ('transport', 'food', 'accommodation', 'other')),
  amount            NUMERIC(10, 2) NOT NULL,
  description       TEXT NOT NULL DEFAULT '',
  date              TIMESTAMPTZ NOT NULL,
  related_event_id  UUID REFERENCES events(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "expenses: users access own rows"
  ON expenses FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_expenses_user_date ON expenses (user_id, date);

-- ─── PREFERENCES ─────────────────────────────────────────────
-- One row per user (enforced by UNIQUE constraint on user_id).
-- Use upsert (INSERT ... ON CONFLICT DO UPDATE) for mutations.

CREATE TABLE IF NOT EXISTS preferences (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  preferred_transport  TEXT NOT NULL DEFAULT 'transit',
  max_budget           NUMERIC(10, 2) NOT NULL DEFAULT 500,
  priority_mode        BOOLEAN NOT NULL DEFAULT true,
  created_at           TIMESTAMPTZ DEFAULT now(),
  updated_at           TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id)
);

ALTER TABLE preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "preferences: users access own rows"
  ON preferences FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── AI INSIGHTS ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ai_insights (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type          TEXT NOT NULL CHECK (type IN ('time', 'cost', 'route')),
  title         TEXT NOT NULL,
  description   TEXT NOT NULL,
  impact        TEXT NOT NULL DEFAULT '',
  is_dismissed  BOOLEAN DEFAULT false,
  created_at    TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_insights: users access own rows"
  ON ai_insights FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_insights_user_active
  ON ai_insights (user_id, is_dismissed, created_at);

-- ─── updated_at trigger (events & preferences) ───────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER preferences_updated_at
  BEFORE UPDATE ON preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
