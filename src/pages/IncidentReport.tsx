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
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);

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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const fileArray = Array.from(files);
      const validFiles = fileArray.filter(file => {
        const isValidType = file.type.startsWith('image/');
        const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB limit
        return isValidType && isValidSize;
      });

      if (validFiles.length !== fileArray.length) {
        toast({
          title: "Some files were skipped",
          description: "Only image files under 5MB are allowed",
          variant: "destructive",
        });
      }

      setImages(prev => [...prev, ...validFiles].slice(0, 3)); // Max 3 images

      // Create preview URLs
      validFiles.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            setImagePreviewUrls(prev => [...prev, e.target!.result as string]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Parse location coordinates if available
      let latitude = null;
      let longitude = null;
      if (location.includes(',')) {
        const [lat, lng] = location.split(',').map(coord => parseFloat(coord.trim()));
        if (!isNaN(lat) && !isNaN(lng)) {
          latitude = lat;
          longitude = lng;
        }
      }

      // Save incident to database
      const { data: incident, error: dbError } = await supabase
        .from('incidents')
        .insert({
          user_id: user?.id,
          title: `${incidentType} incident`,
          description: description,
          incident_type: incidentType,
          location: location,
          latitude: latitude,
          longitude: longitude,
          status: 'open',
          severity: 'medium'
        })
        .select()
        .single();

      if (dbError) {
        console.error('Error saving incident:', dbError);
        throw new Error('Failed to save incident to database');
      }

      // Send Twilio SMS via edge function
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const response = await supabase.functions.invoke('emergency-notifications', {
          body: {
            type: 'incident_report',
            user_id: session.user.id,
            location: latitude && longitude ? {
              latitude: latitude,
              longitude: longitude
            } : undefined,
            incident_details: {
              title: `${incidentType} incident`,
              description: description,
              incident_type: incidentType,
              has_images: images.length > 0,
              image_count: images.length
            }
          }
        });

        if (response.error) {
          console.error('SMS error:', response.error);
          throw new Error('Failed to send SMS alerts');
        }

        toast({
          title: "✅ Report Submitted",
          description: `Incident saved and SMS sent to ${response.data.notifications_sent} contacts`,
        });
      } else {
        toast({
          title: "✅ Report Saved",
          description: "Incident report saved to your account",
        });
      }

      // Reset form
      setIncidentType("");
      setDescription("");
      setDatetime(new Date().toISOString().slice(0, 16));
      setImages([]);
      setImagePreviewUrls([]);
    } catch (error) {
      console.error('Submit error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit report. Please try again.",
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

      <main className="pt-20 px-4 md:pt-32 lg:pt-20 lg:pl-60">
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
                    rows={4}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="images" className="flex items-center gap-2">
                    <Camera className="w-4 h-4" />
                    Evidence Photos (Optional)
                  </Label>
                  <Input
                    id="images"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Upload up to 3 images, max 5MB each
                  </p>
                  
                  {/* Image Previews */}
                  {imagePreviewUrls.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      {imagePreviewUrls.map((url, index) => (
                        <div key={index} className="relative">
                          <img
                            src={url}
                            alt={`Evidence ${index + 1}`}
                            className="w-full h-20 object-cover rounded border"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
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
              <p>• Add photos as evidence if safe to do so</p>
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
