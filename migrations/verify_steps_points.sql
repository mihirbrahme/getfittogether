-- Verification: Check if Steps activity needs points update
-- According to overview: Steps should be 10 points

-- Check current Steps points value
SELECT squad_id, activity_name, activity_key, points 
FROM squad_checkin_activities 
WHERE activity_key LIKE '%step%' OR activity_name ILIKE '%step%'
ORDER BY squad_id;

-- If Steps is not 10 points, run this update:
UPDATE squad_checkin_activities 
SET points = 10 
WHERE activity_key LIKE '%step%' OR activity_name ILIKE '%step%';

-- Verify max points per squad (should be 60 for core activities)
SELECT squad_id, SUM(points) as max_daily_points 
FROM squad_checkin_activities 
WHERE enabled = true 
GROUP BY squad_id;
