import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// Twilio SMS function
const sendTwilioSMS = async (to: string, message: string) => {
  const twilioSid = Deno.env.get('TWILIO_ACCOUNT_SID');
  const twilioToken = Deno.env.get('TWILIO_AUTH_TOKEN');
  const twilioNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

  if (!twilioSid || !twilioToken || !twilioNumber) {
    console.error('Twilio credentials not configured');
    return null;
  }

  const formattedTo = to.startsWith('+') ? to : `+${to}`;
  const auth = btoa(`${twilioSid}:${twilioToken}`);

  try {
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: formattedTo,
          From: twilioNumber,
          Body: message,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Twilio error: ${error.message}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Failed to send SMS to ${to}:`, error);
    return null;
  }
};

const generateShortLocationLink = (lat: number, lng: number) => {
  return `maps.google.com/maps?q=${lat.toFixed(4)},${lng.toFixed(4)}`;
};

Deno.serve(async (req: Request) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase credentials not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get request body
    const { timer_id, user_id, location } = await req.json();

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'user_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user profile and emergency contacts
    const [
      { data: profile },
      { data: contacts },
      { data: timer }
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user_id).single(),
      supabase.from('emergency_contacts').select('*').eq('user_id', user_id),
      timer_id ? supabase.from('safety_timers').select('*').eq('id', timer_id).single() : Promise.resolve({ data: null })
    ]);

    const userName = profile?.full_name || 'User';
    const duration = timer?.duration_minutes || 'N/A';

    // Build SMS message (keep under 160 chars for trial)
    let smsMessage = `⏰ ${userName} missed safety check-in (${duration}min timer).`;
    
    if (location?.latitude && location?.longitude) {
      const locationLink = generateShortLocationLink(location.latitude, location.longitude);
      smsMessage += ` Location: ${locationLink}`;
    } else {
      smsMessage += ` Please contact them immediately.`;
    }

    // Ensure under 160 characters
    if (smsMessage.length > 160) {
      smsMessage = smsMessage.substring(0, 157) + '...';
    }

    console.log(`Sending SMS (${smsMessage.length} chars): ${smsMessage}`);

    // Send SMS to all contacts
    const results = [];
    const errors = [];

    if (contacts && contacts.length > 0) {
      for (const contact of contacts) {
        const twilioResponse = await sendTwilioSMS(contact.phone, smsMessage);
        
        if (twilioResponse) {
          results.push({
            contact: contact.name,
            phone: contact.phone,
            status: 'sent',
            sid: twilioResponse.sid,
          });
        } else {
          errors.push({
            contact: contact.name,
            phone: contact.phone,
            error: 'Failed to send SMS',
          });
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        notifications_sent: results.length,
        total_contacts: contacts?.length || 0,
        results,
        errors: errors.length > 0 ? errors : undefined,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in notify-timer-expired:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
