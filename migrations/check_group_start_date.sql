-- Check the current start_date for all groups
SELECT 
    id,
    name,
    start_date,
    CASE 
        WHEN start_date IS NULL THEN 'NOT SET'
        WHEN start_date = CURRENT_DATE THEN 'TODAY'
        ELSE start_date::text
    END as status
FROM groups
ORDER BY created_at DESC;

-- To set the start_date for a specific group (replace with your group ID and desired start date):
-- UPDATE groups 
-- SET start_date = '2026-01-01'  -- Change this to your programme start date
-- WHERE id = 'your-group-uuid-here';

-- Example: If your programme started on January 1st, 2026:
-- UPDATE groups 
-- SET start_date = '2026-01-01'
-- WHERE name = 'Your Squad Name';
