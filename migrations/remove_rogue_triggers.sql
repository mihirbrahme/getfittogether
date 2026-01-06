-- Migration: Remove Rogue Triggers on daily_logs
-- This script removes any BEFORE INSERT/UPDATE triggers that might be overriding points
-- Run this in Supabase SQL Editor

DO $$
DECLARE
    trg_name TEXT;
BEGIN
    FOR trg_name IN 
        SELECT trigger_name 
        FROM information_schema.triggers 
        WHERE event_object_table = 'daily_logs' 
        AND action_timing = 'BEFORE' 
        AND (event_manipulation = 'INSERT' OR event_manipulation = 'UPDATE')
    LOOP
        RAISE NOTICE 'Dropping trigger: %', trg_name;
        EXECUTE 'DROP TRIGGER IF EXISTS ' || quote_ident(trg_name) || ' ON daily_logs;';
    END LOOP;
END $$;
