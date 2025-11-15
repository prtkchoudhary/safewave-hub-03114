import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const SAFETY_AGENT_PROMPT = `You are SafeGuard AI, a compassionate and professional safety assistant integrated into a personal safety app. Your primary role is to help users stay safe and provide guidance during emergencies or safety concerns.

Key guidelines:
- Always prioritize user safety and wellbeing
- Provide practical, actionable safety advice tailored to their location
- Be supportive and non-judgmental
- If someone is in immediate danger, direct them to emergency services (911, 112, etc.)
- Suggest appropriate app features when relevant (SOS button, safety timer, location sharing, incident reporting, fake call)
- Keep responses concise but helpful (2-4 sentences unless detailed advice is needed)
- Be culturally sensitive and inclusive
- When user's location is provided, use it to give specific, location-aware recommendations
- Mention nearby safe places, police stations, hospitals, or well-lit public areas when relevant
- Consider time of day and local context when giving advice

Available app features you can suggest:
- SOS button: For immediate emergency alerts to contacts
- Safety timer: For check-in reminders with automatic alerts
- Live location: For sharing real-time location with trusted contacts
- Incident report: For documenting safety concerns or incidents
- Fake call: For emergency exit strategies

When suggesting features, use these action codes:
- sos_button: For emergency situations
- safety_timer: For check-in scenarios  
- live_location: For location sharing
- incident_report: For documenting incidents
- fake_call: For exit strategies

Always maintain a caring, professional tone while being informative and helpful.`;

interface ConversationMessage {
  role: 'user' | 'model';
  content: string;
}

interface RequestBody {
  message: string;
  conversation_history?: ConversationMessage[];
  emergency_context?: {
    location?: {
      latitude: number;
      longitude: number;
      address?: string;
    };
  };
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), { 
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const body: RequestBody = await req.json();
    const { message, conversation_history = [], emergency_context } = body;

    if (!message?.trim()) {
      return new Response(JSON.stringify({ error: 'Message is required' }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ 
        error: 'Gemini API key not configured',
        response: "I'm having trouble connecting right now, but I'm here to help with your safety. If this is an emergency, please contact local emergency services immediately (911, 112, etc.). You can also use the SOS button in the app for immediate help.",
        suggested_actions: ['sos_button']
      }), { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Build conversation context with enhanced location awareness
    let contextualMessage = message;
    let locationInfo = '';
    
    if (emergency_context?.location) {
      locationInfo = `\n\n[LOCATION CONTEXT - User is currently at:`;
      locationInfo += `\n- Coordinates: ${emergency_context.location.latitude}, ${emergency_context.location.longitude}`;
      
      if (emergency_context.location.address) {
        locationInfo += `\n- Address: ${emergency_context.location.address}`;
      }
      
      // Add time context
      const now = new Date();
      const hour = now.getUTCHours();
      const timeOfDay = hour >= 6 && hour < 12 ? 'morning' : 
                       hour >= 12 && hour < 18 ? 'afternoon' : 
                       hour >= 18 && hour < 22 ? 'evening' : 'night';
      locationInfo += `\n- Time of day: ${timeOfDay} (${now.toUTCString()})`;
      locationInfo += `\n\nIMPORTANT: Use this location information to provide specific, location-aware safety advice. Mention nearby landmarks, safe places, or relevant local context if the user asks about safe places, directions, or location-specific help.]`;
      
      contextualMessage += locationInfo;
    }

    // Prepare conversation history for Gemini
    const contents = [
      {
        role: 'user',
        parts: [{ text: SAFETY_AGENT_PROMPT }]
      },
      {
        role: 'model', 
        parts: [{ text: "I understand. I'm SafeGuard AI, your personal safety assistant. I'm here to help you stay safe and provide guidance during emergencies or safety concerns. How can I help you today?" }]
      }
    ];

    // Add conversation history
    conversation_history.forEach(msg => {
      contents.push({
        role: msg.role,
        parts: [{ text: msg.content }]
      });
    });

    // Add current message
    contents.push({
      role: 'user',
      parts: [{ text: contextualMessage }]
    });

    // Call Gemini API (free model: gemini-2.5-flash)
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: contents,
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH", 
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Gemini API error:', error);
      return new Response(JSON.stringify({ 
        error: 'Failed to get AI response',
        response: "I'm having trouble connecting right now, but I'm here to help with your safety. If this is an emergency, please contact local emergency services immediately (911, 112, etc.). You can also use the SOS button in the app for immediate help.",
        suggested_actions: ['sos_button']
      }), { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const data = await response.json();
    console.log('Gemini API response:', JSON.stringify(data, null, 2));
    
    if (!data.candidates || data.candidates.length === 0) {
      console.error('No candidates in response:', data);
      return new Response(JSON.stringify({ 
        error: 'No response from AI',
        response: "I'm having trouble generating a response right now. If this is an emergency, please contact local emergency services immediately (911, 112, etc.). You can also use the SOS button in the app for immediate help.",
        suggested_actions: ['sos_button']
      }), { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Safely access nested properties
    const candidate = data.candidates[0];
    if (!candidate || !candidate.content || !candidate.content.parts || !candidate.content.parts[0]) {
      console.error('Invalid candidate structure:', candidate);
      return new Response(JSON.stringify({ 
        error: 'Invalid AI response',
        response: "I'm having trouble generating a response right now. If this is an emergency, please contact local emergency services immediately (911, 112, etc.). You can also use the SOS button in the app for immediate help.",
        suggested_actions: ['sos_button']
      }), { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const aiResponse = candidate.content.parts[0].text;

    // Extract suggested actions from AI response and user message
    const suggestedActions: string[] = [];
    const responseText = aiResponse.toLowerCase();
    const userText = message.toLowerCase();
    
    // Check both user message and AI response for intent
    if (responseText.includes('sos') || responseText.includes('call emergency') || responseText.includes('immediate danger') ||
        userText.includes('danger') || userText.includes('help') || userText.includes('emergency')) {
      suggestedActions.push('sos_button');
    }
    if (responseText.includes('timer') || responseText.includes('check in') || responseText.includes('check-in') ||
        userText.includes('timer') || userText.includes('check in')) {
      suggestedActions.push('safety_timer');
    }
    if (responseText.includes('location') || responseText.includes('share') || responseText.includes('track') ||
        userText.includes('location') || userText.includes('where') || userText.includes('track me')) {
      suggestedActions.push('live_location');
    }
    if (responseText.includes('report') || responseText.includes('document') || responseText.includes('incident') ||
        userText.includes('report') || userText.includes('incident')) {
      suggestedActions.push('incident_report');
    }
    if (responseText.includes('fake call') || responseText.includes('exit') || responseText.includes('pretend') ||
        userText.includes('fake call') || userText.includes('excuse')) {
      suggestedActions.push('fake_call');
    }
    
    // Remove duplicates and limit
    const uniqueActions = [...new Set(suggestedActions)];

    return new Response(JSON.stringify({
      response: aiResponse,
      suggested_actions: uniqueActions.slice(0, 3) // Limit to 3 suggestions
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Function error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      response: "I'm having trouble right now, but I'm here to help with your safety. If this is an emergency, please contact local emergency services immediately (911, 112, etc.). You can also use the SOS button in the app for immediate help.",
      suggested_actions: ['sos_button']
    }), { 
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});