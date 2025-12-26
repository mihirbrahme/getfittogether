-- CLEANUP: Delete all WODs for today to prevent duplicates
DELETE FROM wods WHERE date = CURRENT_DATE;

-- SEED: Insert the single correct WOD
INSERT INTO wods (date, title, description, type)
VALUES (
  CURRENT_DATE, 
  'WOD: Day 12', 
  'MISSION: COMPLETE 3 ROUNDS FOR TIME

1. Jumping Jacks x 50
2. Push-ups x 20
3. Air Squats x 30
4. Walking Lunges x 20 (Total)
5. Plank Shoulder Taps x 30
6. Mountain Climbers x 40
7. Burpees x 10
8. Leg Raises x 15
9. High Knees x 40
10. Bench/Chair Dips x 15
11. Bicycle Crunches x 30
12. Sit-ups x 20

REST 2 MINUTES BETWEEN ROUNDS.
SCORE IS TOTAL TIME.', 
  'weekday'
);
