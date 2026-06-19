-- ============================================================
-- Washly — Soft-delete support for machines
-- ============================================================
-- Deactivating ("deleting") a machine must keep its row and all of its
-- historical bookings/sensor data for reporting & Power BI. Instead of a hard
-- DELETE we flag the row as deleted. Run this once against the Washly database
-- (Supabase SQL editor) before relying on the soft-delete endpoint.
--
--   SUPABASE_URL = https://jekwzdcjxwlwrlecepho.supabase.co
-- ============================================================

ALTER TABLE machines
  ADD COLUMN IF NOT EXISTS is_deleted  BOOLEAN     NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS deleted_at  TIMESTAMPTZ;

-- Speeds up the "only show live machines" filter used on every machines query.
CREATE INDEX IF NOT EXISTS idx_machines_is_deleted
  ON machines (is_deleted);

COMMENT ON COLUMN machines.is_deleted IS 'TRUE = machine deactivated/archived (kept for history, hidden from the app)';
COMMENT ON COLUMN machines.deleted_at IS 'When the machine was deactivated';
