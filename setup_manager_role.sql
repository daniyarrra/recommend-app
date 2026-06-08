-- Add is_manager column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_manager BOOLEAN DEFAULT false;

-- Create RPC function to toggle manager role (only admins can call this)
CREATE OR REPLACE FUNCTION admin_set_manager(target_uid UUID, make_manager BOOLEAN)
RETURNS VOID AS $$
BEGIN
  -- Only allow if caller is admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Only admins can assign manager role';
  END IF;

  UPDATE profiles SET is_manager = make_manager WHERE id = target_uid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
