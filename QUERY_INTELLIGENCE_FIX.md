# Query Intelligence Fix for Deleted Brand Lists

## Problem Description

When a brand list was deleted, queries related to that brand list were still appearing in the Query Intelligence section of the analytics dashboard. This happened because:

1. The cascade delete migration might not have been properly applied
2. There were orphaned queries in the database that weren't being cleaned up
3. The analytics filtering wasn't robust enough to handle deleted brand lists

## Solution Implemented

### 1. Enhanced Analytics Filtering

The `fetchAnalyticsData` function in `AEOAnalyticsDashboard.tsx` now includes:

- **Brand list existence verification**: Before fetching queries, it verifies that the selected brand list still exists
- **Automatic cleanup**: If the selected brand list no longer exists, it clears the selection and analytics data
- **Additional safety filtering**: Filters out any queries that don't match the selected brand list ID
- **Orphaned query detection**: Warns when mismatched queries are found

### 2. Orphaned Query Cleanup

Added a `cleanupOrphanedQueries` function that:

- Finds queries that reference non-existent brand lists
- Automatically deletes orphaned queries
- Can be triggered manually via a "Cleanup Orphaned Data" button

### 3. Brand List Deletion Handling

Enhanced `fetchBrandLists` function to:

- Check if the currently selected brand list still exists
- Clear analytics data when a brand list is deleted
- Automatically select the first available brand list

### 4. Database Migration

Created a migration script (`scripts/run-migration.js`) to:

- Apply the cascade delete constraint if not already applied
- Clean up existing orphaned queries
- Ensure proper foreign key relationships

## How to Apply the Fix

### Option 1: Automatic Fix (Recommended)

The fix is already implemented in the code. Simply:

1. Restart your development server
2. Navigate to the analytics dashboard
3. If you see orphaned data, click the "Cleanup Orphaned Data" button

### Option 2: Manual Database Migration

If you want to ensure the cascade delete constraint is properly applied:

1. Make sure you have your Supabase service role key in your environment variables:
   ```bash
   export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
   ```

2. Run the migration script:
   ```bash
   npm run migrate:cascade-delete
   ```

### Option 3: Manual SQL Execution

If you prefer to run the SQL directly in your Supabase dashboard:

```sql
-- Drop existing constraint (if exists)
ALTER TABLE public.queries 
DROP CONSTRAINT IF EXISTS queries_brand_list_id_fkey;

-- Add new constraint with CASCADE DELETE
ALTER TABLE public.queries 
ADD CONSTRAINT queries_brand_list_id_fkey 
FOREIGN KEY (brand_list_id) 
REFERENCES public.brand_lists(id) 
ON DELETE CASCADE;

-- Clean up orphaned queries
DELETE FROM public.queries 
WHERE brand_list_id NOT IN (
  SELECT id FROM public.brand_lists
);
```

## Testing the Fix

1. **Create a brand list** and run some queries
2. **Delete the brand list**
3. **Navigate to analytics** - you should see:
   - No queries from the deleted brand list
   - A message if no brand list is selected
   - Option to select a different brand list

## Code Changes Summary

### Files Modified:

1. **`components/AEOAnalyticsDashboard.tsx`**:
   - Enhanced `fetchAnalyticsData` with brand list verification
   - Added `cleanupOrphanedQueries` function
   - Added cleanup button in the UI
   - Enhanced `fetchBrandLists` with deletion handling

2. **`scripts/run-migration.js`** (new):
   - Database migration script for cascade delete

3. **`package.json`**:
   - Added migration script command

### Key Functions Added:

- `cleanupOrphanedQueries()`: Removes orphaned queries
- Enhanced `fetchAnalyticsData()`: Better filtering and verification
- Enhanced `fetchBrandLists()`: Handles deleted brand lists

## Prevention

The fix includes several preventive measures:

1. **Cascade delete constraint**: Ensures queries are automatically deleted when brand lists are deleted
2. **Runtime verification**: Checks brand list existence before processing analytics
3. **Automatic cleanup**: Removes orphaned data when detected
4. **Manual cleanup option**: Allows users to trigger cleanup when needed

This should completely resolve the issue of deleted brand list queries appearing in the Query Intelligence section. 