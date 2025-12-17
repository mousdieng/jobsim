# JobSim Senegal - Setup Guide

Complete guide for setting up and running the JobSim Senegal application.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Database Setup](#database-setup)
4. [Environment Configuration](#environment-configuration)
5. [Running the Application](#running-the-application)
6. [Sign Up Feature](#sign-up-feature)
7. [Testing](#testing)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** (comes with Node.js)
- **Angular CLI** (v20.3.0 or higher)
- **Supabase Account** (free tier is sufficient)

## Installation

1. **Clone the repository** (if not already done):
   ```bash
   git clone <repository-url>
   cd jobsim-senegal
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Verify installation**:
   ```bash
   ng version
   ```

## Database Setup

### Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign in or create an account
3. Click "New Project"
4. Fill in the project details:
   - Name: `jobsim-senegal` (or your preferred name)
   - Database Password: Choose a strong password
   - Region: Select the closest region to your users
5. Click "Create new project"
6. Wait for the project to be provisioned (2-3 minutes)

### Step 2: Run Database Migrations

#### Option 1: Supabase Dashboard (Recommended)

1. In your Supabase project dashboard, navigate to **SQL Editor**
2. Click **New Query**
3. Run each migration file in order:

   **Migration 1: Users Table**
   - Copy the contents of `database/migrations/001_create_users_table.sql`
   - Paste into the SQL Editor
   - Click **Run**
   - Wait for "Success. No rows returned" message

   **Migration 2: Simulations Table**
   - Copy the contents of `database/migrations/002_create_simulations_table.sql`
   - Paste into the SQL Editor
   - Click **Run**

   **Migration 3: Jobs Table**
   - Copy the contents of `database/migrations/003_create_jobs_table.sql`
   - Paste into the SQL Editor
   - Click **Run**

   **Migration 4: Submissions Table**
   - Copy the contents of `database/migrations/004_create_submissions_table.sql`
   - Paste into the SQL Editor
   - Click **Run**

4. Verify tables were created:
   - Go to **Table Editor** in the left sidebar
   - You should see: `users`, `simulations`, `jobs`, `submissions`

#### Option 2: Supabase CLI

If you have the Supabase CLI installed:

```bash
# Install Supabase CLI (if not already installed)
npm install -g supabase

# Login
supabase login

# Link your project
supabase link --project-ref YOUR_PROJECT_REF

# Run migrations
supabase db push
```

### Step 3: Verify Database Setup

1. Go to **Table Editor** in Supabase Dashboard
2. Click on `users` table
3. Check that the schema matches:
   - id (uuid, primary key)
   - email (text)
   - user_type (enum: student, mentor, admin)
   - name (text)
   - created_at (timestamptz)
   - updated_at (timestamptz)
   - Additional profile fields

4. Check RLS policies:
   - Go to **Authentication** → **Policies**
   - Verify policies are enabled for the `users` table

## Environment Configuration

### Step 1: Get Supabase Credentials

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL**: `https://[your-project-ref].supabase.co`
   - **Anon/Public Key**: `eyJhbG...` (long JWT token)

### Step 2: Update Environment Files

The environment files are already configured with credentials. If you need to use your own Supabase project:

1. **Update** `src/environments/environment.development.ts`:
   ```typescript
   export const environment = {
     production: false,
     supabase: {
       url: 'YOUR_SUPABASE_PROJECT_URL',
       anonKey: 'YOUR_SUPABASE_ANON_KEY'
     }
   };
   ```

2. **Update** `src/environments/environment.ts`:
   ```typescript
   export const environment = {
     production: true,
     supabase: {
       url: 'YOUR_SUPABASE_PROJECT_URL',
       anonKey: 'YOUR_SUPABASE_ANON_KEY'
     }
   };
   ```

**Important**: Never commit real API keys to version control. The current credentials in the repo are for demonstration purposes only.

## Running the Application

### Development Server

1. **Start the development server**:
   ```bash
   npm start
   ```
   or
   ```bash
   ng serve
   ```

2. **Open your browser** and navigate to:
   ```
   http://localhost:4200
   ```

3. The application will automatically reload when you make changes to the source files.

### Production Build

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Serve the production build** (using a static file server):
   ```bash
   npx http-server dist/jobsim-senegal/browser
   ```

3. **Access the production build** at:
   ```
   http://localhost:8080
   ```

## Sign Up Feature

The sign up feature is **fully implemented** with the following capabilities:

### Features

✅ **User Registration Form**
- Full Name (required, min 2 characters)
- Email (required, valid email format)
- User Type (student, mentor, admin)
- Password (required, min 6 characters)
- Confirm Password (must match)

✅ **Form Validation**
- Real-time field validation
- Password matching validation
- Client-side error messages
- Form-level validation

✅ **Password Security**
- **Password Strength Indicator**: Visual meter showing weak/medium/strong
- **Show/Hide Password Toggle**: Eye icon to reveal/hide passwords
- **Password Requirements**: Displays guidance for strong passwords

✅ **User Experience**
- Loading spinner during registration
- Success/error message display
- Auto-redirect to dashboard on success
- Responsive design (mobile-friendly)
- Professional UI with TailwindCSS

✅ **Backend Integration**
- Supabase Auth for authentication
- User profile creation in database
- Secure password storage (bcrypt via Supabase)
- Row Level Security (RLS) policies

### Using Sign Up

1. **Access the registration page**:
   - Navigate to `http://localhost:4200/register`
   - Or click "Get Started" from the home page
   - Or click "create a new account" from the login page

2. **Fill in the registration form**:
   - Enter your full name
   - Enter a valid email address
   - Select your user type (Student, Mentor, or Admin)
   - Create a strong password (the strength meter will guide you)
   - Confirm your password

3. **Submit the form**:
   - Click "Create Account"
   - Wait for the success message
   - You'll be automatically redirected to the dashboard

4. **Verify your account** (if email verification is enabled):
   - Check your email for a verification link
   - Click the link to verify your account

### Sign Up Flow

```
User fills form → Validates input → Creates Auth user in Supabase
                                              ↓
                                    Creates user profile in database
                                              ↓
                                    Updates authentication state
                                              ↓
                                    Redirects to dashboard
```

## Testing

### Manual Testing

1. **Test Sign Up**:
   ```bash
   # Start the dev server
   npm start

   # Navigate to http://localhost:4200/register
   # Fill in the form and submit
   # Verify redirect to dashboard
   ```

2. **Test Form Validation**:
   - Try submitting with empty fields
   - Try entering an invalid email
   - Try passwords that don't match
   - Try a weak password and observe the strength indicator

3. **Test Password Features**:
   - Type a password and watch the strength meter change
   - Click the eye icon to show/hide password
   - Try different password combinations (numbers, symbols, etc.)

4. **Verify Database**:
   - After successful sign up, check Supabase Dashboard → Table Editor → users
   - Verify your user record was created
   - Check the Auth users in Authentication → Users

### Automated Testing (Future)

To run unit tests (when implemented):
```bash
npm test
```

To run end-to-end tests (when implemented):
```bash
npm run e2e
```

## Troubleshooting

### Common Issues

#### 1. "Failed to create user profile"

**Cause**: RLS policies not properly configured or database migration not run.

**Solution**:
- Run all database migrations
- Verify RLS policies in Supabase Dashboard
- Check that the "Users can insert own profile" policy exists

#### 2. "Invalid API key" or "Project not found"

**Cause**: Incorrect Supabase credentials in environment files.

**Solution**:
- Verify your Supabase URL and anon key
- Update `src/environments/environment.ts`
- Restart the dev server

#### 3. "Email already exists"

**Cause**: Trying to register with an email that's already in use.

**Solution**:
- Use a different email address
- Or sign in instead of signing up
- Check Supabase Dashboard → Authentication → Users to see existing users

#### 4. "Password too weak"

**Cause**: Supabase requires minimum password strength.

**Solution**:
- Use at least 6 characters (recommended: 8+)
- Include numbers, uppercase, lowercase, and symbols
- Watch the password strength indicator

#### 5. Build Warnings

**Warning**: "bundle initial exceeded maximum budget"

**Cause**: Application bundle size is larger than the default Angular budget.

**Solution** (optional optimization):
- Lazy load more modules
- Remove unused dependencies
- Enable production optimizations
- Update `angular.json` budget limits if acceptable

### Debug Mode

Enable verbose logging:

1. Open browser DevTools (F12)
2. Check the Console tab for errors
3. Check the Network tab for failed API calls
4. Look for authentication events logged by the app

### Getting Help

- **Database Issues**: See `database/README.md`
- **Supabase Documentation**: https://supabase.com/docs
- **Angular Documentation**: https://angular.dev/overview

## Next Steps

After successful setup:

1. **Customize the application**:
   - Update branding and colors
   - Add email verification flow
   - Implement additional features

2. **Configure email templates** in Supabase:
   - Go to Authentication → Email Templates
   - Customize confirmation and password reset emails

3. **Set up production environment**:
   - Configure production Supabase project
   - Set up CI/CD pipeline
   - Deploy to hosting platform (Vercel, Netlify, etc.)

4. **Security enhancements**:
   - Enable email verification
   - Add rate limiting
   - Configure CORS policies
   - Set up monitoring

## Summary

The sign up feature is **production-ready** with:

- ✅ Complete registration form with validation
- ✅ Password strength indicator
- ✅ Show/hide password toggles
- ✅ Supabase Auth integration
- ✅ Database user profile creation
- ✅ Row Level Security policies
- ✅ Responsive, professional UI
- ✅ Comprehensive error handling

**All you need to do**:
1. Run the database migrations
2. Start the dev server
3. Navigate to `/register`
4. Start signing up users!

---

**Questions or Issues?**

Check the troubleshooting section above or review the database setup in `database/README.md`.
