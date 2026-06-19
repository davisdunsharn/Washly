-- ============================================================
-- Washly — Enforce unique machine names at the database level
-- ============================================================
-- No two live machines may share a name (case-insensitive). Deactivated
-- (soft-deleted) machines are excluded, so a name can be reused after a
-- machine is removed. Run AFTER 001_soft_delete_machines.sql.
--
-- NOTE: if the table already contains duplicate live names, this will fail.
-- De-duplicate first (rename the copies), then re-run.
-- ============================================================

CREATE UNIQUE INDEX IF NOT EXISTS uniq_machines_name_live
  ON machines (lower(machine_name))
  WHERE is_deleted = false;
