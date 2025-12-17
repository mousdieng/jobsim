-- Fix RLS Policies with CORRECT enum values
-- The creator_type enum has: 'ai', 'enterprise', 'platform' (NOT 'user')

-- Clear all existing policies on tasks table
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'tasks') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON tasks', r.policyname);
    END LOOP;
END $$;

-- Ensure RLS is enabled
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Policy 1: Service role (AI Engine) can do anything
CREATE POLICY "service_role_all_access"
ON tasks
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy 2: All authenticated users can read all tasks
CREATE POLICY "authenticated_read_all_tasks"
ON tasks
FOR SELECT
TO authenticated
USING (true);

-- Policy 3: Platform/admins can insert tasks
CREATE POLICY "platform_insert_tasks"
ON tasks
FOR INSERT
TO authenticated
WITH CHECK (
  created_by = 'platform'
  AND EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.user_type = 'admin'
  )
);

-- Policy 4: Enterprise admins can insert tasks for their enterprise
CREATE POLICY "enterprise_insert_tasks"
ON tasks
FOR INSERT
TO authenticated
WITH CHECK (
  created_by = 'enterprise'
  AND enterprise_id IN (
    SELECT id FROM enterprises WHERE admin_user_id = auth.uid()
  )
);

-- Policy 5: Enterprise admins can update their enterprise's tasks
CREATE POLICY "enterprise_update_own_tasks"
ON tasks
FOR UPDATE
TO authenticated
USING (
  created_by = 'enterprise'
  AND enterprise_id IN (
    SELECT id FROM enterprises WHERE admin_user_id = auth.uid()
  )
)
WITH CHECK (
  created_by = 'enterprise'
  AND enterprise_id IN (
    SELECT id FROM enterprises WHERE admin_user_id = auth.uid()
  )
);

-- Policy 6: Platform admins can update any task
CREATE POLICY "platform_update_tasks"
ON tasks
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.user_type = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.user_type = 'admin'
  )
);

-- Policy 7: Platform admins can delete any task
CREATE POLICY "platform_delete_tasks"
ON tasks
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.user_type = 'admin'
  )
);

-- Verify policies
SELECT
    policyname,
    cmd as operation,
    roles
FROM pg_policies
WHERE tablename = 'tasks'
ORDER BY policyname;
