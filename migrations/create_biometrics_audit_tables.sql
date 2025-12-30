-- Phase 1: Biometric Logs & Audit Logs Setup
-- This migration creates tables for tracking biometric history and audit logs

-- =====================================================
-- BIOMETRIC LOGS TABLE
-- =====================================================
-- Stores historical biometric measurements for participants
-- Allows tracking progress over time

CREATE TABLE IF NOT EXISTS biometric_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    weight_kg NUMERIC(5,2),
    height_cm NUMERIC(5,2),
    body_fat_percentage NUMERIC(4,2),
    muscle_mass_percentage NUMERIC(4,2),
    -- BMI is auto-calculated from weight and height
    bmi NUMERIC(4,2) GENERATED ALWAYS AS (
        CASE 
            WHEN height_cm > 0 THEN 
                ROUND((weight_kg / ((height_cm/100) * (height_cm/100)))::numeric, 2)
            ELSE NULL 
        END
    ) STORED,
    measured_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_biometric_logs_user_id ON biometric_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_biometric_logs_measured_at ON biometric_logs(measured_at DESC);

-- RLS Policies
ALTER TABLE biometric_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their own biometric logs
DROP POLICY IF EXISTS "Users can view own biometric logs" ON biometric_logs;
CREATE POLICY "Users can view own biometric logs"
    ON biometric_logs FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own biometric logs
DROP POLICY IF EXISTS "Users can insert own biometric logs" ON biometric_logs;
CREATE POLICY "Users can insert own biometric logs"
    ON biometric_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Admins can view all biometric logs
DROP POLICY IF EXISTS "Admins can view all biometric logs" ON biometric_logs;
CREATE POLICY "Admins can view all biometric logs"
    ON biometric_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- =====================================================
-- MIGRATE EXISTING DATA
-- =====================================================
-- Copy existing biometric data from profiles to biometric_logs
-- This is a one-time migration for existing users

INSERT INTO biometric_logs (user_id, weight_kg, height_cm, body_fat_percentage, muscle_mass_percentage, measured_at)
SELECT 
    id,
    weight,  -- profiles table uses 'weight' not 'weight_kg'
    height,  -- profiles table uses 'height' not 'height_cm'
    body_fat_percentage,
    muscle_mass_percentage,
    created_at
FROM profiles
WHERE (weight IS NOT NULL OR body_fat_percentage IS NOT NULL OR muscle_mass_percentage IS NOT NULL)
ON CONFLICT DO NOTHING;

-- =====================================================
-- AUDIT LOGS TABLE
-- =====================================================
-- Comprehensive audit trail for all participant actions
-- Supports compliance and debugging

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);

-- RLS Policies
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
DROP POLICY IF EXISTS "Only admins can view audit logs" ON audit_logs;
CREATE POLICY "Only admins can view audit logs"
    ON audit_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- System can insert audit logs (authenticated users can log their actions)
DROP POLICY IF EXISTS "Authenticated users can insert audit logs" ON audit_logs;
CREATE POLICY "Authenticated users can insert audit logs"
    ON audit_logs FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these to verify the migration was successful

-- Check biometric_logs table
-- SELECT COUNT(*) as total_biometric_entries FROM biometric_logs;

-- Check audit_logs table
-- SELECT COUNT(*) as total_audit_entries FROM audit_logs;

-- View sample biometric data
-- SELECT 
--     bl.id,
--     p.first_name,
--     p.last_name,
--     bl.weight_kg,
--     bl.bmi,
--     bl.measured_at
-- FROM biometric_logs bl
-- JOIN profiles p ON p.id = bl.user_id
-- ORDER BY bl.measured_at DESC
-- LIMIT 10;
