-- Add trigger to automatically set user_id to current user
-- This bypasses the hanging auth.getUser() issue in the frontend

-- Create trigger function to auto-set user_id
CREATE OR REPLACE FUNCTION public.set_emergency_contact_user_id()
RETURNS TRIGGER AS $$
BEGIN
  -- If user_id is not provided, set it to the authenticated user
  IF NEW.user_id IS NULL THEN
    NEW.user_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS set_emergency_contact_user_id_trigger ON public.emergency_contacts;

-- Create trigger that runs before INSERT
CREATE TRIGGER set_emergency_contact_user_id_trigger
  BEFORE INSERT ON public.emergency_contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_emergency_contact_user_id();

-- Update the INSERT RLS policy to allow NULL user_id (will be filled by trigger)
DROP POLICY IF EXISTS "Users can insert own emergency contacts" ON public.emergency_contacts;

CREATE POLICY "Users can insert own emergency contacts"
ON public.emergency_contacts
FOR INSERT
WITH CHECK (
  COALESCE(user_id, auth.uid()) = auth.uid()
);

COMMENT ON FUNCTION public.set_emergency_contact_user_id IS 
'Automatically sets user_id to authenticated user for new emergency contacts. 
This solves the issue of hanging auth.getUser() calls in the frontend.';
