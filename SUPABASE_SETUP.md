# Supabase Setup Guide for JobSim Senegal

This guide will walk you through setting up Supabase for your Angular application with complete authentication and database configuration.

## Table of Contents

1. [Creating a Supabase Project](#1-creating-a-supabase-project)
2. [Environment Configuration](#2-environment-configuration)
3. [Database Setup](#3-database-setup)
4. [Authentication Configuration](#4-authentication-configuration)
5. [Security & RLS Policies](#5-security--rls-policies)
6. [Testing the Setup](#6-testing-the-setup)

---

## 1. Creating a Supabase Project

### Step 1: Sign Up / Log In to Supabase

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project" or "Sign In"
3. Sign up with GitHub, Google, or email

### Step 2: Create a New Project

1. Click "New Project"
2. Fill in the following details:
   - **Name**: `jobsim-senegal` (or your preferred name)
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose the closest region to your users (e.g., `eu-west-1` for Europe)
   - **Pricing Plan**: Select "Free" for development
3. Click "Create new project"
4. Wait 2-3 minutes for the project to be provisioned

### Step 3: Get Your API Keys

1. Once the project is created, go to **Settings** > **API**
2. You'll find two important values:
   - **Project URL**: `https://xxxxxxxxxxxxx.supabase.co`
   - **anon/public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (very long string)
3. Keep these values handy for the next step

---

## 2. Environment Configuration

### Update Environment Files

Open your Angular project and update the environment files with your Supabase credentials:

**File: `src/environments/environment.development.ts`**

```typescript
export const environment = {
  production: false,
  supabase: {
    url: 'https://xxxxxxxxxxxxx.supabase.co',  // Replace with your Project URL
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'  // Replace with your anon key
  }
};
```

**File: `src/environments/environment.ts`**

```typescript
export const environment = {
  production: true,
  supabase: {
    url: 'https://xxxxxxxxxxxxx.supabase.co',  // Replace with your Project URL
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'  // Replace with your anon key
  }
};
```

### Add to .gitignore

Make sure your environment files are in `.gitignore` to avoid committing sensitive keys:

```
# Environments
src/environments/environment.ts
src/environments/environment.development.ts
```

---

## 3. Database Setup

### Create the Users Table

1. In your Supabase dashboard, go to **Table Editor**
2. Click "Create a new table"
3. Configure the table as follows:

**Table Name**: `users`

**Columns**:

| Column Name      | Type         | Default Value      | Primary | Nullable | Description                    |
|-----------------|--------------|-------------------|---------|----------|--------------------------------|
| `id`            | `uuid`       | `auth.uid()`      | Yes     | No       | References auth.users(id)      |
| `email`         | `text`       | -                 | No      | No       | User's email address           |
| `user_type`     | `text`       | `'student'`       | No      | No       | User role: student/mentor/admin|
| `name`          | `text`       | `null`            | No      | Yes      | User's full name               |
| `created_at`    | `timestamptz`| `now()`           | No      | No       | Account creation timestamp     |
| `updated_at`    | `timestamptz`| `now()`           | No      | No       | Last update timestamp          |
| `completed_count`| `int4`      | `0`               | No      | Yes      | Number of completed tasks      |
| `score_total`   | `int4`       | `0`               | No      | Yes      | Total score                    |
| `badge_level`   | `text`       | `null`            | No      | Yes      | Current badge level            |
| `linkedProfile` | `text`       | `null`            | No      | Yes      | LinkedIn profile URL           |
| `contactEmail`  | `text`       | `null`            | No      | Yes      | Alternative contact email      |

**Important Settings**:
- ✅ Enable Row Level Security (RLS)
- ✅ Enable Realtime (optional, for live updates)

### SQL Method (Alternative)

You can also create the table using SQL. Go to **SQL Editor** and run:

```sql
-- Create users table
CREATE TABLE public.users (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email text NOT NULL,
  user_type text NOT NULL DEFAULT 'student',
  name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_count int4 DEFAULT 0,
  score_total int4 DEFAULT 0,
  badge_level text,
  "linkedProfile" text,
  "contactEmail" text
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
```

---

## 4. Authentication Configuration

### Configure Auth Settings

1. Go to **Authentication** > **Settings**
2. Configure the following:

**Site URL**: `http://localhost:4200` (for development)

**Redirect URLs**: Add these URLs:
- `http://localhost:4200/**`
- `https://yourdomain.com/**` (for production)

**Email Templates**: Customize your email templates
- Confirm signup
- Magic Link
- Reset password

### Enable Email Provider

1. Go to **Authentication** > **Providers**
2. Make sure **Email** is enabled
3. Configure settings:
   - ✅ Enable email confirmations (optional, recommended for production)
   - Set minimum password length: 6 characters

---

## 5. Security & RLS Policies

Row Level Security (RLS) ensures users can only access their own data.

### Create RLS Policies

Go to **Authentication** > **Policies** or use the **SQL Editor**:

```sql
-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON public.users
  FOR SELECT
  USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy: Users can insert their own profile (during signup)
CREATE POLICY "Users can insert own profile"
  ON public.users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Policy: Service role can do everything (for signup process)
CREATE POLICY "Service role can manage all users"
  ON public.users
  USING (auth.jwt() ->> 'role' = 'service_role');
```

### Create Database Function for User Creation

This function automatically creates a user profile when someone signs up:

```sql
-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, user_type, name, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'student'),
    NEW.raw_user_meta_data->>'name',
    now(),
    now()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

---

## 6. Testing the Setup

### Test Authentication Flow

1. **Start your Angular app**:
   ```bash
   npm start
   ```

2. **Navigate to the register page**:
   - Go to `http://localhost:4200/register`
   - Fill in the form with test data
   - Submit the form

3. **Check Supabase Dashboard**:
   - Go to **Authentication** > **Users**
   - You should see your new user
   - Go to **Table Editor** > **users**
   - You should see the user profile data

4. **Test Login**:
   - Go to `http://localhost:4200/login`
   - Login with your test credentials
   - You should be redirected to the dashboard

5. **Test Protected Routes**:
   - Try accessing `/dashboard` without logging in
   - You should be redirected to `/login`
   - Login and try again
   - You should see the dashboard

### Verify Database Connection

Open your browser console and check for:
- No CORS errors
- Successful authentication events
- User profile data loading

### Common Issues & Solutions

#### Issue: "Invalid API key"
**Solution**: Double-check your `anon` key in environment files

#### Issue: "Row Level Security policy violation"
**Solution**: Make sure RLS policies are created correctly

#### Issue: "Email not confirmed"
**Solution**:
- Go to **Authentication** > **Settings**
- Disable email confirmations for development
- Or check your email for confirmation link

#### Issue: User created in auth but not in users table
**Solution**:
- Check if the `handle_new_user()` trigger is created
- Verify the trigger is firing after INSERT on auth.users
- Check Supabase logs for errors

---

## Project Structure

Your Angular project now has the following structure:

```
src/app/
├── components/          # Reusable UI components
├── guards/             # Route guards
│   └── auth.guard.ts   # Authentication guards
├── models/             # TypeScript interfaces
│   └── user.model.ts   # User-related types
├── pages/              # Page components
│   ├── auth/
│   │   ├── login/      # Login page
│   │   └── register/   # Register page
│   └── dashboard/      # Dashboard page
├── services/           # Angular services
│   ├── auth.service.ts     # Authentication logic
│   └── supabase.service.ts # Supabase client
├── utils/              # Utility functions
└── app.routes.ts       # Route configuration
```

---

## Next Steps

1. **Customize User Profiles**: Add more fields to the users table
2. **Add Role-Based Access**: Use the role guards for admin/mentor features
3. **Email Verification**: Enable email confirmations in production
4. **Social Auth**: Add Google, GitHub OAuth providers
5. **Password Reset**: Implement password recovery flow
6. **User Dashboard**: Build out profile editing features
7. **Data Tables**: Create tables for jobs, submissions, simulations

---

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Angular Supabase Integration](https://supabase.com/docs/guides/getting-started/tutorials/with-angular)

---

## Support

If you encounter issues:
1. Check the browser console for errors
2. Check Supabase logs in the dashboard
3. Review the RLS policies
4. Verify environment variables are correct

Happy coding!
