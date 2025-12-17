# Testing Auth and Routing Fixes

## Changes Made

### 1. Authentication Persistence Fix
**Files Modified:**
- `src/app/services/auth.service.ts`
- `src/app/guards/auth.guard.ts`

**What was fixed:**
- The auth guard now waits for authentication to finish loading before checking if user is authenticated
- Added retry logic (3 attempts with delays) when loading user profile to handle race conditions
- Set up event listener for `INITIAL_SESSION` to properly restore session from localStorage

### 2. Task Routing Fix
**Files Modified:**
- `src/app/pages/home/home.component.html` (2 links)
- `src/app/pages/tasks/task-list/task-list.component.html` (1 link)
- `src/app/pages/tasks/task-detail/task-detail.component.ts` (goBack function)

**What was fixed:**
- Changed `/tasks` to `/app/tasks` in all task links
- Changed `/tasks/:id` to `/app/tasks/:id` in task detail links

## How to Test

### Prerequisites
1. Make sure you have the Angular dev server running on http://localhost:4200
2. If not running, start it with: `npm start`
3. Clear your browser cache and localStorage:
   - Press F12 to open DevTools
   - Go to Application tab → Storage → Clear site data
   - Or press Ctrl+Shift+Delete and clear browsing data

### Test 1: Authentication Persistence
1. Open http://localhost:4200 in your browser
2. Sign in with your credentials
3. Verify you're logged in and see the dashboard
4. **Press F5 to reload the page**
5. ✅ **EXPECTED:** You should remain logged in (no redirect to login page)
6. ❌ **IF FAILED:** Check browser console for errors (F12)

### Test 2: Task Detail Navigation
1. From the dashboard, click on "View All Tasks" button
2. You should see a list of tasks
3. Click on any task's "View Details" button
4. ✅ **EXPECTED:** You should see the task detail page (not 404)
5. Verify the URL is `/app/tasks/<task-id>`
6. Click the back button or navigate to dashboard
7. Click on a task card from the dashboard recommended tasks
8. ✅ **EXPECTED:** Same task detail page should load

## Troubleshooting

### Issue: Still getting redirected to login on page reload

**Check these:**
1. Open browser console (F12) and check for errors
2. Check Application → Local Storage → Should see `jobsim-auth-token` key
3. Check console logs - should see "Auth event: INITIAL_SESSION" or "Auth event: SIGNED_IN"
4. Verify the Angular dev server restarted after the changes (look for compilation success)

**If still failing:**
```bash
# Clear the terminal and restart dev server
# Press Ctrl+C to stop the server
npm start
```

### Issue: Still getting 404 on task detail page

**Check these:**
1. Look at the URL when you click a task - it should be `/app/tasks/<id>` not `/tasks/<id>`
2. Check browser console for routing errors
3. Verify all changes were saved (check file modification times)

**If still failing:**
```bash
# Hard reload in browser
# Press Ctrl+Shift+R (or Cmd+Shift+R on Mac)
```

### Issue: Dev server not reflecting changes

**Solution:**
```bash
# Stop the server (Ctrl+C) and restart
npm start
```

## Console Logs to Look For

### Successful Auth Persistence:
```
Auth event: INITIAL_SESSION
(or)
Auth event: SIGNED_IN
```

### Failed Auth:
```
Error loading user profile: ...
Error initializing auth: ...
```

## Need More Help?

If issues persist after these fixes:
1. Share the browser console errors (F12 → Console tab)
2. Check the Network tab to see which API calls are failing
3. Verify your Supabase credentials are correct in `ai-engine/.env`
