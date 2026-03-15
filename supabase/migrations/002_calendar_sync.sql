-- ============================================================
-- SynchroPlan — Migration 002: Calendar Sync Support
-- Run this in the Supabase SQL Editor after 001_initial_schema.sql
-- ============================================================

-- Add calendar sync fields to the events table.
-- These columns are additive and do not break existing rows.

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS external_id TEXT,
  ADD COLUMN IF NOT EXISTS source      TEXT NOT NULL DEFAULT 'manual'
    CHECK (source IN ('manual', 'google_calendar', 'outlook'));

-- Unique constraint: one imported event per user per Google event ID.
-- Enables upsert-by-external-id without duplicates.
CREATE UNIQUE INDEX IF NOT EXISTS idx_events_user_external_id
  ON events (user_id, external_id)
  WHERE external_id IS NOT NULL;

-- Index for fast lookup of calendar-sourced events
CREATE INDEX IF NOT EXISTS idx_events_source
  ON events (user_id, source);
