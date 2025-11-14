import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const SAFETY_AGENT_PROMPT = `You are SafeGuard AI, a compassionate and professional safety assistant integrated into a personal safety app. Your primary role is to help users stay safe and provide guidance during emergencies or safety concerns.

Key guidelines:
- Always prioritize user safety and wellbeing
- Provide practical, actionable safety advice
- Be supportive and non-judgmental
- If someone is in immediate danger, direct them to emergency services (911, 112, etc.)
- Suggest appropriate app features when relevant (SOS button, safety timer, location sharing, incident reporting, fake call)
- Keep responses concise but helpful
- Be culturally sensitive and inclusive

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

    // Build conversation context
    let contextualMessage = message;
    if (emergency_context?.location) {
      contextualMessage += `\n\n[User's current location: ${emergency_context.location.latitude}, ${emergency_context.location.longitude}]`;
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
    
    if (!data.candidates || data.candidates.length === 0) {
      return new Response(JSON.stringify({ 
        error: 'No response from AI',
        response: "I'm having trouble generating a response right now. If this is an emergency, please contact local emergency services immediately (911, 112, etc.). You can also use the SOS button in the app for immediate help.",
        suggested_actions: ['sos_button']
      }), { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const aiResponse = data.candidates[0].content.parts[0].text;

    // Extract suggested actions from AI response
    const suggestedActions: string[] = [];
    const actionMatches = aiResponse.toLowerCase();
    
    if (actionMatches.includes('sos') || actionMatches.includes('emergency') || actionMatches.includes('immediate danger')) {
      suggestedActions.push('sos_button');
    }
    if (actionMatches.includes('timer') || actionMatches.includes('check in')) {
      suggestedActions.push('safety_timer');
    }
    if (actionMatches.includes('location') || actionMatches.includes('share')) {
      suggestedActions.push('live_location');
    }
    if (actionMatches.includes('report') || actionMatches.includes('document')) {
      suggestedActions.push('incident_report');
    }
    if (actionMatches.includes('fake call') || actionMatches.includes('exit')) {
      suggestedActions.push('fake_call');
    }

    return new Response(JSON.stringify({
      response: aiResponse,
      suggested_actions: suggestedActions.slice(0, 3) // Limit to 3 suggestions
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