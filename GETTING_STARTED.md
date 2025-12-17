# Getting Started - JobSim Senegal Platform

Welcome! This guide will help you get your Angular + Supabase platform up and running in **under 30 minutes**.

---

## 📋 Prerequisites

Before you begin, make sure you have:

- ✅ **Node.js** (v18 or later) - [Download here](https://nodejs.org/)
- ✅ **npm** (comes with Node.js)
- ✅ A **Supabase account** - [Sign up here](https://supabase.com)
- ✅ A modern **web browser** (Chrome, Firefox, Edge, Safari)
- ✅ A **code editor** (VS Code recommended)

---

## 🚀 Quick Start (5 Steps)

### Step 1: Verify Installation

```bash
# Check Node.js version
node --version  # Should be v18+

# Check npm version
npm --version   # Should be 9+
```

### Step 2: Install Dependencies

```bash
# Install all npm packages
npm install
```

**Expected output**: ~600 packages installed successfully

### Step 3: Create Supabase Project

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Click **"New Project"**
3. Fill in:
   - **Name**: `jobsim-senegal`
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose closest to you (e.g., `eu-west-1`)
   - **Plan**: Free tier
4. Click **"Create new project"**
5. Wait 2-3 minutes for provisioning

### Step 4: Configure Environment

1. In Supabase dashboard, go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon/public key** (long JWT token)

3. Update **both** environment files:

**File**: `src/environments/environment.development.ts`
```typescript
export const environment = {
  production: false,
  supabase: {
    url: 'PASTE_YOUR_PROJECT_URL_HERE',
    anonKey: 'PASTE_YOUR_ANON_KEY_HERE'
  }
};
```

**File**: `src/environments/environment.ts`
```typescript
export const environment = {
  production: true,
  supabase: {
    url: 'PASTE_YOUR_PROJECT_URL_HERE',
    anonKey: 'PASTE_YOUR_ANON_KEY_HERE'
  }
};
```

### Step 5: Set Up Database

1. In Supabase dashboard, go to **SQL Editor**
2. Click **"+ New query"**
3. Copy and paste this SQL:

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

-- Create policies
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

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

-- Create user signup trigger
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

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

4. Click **"Run"** (or press Ctrl/Cmd + Enter)
5. You should see "Success. No rows returned"

---

## 🎯 Start Development Server

```bash
# Start the development server
npm start
```

**Wait for**: `Application bundle generation complete.`

Then open your browser to: **http://localhost:4200**

---

## ✅ Test Your Setup

### Test 1: Homepage

1. Navigate to `http://localhost:4200`
2. You should see the home page
3. ✅ **Pass**: Page loads without errors

### Test 2: Register New User

1. Click on "Register" or navigate to `http://localhost:4200/register`
2. Fill in the form:
   - **Name**: Test User
   - **Email**: test@example.com
   - **User Type**: Student
   - **Password**: test123
   - **Confirm Password**: test123
3. Click "Create Account"
4. ✅ **Pass**: Redirected to dashboard

### Test 3: Verify Database

1. Go to Supabase dashboard
2. Navigate to **Authentication** → **Users**
3. You should see your test user
4. Navigate to **Table Editor** → **users**
5. You should see the user profile data
6. ✅ **Pass**: User appears in both tables

### Test 4: Login

1. Sign out from the dashboard
2. Navigate to `http://localhost:4200/login`
3. Enter your credentials:
   - **Email**: test@example.com
   - **Password**: test123
4. Click "Sign in"
5. ✅ **Pass**: Redirected to dashboard

### Test 5: Protected Routes

1. Sign out if logged in
2. Try to access `http://localhost:4200/dashboard`
3. ✅ **Pass**: Automatically redirected to login
4. Log back in
5. ✅ **Pass**: Can access dashboard

### Test 6: Guest Routes

1. While logged in, try to access `http://localhost:4200/login`
2. ✅ **Pass**: Automatically redirected to dashboard

---

## 🔍 Troubleshooting

### Problem: "npm install" fails

**Solution**:
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

### Problem: "Cannot connect to Supabase"

**Checklist**:
- [ ] Verify Supabase URL is correct (no trailing slash)
- [ ] Verify anon key is complete (very long string)
- [ ] Check browser console for CORS errors
- [ ] Ensure Supabase project is active

**Solution**: Double-check environment files for typos

### Problem: "User created but no profile in database"

**Checklist**:
- [ ] Verify trigger function exists in Supabase SQL Editor
- [ ] Check Supabase logs for errors

**Solution**:
1. Go to Supabase **SQL Editor**
2. Re-run the trigger creation SQL
3. Try registering a new user

### Problem: "Email not confirmed" error

**Solution**:
1. Go to **Authentication** → **Settings**
2. Under "Email Settings"
3. Disable "Enable email confirmations" (for development only)
4. Try logging in again

### Problem: Build errors

**Solution**:
```bash
# Clean build
rm -rf dist .angular

# Rebuild
npm run build
```

### Problem: Port 4200 already in use

**Solution**:
```bash
# Kill process on port 4200
kill -9 $(lsof -t -i:4200)

# Or use a different port
ng serve --port 4300
```

---

## 📁 Project Files Overview

### Key Files You'll Work With

```
src/
├── app/
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── login/          ← Login page
│   │   │   └── register/       ← Registration page
│   │   └── dashboard/          ← Main dashboard
│   ├── services/
│   │   ├── auth.service.ts     ← Authentication logic
│   │   └── supabase.service.ts ← Database operations
│   ├── guards/
│   │   └── auth.guard.ts       ← Route protection
│   ├── models/
│   │   └── user.model.ts       ← TypeScript types
│   └── app.routes.ts           ← Route configuration
└── environments/
    ├── environment.ts          ← Production config
    └── environment.development.ts ← Development config
```

### Configuration Files

- `angular.json` - Angular project configuration
- `package.json` - npm dependencies
- `tsconfig.json` - TypeScript configuration
- `tailwind.config.ts` - Tailwind CSS configuration

---

## 📚 Next Steps

Now that your foundation is set up, you can:

### 1. Customize User Profile
Edit `src/app/models/user.model.ts` to add fields

### 2. Build Features
- Job listings page
- Simulation submissions
- User profile editing
- Admin dashboard

### 3. Add More Tables
```sql
CREATE TABLE jobs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  description text,
  user_id uuid REFERENCES public.users(id),
  created_at timestamptz DEFAULT now()
);
```

### 4. Enhance Authentication
- Add password reset page
- Enable email verification
- Add social logins (Google, GitHub)

### 5. Deploy to Production
- Build: `npm run build`
- Deploy `dist/` folder to:
  - Netlify
  - Vercel
  - AWS S3 + CloudFront
  - Your own server

---

## 🆘 Get Help

### Documentation
- **Supabase Setup**: See `SUPABASE_SETUP.md`
- **Quick Reference**: See `QUICK_REFERENCE.md`
- **Implementation Details**: See `IMPLEMENTATION_SUMMARY.md`

### Resources
- [Supabase Docs](https://supabase.com/docs)
- [Angular Docs](https://angular.dev)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

### Community
- [Supabase Discord](https://discord.supabase.com)
- [Angular Discord](https://discord.gg/angular)

---

## ✨ You're Ready!

Your Angular + Supabase platform is now fully configured and ready for development.

Start building amazing features! 🚀

**Happy coding!**

---

## 📝 Useful Commands

```bash
# Development
npm start              # Start dev server
npm run build          # Build for production
npm test               # Run tests

# Supabase
supabase login         # Login to Supabase CLI (optional)
supabase link          # Link project (optional)

# Git
git add .
git commit -m "Initial Supabase setup"
git push

# Clean up
rm -rf node_modules    # Remove dependencies
npm install            # Reinstall dependencies
```

---

**Last Updated**: 2025-11-15
**Version**: 1.0.0
