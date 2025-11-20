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
    console.log('emergency-notifications function invoked');

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase credentials not configured');
      throw new Error('Supabase credentials not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get request body
    const { type, user_id, location, message } = await req.json();
    console.log('Request data:', { type, user_id, has_location: !!location, has_message: !!message });

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'user_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!type || !['sos', 'timer_expired'].includes(type)) {
      return new Response(
        JSON.stringify({ error: 'type must be either "sos" or "timer_expired"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user profile and emergency contacts
    console.log('Fetching profile and contacts for user:', user_id);

    const [
      { data: profile, error: profileError },
      { data: contacts, error: contactsError }
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user_id).single(),
      supabase.from('emergency_contacts').select('*').eq('user_id', user_id)
    ]);

    if (profileError) {
      console.error('Error fetching profile:', profileError);
    }
    if (contactsError) {
      console.error('Error fetching contacts:', contactsError);
    }

    console.log('Profile found:', !!profile, 'Contacts found:', contacts?.length || 0);

    if (!contacts || contacts.length === 0) {
      console.log('No emergency contacts found for user');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No emergency contacts found',
          notifications_sent: 0,
          total_contacts: 0
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userName = profile?.full_name || 'User';

    // Build SMS message based on type
    let smsMessage = '';

    if (type === 'sos') {
      smsMessage = `🚨 EMERGENCY SOS from ${userName}!`;

      if (location?.latitude && location?.longitude) {
        const locationLink = generateShortLocationLink(location.latitude, location.longitude);
        smsMessage += ` Location: ${locationLink}`;
      }

      if (message) {
        smsMessage += ` - ${message}`;
      }
    } else if (type === 'timer_expired') {
      smsMessage = `⏰ ${userName} missed safety check-in.`;

      if (location?.latitude && location?.longitude) {
        const locationLink = generateShortLocationLink(location.latitude, location.longitude);
        smsMessage += ` Last location: ${locationLink}`;
      } else {
        smsMessage += ` Please contact them immediately.`;
      }

      if (message) {
        smsMessage += ` Note: ${message}`;
      }
    }

    // Ensure under 160 characters for better compatibility
    if (smsMessage.length > 160) {
      smsMessage = smsMessage.substring(0, 157) + '...';
    }

    console.log(`Sending ${type} SMS (${smsMessage.length} chars): ${smsMessage}`);

    // Send SMS to all contacts
    const results = [];
    const errors = [];

    console.log(`Attempting to send SMS to ${contacts.length} contact(s)`);

    for (const contact of contacts) {
      console.log(`Sending SMS to ${contact.name} (${contact.phone})`);
      const twilioResponse = await sendTwilioSMS(contact.phone, smsMessage);

      if (twilioResponse) {
        console.log(`SMS sent successfully to ${contact.name}`);
        results.push({
          contact: contact.name,
          phone: contact.phone,
          status: 'sent',
          sid: twilioResponse.sid,
        });
      } else {
        console.log(`Failed to send SMS to ${contact.name}`);
        errors.push({
          contact: contact.name,
          phone: contact.phone,
          error: 'Failed to send SMS',
        });
      }
    }

    console.log(`SMS sending complete. Sent: ${results.length}, Failed: ${errors.length}`);

    // Create SOS activation record if it's an SOS alert
    if (type === 'sos') {
      console.log('Creating SOS activation record');
      const { error: sosError } = await supabase
        .from('sos_activations')
        .insert({
          user_id: user_id,
          message: message || 'Emergency SOS Alert',
          contacts_notified: contacts.map(c => c.phone),
          status: 'active',
        });

      if (sosError) {
        console.error('Error creating SOS activation:', sosError);
      } else {
        console.log('SOS activation record created successfully');
      }
    }

    console.log('Returning success response');
    return new Response(
      JSON.stringify({
        success: true,
        notifications_sent: results.length,
        total_contacts: contacts.length,
        results,
        errors: errors.length > 0 ? errors : undefined,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in emergency-notifications:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
