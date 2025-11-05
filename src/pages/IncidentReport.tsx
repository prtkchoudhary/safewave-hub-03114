import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Shield, MapPin, Camera, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase-temp";
import BottomNav from "@/components/BottomNav";

const IncidentReport = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [location, setLocation] = useState("");
  const [incidentType, setIncidentType] = useState("");
  const [description, setDescription] = useState("");
  const [datetime, setDatetime] = useState("");

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
    
    // Get current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation(`${position.coords.latitude}, ${position.coords.longitude}`);
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }

    // Set current datetime
    const now = new Date();
    const formattedDate = now.toISOString().slice(0, 16);
    setDatetime(formattedDate);
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Here you would typically save to a database
      // For now, we'll create a report message
      const report = `
🚨 INCIDENT REPORT

Type: ${incidentType}
Date/Time: ${new Date(datetime).toLocaleString()}
Location: ${location}

Description:
${description}

Reported by: ${user?.email}
      `;

      // Send to emergency contacts
      const { data: contacts } = await supabase
        .from('emergency_contacts')
        .select('*')
        .eq('user_id', user?.id);

      if (contacts && contacts.length > 0) {
        const primaryContact = contacts.find(c => c.is_primary) || contacts[0];
        const message = encodeURIComponent(report);
        window.open(`https://wa.me/${primaryContact.phone}?text=${message}`, '_blank');
      }

      toast({
        title: "Report Submitted",
        description: "Your incident report has been sent to emergency contacts",
      });

      // Reset form
      setIncidentType("");
      setDescription("");
      setDatetime(new Date().toISOString().slice(0, 16));
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary pb-20">
      <header className="fixed top-0 left-0 right-0 z-30 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-primary to-primary-glow rounded-xl">
              <Shield className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              Incident Report
            </h1>
          </div>
        </div>
      </header>

      <main className="pt-20 px-4">
        <div className="max-w-md mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Report an Incident
              </CardTitle>
              <CardDescription>
                Document any safety concerns or incidents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="type">Incident Type</Label>
                  <Select value={incidentType} onValueChange={setIncidentType} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select incident type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="harassment">Harassment</SelectItem>
                      <SelectItem value="stalking">Stalking</SelectItem>
                      <SelectItem value="theft">Theft</SelectItem>
                      <SelectItem value="assault">Assault</SelectItem>
                      <SelectItem value="suspicious">Suspicious Activity</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="datetime">Date & Time</Label>
                  <Input
                    id="datetime"
                    type="datetime-local"
                    value={datetime}
                    onChange={(e) => setDatetime(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="location" className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Location
                  </Label>
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Current location"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide details about the incident..."
                    rows={6}
                    required
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full"
                  size="lg"
                  disabled={isSubmitting}
                >
                  <Send className="w-5 h-5 mr-2" />
                  {isSubmitting ? "Submitting..." : "Submit Report"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Important Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>• Your report will be sent to your emergency contacts</p>
              <p>• Include as many details as possible</p>
              <p>• For immediate danger, use the SOS button instead</p>
              <p>• Consider reporting to local authorities if appropriate</p>
            </CardContent>
          </Card>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default IncidentReport;
