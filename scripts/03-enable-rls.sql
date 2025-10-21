-- Enable Row Level Security on all tables
ALTER TABLE quarters ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE quarter_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_outs ENABLE ROW LEVEL SECURITY;
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access (allow all operations)
-- Note: In production, you should create proper authentication and restrict based on user roles
-- For now, we'll allow all authenticated users (admins) to perform all operations

CREATE POLICY "Allow all operations on quarters" ON quarters
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on sessions" ON sessions
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on users" ON users
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on quarter_enrollments" ON quarter_enrollments
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on check_ins" ON check_ins
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on check_outs" ON check_outs
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on contributions" ON contributions
  FOR ALL USING (true) WITH CHECK (true);
