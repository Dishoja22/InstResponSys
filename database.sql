-- Supabase Schema for ResponSys

CREATE TABLE institutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT,
  role TEXT NOT NULL CHECK (role IN ('student','faculty','admin')),
  department TEXT,
  student_id TEXT,
  institution_id UUID REFERENCES institutions(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  head_name TEXT,
  email TEXT,
  avg_resolution_days FLOAT DEFAULT 0,
  institution_id UUID REFERENCES institutions(id)
);

CREATE TABLE complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Hostel','Academic','IT','Library','Transport','Administration')),
  priority TEXT NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('LOW','MEDIUM','HIGH','URGENT')),
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending','In Progress','Resolved','Closed','Rejected')),
  submitted_by UUID REFERENCES users(id),
  assigned_department UUID REFERENCES departments(id),
  assigned_officer UUID REFERENCES users(id),
  ai_priority TEXT,
  ai_confidence INT,
  ai_sentiment TEXT,
  ai_category TEXT,
  ai_tips JSONB,
  admin_response TEXT,
  attachment_urls JSONB DEFAULT '[]',
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_complaints_user ON complaints(submitted_by, created_at DESC);
CREATE INDEX idx_complaints_status ON complaints(status, created_at DESC);

-- Auto-generate complaint_code:
CREATE OR REPLACE FUNCTION generate_complaint_code()
RETURNS TRIGGER AS $$
BEGIN
  NEW.complaint_code := 'RSY-' || EXTRACT(YEAR FROM now())::TEXT || '-' ||
    LPAD(FLOOR(RANDOM() * 99999)::TEXT, 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_complaint_code
  BEFORE INSERT ON complaints
  FOR EACH ROW EXECUTE FUNCTION generate_complaint_code();

CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id UUID REFERENCES complaints(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES users(id),
  actor_name TEXT,
  action TEXT NOT NULL,
  is_admin_only BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  complaint_id UUID REFERENCES complaints(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT CHECK (type IN ('status_update','admin_response','assigned','resolved','system')),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS:
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students see own complaints" ON complaints
  FOR SELECT USING (submitted_by = auth.uid() OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin','faculty')));
CREATE POLICY "Students insert own" ON complaints
  FOR INSERT WITH CHECK (submitted_by = auth.uid());
CREATE POLICY "Admins update" ON complaints
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin','faculty'))
  );

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own notifications" ON notifications
  FOR ALL USING (user_id = auth.uid());

-- Enable Realtime on: complaints, activity_log, notifications
