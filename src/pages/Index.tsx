import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, MessageCircle, LogOut, Settings, User, Phone } from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';
import SosButton from "@/components/SosButton";
import ChatOverlay from "@/components/ChatOverlay";
import EmergencyContactsModal from "@/components/EmergencyContactsModal";
import QuickActions from "@/components/QuickActions";
import AdminPanel from "@/components/AdminPanel";
import BottomNav from "@/components/BottomNav";
import { Button } from '@/components/ui/button';

const Index = () => {
  const { user, isLoading, signOut, isAdmin } = useAuth();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showContacts, setShowContacts] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/auth');
    }
  }, [user, isLoading, navigate]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-background sentinel-grain flex items-center justify-center relative overflow-hidden">
        {/* Radial Background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,hsl(191_100%_50%/0.1)_0%,transparent_70%)]" />

        {/* Loading Animation */}
        <div className="relative">
          {/* Outer Rings */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full border-2 border-primary/20 animate-sentinel-ripple" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full border-2 border-primary/30 animate-sentinel-ripple [animation-delay:0.5s]" />

          {/* Central Icon */}
          <div className="relative flex flex-col items-center gap-6">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/30 rounded-full blur-2xl animate-sentinel-pulse" />
              <div className="relative w-24 h-24 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full border-2 border-primary/40 flex items-center justify-center">
                <Shield className="w-12 h-12 text-primary animate-sentinel-pulse" />
              </div>
            </div>

            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold text-primary uppercase tracking-widest">
                SENTINEL
              </h2>
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
                Initializing Protection
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden pb-20 sentinel-grain bg-background">
      {/* Radial Protection Field Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,hsl(191_100%_50%/0.08)_0%,transparent_70%)]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-[radial-gradient(circle,hsl(191_100%_50%/0.1)_0%,transparent_70%)] blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[radial-gradient(circle,hsl(14_100%_60%/0.05)_0%,transparent_70%)] blur-3xl" />
      </div>

      {/* Header - Sentinel Command Bar */}
      <header className="fixed top-0 left-0 right-0 z-30 bg-card/40 backdrop-blur-xl border-b border-primary/10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-lg blur-md" />
              <div className="relative p-2.5 bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg border border-primary/30">
                <Shield className="w-6 h-6 text-primary" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-wider text-primary">
                SENTINEL
              </h1>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
                Protection Active
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowContacts(true)}
                className="text-foreground hover:text-primary hover:bg-primary/10 transition-all"
              >
                <Settings className="w-5 h-5" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={signOut}
              className="text-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content - Responsive */}
      <main className="relative pt-24 pb-24 px-4 md:pt-32 lg:pt-28 lg:pl-60">
        <div className="max-w-md md:max-w-4xl mx-auto space-y-10">
          {/* Status Banner */}
          <div className="relative animate-sentinel-shield">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-2xl blur-xl" />
            <div className="relative bg-card/30 backdrop-blur-md border border-primary/20 rounded-2xl p-6 overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full blur-3xl" />
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center border border-primary/40">
                      <div className="w-2 h-2 rounded-full bg-primary animate-sentinel-pulse" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs uppercase tracking-widest font-bold text-primary">System Status</span>
                      <div className="px-2 py-0.5 bg-primary/20 rounded-full">
                        <span className="text-[10px] uppercase tracking-wider font-semibold text-primary">Online</span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" />
                      {user.email}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="md:grid md:grid-cols-2 md:gap-12 md:items-start space-y-8 md:space-y-0">
            {/* Left Column - SOS and Primary Actions */}
            <div className="space-y-8">
              {/* SOS Button - Center of attention */}
              <div className="flex justify-center py-6 md:py-12">
                <SosButton />
              </div>
              
              {/* Quick Actions */}
              <QuickActions onContactsClick={() => setShowContacts(true)} />
            </div>
            
            {/* Right Column - Mission Control (Desktop Only) */}
            <div className="hidden md:block space-y-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent rounded-2xl blur-xl" />
                <div className="relative bg-card/20 backdrop-blur-md border border-border/50 rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-1 h-6 bg-primary rounded-full" />
                    <h3 className="text-lg font-bold uppercase tracking-wider text-foreground">Mission Control</h3>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    <button
                      onClick={() => navigate('/safety-timer')}
                      className="group relative flex items-center gap-4 p-4 bg-card/40 hover:bg-card/60 border border-primary/10 hover:border-primary/30 rounded-xl transition-all duration-300 text-left overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="relative flex items-center justify-center w-12 h-12 bg-primary/10 group-hover:bg-primary/20 rounded-lg transition-colors">
                        <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="relative flex-1">
                        <div className="font-semibold text-foreground group-hover:text-primary transition-colors">Safety Timer</div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wider">Check-in Protocol</div>
                      </div>
                    </button>

                    <button
                      onClick={() => navigate('/live-location')}
                      className="group relative flex items-center gap-4 p-4 bg-card/40 hover:bg-card/60 border border-primary/10 hover:border-primary/30 rounded-xl transition-all duration-300 text-left overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="relative flex items-center justify-center w-12 h-12 bg-primary/10 group-hover:bg-primary/20 rounded-lg transition-colors">
                        <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <div className="relative flex-1">
                        <div className="font-semibold text-foreground group-hover:text-primary transition-colors">Live Tracking</div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wider">Location Broadcast</div>
                      </div>
                    </button>

                    <button
                      onClick={() => navigate('/incident-report')}
                      className="group relative flex items-center gap-4 p-4 bg-card/40 hover:bg-card/60 border border-accent/10 hover:border-accent/30 rounded-xl transition-all duration-300 text-left overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-accent/0 via-accent/5 to-accent/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="relative flex items-center justify-center w-12 h-12 bg-accent/10 group-hover:bg-accent/20 rounded-lg transition-colors">
                        <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="relative flex-1">
                        <div className="font-semibold text-foreground group-hover:text-accent transition-colors">Incident Log</div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wider">Report & Document</div>
                      </div>
                    </button>

                    <button
                      onClick={() => navigate('/fake-call')}
                      className="group relative flex items-center gap-4 p-4 bg-card/40 hover:bg-card/60 border border-primary/10 hover:border-primary/30 rounded-xl transition-all duration-300 text-left overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="relative flex items-center justify-center w-12 h-12 bg-primary/10 group-hover:bg-primary/20 rounded-lg transition-colors">
                        <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </div>
                      <div className="relative flex-1">
                        <div className="font-semibold text-foreground group-hover:text-primary transition-colors">Decoy Call</div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wider">Exit Strategy</div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Admin Panel */}
          {isAdmin && <AdminPanel />}
        </div>
      </main>

      {/* AI Sentinel - Floating Assistant */}
      <div className="fixed bottom-24 right-6 z-40 group md:bottom-6">
        <div className="relative">
          {/* Orbital Rings */}
          <div className="absolute inset-0 animate-sentinel-ripple pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full border border-primary/30" />
          </div>
          <div className="absolute inset-0 animate-sentinel-ripple [animation-delay:0.5s] pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full border border-primary/20" />
          </div>

          {/* Glow */}
          <div className="absolute -inset-4 bg-primary/30 rounded-full blur-2xl animate-sentinel-pulse" />

          {/* Main Button */}
          <button
            onClick={() => setIsChatOpen(true)}
            className="relative w-16 h-16 bg-gradient-to-br from-primary via-primary to-primary/90 rounded-full shadow-[0_0_30px_rgba(0,217,255,0.4)] hover:shadow-[0_0_50px_rgba(0,217,255,0.6)] hover:scale-110 transition-all duration-300 border-2 border-primary/50 group/btn overflow-hidden"
            title="Sentinel AI Assistant"
          >
            {/* Inner Glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-full" />

            {/* Icon */}
            <div className="relative flex items-center justify-center w-full h-full">
              <Shield className="w-8 h-8 text-background drop-shadow-lg" />
            </div>

            {/* Status Indicator */}
            <div className="absolute -top-1 -right-1 flex items-center justify-center">
              <div className="w-5 h-5 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-full border-2 border-background shadow-lg">
                <div className="w-full h-full rounded-full bg-emerald-400 animate-ping opacity-75" />
              </div>
            </div>

            {/* Rotating Border */}
            <div className="absolute inset-0 rounded-full opacity-0 group-hover/btn:opacity-100 transition-opacity">
              <div className="absolute inset-0 rounded-full border-2 border-white/40 animate-spin" style={{ animationDuration: '3s' }} />
            </div>
          </button>

          {/* Enhanced Tooltip */}
          <div className="absolute bottom-20 right-0 w-64 bg-card/95 backdrop-blur-xl border border-primary/30 rounded-xl p-4 shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 pointer-events-none">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-primary/30 to-primary/10 rounded-lg flex items-center justify-center border border-primary/30">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-bold text-primary uppercase tracking-wider">Sentinel AI</p>
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-sentinel-pulse" />
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  24/7 Safety Assistant • Powered by Gemini 2.5
                </p>
                <div className="mt-2 pt-2 border-t border-primary/20">
                  <p className="text-xs text-primary font-semibold uppercase tracking-wide">
                    Click for secure assistance
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Overlay */}
      <ChatOverlay isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />

      {/* Emergency Contacts Modal */}
      <EmergencyContactsModal 
        isOpen={showContacts} 
        onClose={() => setShowContacts(false)} 
      />

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default Index;