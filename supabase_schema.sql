-- Profiles Table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  full_name TEXT,
  role TEXT CHECK (role IN ('participant', 'admin')) DEFAULT 'participant',
  total_points INTEGER DEFAULT 0,
  status TEXT CHECK (status IN ('pending', 'approved')) DEFAULT 'pending',
  challenge_start_date DATE DEFAULT '2025-01-01', -- Example start date
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Groups Table
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  admin_id UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Group Members (moderated join requests)
CREATE TABLE group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) NOT NULL,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  status TEXT CHECK (status IN ('pending', 'approved')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- Workout Library
CREATE TABLE workout_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT CHECK (type IN ('weekday', 'weekend', 'event')) DEFAULT 'weekday',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- WODs Table
CREATE TABLE wods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT CHECK (type IN ('weekday', 'weekend', 'event')) DEFAULT 'weekday',
  group_id UUID REFERENCES groups(id), -- Optional: if null, assigned to all
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Events Table (Admin added)
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  bonus_points INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- User Goals Table
CREATE TABLE user_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  goal_name TEXT NOT NULL,
  points INTEGER DEFAULT 5,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, goal_name)
);

-- Daily Logs Table
CREATE TABLE daily_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  date DATE DEFAULT CURRENT_DATE NOT NULL,
  wod_done BOOLEAN DEFAULT FALSE,
  steps_done BOOLEAN DEFAULT FALSE,
  water_done BOOLEAN DEFAULT FALSE,
  sleep_done BOOLEAN DEFAULT FALSE,
  clean_eating_done BOOLEAN DEFAULT FALSE,
  daily_points INTEGER DEFAULT 0,
  UNIQUE(user_id, date)
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE wods ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_library ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Groups Policies
CREATE POLICY "Everyone can view groups" ON groups FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Admins can manage groups" ON groups FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Group Members Policies
CREATE POLICY "Users can view their own memberships" ON group_members FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all memberships" ON group_members FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Workout Library Policies
CREATE POLICY "Everyone can view library" ON workout_library FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Admins can manage library" ON workout_library FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- WODs Policies
CREATE POLICY "Everyone can view WODs" ON wods FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Admins can manage WODs" ON wods FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Daily Logs Policies
CREATE POLICY "Users can manage their own logs" ON daily_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all logs" ON daily_logs FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
