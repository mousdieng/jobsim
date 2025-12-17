-- Step 1: Disable RLS temporarily to see all policies
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL policies on tasks table (this will work even with syntax errors)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'tasks') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON tasks', r.policyname);
    END LOOP;
END $$;

-- Step 3: Re-enable RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Step 4: Create clean, simple policies

-- Policy 1: Service role can insert anything (for AI Engine)
CREATE POLICY "service_role_insert_tasks"
ON tasks
FOR INSERT
TO service_role
WITH CHECK (true);

-- Policy 2: Authenticated users can read all tasks
CREATE POLICY "authenticated_read_tasks"
ON tasks
FOR SELECT
TO authenticated
USING (true);

-- Policy 3: Users can insert tasks they create
CREATE POLICY "users_insert_own_tasks"
ON tasks
FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid());

-- Policy 4: Users can update their own tasks
CREATE POLICY "users_update_own_tasks"
ON tasks
FOR UPDATE
TO authenticated
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

-- Policy 5: Users can delete their own tasks
CREATE POLICY "users_delete_own_tasks"
ON tasks
FOR DELETE
TO authenticated
USING (created_by = auth.uid());

-- Verify the new policies
SELECT
    schemaname,
    tablename,
    policyname,
    cmd,
    roles
FROM pg_policies
WHERE tablename = 'tasks'
ORDER BY policyname;
