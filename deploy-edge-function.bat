@echo off
echo ============================================
echo Deploying Supabase Edge Function
echo ============================================
echo.

echo Step 1: Get your Supabase Access Token
echo Go to: https://supabase.com/dashboard/account/tokens
echo Click "Generate new token" and copy it
echo.
set /p SUPABASE_ACCESS_TOKEN="Paste your access token here: "
echo.

echo Step 2: Linking project...
npx supabase link --project-ref rnqwajmjfqlsrvhupram
if %errorlevel% neq 0 (
    echo Failed to link project. Please check your access token.
    pause
    exit /b 1
)
echo.

echo Step 3: Deploying admin-create-user function...
npx supabase functions deploy admin-create-user
if %errorlevel% neq 0 (
    echo Failed to deploy function.
    pause
    exit /b 1
)
echo.

echo Step 4: Get your Service Role Key
echo Go to: https://supabase.com/dashboard/project/rnqwajmjfqlsrvhupram/settings/api
echo Copy the "service_role" key (NOT the anon key)
echo.
set /p SERVICE_ROLE_KEY="Paste your service role key here: "
echo.

echo Step 5: Setting service role key secret...
npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=%SERVICE_ROLE_KEY% --project-ref rnqwajmjfqlsrvhupram
if %errorlevel% neq 0 (
    echo Failed to set secret.
    pause
    exit /b 1
)
echo.

echo ============================================
echo Deployment Complete!
echo ============================================
echo.
echo Your Edge Function is now deployed and ready to use.
echo Try creating a user from your admin panel!
echo.
pause
