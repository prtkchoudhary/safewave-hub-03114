import { Shield, MapPin, MessageCircle, Phone, AlertCircle } from "lucide-react";
import SosButton from "@/components/SosButton";
import EmergencyContacts from "@/components/EmergencyContacts";
import SafetyChat from "@/components/SafetyChat";
import SafeZones from "@/components/SafeZones";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnoiIHN0cm9rZT0iaHNsKDE5NSA4NSUgMzUlKSIgc3Ryb2tlLW9wYWNpdHk9IjAuMDUiLz48L2c+PC9zdmc+')] opacity-30"></div>
        
        <div className="container mx-auto px-4 py-12 relative">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-gradient-to-br from-primary to-primary-glow rounded-2xl shadow-glow">
              <Shield className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              SafeGuard
            </h1>
          </div>

          <div className="max-w-3xl">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 leading-tight">
              Your Personal Safety Companion
            </h2>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              Instant emergency alerts, AI-powered safety assistance, and real-time location sharing — all at your fingertips when you need it most.
            </p>
          </div>

          <SosButton />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 space-y-12">
        {/* Quick Actions Grid */}
        <section className="grid md:grid-cols-3 gap-6">
          <div className="group bg-card rounded-2xl p-6 shadow-soft hover:shadow-lg transition-all duration-300 border border-border hover:border-primary/20">
            <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Phone className="w-6 h-6 text-accent" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-card-foreground">Emergency Contacts</h3>
            <p className="text-muted-foreground">Quick access to helplines and trusted contacts</p>
          </div>

          <div className="group bg-card rounded-2xl p-6 shadow-soft hover:shadow-lg transition-all duration-300 border border-border hover:border-primary/20">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <MapPin className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-card-foreground">Safe Zones</h3>
            <p className="text-muted-foreground">Find nearby police stations and safe places</p>
          </div>

          <div className="group bg-card rounded-2xl p-6 shadow-soft hover:shadow-lg transition-all duration-300 border border-border hover:border-primary/20">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <MessageCircle className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-card-foreground">AI Safety Assistant</h3>
            <p className="text-muted-foreground">Get instant safety tips and guidance</p>
          </div>
        </section>

        {/* Emergency Contacts */}
        <EmergencyContacts />

        {/* Safe Zones Map */}
        <SafeZones />

        {/* AI Chat Assistant */}
        <SafetyChat />

        {/* Safety Tips */}
        <section className="bg-card rounded-2xl p-8 shadow-soft border border-border">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-2 bg-accent/10 rounded-lg">
              <AlertCircle className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-2 text-card-foreground">Quick Safety Tips</h3>
              <p className="text-muted-foreground">Essential guidelines for staying safe</p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-secondary rounded-xl">
              <h4 className="font-semibold mb-2 text-foreground">Share Your Location</h4>
              <p className="text-sm text-muted-foreground">Always let trusted contacts know where you're going</p>
            </div>
            <div className="p-4 bg-secondary rounded-xl">
              <h4 className="font-semibold mb-2 text-foreground">Trust Your Instincts</h4>
              <p className="text-sm text-muted-foreground">If something feels wrong, remove yourself from the situation</p>
            </div>
            <div className="p-4 bg-secondary rounded-xl">
              <h4 className="font-semibold mb-2 text-foreground">Stay Alert</h4>
              <p className="text-sm text-muted-foreground">Avoid distractions like headphones in unfamiliar areas</p>
            </div>
            <div className="p-4 bg-secondary rounded-xl">
              <h4 className="font-semibold mb-2 text-foreground">Use Well-Lit Routes</h4>
              <p className="text-sm text-muted-foreground">Stick to populated, well-lit areas when traveling alone</p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center border-t border-border mt-12">
        <p className="text-muted-foreground">
          SafeGuard - Empowering women with safety and confidence
        </p>
      </footer>
    </div>
  );
};

export default Index;
