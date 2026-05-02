-- ============================================================================
-- 003: practical_answer_boolean + auth.users FK validatie
-- ============================================================================

CREATE TABLE IF NOT EXISTS practical_answer_boolean (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    practical_answer_id UUID NOT NULL REFERENCES practical_answer(id) ON DELETE CASCADE,
    value BOOLEAN NOT NULL,
    created_at TIMESTAMP DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_paboolean_answer ON practical_answer_boolean(practical_answer_id);

-- Validerende FK op auth.users — Supabase auth.users staat in `auth` schema.
-- We voegen pas toe als constraint nog niet bestaat.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'practitioner_auth_user_id_fkey'
  ) THEN
    ALTER TABLE practitioner
      ADD CONSTRAINT practitioner_auth_user_id_fkey
      FOREIGN KEY (auth_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;
