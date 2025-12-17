# Quick Reference Guide - Angular + Supabase Authentication

## 🚀 Quick Start Commands

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build
```

---

## 📁 Project Structure

```
src/app/
├── components/              # Shared UI components
├── guards/
│   └── auth.guard.ts       # authGuard, guestGuard, roleGuard
├── models/
│   └── user.model.ts       # User, SignUpCredentials, SignInCredentials
├── pages/
│   ├── auth/
│   │   ├── login/          # Login page with reactive form
│   │   └── register/       # Register page with validation
│   └── dashboard/          # Protected dashboard page
├── services/
│   ├── auth.service.ts     # Main authentication service
│   └── supabase.service.ts # Supabase client wrapper
└── app.routes.ts           # Route configuration with guards
```

---

## 🔐 Authentication Service Usage

### Sign Up

```typescript
import { AuthService } from './services/auth.service';

constructor(private authService: AuthService) {}

async signup() {
  const response = await this.authService.signUp({
    email: 'user@example.com',
    password: 'password123',
    user_type: 'student',
    name: 'John Doe'
  });

  if (response.error) {
    console.error('Signup error:', response.error);
  } else {
    console.log('User created:', response.user);
  }
}
```

### Sign In

```typescript
async login() {
  const response = await this.authService.signIn({
    email: 'user@example.com',
    password: 'password123'
  });

  if (response.error) {
    console.error('Login error:', response.error);
  } else {
    console.log('Logged in:', response.user);
  }
}
```

### Sign Out

```typescript
async logout() {
  await this.authService.signOut();
  // User will be redirected to /login automatically
}
```

### Get Current User

```typescript
// Observable
this.authService.currentUser$.subscribe(user => {
  console.log('Current user:', user);
});

// Synchronous
const user = this.authService.getCurrentUser();
```

### Check Authentication Status

```typescript
// Observable
this.authService.isAuthenticated$.subscribe(isAuth => {
  console.log('Is authenticated:', isAuth);
});

// Synchronous
const isAuth = this.authService.isAuthenticated();
```

### Update Profile

```typescript
async updateProfile() {
  const response = await this.authService.updateProfile({
    name: 'Jane Doe',
    user_type: 'mentor'
  });

  if (response.error) {
    console.error('Update error:', response.error);
  }
}
```

---

## 🛡️ Route Guards

### Protect Routes (Auth Required)

```typescript
// app.routes.ts
{
  path: 'dashboard',
  component: DashboardComponent,
  canActivate: [authGuard]
}
```

### Guest Only Routes (Already Logged In → Redirect)

```typescript
{
  path: 'login',
  component: LoginComponent,
  canActivate: [guestGuard]
}
```

### Role-Based Guards

```typescript
import { roleGuard, adminGuard, studentGuard, mentorGuard } from './guards/auth.guard';

// Custom roles
{
  path: 'admin',
  component: AdminComponent,
  canActivate: [authGuard, adminGuard]
}

// Or create custom guard
const customGuard = roleGuard(['mentor', 'admin']);
{
  path: 'manage',
  component: ManageComponent,
  canActivate: [authGuard, customGuard]
}
```

---

## 🗄️ Supabase Service Usage

### Direct Database Queries

```typescript
import { SupabaseService } from './services/supabase.service';

constructor(private supabase: SupabaseService) {}

async getJobs() {
  const { data, error } = await this.supabase.client
    .from('jobs')
    .select('*')
    .eq('user_id', this.userId);

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Jobs:', data);
  }
}

async createJob(job: any) {
  const { data, error } = await this.supabase.client
    .from('jobs')
    .insert(job)
    .select()
    .single();

  return { data, error };
}

async updateJob(id: string, updates: any) {
  const { data, error } = await this.supabase.client
    .from('jobs')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  return { data, error };
}

async deleteJob(id: string) {
  const { error } = await this.supabase.client
    .from('jobs')
    .delete()
    .eq('id', id);

  return { error };
}
```

### Realtime Subscriptions

```typescript
subscribeToJobs() {
  const channel = this.supabase.client
    .channel('jobs')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'jobs'
    }, (payload) => {
      console.log('Change received!', payload);
    })
    .subscribe();

  // Unsubscribe when component is destroyed
  return () => channel.unsubscribe();
}
```

---

## 💾 Database Schema

### Users Table

```sql
CREATE TABLE public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  user_type text NOT NULL DEFAULT 'student',
  name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_count int4 DEFAULT 0,
  score_total int4 DEFAULT 0,
  badge_level text,
  linkedProfile text,
  contactEmail text
);
```

---

## 🔒 Row Level Security Policies

```sql
-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);
```

---

## 🎨 Form Validation Examples

### Login Form

```typescript
this.loginForm = this.fb.group({
  email: ['', [Validators.required, Validators.email]],
  password: ['', [Validators.required, Validators.minLength(6)]]
});
```

### Register Form

```typescript
this.registerForm = this.fb.group({
  name: ['', [Validators.required, Validators.minLength(2)]],
  email: ['', [Validators.required, Validators.email]],
  password: ['', [Validators.required, Validators.minLength(6)]],
  confirmPassword: ['', [Validators.required]],
  userType: ['student', [Validators.required]]
}, {
  validators: this.passwordMatchValidator
});
```

---

## 🌍 Environment Variables

**Development**: `src/environments/environment.development.ts`

```typescript
export const environment = {
  production: false,
  supabase: {
    url: 'YOUR_SUPABASE_URL',
    anonKey: 'YOUR_SUPABASE_ANON_KEY'
  }
};
```

**Production**: `src/environments/environment.ts`

```typescript
export const environment = {
  production: true,
  supabase: {
    url: 'YOUR_SUPABASE_URL',
    anonKey: 'YOUR_SUPABASE_ANON_KEY'
  }
};
```

---

## 🐛 Common Error Handling

```typescript
try {
  const response = await this.authService.signIn(credentials);

  if (response.error) {
    // Handle Supabase error
    if (response.error.includes('Invalid login credentials')) {
      this.errorMessage = 'Incorrect email or password';
    } else if (response.error.includes('Email not confirmed')) {
      this.errorMessage = 'Please confirm your email';
    } else {
      this.errorMessage = response.error;
    }
  } else {
    // Success
    this.router.navigate(['/dashboard']);
  }
} catch (error: any) {
  // Handle unexpected errors
  this.errorMessage = error.message || 'An unexpected error occurred';
}
```

---

## 📱 Responsive Design (Tailwind CSS)

All components use Tailwind CSS classes for responsive design:

```html
<!-- Mobile first approach -->
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
  <!-- Content -->
</div>

<!-- Responsive padding -->
<div class="px-4 sm:px-6 lg:px-8">
  <!-- Content -->
</div>
```

---

## 🧪 Testing Authentication

### Test User Creation

1. Start app: `npm start`
2. Go to `/register`
3. Create a test account
4. Check Supabase dashboard → Authentication → Users
5. Check Supabase dashboard → Table Editor → users

### Test Protected Routes

1. Try accessing `/dashboard` without login → Should redirect to `/login`
2. Login with test account
3. Access `/dashboard` → Should show dashboard
4. Try accessing `/login` while logged in → Should redirect to `/dashboard`

---

## 📚 TypeScript Interfaces

```typescript
// User Types
type UserType = 'student' | 'mentor' | 'admin';

interface User {
  id: string;
  email: string;
  user_type: UserType;
  created_at: string;
  updated_at: string;
  name?: string;
  // ... other fields
}

interface SignUpCredentials {
  email: string;
  password: string;
  user_type?: UserType;
  name?: string;
}

interface SignInCredentials {
  email: string;
  password: string;
}

interface AuthResponse {
  user: User | null;
  error: string | null;
}
```

---

## 🔗 Useful Links

- **Supabase Dashboard**: https://app.supabase.com
- **Supabase Docs**: https://supabase.com/docs
- **Angular Docs**: https://angular.dev
- **Tailwind CSS**: https://tailwindcss.com

---

## 🆘 Troubleshooting

### Can't connect to Supabase
- Check environment variables
- Verify Supabase URL and anon key
- Check browser console for CORS errors

### Authentication not working
- Check RLS policies are enabled
- Verify trigger function exists
- Check Supabase logs

### Routes not protected
- Ensure guards are imported in routes
- Check auth service initialization
- Verify session persistence

---

## 📝 Next Steps

1. Add password reset functionality
2. Implement email verification
3. Add social login (Google, GitHub)
4. Create profile editing page
5. Add role-based features
6. Implement data tables for jobs/simulations
7. Add real-time features

---

Happy coding! 🚀
