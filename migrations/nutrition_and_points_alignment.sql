-- Migration: Replace Clean Eating with 4 Detailed Nutrition Activities + Points Alignment
-- Run this in Supabase SQL Editor

-- =====================================================
-- STEP 1: POINTS ALIGNMENT - Update existing activities
-- =====================================================
-- Align WOD, Hydration, Sleep to overview document values

UPDATE squad_checkin_activities 
SET points = 20 
WHERE activity_key = 'wod' OR activity_name ILIKE '%workout%';

UPDATE squad_checkin_activities 
SET points = 10 
WHERE activity_key = 'hydration' OR activity_name ILIKE '%hydration%' OR activity_name ILIKE '%water%';

UPDATE squad_checkin_activities 
SET points = 10 
WHERE activity_key = 'sleep' OR activity_name ILIKE '%sleep%';

-- =====================================================
-- STEP 2: REMOVE OLD CLEAN EATING ACTIVITY
-- =====================================================

DELETE FROM squad_checkin_activities 
WHERE activity_key = 'clean_eating' 
   OR activity_key = 'cleanEating' 
   OR activity_name ILIKE '%clean eating%'
   OR activity_name ILIKE '%diet%';

-- =====================================================
-- STEP 3: ADD 4 DETAILED NUTRITION ACTIVITIES
-- =====================================================
-- Insert for each existing squad

INSERT INTO squad_checkin_activities (
    squad_id, 
    activity_name, 
    activity_type, 
    activity_key, 
    points, 
    enabled, 
    display_order, 
    icon, 
    description
)
SELECT 
    g.id as squad_id,
    nutrition.name,
    'core_habit'::text,
    nutrition.key,
    nutrition.pts,
    true,
    nutrition.ord,
    nutrition.icn,
    nutrition.desc_text
FROM groups g
CROSS JOIN (VALUES 
    ('Home Cooked Meals', 'home_cooked', 3, 21, 'Apple', 'Ate mostly home-prepared food today'),
    ('Veggies in 2+ Meals', 'veggies_2meals', 3, 22, 'Apple', 'Had vegetables/salad in at least 2 meals'),
    ('2 Fruits Today', 'fruits_2', 2, 23, 'Apple', 'Consumed at least 2 fruits'),
    ('High Protein Meal', 'high_protein', 2, 24, 'Target', 'Had a protein-rich meal')
) AS nutrition(name, key, pts, ord, icn, desc_text)
WHERE NOT EXISTS (
    SELECT 1 FROM squad_checkin_activities sca
    WHERE sca.squad_id = g.id AND sca.activity_key = nutrition.key
);

-- =====================================================
-- STEP 4: VERIFY CHANGES
-- =====================================================
-- Run these queries to verify the migration worked

-- Check activities per squad:
-- SELECT squad_id, activity_name, activity_key, points 
-- FROM squad_checkin_activities 
-- ORDER BY squad_id, display_order;

-- Verify point totals (should be ~70 max):
-- SELECT squad_id, SUM(points) as max_daily_points 
-- FROM squad_checkin_activities 
-- WHERE enabled = true 
-- GROUP BY squad_id;
