-- Migration: Add encrypted columns to biometric_logs
-- This enables client-side encryption of sensitive health data

-- Add encrypted columns alongside existing ones
-- This allows gradual migration with backward compatibility

ALTER TABLE biometric_logs 
ADD COLUMN IF NOT EXISTS weight_kg_encrypted TEXT,
ADD COLUMN IF NOT EXISTS body_fat_encrypted TEXT,
ADD COLUMN IF NOT EXISTS muscle_mass_encrypted TEXT,
ADD COLUMN IF NOT EXISTS height_cm_encrypted TEXT,
ADD COLUMN IF NOT EXISTS is_encrypted BOOLEAN DEFAULT false;

-- Add comment explaining encryption
COMMENT ON COLUMN biometric_logs.is_encrypted IS 'True if this row uses client-side encryption';
COMMENT ON COLUMN biometric_logs.weight_kg_encrypted IS 'AES-GCM encrypted weight value (base64)';
COMMENT ON COLUMN biometric_logs.body_fat_encrypted IS 'AES-GCM encrypted body fat value (base64)';
COMMENT ON COLUMN biometric_logs.muscle_mass_encrypted IS 'AES-GCM encrypted muscle mass value (base64)';
COMMENT ON COLUMN biometric_logs.height_cm_encrypted IS 'AES-GCM encrypted height value (base64)';

-- Note: Original unencrypted columns are kept for backward compatibility
-- New entries from the app will use encrypted columns with is_encrypted=true
-- A separate data migration can be run to encrypt existing unencrypted data
