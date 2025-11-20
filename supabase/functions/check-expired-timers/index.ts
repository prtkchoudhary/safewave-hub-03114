import { createClient } from 'jsr:@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role key (has full access)
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Find all expired safety timers that haven't triggered an emergency
    const { data: expiredTimers, error: fetchError } = await supabase
      .from('safety_timers')
      .select('id, user_id, duration_minutes, end_time')
      .eq('status', 'active')
      .eq('emergency_triggered', false)
      .lt('end_time', new Date().toISOString());

    if (fetchError) {
      console.error('Error fetching expired timers:', fetchError);
      throw fetchError;
    }

    if (!expiredTimers || expiredTimers.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No expired timers found', count: 0 }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    console.log(`Found ${expiredTimers.length} expired timer(s)`);

    const results = [];

    // Process each expired timer
    for (const timer of expiredTimers) {
      try {
        // Update timer status
        const { error: updateError } = await supabase
          .from('safety_timers')
          .update({
            status: 'expired',
            emergency_triggered: true,
            updated_at: new Date().toISOString(),
          })
          .eq('id', timer.id);

        if (updateError) {
          console.error(`Error updating timer ${timer.id}:`, updateError);
          continue;
        }

        // Get user's emergency contacts
        const { data: contacts, error: contactsError } = await supabase
          .from('emergency_contacts')
          .select('phone, name')
          .eq('user_id', timer.user_id);

        if (contactsError) {
          console.error(`Error fetching contacts for user ${timer.user_id}:`, contactsError);
          continue;
        }

        if (!contacts || contacts.length === 0) {
          console.log(`No emergency contacts found for user ${timer.user_id}`);
          results.push({
            timer_id: timer.id,
            user_id: timer.user_id,
            status: 'no_contacts',
          });
          continue;
        }

        // Get user's last known location if available
        const { data: locationData } = await supabase
          .from('user_locations')
          .select('latitude, longitude')
          .eq('user_id', timer.user_id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        // Call emergency-notifications function to send SMS via Twilio
        console.log(`Sending SMS alerts to ${contacts.length} contact(s) for user ${timer.user_id}`);

        const notificationPayload = {
          type: 'timer_expired',
          user_id: timer.user_id,
          message: `Safety timer expired after ${timer.duration_minutes} minutes. No check-in received.`,
        };

        // Add location if available
        if (locationData?.latitude && locationData?.longitude) {
          notificationPayload.location = {
            latitude: locationData.latitude,
            longitude: locationData.longitude,
          };
        }

        // Invoke the emergency-notifications function
        const notificationResponse = await fetch(
          `${supabaseUrl}/functions/v1/emergency-notifications`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${supabaseServiceRoleKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(notificationPayload),
          }
        );

        if (!notificationResponse.ok) {
          console.error(`Failed to send notifications for user ${timer.user_id}`);
        } else {
          const notificationResult = await notificationResponse.json();
          console.log(`Notifications sent: ${notificationResult.notifications_sent} of ${notificationResult.total_contacts}`);
        }

        results.push({
          timer_id: timer.id,
          user_id: timer.user_id,
          contacts_count: contacts.length,
          status: 'processed',
        });
      } catch (error) {
        console.error(`Error processing timer ${timer.id}:`, error);
        results.push({
          timer_id: timer.id,
          error: error.message,
          status: 'error',
        });
      }
    }

    return new Response(
      JSON.stringify({
        message: 'Expired timers processed',
        total_found: expiredTimers.length,
        results: results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in check-expired-timers function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
