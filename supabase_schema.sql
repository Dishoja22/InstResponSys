-- SQL Schema for ResponSys
-- Run this in your Supabase SQL Editor

-- 1. Profiles Table (Trusted Role storage)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  email TEXT,
  role TEXT DEFAULT 'student', -- 'student' or 'admin'
  institution_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON public.profiles
FOR SELECT USING (auth.uid() = id);

-- 2. Departments Table
CREATE TABLE IF NOT EXISTS public.departments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  head_name TEXT,
  email TEXT,
  avg_resolution_days NUMERIC DEFAULT 0,
  institution_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on departments
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view departments" ON public.departments 
FOR SELECT TO authenticated USING (true);

-- 3. Complaints Table
CREATE TABLE IF NOT EXISTS public.complaints (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  complaint_code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  priority TEXT DEFAULT 'MEDIUM',
  status TEXT DEFAULT 'Pending',
  submitted_by UUID REFERENCES public.profiles(id),
  assigned_department TEXT,
  admin_response TEXT,
  ai_priority TEXT,
  ai_sentiment TEXT,
  ai_category TEXT,
  ai_tips JSONB,
  ai_confidence NUMERIC,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on complaints
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their own complaints" ON public.complaints
FOR SELECT USING (auth.uid() = submitted_by);

CREATE POLICY "Students can insert their own complaints" ON public.complaints
FOR INSERT WITH CHECK (auth.uid() = submitted_by);

CREATE POLICY "Admins can view and update all complaints" ON public.complaints
USING (
  EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 4. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  complaint_id UUID REFERENCES public.complaints(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT,
  type TEXT DEFAULT 'system', -- 'update', 'resolved', 'system'
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications" ON public.notifications
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications (read status)" ON public.notifications
FOR UPDATE USING (auth.uid() = user_id);

-- TRIGGER for updating profiles on auth.users changes
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.email, COALESCE(new.raw_user_meta_data->>'role', 'student'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
