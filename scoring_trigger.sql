-- Function to calculate daily points and update profile total
CREATE OR REPLACE FUNCTION calculate_daily_points()
RETURNS TRIGGER AS $$
DECLARE
    new_points INTEGER := 0;
    goal_points INTEGER := 0;
    custom_key TEXT;
    custom_val BOOLEAN;
BEGIN
    -- 1. Calculate Core Habits Points
    IF NEW.wod_done THEN new_points := new_points + 20; END IF;
    IF NEW.steps_done THEN new_points := new_points + 10; END IF;
    IF NEW.clean_eating_done THEN new_points := new_points + 10; END IF;
    IF NEW.sleep_done THEN new_points := new_points + 10; END IF;
    IF NEW.water_done THEN new_points := new_points + 10; END IF;

    -- 2. Calculate Custom Goals Points (JSONB parsing)
    -- Iterate through keys in custom_logs. If value is true, add 5 points.
    FOR custom_key, custom_val IN SELECT * FROM jsonb_each(NEW.custom_logs)
    LOOP
        IF custom_val = TRUE THEN
            new_points := new_points + 5;
        END IF;
    END LOOP;

    -- 3. Update the daily_logs row with the calculated value
    NEW.daily_points := new_points;

    -- 4. Update the Profile's Total Points
    -- We subtract the OLD daily_points (if update) and add the NEW daily_points
    -- This ensures we don't double count.
    
    -- Recalculate total for user (safer than incrementing to avoid drift)
    -- But for performance in this trigger, delta is standard.
    -- Let's stick to simple delta update on Profiles.
    
    UPDATE profiles 
    SET total_points = total_points - COALESCE(OLD.daily_points, 0) + NEW.daily_points
    WHERE id = NEW.user_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to run BEFORE INSERT OR UPDATE on daily_logs
DROP TRIGGER IF EXISTS update_points_trigger ON daily_logs;

CREATE TRIGGER update_points_trigger
BEFORE INSERT OR UPDATE ON daily_logs
FOR EACH ROW
EXECUTE FUNCTION calculate_daily_points();
