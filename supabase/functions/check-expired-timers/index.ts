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

        // Here you would normally send SMS alerts
        // For now, we'll just log the action
        // You can integrate with Twilio or another SMS service
        console.log(`Would send SMS to ${contacts.length} contact(s) for user ${timer.user_id}`);

        // Create SOS activation record
        const { error: sosError } = await supabase
          .from('sos_activations')
          .insert({
            user_id: timer.user_id,
            message: `Safety timer expired after ${timer.duration_minutes} minutes. No check-in received.`,
            contacts_notified: contacts.map(c => c.phone),
            status: 'active',
          });

        if (sosError) {
          console.error(`Error creating SOS activation:`, sosError);
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
