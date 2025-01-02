-- Enable RLS
ALTER TABLE cvs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable all access to cvs" ON cvs;

-- Create a policy that allows all operations
CREATE POLICY "Enable all access to cvs"
ON cvs
FOR ALL
USING (true)
WITH CHECK (true);
