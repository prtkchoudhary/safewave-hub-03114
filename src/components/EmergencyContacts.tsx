import { Phone, MapPin, Heart, Shield } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const emergencyNumbers = [
  {
    name: "Police Emergency",
    number: "100",
    icon: Shield,
    description: "For immediate police assistance",
  },
  {
    name: "Women's Helpline",
    number: "1091",
    icon: Heart,
    description: "24/7 support for women in distress",
  },
  {
    name: "Ambulance",
    number: "102",
    icon: MapPin,
    description: "Medical emergency services",
  },
  {
    name: "National Commission for Women",
    number: "7827-170-170",
    icon: Shield,
    description: "Women's rights and safety support",
  },
];

const EmergencyContacts = () => {
  const handleCall = (number: string) => {
    window.location.href = `tel:${number}`;
  };

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2 text-foreground">Emergency Contacts</h2>
        <p className="text-muted-foreground">Quick access to helplines that can assist you</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {emergencyNumbers.map((contact) => {
          const Icon = contact.icon;
          return (
            <Card key={contact.number} className="p-6 hover:shadow-lg transition-all duration-300 border-border bg-card">
              <div className="flex items-start justify-between">
                <div className="flex gap-4 flex-1">
                  <div className="p-3 bg-primary/10 rounded-xl">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1 text-card-foreground">{contact.name}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{contact.description}</p>
                    <p className="text-2xl font-bold text-primary">{contact.number}</p>
                  </div>
                </div>
                <Button
                  onClick={() => handleCall(contact.number)}
                  size="icon"
                  className="bg-primary hover:bg-primary-glow text-primary-foreground rounded-full shadow-soft hover:shadow-lg transition-all"
                >
                  <Phone className="w-5 h-5" />
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
};

export default EmergencyContacts;
