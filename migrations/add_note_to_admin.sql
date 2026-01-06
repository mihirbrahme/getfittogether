-- Migration: Add Admin Check-in Visibility Features
-- Run this in Supabase SQL Editor
-- Created: 2026-01-06

-- =====================================================
-- STEP 1: ADD NOTE_TO_ADMIN COLUMN
-- =====================================================
-- Allows participants to leave optional notes for admin during check-in

ALTER TABLE daily_logs ADD COLUMN IF NOT EXISTS note_to_admin TEXT;

-- =====================================================
-- VERIFICATION
-- =====================================================
-- Check the column was added:
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'daily_logs' AND column_name = 'note_to_admin';
