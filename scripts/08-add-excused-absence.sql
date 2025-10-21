-- Add "excused_absence" status option to check_ins table
-- This allows students to be marked as excused from a session

-- Drop the existing CHECK constraint
ALTER TABLE check_ins
DROP CONSTRAINT IF EXISTS check_ins_status_check;

-- Add the new CHECK constraint with excused_absence included
ALTER TABLE check_ins
ADD CONSTRAINT check_ins_status_check
CHECK (status IN ('on_time', 'late', 'missing', 'excused_absence'));

-- Add comment for documentation
COMMENT ON CONSTRAINT check_ins_status_check ON check_ins IS 'Valid check-in statuses: on_time, late, missing, excused_absence';
