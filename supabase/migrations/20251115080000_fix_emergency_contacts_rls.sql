-- Fix RLS policy for emergency_contacts to properly support INSERT
-- Drop existing policy
DROP POLICY IF EXISTS "Users can manage own emergency contacts" ON public.emergency_contacts;

-- Create separate policies for better control
CREATE POLICY "Users can view own emergency contacts"
ON public.emergency_contacts
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own emergency contacts"
ON public.emergency_contacts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own emergency contacts"
ON public.emergency_contacts
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own emergency contacts"
ON public.emergency_contacts
FOR DELETE
USING (auth.uid() = user_id);

-- Verify RLS is enabled
ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.emergency_contacts TO authenticated;
