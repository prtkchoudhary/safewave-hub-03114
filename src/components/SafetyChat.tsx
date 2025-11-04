import { useState } from "react";
import { Send, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const SafetyChat = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! I'm your AI safety assistant. I can help you with safety tips, guidance when you feel unsafe, or answer questions about women's safety. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    // Simulate AI response (will be replaced with actual AI integration)
    setTimeout(() => {
      const responses = {
        unsafe: "If you feel unsafe, here are immediate steps:\n1. Move to a well-lit, populated area\n2. Call a trusted contact or emergency services (100/1091)\n3. Share your live location with trusted contacts\n4. Stay alert and trust your instincts",
        tips: "Key safety tips:\n• Always inform someone about your whereabouts\n• Carry your phone fully charged\n• Avoid isolated areas, especially at night\n• Trust your intuition if something feels wrong\n• Keep emergency contacts on speed dial",
        default: "I'm here to help with safety guidance. You can ask me about:\n• What to do if you feel unsafe\n• Safety tips for traveling alone\n• Self-defense basics\n• Emergency contact information",
      };

      let response = responses.default;
      if (userMessage.toLowerCase().includes("unsafe") || userMessage.toLowerCase().includes("scared")) {
        response = responses.unsafe;
      } else if (userMessage.toLowerCase().includes("tip") || userMessage.toLowerCase().includes("advice")) {
        response = responses.tips;
      }

      setMessages((prev) => [...prev, { role: "assistant", content: response }]);
      setIsLoading(false);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Sparkles className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h2 className="text-3xl font-bold text-foreground">AI Safety Assistant</h2>
          <p className="text-muted-foreground">Get instant safety guidance and support</p>
        </div>
      </div>

      <Card className="p-6 bg-card border-border shadow-soft">
        <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] p-4 rounded-2xl ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-foreground"
                }`}
              >
                <p className="whitespace-pre-line">{message.content}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-secondary text-foreground p-4 rounded-2xl">
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about safety..."
            className="flex-1 bg-background border-input"
            disabled={isLoading}
          />
          <Button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="bg-primary hover:bg-primary-glow text-primary-foreground"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </Card>
    </section>
  );
};

export default SafetyChat;
