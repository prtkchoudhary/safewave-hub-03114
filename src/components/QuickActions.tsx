import { Phone, MapPin, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";

type QuickActionsProps = {
  onContactsClick: () => void;
};

const QuickActions = ({ onContactsClick }: QuickActionsProps) => {
  const [helplineDialogOpen, setHelplineDialogOpen] = useState(false);

  const helplines = [
    { name: "Police", number: "100", icon: "🚓" },
    { name: "Women Helpline", number: "1091", icon: "👩" },
    { name: "Child Helpline", number: "1098", icon: "👶" },
    { name: "Ambulance", number: "102", icon: "🚑" }
  ];

  const dialNumber = (number: string) => {
    window.location.href = `tel:${number}`;
    setHelplineDialogOpen(false);
  };

  const openSafeZones = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          // Search for police stations, hospitals, and fire stations within 5km radius
          const searchQuery = `police+station+hospital+fire+station+near+me`;
          const mapsUrl = `https://www.google.com/maps/search/${searchQuery}/@${latitude},${longitude},14z`;
          window.open(mapsUrl, '_blank');
        },
        (error) => {
          // Fallback - open generic search
          window.open('https://www.google.com/maps/search/police+station+hospital+near+me', '_blank');
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0
        }
      );
    } else {
      window.open('https://www.google.com/maps/search/police+station+hospital+near+me', '_blank');
    }
  };

  return (
    <div className="space-y-4">
      {/* Featured Emergency Hotline */}
      <Dialog open={helplineDialogOpen} onOpenChange={setHelplineDialogOpen}>
        <DialogTrigger asChild>
          <div className="relative group cursor-pointer">
            <div className="absolute inset-0 bg-gradient-to-r from-destructive/20 via-destructive/10 to-transparent rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <Card className="relative p-6 bg-gradient-to-br from-destructive/10 via-card/50 to-card/30 backdrop-blur-sm border-destructive/30 hover:border-destructive/50 transition-all duration-300 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-destructive/5 rounded-full blur-2xl" />
              <div className="relative flex items-center gap-5">
                <div className="relative">
                  <div className="absolute inset-0 bg-destructive/30 rounded-2xl blur-md" />
                  <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-destructive/30 to-destructive/20 flex items-center justify-center border border-destructive/40 group-hover:scale-110 transition-transform">
                    <Phone className="w-8 h-8 text-destructive" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-foreground mb-1 uppercase tracking-wide">Emergency Hotline</h3>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Immediate Response • 24/7</p>
                </div>
              </div>
            </Card>
          </div>
        </DialogTrigger>
        <DialogContent className="max-w-sm bg-card/95 backdrop-blur-xl border-destructive/30">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold uppercase tracking-wider text-destructive">
              Emergency Services
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Direct line to emergency response
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-4">
            {helplines.map((helpline) => (
              <Button
                key={helpline.number}
                onClick={() => dialNumber(helpline.number)}
                variant="outline"
                className="h-auto py-4 px-4 justify-start hover:bg-destructive/10 hover:border-destructive/40 transition-all group border-border/50"
              >
                <span className="text-2xl mr-3 group-hover:scale-125 transition-transform">{helpline.icon}</span>
                <div className="text-left flex-1">
                  <div className="font-bold text-base">{helpline.name}</div>
                  <div className="text-xs text-muted-foreground font-mono">{helpline.number}</div>
                </div>
                <Phone className="w-5 h-5 text-muted-foreground group-hover:text-destructive transition-colors" />
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Tactical Actions Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Emergency Contacts */}
        <div
          onClick={onContactsClick}
          className="relative group cursor-pointer"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
          <Card className="relative h-full p-5 bg-card/30 backdrop-blur-sm border-primary/20 hover:border-primary/40 transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl" />
            <div className="relative">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center mb-4 border border-primary/30 group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-bold text-foreground mb-1 uppercase tracking-wide text-sm">Contacts</h3>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Emergency Network</p>
            </div>
          </Card>
        </div>

        {/* Safe Zones */}
        <div
          onClick={openSafeZones}
          className="relative group cursor-pointer"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
          <Card className="relative h-full p-5 bg-card/30 backdrop-blur-sm border-primary/20 hover:border-primary/40 transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl" />
            <div className="relative">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center mb-4 border border-primary/30 group-hover:scale-110 transition-transform">
                <MapPin className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-bold text-foreground mb-1 uppercase tracking-wide text-sm">Safe Zones</h3>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Nearby Refuge</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default QuickActions;