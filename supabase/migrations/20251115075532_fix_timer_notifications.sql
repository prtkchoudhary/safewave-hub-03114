-- Fix timer expiration notifications by updating process_expired_timers function
-- to use http extension to call the emergency-notifications edge function

-- Ensure http extension is enabled
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;

-- Drop and recreate the function with HTTP call capability
CREATE OR REPLACE FUNCTION public.process_expired_timers()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  timer_record record;
  contact_phones text[];
  contact_record record;
  service_role_key text;
  supabase_url text;
  http_response extensions.http_response;
  notification_payload jsonb;
BEGIN
  -- Get configuration (set these in Supabase Dashboard > Project Settings > API)
  supabase_url := current_setting('app.settings.supabase_url', true);
  service_role_key := current_setting('app.settings.service_role_key', true);

  -- Find and process expired timers
  FOR timer_record IN 
    SELECT 
      st.id, 
      st.user_id, 
      st.duration_minutes, 
      st.end_time,
      ls.latitude,
      ls.longitude
    FROM public.safety_timers st
    LEFT JOIN public.location_shares ls ON ls.user_id = st.user_id AND ls.is_active = true
    WHERE st.status = 'active'
      AND st.emergency_triggered = false
      AND st.end_time < now()
  LOOP
    -- Update timer status
    UPDATE public.safety_timers
    SET status = 'expired',
        emergency_triggered = true,
        updated_at = now()
    WHERE id = timer_record.id;

    -- Get emergency contacts
    SELECT array_agg(phone) INTO contact_phones
    FROM public.emergency_contacts
    WHERE user_id = timer_record.user_id;

    -- Create SOS activation
    INSERT INTO public.sos_activations (user_id, latitude, longitude, message, contacts_notified, status)
    VALUES (
      timer_record.user_id,
      timer_record.latitude,
      timer_record.longitude,
      'Safety timer expired after ' || timer_record.duration_minutes || ' minutes. No check-in received.',
      contact_phones,
      'active'
    );

    -- Try to call edge function to send notifications if configured
    IF supabase_url IS NOT NULL AND service_role_key IS NOT NULL THEN
      BEGIN
        -- Build notification payload
        notification_payload := jsonb_build_object(
          'type', 'timer_expired',
          'user_id', timer_record.user_id::text,
          'message', 'Safety timer expired after ' || timer_record.duration_minutes || ' minutes',
          'location', CASE 
            WHEN timer_record.latitude IS NOT NULL 
            THEN jsonb_build_object(
              'latitude', timer_record.latitude,
              'longitude', timer_record.longitude
            )
            ELSE NULL 
          END
        );

        -- Make HTTP request to edge function
        SELECT * INTO http_response FROM extensions.http((
          'POST',
          supabase_url || '/functions/v1/emergency-notifications',
          ARRAY[
            extensions.http_header('Authorization', 'Bearer ' || service_role_key),
            extensions.http_header('Content-Type', 'application/json')
          ],
          'application/json',
          notification_payload::text
        )::extensions.http_request);

        IF http_response.status != 200 THEN
          RAISE WARNING 'Failed to send notifications for timer %: HTTP %', timer_record.id, http_response.status;
        ELSE
          RAISE NOTICE 'Sent notifications for expired timer % (user %)', timer_record.id, timer_record.user_id;
        END IF;

      EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Error calling edge function for timer %: %', timer_record.id, SQLERRM;
      END;
    ELSE
      RAISE NOTICE 'Edge function not configured, SOS activation created for timer %', timer_record.id;
    END IF;

  END LOOP;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.process_expired_timers() TO postgres;

-- Update the cron job to ensure it's properly scheduled (if needed)
-- Note: This requires the pg_cron extension
DO $$
BEGIN
  -- Check if job exists, if not create it
  IF NOT EXISTS (
    SELECT 1 FROM cron.job 
    WHERE jobname = 'process-expired-timers-db'
  ) THEN
    PERFORM cron.schedule(
      'process-expired-timers-db',
      '* * * * *', -- Every minute
      'SELECT public.process_expired_timers()'
    );
  END IF;
END
$$;

-- Set configuration parameters (you need to set these in Supabase Dashboard)
-- Go to: Settings > API
-- These need to be set via ALTER DATABASE or Supabase Dashboard:
-- ALTER DATABASE postgres SET app.settings.supabase_url = 'https://your-project.supabase.co';
-- ALTER DATABASE postgres SET app.settings.service_role_key = 'your_service_role_key';

COMMENT ON FUNCTION public.process_expired_timers IS 
'Checks for expired safety timers and sends emergency notifications. 
Called by pg_cron every minute.
Requires app.settings.supabase_url and app.settings.service_role_key to be configured.';
