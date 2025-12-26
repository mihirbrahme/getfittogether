-- Seed 5 Initial Teams
INSERT INTO groups (name, code) VALUES
('Spartans', 'SPR001'),
('Titans', 'TTN002'),
('Warriors', 'WAR003'),
('Legends', 'LGD004'),
('Avengers', 'AVG005')
ON CONFLICT (code) DO NOTHING;
