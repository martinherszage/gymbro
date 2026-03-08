-- Add friendships table for social features
CREATE TABLE IF NOT EXISTS friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, friend_id)
);

-- Add points to profiles for gamification
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_points INTEGER NOT NULL DEFAULT 0;

-- Create activity log for social feed
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('workout_completed', 'milestone', 'streak', 'personal_record')),
  points_earned INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Friendships policies
CREATE POLICY "friendships_select" ON friendships FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "friendships_insert" ON friendships FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "friendships_update" ON friendships FOR UPDATE
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "friendships_delete" ON friendships FOR DELETE
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Activity log policies (friends can see each other's activities)
CREATE POLICY "activity_select_own" ON activity_log FOR SELECT
  USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM friendships 
      WHERE status = 'accepted' 
      AND ((user_id = auth.uid() AND friend_id = activity_log.user_id)
        OR (friend_id = auth.uid() AND user_id = activity_log.user_id))
    )
  );

CREATE POLICY "activity_insert_own" ON activity_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Function to award points when workout is completed
CREATE OR REPLACE FUNCTION award_workout_points()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  set_count INTEGER;
  points INTEGER;
BEGIN
  -- Only award points when workout is completed
  IF NEW.completed_at IS NOT NULL AND OLD.completed_at IS NULL THEN
    -- Count sets in this workout
    SELECT COUNT(*) INTO set_count FROM workout_sets WHERE workout_id = NEW.id;
    
    -- Calculate points: 10 base + 2 per set
    points := 10 + (set_count * 2);
    
    -- Update user's total points
    UPDATE profiles SET total_points = total_points + points WHERE id = NEW.user_id;
    
    -- Log the activity
    INSERT INTO activity_log (user_id, activity_type, points_earned, description, metadata)
    VALUES (
      NEW.user_id,
      'workout_completed',
      points,
      'Entrenamiento completado',
      jsonb_build_object('workout_id', NEW.id, 'set_count', set_count)
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for awarding points
DROP TRIGGER IF EXISTS on_workout_completed ON workouts;
CREATE TRIGGER on_workout_completed
  AFTER UPDATE ON workouts
  FOR EACH ROW
  EXECUTE FUNCTION award_workout_points();

-- Index for faster friend queries
CREATE INDEX IF NOT EXISTS idx_friendships_user_id ON friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend_id ON friendships(friend_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at DESC);
