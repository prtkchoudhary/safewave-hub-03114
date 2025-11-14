import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X, Send, Sparkles, Shield, MapPin, Clock, FileText, Phone, AlertTriangle, Zap, Heart, Users, Camera, Timer, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase-temp";

type Message = {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  suggested_actions?: string[];
};

type ChatOverlayProps = {
  isOpen: boolean;
  onClose: () => void;
};

const ChatOverlay = ({ isOpen, onClose }: ChatOverlayProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! I'm SafeGuard AI, your personal safety assistant. I'm here to help you stay safe and provide guidance during emergencies or safety concerns. How can I help you today?",
      timestamp: new Date().toISOString(),
      suggested_actions: [],
    },
  ]);

  const emergencyOptions = [
    { icon: AlertTriangle, text: "I'm in immediate danger", color: "bg-red-500", priority: "emergency" },
    { icon: Shield, text: "I feel unsafe right now", color: "bg-orange-500", priority: "urgent" },
    { icon: Users, text: "Someone is following me", color: "bg-red-400", priority: "urgent" },
    { icon: Phone, text: "Need emergency contacts", color: "bg-blue-500", priority: "urgent" }
  ];

  const safetyTips = [
    { icon: MapPin, text: "Safety tips for walking alone", color: "bg-green-500", category: "tips" },
    { icon: Shield, text: "How to stay safe at night", color: "bg-purple-500", category: "tips" },
    { icon: Camera, text: "Personal safety devices", color: "bg-blue-500", category: "tips" },
    { icon: Heart, text: "Self-defense basics", color: "bg-pink-500", category: "tips" }
  ];

  const appFeatures = [
    { icon: Timer, text: "Set up safety timer", color: "bg-blue-600", action: "safety_timer" },
    { icon: Navigation, text: "Share live location", color: "bg-green-600", action: "live_location" },
    { icon: FileText, text: "Report an incident", color: "bg-orange-600", action: "incident_report" },
    { icon: Phone, text: "Start fake call", color: "bg-purple-600", action: "fake_call" }
  ];
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleQuickAction = (action: string) => {
    onClose();
    switch (action) {
      case 'sos_button':
        // The SOS button is on the main page
        navigate('/');
        toast({
          title: "SOS Feature",
          description: "Use the red SOS button on the main page for immediate emergency alerts.",
          variant: "destructive",
        });
        break;
      case 'safety_timer':
        navigate('/safety-timer');
        break;
      case 'live_location':
        navigate('/live-location');
        break;
      case 'incident_report':
        navigate('/incident-report');
        break;
      case 'fake_call':
        navigate('/fake-call');
        break;
      default:
        break;
    }
  };

  const getQuickActionButton = (action: string) => {
    const actions = {
      sos_button: { icon: AlertTriangle, label: "SOS Alert", color: "bg-red-500 hover:bg-red-600" },
      safety_timer: { icon: Clock, label: "Safety Timer", color: "bg-blue-500 hover:bg-blue-600" },
      live_location: { icon: MapPin, label: "Share Location", color: "bg-green-500 hover:bg-green-600" },
      incident_report: { icon: FileText, label: "Report Incident", color: "bg-orange-500 hover:bg-orange-600" },
      fake_call: { icon: Phone, label: "Fake Call", color: "bg-purple-500 hover:bg-purple-600" },
    };

    const actionConfig = actions[action as keyof typeof actions];
    if (!actionConfig) return null;

    const Icon = actionConfig.icon;

    return (
      <Button
        key={action}
        size="sm"
        onClick={() => handleQuickAction(action)}
        className={`text-white ${actionConfig.color} transition-all duration-200`}
      >
        <Icon className="w-4 h-4 mr-2" />
        {actionConfig.label}
      </Button>
    );
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    
    const userMsg: Message = {
      role: "user",
      content: userMessage,
      timestamp: new Date().toISOString(),
    };
    
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      // Get user location for context (if available)
      let locationContext = undefined;
      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 15000,
              enableHighAccuracy: true,
              maximumAge: 0
            });
          });
          locationContext = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
        } catch (error) {
          console.log('Location not available:', error);
        }
      }

      // Call Gemini API through our edge function
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await supabase.functions.invoke('gemini-safety-chat', {
        body: {
          message: userMessage,
          conversation_history: messages.slice(1).map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            content: msg.content
          })),
          emergency_context: locationContext ? {
            location: locationContext
          } : undefined
        }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to get AI response');
      }

      const aiMsg: Message = {
        role: "assistant",
        content: response.data.response,
        timestamp: new Date().toISOString(),
        suggested_actions: response.data.suggested_actions || [],
      };

      setMessages((prev) => [...prev, aiMsg]);

    } catch (error) {
      console.error('Chat error:', error);
      
      // Fallback response
      const fallbackMsg: Message = {
        role: "assistant",
        content: "I'm having trouble connecting right now, but I'm here to help with your safety. If this is an emergency, please contact local emergency services immediately (911, 112, etc.). You can also use the SOS button in the app for immediate help.",
        timestamp: new Date().toISOString(),
        suggested_actions: ['sos_button'],
      };

      setMessages((prev) => [...prev, fallbackMsg]);
      
      toast({
        title: "Connection Issue",
        description: "AI chat is temporarily unavailable. Emergency features still work.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/10 to-primary-glow/10 border-b border-border/50 backdrop-blur-lg relative z-[101]">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="p-2 bg-gradient-to-br from-primary to-primary-glow rounded-xl shadow-lg">
              <Shield className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background animate-pulse"></div>
          </div>
          <div>
            <h3 className="font-bold text-foreground text-lg">SafeGuard AI</h3>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              {isLoading ? (
                <><Sparkles className="w-3 h-3 animate-pulse" /> Thinking...</>
              ) : (
                <><Zap className="w-3 h-3 text-green-500" /> Ready to help</>
              )}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-foreground hover:bg-red-500/20 transition-colors"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-32" style={{height: 'calc(100vh - 200px)'}}>
        {messages.map((message, index) => (
          <div key={index} className="space-y-3">
            <div
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] p-4 rounded-2xl shadow-lg ${
                  message.role === "user"
                    ? "bg-gradient-to-br from-primary to-primary-glow text-primary-foreground"
                    : "bg-gradient-to-br from-card to-card/80 text-foreground border border-border/50 backdrop-blur-sm"
                }`}
              >
                <p className="whitespace-pre-line text-sm leading-relaxed">{message.content}</p>
                <p className={`text-xs mt-2 flex items-center gap-1 ${
                  message.role === "user" ? "opacity-70" : "text-muted-foreground"
                }`}>
                  {message.role === "assistant" && <Shield className="w-3 h-3" />}
                  {new Date(message.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
            
            {/* Quick Action Buttons */}
            {message.role === "assistant" && message.suggested_actions && message.suggested_actions.length > 0 && (
              <div className="flex justify-start">
                <div className="max-w-[85%] space-y-2">
                  <p className="text-xs text-muted-foreground px-1">Suggested actions:</p>
                  <div className="flex flex-wrap gap-2">
                    {message.suggested_actions.map((action) => getQuickActionButton(action))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gradient-to-br from-card to-card/80 border border-border/50 p-4 rounded-2xl shadow-lg backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Shield className="w-5 h-5 text-primary" />
                  <Sparkles className="w-3 h-3 text-primary-glow absolute -top-1 -right-1 animate-spin" />
                </div>
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-primary-glow rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                </div>
                <span className="text-sm text-muted-foreground font-medium">SafeGuard AI is analyzing...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Smart Quick Options - Show only if no messages beyond the initial one */}
      {messages.length === 1 && (
        <div className="px-4 pb-6 space-y-6">
          {/* Emergency Options */}
          <div>
            <h4 className="text-sm font-semibold text-red-500 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Emergency Situations
            </h4>
            <div className="grid grid-cols-1 gap-2">
              {emergencyOptions.map((option, index) => {
                const Icon = option.icon;
                return (
                  <Button
                    key={index}
                    variant="outline"
                    onClick={() => setInput(option.text)}
                    className={`justify-start text-left h-auto p-3 border-2 hover:${option.color} hover:text-white transition-all duration-200`}
                  >
                    <Icon className="w-4 h-4 mr-3 flex-shrink-0" />
                    <span className="text-sm">{option.text}</span>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Safety Tips */}
          <div>
            <h4 className="text-sm font-semibold text-blue-500 mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Safety Guidance
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {safetyTips.map((tip, index) => {
                const Icon = tip.icon;
                return (
                  <Button
                    key={index}
                    variant="outline"
                    onClick={() => setInput(tip.text)}
                    className="justify-start text-left h-auto p-3 hover:bg-blue-50 transition-colors"
                  >
                    <Icon className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="text-xs">{tip.text}</span>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* App Features */}
          <div>
            <h4 className="text-sm font-semibold text-green-500 mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Quick Actions
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {appFeatures.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <Button
                    key={index}
                    variant="outline"
                    onClick={() => handleQuickAction(feature.action)}
                    className="justify-start text-left h-auto p-3 hover:bg-green-50 transition-colors"
                  >
                    <Icon className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="text-xs">{feature.text}</span>
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Input Section - Fixed at bottom with proper spacing */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-card/95 to-card/80 backdrop-blur-lg border-t border-border/50 z-[102]" style={{paddingBottom: '80px'}}>
        <div className="p-4">
          {/* Quick Emergency Actions */}
          {!isLoading && messages.length > 1 && (
            <div className="flex gap-2 mb-3 overflow-x-auto scrollbar-hide">
              <Button
                size="sm"
                onClick={() => handleQuickAction('sos_button')}
                className="bg-red-500 hover:bg-red-600 text-white flex-shrink-0"
              >
                <AlertTriangle className="w-4 h-4 mr-1" />
                SOS
              </Button>
              <Button
                size="sm"
                onClick={() => handleQuickAction('safety_timer')}
                className="bg-blue-500 hover:bg-blue-600 text-white flex-shrink-0"
              >
                <Timer className="w-4 h-4 mr-1" />
                Timer
              </Button>
              <Button
                size="sm"
                onClick={() => handleQuickAction('live_location')}
                className="bg-green-500 hover:bg-green-600 text-white flex-shrink-0"
              >
                <Navigation className="w-4 h-4 mr-1" />
                Location
              </Button>
              <Button
                size="sm"
                onClick={() => handleQuickAction('fake_call')}
                className="bg-purple-500 hover:bg-purple-600 text-white flex-shrink-0"
              >
                <Phone className="w-4 h-4 mr-1" />
                Call
              </Button>
            </div>
          )}
          
          {/* Input Bar */}
          <div className="flex gap-3 items-end">
            <div className="flex-1 relative">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                placeholder="Describe your situation or ask for safety advice..."
                className="bg-background/80 border-2 border-primary/20 focus:border-primary rounded-xl px-4 py-3 text-sm shadow-lg backdrop-blur-sm"
                disabled={isLoading}
              />
              {isLoading && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Sparkles className="w-4 h-4 animate-spin text-primary" />
                </div>
              )}
            </div>
            <Button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="bg-gradient-to-r from-primary to-primary-glow hover:from-primary-glow hover:to-primary text-primary-foreground rounded-xl px-6 py-3 shadow-lg transition-all duration-200 transform hover:scale-105"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
          
          {/* Footer */}
          <div className="flex justify-center mt-3">
            <p className="text-xs text-muted-foreground text-center flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Powered by Google Gemini 2.5 Flash • Your 24/7 safety companion
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatOverlay;