# Authentication System Overview

## 📁 File Structure

```
src/
├── app/
│   ├── components/
│   │   ├── ProtectedRoute.tsx          # Route wrapper that requires authentication
│   │   └── ui/                          # UI components
│   ├── context/
│   │   ├── AuthContext.tsx              # Authentication state management
│   │   └── AppContext.tsx               # Application state management
│   ├── layouts/
│   │   └── RootLayout.tsx               # Main layout with user profile & logout
│   ├── pages/
│   │   ├── Login.tsx                    # Login page
│   │   ├── Signup.tsx                   # Signup page
│   │   ├── Dashboard.tsx                # Protected dashboard
│   │   ├── Schedule.tsx                 # Protected schedule page
│   │   ├── TravelPlanner.tsx            # Protected travel planner
│   │   ├── Recommendations.tsx          # Protected recommendations
│   │   ├── ExpenseTracker.tsx           # Protected expense tracker
│   │   └── Settings.tsx                 # Protected settings page
│   ├── routes.tsx                       # Router configuration with protected routes
│   └── App.tsx                          # Root component with AuthProvider
├── lib/
│   └── supabase.ts                      # Supabase client initialization
.env                                     # Environment variables (not committed)
.env.example                             # Template for environment variables
```

## 🔐 Authentication Flow

### 1. Initial Load
```
User visits app
    ↓
AuthContext checks for existing session
    ↓
If session exists → Redirect to Dashboard
If no session → Redirect to Login
```

### 2. Sign Up Flow
```
User fills signup form
    ↓
Validation (email format, password match, etc.)
    ↓
Call supabase.auth.signUp()
    ↓
If successful → Auto login and redirect to Dashboard
If error → Display error message
```

### 3. Login Flow
```
User fills login form
    ↓
Validation (email format, password length)
    ↓
Call supabase.auth.signInWithPassword()
    ↓
If successful → Store session and redirect to Dashboard
If error → Display error message
```

### 4. Protected Route Access
```
User navigates to protected route
    ↓
ProtectedRoute component checks auth state
    ↓
If authenticated → Render page
If not authenticated → Redirect to /login
```

### 5. Logout Flow
```
User clicks logout
    ↓
Call supabase.auth.signOut()
    ↓
Clear session
    ↓
Redirect to /login
```

## 🛠️ Key Components

### AuthContext (`/src/app/context/AuthContext.tsx`)

Provides authentication state and methods throughout the app:

```typescript
interface AuthContextType {
  user: User | null;              // Current user object
  session: Session | null;        // Current session
  loading: boolean;               // Loading state
  signUp: (email, password) => Promise;
  signIn: (email, password) => Promise;
  signOut: () => Promise;
}
```

**Usage:**
```typescript
import { useAuth } from '../context/AuthContext';

const { user, signIn, signOut, loading } = useAuth();
```

### ProtectedRoute (`/src/app/components/ProtectedRoute.tsx`)

Wrapper component that protects routes from unauthorized access:

```typescript
<ProtectedRoute>
  <Dashboard />
</ProtectedRoute>
```

- Shows loading spinner while checking auth state
- Redirects to `/login` if user is not authenticated
- Renders children if user is authenticated

### Login Page (`/src/app/pages/Login.tsx`)

Features:
- Email and password input fields
- Form validation
- Error handling
- Loading states
- Link to signup page
- Auto-redirect if already logged in
- Modern UI matching app design

### Signup Page (`/src/app/pages/Signup.tsx`)

Features:
- Email and password input fields
- Password confirmation
- Form validation
- Error handling
- Success state with auto-redirect
- Link to login page
- Auto-redirect if already logged in

### RootLayout (`/src/app/layouts/RootLayout.tsx`)

Enhanced with:
- User avatar with initials
- Email display in dropdown menu
- Logout button
- Settings link
- Mobile-responsive user menu

## 🔄 Session Management

### Automatic Session Persistence
The Supabase client automatically:
- Stores session in localStorage
- Refreshes tokens before expiration
- Detects session in URL (for email confirmations)
- Syncs session across browser tabs

### Session Listeners
AuthContext subscribes to auth state changes:
```typescript
supabase.auth.onAuthStateChange((event, session) => {
  // Updates user and session state automatically
  // Handles: SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED, etc.
});
```

## 🎨 UI/UX Features

### Form Validation
- Email format validation
- Password length requirements (min 6 characters)
- Password confirmation matching
- Empty field checks
- Real-time error messages

### Loading States
- Button disabled during submission
- Loading spinner on buttons
- Full-page loading spinner during auth checks
- Skeleton screens for protected routes

### Error Handling
- User-friendly error messages
- Alert components for errors
- Network error handling
- Invalid credentials feedback

### Success Feedback
- Toast notifications for successful actions
- Success alerts on signup
- Auto-redirect after successful auth
- Visual confirmation of logout

## 🚦 Route Configuration

### Public Routes
- `/login` - Login page
- `/signup` - Signup page

### Protected Routes (require authentication)
- `/` - Dashboard
- `/schedule` - Schedule Manager
- `/travel` - Travel Planner
- `/recommendations` - Recommendations
- `/expenses` - Expense Tracker
- `/settings` - Settings

### Route Protection Implementation
```typescript
// In routes.tsx
{
  path: "/",
  element: (
    <ProtectedRoute>
      <RootLayout />
    </ProtectedRoute>
  ),
  children: [
    { index: true, Component: Dashboard },
    { path: "schedule", Component: Schedule },
    // ... other protected routes
  ],
}
```

## 🔧 Environment Variables

Required variables in `.env`:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Important:**
- Prefix with `VITE_` to expose to client-side code
- Never commit `.env` file to version control
- Use `.env.example` as a template
- Restart dev server after changing environment variables

## 📱 Responsive Design

The authentication system is fully responsive:

### Desktop (lg breakpoint and above)
- Sidebar always visible
- User profile in sidebar footer
- Dropdown menu for account options

### Mobile (below lg breakpoint)
- Collapsible sidebar
- User avatar in top bar
- Mobile-optimized forms
- Touch-friendly buttons

## 🔒 Security Features

### Implemented
✅ Password-based authentication
✅ Session persistence
✅ Automatic token refresh
✅ Protected routes
✅ Secure client initialization
✅ Environment variable usage
✅ HTTPS enforcement (in production)
✅ Input validation

### Recommended for Production
- [ ] Email verification
- [ ] Password reset functionality
- [ ] Rate limiting
- [ ] CAPTCHA on signup
- [ ] Two-factor authentication
- [ ] Session timeout
- [ ] Account lockout after failed attempts
- [ ] Password strength requirements
- [ ] Social authentication providers

## 🧪 Testing the Authentication

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Access the app:**
   - Navigate to `http://localhost:5173`
   - You should be redirected to `/login`

3. **Create an account:**
   - Click "Sign up"
   - Enter email and password
   - Submit form
   - You should be redirected to dashboard

4. **Test logout:**
   - Click user avatar in sidebar
   - Click "Log out"
   - You should be redirected to `/login`

5. **Test login:**
   - Enter your credentials
   - Submit form
   - You should be redirected to dashboard

6. **Test protected routes:**
   - Log out
   - Try to access `/schedule` directly
   - You should be redirected to `/login`

## 📊 TypeScript Types

All authentication-related types are strongly typed:

```typescript
// From @supabase/supabase-js
import { User, Session, AuthError } from '@supabase/supabase-js';

// Custom context type
interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
}
```

## 🚀 Next Steps

To extend the authentication system:

1. **Add password reset:**
   - Create forgot password page
   - Implement email reset flow
   - Add reset password page

2. **Add email verification:**
   - Enable in Supabase settings
   - Add verification pending state
   - Implement resend verification email

3. **Add social providers:**
   - Enable Google/GitHub in Supabase
   - Add social login buttons
   - Handle OAuth callbacks

4. **Add user profiles:**
   - Create profile page
   - Store additional user data
   - Implement profile editing

5. **Enhance security:**
   - Add password strength meter
   - Implement rate limiting
   - Add CAPTCHA
   - Enable 2FA

## 📚 Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [React Router Documentation](https://reactrouter.com)
- [TypeScript + React Best Practices](https://react-typescript-cheatsheet.netlify.app/)

## 💡 Tips

1. Always check `loading` state before making auth decisions
2. Use `user?.email` with optional chaining to avoid null errors
3. Handle errors gracefully with user-friendly messages
4. Test authentication in incognito mode to verify session behavior
5. Clear localStorage when debugging session issues
6. Monitor Supabase logs for authentication events
7. Use environment-specific Supabase projects for dev/prod
