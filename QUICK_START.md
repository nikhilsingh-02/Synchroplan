# Quick Start Guide - SmartSchedule with Authentication

Get your SmartSchedule app running with authentication in 5 minutes!

## 🚀 Quick Setup

### 1. Install Dependencies (if not already done)

```bash
npm install
```

### 2. Set Up Supabase

#### Option A: Use Existing Supabase Project
If you already have a Supabase project:

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

#### Option B: Create New Supabase Project
If you need to create a new project:

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Fill in project details and create
4. Go to Settings > API
5. Copy "Project URL" and "anon public" key
6. Add to `.env` file as shown above

### 3. Start Development Server

```bash
npm run dev
```

### 4. Test the App

1. Open `http://localhost:5173`
2. You'll be redirected to `/login`
3. Click "Sign up" to create an account
4. Enter email and password (min 6 characters)
5. After successful signup, you'll be logged in automatically!

## 🎯 What You Get

### Authentication Pages
- ✅ **Login Page** (`/login`) - Beautiful login form with validation
- ✅ **Signup Page** (`/signup`) - User registration with password confirmation
- ✅ **Auto-redirect** - Logged-in users redirected from auth pages

### Protected Pages
All these require authentication:
- ✅ **Dashboard** (`/`) - Overview of schedule, expenses, and insights
- ✅ **Schedule** (`/schedule`) - Event management with conflict detection
- ✅ **Travel Planner** (`/travel`) - Route optimization and traffic updates
- ✅ **Recommendations** (`/recommendations`) - AI-powered suggestions
- ✅ **Expenses** (`/expenses`) - Budget tracking and analytics
- ✅ **Settings** (`/settings`) - User preferences

### Features
- ✅ Session persistence (stays logged in after refresh)
- ✅ Automatic token refresh
- ✅ User profile display with email
- ✅ Logout functionality
- ✅ Loading states and error handling
- ✅ Mobile-responsive design
- ✅ Toast notifications
- ✅ Protected routes

## 🧪 Test Credentials

You'll need to create your own account. There are no default credentials.

**Test Account Creation:**
```
Email: test@example.com
Password: test123 (or any password ≥6 characters)
```

## 📱 User Interface

### Login/Signup Pages
- Clean, modern design matching the dashboard
- Email and password fields with icons
- Validation messages
- Loading states during submission
- Links to switch between login/signup

### Sidebar (When Logged In)
- User avatar with email initials
- Display of user email
- Dropdown menu with:
  - Settings link
  - Logout button

### Mobile Experience
- Responsive design
- Collapsible sidebar
- User menu in top bar
- Touch-optimized buttons

## 🔍 Troubleshooting

### "Invalid API key" Error
```bash
# Solution: Check your .env file
# Make sure you have both variables set correctly
# Restart the dev server after changes
```

### Not Redirecting After Login
```bash
# Solution: Clear browser cache and localStorage
# Then try logging in again
```

### Session Not Persisting
```bash
# Solution: Check browser console for errors
# Make sure cookies are enabled
# Try in incognito mode to test
```

### Can't Access Protected Routes
```bash
# Solution: Make sure you're logged in
# Check Network tab for auth errors
# Verify Supabase credentials are correct
```

## 📖 Next Steps

### Essential Setup (Recommended)
1. **Enable Email Confirmation** (Production)
   - Go to Supabase Dashboard > Authentication > Providers
   - Enable "Confirm email" option

2. **Configure Site URL**
   - Go to Authentication > URL Configuration
   - Add your production domain

3. **Set Up Database Tables** (Optional but recommended)
   - See `AUTH_SETUP.md` for SQL scripts
   - Create tables for events, expenses, routes
   - Enable Row Level Security

### Feature Enhancements
1. Add password reset functionality
2. Implement email verification
3. Add social login (Google, GitHub)
4. Create user profile page
5. Add two-factor authentication

## 📚 Documentation

- **Detailed Setup**: See `AUTH_SETUP.md`
- **Architecture Overview**: See `AUTHENTICATION_OVERVIEW.md`
- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)

## 🆘 Getting Help

If you encounter issues:

1. Check the browser console for errors
2. Review Supabase logs: Dashboard > Authentication > Logs
3. Verify environment variables are set correctly
4. Make sure Supabase project is not paused
5. Check [Supabase Status](https://status.supabase.com)

## 🎉 You're All Set!

Your SmartSchedule app is now running with full authentication! 

Try creating events, planning routes, tracking expenses, and exploring all the features.

**Happy Scheduling! 🚀**
