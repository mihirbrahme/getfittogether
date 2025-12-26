INSERT INTO groups (name, code, admin_id)
SELECT 
    g.name, 
    g.code,
    (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1) as admin_id
FROM (VALUES 
    ('Alpha Squad', 'ALPHA'),
    ('Bravo Squad', 'BRAVO'),
    ('Charlie Squad', 'CHARLIE')
) AS g(name, code)
ON CONFLICT (code) DO NOTHING;
