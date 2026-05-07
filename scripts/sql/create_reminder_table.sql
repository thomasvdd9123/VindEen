-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor → New query)
CREATE TABLE IF NOT EXISTS profile_payment_reminder (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
  reminder_type text NOT NULL,   -- '1h' | '1d' | '2d' | '1w' | '1m'
  sent_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(profile_id, reminder_type)
);
CREATE INDEX IF NOT EXISTS idx_ppr_profile_id ON profile_payment_reminder(profile_id);
