# Authentication Setup Guide

This guide will help you set up Supabase authentication for the SmartSchedule application.

## Prerequisites

1. A Supabase account (sign up at [supabase.com](https://supabase.com))
2. Node.js and npm installed

## Step 1: Create a Supabase Project

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Click "New Project"
3. Fill in your project details:
   - **Project Name**: SmartSchedule (or your preferred name)
   - **Database Password**: Choose a strong password
   - **Region**: Select the closest region to your users
4. Click "Create new project"
5. Wait for the project to be set up (this may take a few minutes)

## Step 2: Get Your API Keys

1. In your Supabase project dashboard, click on the **Settings** icon (gear icon) in the sidebar
2. Navigate to **API** section
3. Copy the following values:
   - **Project URL** (under "Project URL")
   - **anon public** key (under "Project API keys")

## Step 3: Configure Environment Variables

1. Create a `.env` file in the root of your project:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

3. **Important**: Make sure `.env` is in your `.gitignore` file to keep your keys secure

## Step 4: Configure Supabase Authentication

1. In your Supabase dashboard, go to **Authentication** > **Providers**
2. Enable **Email** provider (it should be enabled by default)
3. Configure email settings:
   - **Enable Email Confirmations**: Toggle ON if you want users to verify their email
   - **Enable Email Change Confirmations**: Toggle ON for security
   
4. Optional: Configure email templates:
   - Go to **Authentication** > **Email Templates**
   - Customize the confirmation, password recovery, and other email templates

## Step 5: Set Up Site URL (Important for Redirects)

1. Go to **Authentication** > **URL Configuration**
2. Add your site URL:
   - For local development: `http://localhost:5173`
   - For production: Your actual domain (e.g., `https://yourapp.com`)
3. Add redirect URLs if needed

## Step 6: Optional Database Tables

If you want to store additional user data (recommended for the SmartSchedule app):

1. Go to **Database** > **Tables**
2. Create the following tables:

### Users Table (extends auth.users)
```sql
CREATE TABLE public.users (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own data
CREATE POLICY "Users can view own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Policy: Users can update their own data
CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);
```

### Events Table
```sql
CREATE TABLE public.events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  location TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  priority TEXT CHECK (priority IN ('high', 'medium', 'low')) DEFAULT 'medium',
  type TEXT CHECK (type IN ('meeting', 'task', 'travel', 'personal')) DEFAULT 'meeting',
  notes TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own events" ON public.events
  FOR ALL USING (auth.uid() = user_id);
```

### Expenses Table
```sql
CREATE TABLE public.expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  category TEXT CHECK (category IN ('transport', 'food', 'accommodation', 'other')) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  related_event_id UUID REFERENCES public.events ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own expenses" ON public.expenses
  FOR ALL USING (auth.uid() = user_id);
```

### Routes Table
```sql
CREATE TABLE public.routes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  from_location TEXT NOT NULL,
  to_location TEXT NOT NULL,
  mode TEXT CHECK (mode IN ('driving', 'transit', 'walking', 'cycling')) NOT NULL,
  duration INTEGER NOT NULL, -- in minutes
  distance DECIMAL(10, 2) NOT NULL, -- in km
  cost DECIMAL(10, 2) DEFAULT 0,
  arrival_time TIMESTAMP WITH TIME ZONE,
  status TEXT CHECK (status IN ('optimal', 'delayed', 'normal')) DEFAULT 'normal',
  traffic_level TEXT CHECK (traffic_level IN ('low', 'medium', 'high')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own routes" ON public.routes
  FOR ALL USING (auth.uid() = user_id);
```

## Step 7: Test the Authentication

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:5173`
3. You should be redirected to the login page
4. Click "Sign up" and create a test account
5. After successful signup, you should be redirected to the dashboard

## Troubleshooting

### Common Issues

1. **"Invalid API key" error**
   - Double-check your `.env` file
   - Make sure you're using the `anon` public key, not the `service_role` key
   - Restart your dev server after changing environment variables

2. **Email confirmation not working**
   - Check your spam folder
   - In development, you can disable email confirmation in Supabase settings
   - Check Supabase logs: **Authentication** > **Logs**

3. **Redirect issues**
   - Verify the Site URL in Supabase settings matches your app URL
   - Check that redirect URLs are properly configured

4. **Session not persisting**
   - Clear your browser cookies and localStorage
   - Check browser console for errors
   - Verify Supabase client configuration in `/src/lib/supabase.ts`

## Security Best Practices

1. **Never commit `.env` file** to version control
2. **Use different projects** for development and production
3. **Enable Row Level Security (RLS)** on all database tables
4. **Rotate API keys** regularly in production
5. **Use strong password requirements** in Supabase settings
6. **Enable email verification** for production environments
7. **Set up proper CORS policies** for your production domain

## Next Steps

After setting up authentication:

1. Implement password reset functionality
2. Add social authentication providers (Google, GitHub, etc.)
3. Set up user profiles and preferences
4. Implement proper error handling and user feedback
5. Add loading states and skeleton screens
6. Set up analytics and monitoring

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [React + Supabase Guide](https://supabase.com/docs/guides/getting-started/quickstarts/reactjs)

## Support

If you encounter any issues:
1. Check the [Supabase Discord](https://discord.supabase.com)
2. Review [Supabase GitHub Issues](https://github.com/supabase/supabase/issues)
3. Consult the official documentation
