import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, Play, Pause, X, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase-temp";
import BottomNav from "@/components/BottomNav";

const SafetyTimer = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [minutes, setMinutes] = useState(30);
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [checkInMessage, setCheckInMessage] = useState("I'm safe and checking in!");

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  const handleTimerExpired = useCallback(async () => {
    setIsActive(false);
    
    try {
      // Update timer status in database
      const { error: dbError } = await supabase
        .from('safety_timers')
        .update({ 
          status: 'expired',
          emergency_triggered: true,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user?.id)
        .eq('status', 'active');

      if (dbError) {
        console.error('Error updating timer:', dbError);
      }

      // Send Twilio SMS via edge function
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        console.log('Sending timer expiry alert...');

        // Create a timeout promise
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Request timeout')), 30000)
        );

        const response = await Promise.race([
          supabase.functions.invoke('emergency-notifications', {
            body: {
              type: 'timer_expired',
              user_id: session.user.id,
              message: `Safety timer expired after ${minutes} minutes`
            }
          }),
          timeoutPromise
        ]);

        console.log('Timer expiry response:', response);

        if (response.error) {
          throw new Error(response.error.message);
        }

        const notificationsSent = response.data?.notifications_sent ?? 0;

        if (notificationsSent === 0) {
          toast({
            title: "⚠️ Timer Expired",
            description: response.data?.error || "No SMS sent. Please contact emergency contacts manually.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "⚠️ Emergency Alert Sent",
            description: `SMS sent to ${notificationsSent} contact${notificationsSent !== 1 ? 's' : ''}`,
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error('Error sending timer expiry alert:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast({
        title: "Error",
        description: errorMessage.includes('timeout')
          ? "Alert timeout. Please contact emergency contacts manually."
          : "Failed to send automatic alert. Please contact emergency contacts manually.",
        variant: "destructive",
      });
    }
  }, [user, minutes, toast]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      handleTimerExpired();
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, handleTimerExpired]);

  const startTimer = async () => {
    if (minutes > 0 && minutes <= 240) {
      setTimeLeft(minutes * 60);
      setIsActive(true);
      
      // Save timer session to database
      try {
        const { error } = await supabase
          .from('safety_timers')
          .insert({
            user_id: user?.id,
            duration_minutes: minutes,
            start_time: new Date().toISOString(),
            end_time: new Date(Date.now() + minutes * 60 * 1000).toISOString(),
            status: 'active',
            check_in_message: checkInMessage
          });

        if (error) {
          console.error('Error saving timer:', error);
        }
      } catch (error) {
        console.error('Database error:', error);
      }

      toast({
        title: "Safety Timer Started",
        description: `Check in within ${minutes} minutes or alert will be sent`,
      });
    } else {
      toast({
        title: "Invalid Duration",
        description: "Please enter a duration between 1-240 minutes",
        variant: "destructive",
      });
    }
  };

  const checkIn = async () => {
    setIsActive(false);
    setTimeLeft(0);

    // Update timer status in database
    try {
      const { error } = await supabase
        .from('safety_timers')
        .update({ 
          status: 'completed',
          emergency_triggered: false,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user?.id)
        .eq('status', 'active');

      if (error) {
        console.error('Error updating timer:', error);
      }
    } catch (error) {
      console.error('Database error:', error);
    }

    toast({
      title: "✅ Checked In Successfully",
      description: "Stay safe!",
    });
  };

  const cancelTimer = async () => {
    setIsActive(false);
    setTimeLeft(0);

    // Update timer status in database
    try {
      const { error } = await supabase
        .from('safety_timers')
        .update({ 
          status: 'cancelled',
          emergency_triggered: false,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user?.id)
        .eq('status', 'active');

      if (error) {
        console.error('Error updating timer:', error);
      }
    } catch (error) {
      console.error('Database error:', error);
    }

    toast({
      title: "Timer Cancelled",
      description: "Safety timer has been stopped",
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
              Safety Timer
            </h1>
          </div>
        </div>
      </header>

      <main className="pt-20 px-4 md:pt-32 lg:pt-20 lg:pl-60">
        <div className="max-w-md mx-auto space-y-6">
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Auto Check-In Timer
              </CardTitle>
              <CardDescription>
                Set a timer and check in before it expires, or emergency contacts will be notified
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!isActive ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="minutes">Timer Duration (minutes)</Label>
                    <Input
                      id="minutes"
                      type="number"
                      min="1"
                      max="240"
                      value={minutes}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '') {
                          setMinutes(0);
                        } else {
                          const numValue = parseInt(value);
                          if (!isNaN(numValue) && numValue >= 1 && numValue <= 240) {
                            setMinutes(numValue);
                          }
                        }
                      }}
                      placeholder="30"
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Enter duration between 1-240 minutes
                    </p>
                  </div>
                  <Button 
                    onClick={startTimer} 
                    className="w-full"
                    size="lg"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    Start Safety Timer
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-center py-8">
                    <div className="text-6xl font-bold text-primary mb-4">
                      {formatTime(timeLeft)}
                    </div>
                    <p className="text-muted-foreground">
                      Check in before timer expires
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      onClick={checkIn}
                      variant="default"
                      size="lg"
                      className="w-full"
                    >
                      <Pause className="w-5 h-5 mr-2" />
                      Check In
                    </Button>
                    <Button 
                      onClick={cancelTimer}
                      variant="outline"
                      size="lg"
                      className="w-full"
                    >
                      <X className="w-5 h-5 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>How it works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>1. Set a duration for your safety timer</p>
              <p>2. Start the timer when you're in a situation where you want to be checked</p>
              <p>3. Check in before the timer expires to confirm you're safe</p>
              <p>4. If you don't check in, your emergency contacts will be automatically notified</p>
            </CardContent>
          </Card>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default SafetyTimer;
