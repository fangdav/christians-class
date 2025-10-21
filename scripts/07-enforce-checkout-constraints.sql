-- Database-Level Enforcement for Checkout State
-- This migration adds constraints and triggers to ensure data integrity

-- 1. Prevent multiple active checkouts for the same user in the same session
-- A student can only have ONE checkout record with check_in_time = NULL per session
CREATE UNIQUE INDEX IF NOT EXISTS idx_check_outs_active_unique
ON check_outs(user_id, session_id)
WHERE check_in_time IS NULL;

-- 2. Ensure check_in_time is always after check_out_time
ALTER TABLE check_outs
ADD CONSTRAINT check_outs_valid_timestamps
CHECK (check_in_time IS NULL OR check_in_time > check_out_time);

-- 3. Ensure duration_minutes is non-negative
ALTER TABLE check_outs
ADD CONSTRAINT check_outs_valid_duration
CHECK (duration_minutes IS NULL OR duration_minutes >= 0);

-- 4. Create trigger function to auto-calculate duration_minutes
CREATE OR REPLACE FUNCTION calculate_checkout_duration()
RETURNS TRIGGER AS $$
BEGIN
  -- Only calculate if check_in_time is being set (not NULL)
  IF NEW.check_in_time IS NOT NULL AND OLD.check_in_time IS NULL THEN
    -- Calculate duration in minutes
    NEW.duration_minutes := EXTRACT(EPOCH FROM (NEW.check_in_time - NEW.check_out_time)) / 60;
    -- Round down to nearest minute
    NEW.duration_minutes := FLOOR(NEW.duration_minutes);
    -- Ensure it's non-negative (constraint will catch this, but good to be defensive)
    IF NEW.duration_minutes < 0 THEN
      RAISE EXCEPTION 'check_in_time cannot be before check_out_time';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Create trigger that runs before UPDATE on check_outs
DROP TRIGGER IF EXISTS trigger_calculate_checkout_duration ON check_outs;
CREATE TRIGGER trigger_calculate_checkout_duration
BEFORE UPDATE ON check_outs
FOR EACH ROW
EXECUTE FUNCTION calculate_checkout_duration();

-- 6. Add index for better query performance on active checkouts
CREATE INDEX IF NOT EXISTS idx_check_outs_active
ON check_outs(user_id, session_id, check_out_time DESC)
WHERE check_in_time IS NULL;

-- Add comments for documentation
COMMENT ON INDEX idx_check_outs_active_unique IS 'Ensures only one active checkout (check_in_time IS NULL) per student per session';
COMMENT ON CONSTRAINT check_outs_valid_timestamps ON check_outs IS 'Ensures check_in_time is always after check_out_time';
COMMENT ON CONSTRAINT check_outs_valid_duration ON check_outs IS 'Ensures duration_minutes is non-negative';
COMMENT ON FUNCTION calculate_checkout_duration IS 'Auto-calculates duration_minutes when check_in_time is set';
