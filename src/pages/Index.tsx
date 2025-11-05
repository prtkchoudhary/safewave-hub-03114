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
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary flex items-center justify-center">
        <div className="animate-pulse flex items-center gap-3">
          <Shield className="w-12 h-12 text-primary" />
          <span className="text-2xl font-bold text-foreground">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary relative overflow-hidden pb-20">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-30 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-primary to-primary-glow rounded-xl">
              <Shield className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              SafeGuard
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowContacts(true)}
                className="text-foreground"
              >
                <Settings className="w-5 h-5" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={signOut}
              className="text-foreground"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content - Mobile First */}
      <main className="pt-20 pb-24 px-4">
        <div className="max-w-md mx-auto space-y-8">
          {/* Welcome Section */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <User className="w-5 h-5" />
              <span className="text-sm">Signed in as {user.email}</span>
            </div>
            <h2 className="text-2xl font-bold text-foreground">Stay Safe</h2>
            <p className="text-muted-foreground">Help is always one tap away</p>
          </div>

          {/* SOS Button - Center of attention */}
          <div className="flex justify-center py-12">
            <SosButton />
          </div>

          {/* Quick Actions */}
          <QuickActions onContactsClick={() => setShowContacts(true)} />

          {/* Admin Panel */}
          {isAdmin && <AdminPanel />}
        </div>
      </main>

      {/* Floating Chat Button */}
      <button
        onClick={() => setIsChatOpen(true)}
        className="fixed bottom-6 right-6 z-40 p-4 bg-gradient-to-r from-primary to-primary-glow rounded-full shadow-glow hover:scale-110 transition-transform duration-300"
      >
        <MessageCircle className="w-6 h-6 text-primary-foreground" />
      </button>

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