-- Check what values exist in the creator_type enum
SELECT
    t.typname AS enum_name,
    e.enumlabel AS enum_value,
    e.enumsortorder AS sort_order
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typname = 'creator_type'
ORDER BY e.enumsortorder;

-- Also check what values are actually in the tasks table
SELECT DISTINCT created_by
FROM tasks
ORDER BY created_by;
