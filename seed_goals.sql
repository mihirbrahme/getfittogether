-- Seed goals for the test user (or all users who don't have them)
-- First, ensure we have some goals
INSERT INTO user_goals (user_id, goal_name, active)
SELECT id, 'Read 10 Pages', true
FROM profiles
WHERE NOT EXISTS (
    SELECT 1 FROM user_goals WHERE user_id = profiles.id AND goal_name = 'Read 10 Pages'
);

INSERT INTO user_goals (user_id, goal_name, active)
SELECT id, 'No Added Sugar', true
FROM profiles
WHERE NOT EXISTS (
    SELECT 1 FROM user_goals WHERE user_id = profiles.id AND goal_name = 'No Added Sugar'
);
