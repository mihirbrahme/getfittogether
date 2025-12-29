# Database Cleanup Guide

## 🗑️ Removing Redundant Tables

The new WOD Library system replaces the old tables shown below. This guide helps you safely clean up Supabase.

---

## 📊 Old vs New System

### **Replaced Tables:**

| Old Table | Purpose | New Replacement |
|-----------|---------|----------------|
| `wods` | Daily workout instances | `scheduled_workouts` + `workout_templates` |
| `workout_library` | Basic workout templates | `workout_templates` + `workout_exercises` |
| `wod_squad_assignments` | WOD-to-squad mapping | `scheduled_workout_squads` |

---

## ⚠️ Before You Delete

### **1. Create Backups (Recommended)**

Run in Supabase SQL Editor:

```sql
-- Backup old data (optional)
CREATE TABLE wods_backup AS SELECT * FROM wods;
CREATE TABLE workout_library_backup AS SELECT * FROM workout_library;
CREATE TABLE wod_squad_assignments_backup AS SELECT * FROM wod_squad_assignments;
```

### **2. Verify New System Works**

Test the complete workflow:
- ✅ Create workout in WOD Library
- ✅ Assign from Calendar
- ✅ View as participant
- ✅ All exercises display correctly

---

## 🚀 Cleanup Steps

### **Option A: Safe Cleanup (Recommended)**

Keep backups, remove old tables:

```sql
-- 1. Create backups (from above)

-- 2. Drop old tables
DROP TABLE IF EXISTS wod_squad_assignments CASCADE;
DROP TABLE IF EXISTS wods CASCADE;
DROP TABLE IF EXISTS workout_library CASCADE;

-- 3. Verify new tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('workout_templates', 'workout_exercises', 'scheduled_workouts', 'scheduled_workout_squads');
```

### **Option B: Complete Wipe (Risky)**

No backups, fresh start:

```sql
-- ⚠️ WARNING: This deletes all old data permanently
DROP TABLE IF EXISTS wod_squad_assignments CASCADE;
DROP TABLE IF EXISTS wods CASCADE;
DROP TABLE IF EXISTS workout_library CASCADE;
```

---

## ✅ Post-Cleanup Verification

Run these queries to confirm everything works:

```sql
-- Check new tables have data
SELECT COUNT(*) as templates FROM workout_templates;
SELECT COUNT(*) as exercises FROM workout_exercises;
SELECT COUNT(*) as scheduled FROM scheduled_workouts;
SELECT COUNT(*) as assignments FROM scheduled_workout_squads;
```

---

## 🔄 Rollback (If Needed)

If you created backups and need to restore:

```sql
CREATE TABLE wods AS SELECT * FROM wods_backup;
CREATE TABLE workout_library AS SELECT * FROM workout_library_backup;
CREATE TABLE wod_squad_assignments AS SELECT * FROM wod_squad_assignments_backup;
```

Then restore the old code from git history.

---

## 📝 Final Checklist

Before considering cleanup complete:

- [ ] New WOD Library tested and working
- [ ] Calendar assignment works
- [ ] Participants see detailed exercises
- [ ] Backups created (if desired)
- [ ] Old tables dropped successfully
- [ ] No references to old tables in code

---

## 🎯 Result

**After cleanup:**
- 3 fewer tables in database
- Simpler schema
- Better organized data
- Detailed workout system
- No redundancy

**File to run:** `phase4_cleanup_old_tables.sql`
