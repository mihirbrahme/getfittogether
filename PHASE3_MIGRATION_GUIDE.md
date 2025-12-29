# Phase 3 Database Migration Guide
## Get Fit Together - Supabase Migrations

**Date:** December 29, 2025  
**Phase:** Phase 3 Admin Portal Enhancements  
**Total Migrations:** 2

---

## 🎯 Overview

This guide contains all database schema changes required for Phase 3 features. Run these migrations in your Supabase SQL Editor in the order specified.

---

## 📋 Migration Checklist

- [ ] Migration 1: Add YouTube Video URL Support
- [ ] Migration 2: Create Squad-Specific WOD Assignments
- [ ] Verify migrations completed successfully
- [ ] Test features in application

---

## 🚀 Migration 1: YouTube Video URL Support

**Purpose:** Add video URL fields to support YouTube exercise demonstrations

**File:** `phase3_add_video_url.sql`

**What it does:**
- Adds `video_url` column to `wods` table
- Adds `video_url` column to `workout_library` table
- Adds documentation comments

### SQL Command:

```sql
-- Phase 3 Enhancement: Add YouTube video link support to WODs
-- Migration: Add video_url field to wods table

ALTER TABLE wods ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Add video_url to workout_library as well for templates
ALTER TABLE workout_library ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Optional: Add comment for documentation
COMMENT ON COLUMN wods.video_url IS 'YouTube or video URL for exercise demonstration';
COMMENT ON COLUMN workout_library.video_url IS 'YouTube or video URL for exercise demonstration template';
```

### Expected Result:
```
ALTER TABLE
ALTER TABLE
COMMENT
COMMENT
```

---

## 🚀 Migration 2: Squad-Specific WOD Assignments

**Purpose:** Enable many-to-many relationship between WODs and Squads

**File:** `phase3_wod_squad_assignments.sql`

**What it does:**
- Creates `wod_squad_assignments` junction table
- Adds indexes for performance
- Migrates existing data from `wods.group_id`
- Sets up RLS policies
- Maintains backward compatibility

### SQL Command:

```sql
-- Phase 3 Sprint 1 Task 2.1: Squad-Specific WOD Assignment
-- Create many-to-many relationship between WODs and Squads

-- Create the junction table for WOD-Squad assignments
CREATE TABLE IF NOT EXISTS wod_squad_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wod_id UUID REFERENCES wods(id) ON DELETE CASCADE NOT NULL,
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(wod_id, group_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_wod_squad_wod_id ON wod_squad_assignments(wod_id);
CREATE INDEX IF NOT EXISTS idx_wod_squad_group_id ON wod_squad_assignments(group_id);

-- Migrate existing data from wods.group_id to junction table
-- Only migrate where group_id is not null
INSERT INTO wod_squad_assignments (wod_id, group_id)
SELECT id, group_id 
FROM wods 
WHERE group_id IS NOT NULL
ON CONFLICT (wod_id, group_id) DO NOTHING;

-- Optional: Keep group_id column for backward compatibility
-- Or drop it if you want to enforce the new structure
-- ALTER TABLE wods DROP COLUMN group_id;

-- Add RLS policies for the new table
ALTER TABLE wod_squad_assignments ENABLE ROW LEVEL SECURITY;

-- Everyone can view assignments
CREATE POLICY "Everyone can view WOD assignments" ON wod_squad_assignments 
    FOR SELECT TO authenticated USING (TRUE);

-- Admins can manage assignments
CREATE POLICY "Admins can manage WOD assignments" ON wod_squad_assignments 
    FOR ALL USING (is_admin());

-- Add comment for documentation
COMMENT ON TABLE wod_squad_assignments IS 'Many-to-many relationship between WODs and Squads/Groups';
```

### Expected Result:
```
CREATE TABLE
CREATE INDEX
CREATE INDEX
INSERT 0 X  -- (X = number of existing WOD-squad relationships migrated)
ALTER TABLE
CREATE POLICY
CREATE POLICY
COMMENT
```

---

## 📝 Step-by-Step Instructions

### **Step 1: Access Supabase SQL Editor**

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** from the left sidebar
3. Click **+ New query**

### **Step 2: Run Migration 1**

1. Copy the entire SQL from Migration 1 above
2. Paste into the SQL Editor
3. Click **Run** or press `Ctrl+Enter`
4. Verify success messages appear
5. Confirm no errors

### **Step 3: Run Migration 2**

1. Copy the entire SQL from Migration 2 above
2. Paste into the SQL Editor (replace previous query)
3. Click **Run** or press `Ctrl+Enter`
4. Verify success messages appear
5. Note the number of rows migrated in the INSERT statement
6. Confirm no errors

### **Step 4: Verify Migrations**

Run this verification query:

```sql
-- Verify video_url columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('wods', 'workout_library') 
  AND column_name = 'video_url';

-- Verify wod_squad_assignments table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'wod_squad_assignments';

-- Check migrated data
SELECT COUNT(*) as total_assignments 
FROM wod_squad_assignments;

-- Verify indexes
SELECT indexname 
FROM pg_indexes 
WHERE tablename = 'wod_squad_assignments';
```

**Expected Output:**
- 2 rows showing `video_url` columns
- 1 row showing `wod_squad_assignments` table
- Count of migrated assignments
- 2 index names

---

## ⚠️ Important Notes

### **Backward Compatibility**

The `wods.group_id` column is **retained** by default for backward compatibility. This means:

- ✅ Old code will continue to work
- ✅ New code can use `wod_squad_assignments`
- ✅ Gradual migration is possible

If you want to **enforce** the new many-to-many structure:

```sql
-- CAUTION: Only run this if you've updated ALL code to use wod_squad_assignments
ALTER TABLE wods DROP COLUMN group_id;
```

### **RLS Policy Dependency**

Migration 2 assumes you have an `is_admin()` function. If not, replace with:

```sql
-- Alternative for admin policy (if is_admin() doesn't exist)
CREATE POLICY "Admins can manage WOD assignments" ON wod_squad_assignments 
    FOR ALL USING (
        (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
    );
```

### **Rollback (If Needed)**

If you need to undo Migration 2:

```sql
-- Rollback Migration 2
DROP TABLE IF EXISTS wod_squad_assignments CASCADE;
```

If you need to undo Migration 1:

```sql
-- Rollback Migration 1
ALTER TABLE wods DROP COLUMN IF EXISTS video_url;
ALTER TABLE workout_library DROP COLUMN IF EXISTS video_url;
```

---

## 🧪 Post-Migration Testing

### **1. Test Video URL Fields**

```sql
-- Test inserting a WOD with video URL
INSERT INTO wods (date, title, description, type, video_url)
VALUES (
    '2025-01-15',
    'Test WOD',
    'Test description',
    'weekday',
    'https://youtube.com/watch?v=dQw4w9WgXcQ'
);

-- Verify it was inserted
SELECT title, video_url FROM wods WHERE title = 'Test WOD';

-- Clean up test data
DELETE FROM wods WHERE title = 'Test WOD';
```

### **2. Test Squad Assignments**

```sql
-- Get a sample WOD and group ID
SELECT id FROM wods LIMIT 1; -- Copy this ID
SELECT id FROM groups LIMIT 1; -- Copy this ID

-- Test inserting assignment (replace UUIDs with actual IDs)
INSERT INTO wod_squad_assignments (wod_id, group_id)
VALUES ('YOUR_WOD_ID', 'YOUR_GROUP_ID');

-- Verify assignment
SELECT * FROM wod_squad_assignments ORDER BY created_at DESC LIMIT 1;

-- Clean up test data
DELETE FROM wod_squad_assignments WHERE wod_id = 'YOUR_WOD_ID';
```

---

## 📊 Migration Summary

| Migration | Tables Modified | Columns Added | New Tables | Indexes Created | RLS Policies |
|-----------|----------------|---------------|------------|-----------------|--------------|
| **#1** | 2 | 2 | 0 | 0 | 0 |
| **#2** | 0 | 0 | 1 | 2 | 2 |
| **Total** | **2** | **2** | **1** | **2** | **2** |

---

## ✅ Success Criteria

After running all migrations, you should have:

- [x] `wods.video_url` column exists
- [x] `workout_library.video_url` column exists
- [x] `wod_squad_assignments` table created
- [x] Existing WOD-squad relationships migrated
- [x] Indexes created on junction table
- [x] RLS policies active
- [x] No errors in SQL Editor
- [x] Verification queries pass

---

## 🆘 Troubleshooting

### **Error: "is_admin() does not exist"**

**Solution:** Use the alternative admin policy shown in the Important Notes section.

### **Error: "column already exists"**

**Solution:** This is fine! The `IF NOT EXISTS` clause prevents errors. The migration has already been run.

### **Error: "relation wod_squad_assignments already exists"**

**Solution:** The table already exists. Skip Migration 2.

### **Error: Foreign key constraint violation**

**Solution:** Check that your `wods` and `groups` tables have the referenced IDs. The INSERT migration may fail if data is corrupted.

---

## 📞 Support

If you encounter issues:

1. Check the error message in SQL Editor
2. Verify table/column names match your schema
3. Ensure you have admin privileges
4. Review the verification queries output

---

**Migration Status:** Ready to Execute  
**Risk Level:** Low (backward compatible)  
**Estimated Time:** < 2 minutes

---

*Phase 3 Database Migrations*  
*Get Fit Together Project*
