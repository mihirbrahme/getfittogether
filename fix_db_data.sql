-- 1. Seed Teams (Dynamically using the first user as admin to satisfy NOT NULL constraint)
WITH first_admin AS (
    SELECT id FROM auth.users ORDER BY created_at LIMIT 1
)
INSERT INTO groups (name, code, admin_id)
SELECT g.name, g.code, a.id
FROM (VALUES
    ('Spartans', 'SPR001'),
    ('Titans', 'TTN002'),
    ('Warriors', 'WAR003'),
    ('Legends', 'LGD004'),
    ('Avengers', 'AVG005')
) AS g(name, code)
CROSS JOIN first_admin a
ON CONFLICT (code) DO NOTHING;

-- 2. Backfill: Assign all users who are NOT in a team to the first team (Spartans)
INSERT INTO group_members (group_id, user_id, status)
SELECT 
    (SELECT id FROM groups WHERE code = 'SPR001' LIMIT 1),
    p.id,
    'approved'
FROM profiles p
WHERE NOT EXISTS (
    SELECT 1 FROM group_members gm WHERE gm.user_id = p.id
);

-- 3. Check for incomplete profiles (Run this to see who is missing data)
SELECT id, full_name, height, weight 
FROM profiles 
WHERE height IS NULL OR weight IS NULL OR height = '' OR weight = '';
