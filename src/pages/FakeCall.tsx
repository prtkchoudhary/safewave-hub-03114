import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Phone, PhoneOff, Shield, User, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import BottomNav from "@/components/BottomNav";

const FakeCall = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isCallActive, setIsCallActive] = useState(false);
  const [callerName, setCallerName] = useState("Mom");
  const [delay, setDelay] = useState(0);
  const [callDuration, setCallDuration] = useState(0);
  const vibrationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const triggerTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isCallActiveRef = useRef(false);

  // Keep ref in sync with state
  useEffect(() => {
    isCallActiveRef.current = isCallActive;
  }, [isCallActive]);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isCallActive) {
      interval = setInterval(() => {
        setCallDuration((duration) => duration + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isCallActive]);

  // Cleanup vibration and timeouts on unmount
  useEffect(() => {
    return () => {
      if (vibrationTimeoutRef.current) {
        clearTimeout(vibrationTimeoutRef.current);
      }
      if (triggerTimeoutRef.current) {
        clearTimeout(triggerTimeoutRef.current);
      }
      if (navigator.vibrate) {
        navigator.vibrate(0);
      }
    };
  }, []);

  const stopVibration = () => {
    if (vibrationTimeoutRef.current) {
      clearTimeout(vibrationTimeoutRef.current);
      vibrationTimeoutRef.current = null;
    }
    if (navigator.vibrate) {
      navigator.vibrate(0);
    }
  };

  const startVibration = () => {
    if (!navigator.vibrate) return;

    const pattern = [200, 100, 200, 100, 200];
    const vibrate = () => {
      if (!isCallActiveRef.current) return;

      navigator.vibrate(pattern);
      vibrationTimeoutRef.current = setTimeout(vibrate, 1000);
    };
    vibrate();
  };

  const triggerCall = () => {
    const triggerDelay = delay * 1000;

    triggerTimeoutRef.current = setTimeout(() => {
      setIsCallActive(true);
      setCallDuration(0);
      startVibration();
    }, triggerDelay);
  };

  const answerCall = () => {
    stopVibration();
    // Keep call active but stop ringing effect
  };

  const endCall = () => {
    stopVibration();
    setIsCallActive(false);
    setCallDuration(0);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!user) return null;

  if (isCallActive) {
    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col items-center justify-between py-12 px-6">
        {/* Call Header */}
        <div className="text-center space-y-4">
          <p className="text-white/60 text-sm">Incoming Call</p>
          <div className="flex justify-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center animate-pulse">
              <User className="w-12 h-12 text-white" />
            </div>
          </div>
          <h2 className="text-white text-3xl font-semibold">{callerName}</h2>
          <p className="text-white/60">Mobile</p>
        </div>

        {/* Call Duration */}
        <div className="text-center">
          <p className="text-white/80 text-xl font-mono">{formatDuration(callDuration)}</p>
        </div>

        {/* Call Actions */}
        <div className="flex gap-8 items-center">
          <button
            onClick={endCall}
            className="flex flex-col items-center gap-2"
          >
            <div className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors">
              <PhoneOff className="w-8 h-8 text-white" />
            </div>
            <span className="text-white/80 text-sm">Decline</span>
          </button>

          <button
            onClick={answerCall}
            className="flex flex-col items-center gap-2"
          >
            <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center shadow-lg hover:bg-green-600 transition-colors">
              <Phone className="w-8 h-8 text-white" />
            </div>
            <span className="text-white/80 text-sm">Accept</span>
          </button>
        </div>

        {/* Quick Exit Hint */}
        <p className="text-white/40 text-xs">Tap decline to exit</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary pb-20">
      <header className="fixed top-0 left-0 right-0 z-30 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-primary to-primary-glow rounded-xl">
              <Shield className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              Fake Call
            </h1>
          </div>
        </div>
      </header>

      <main className="pt-20 px-4 md:pt-32 lg:pt-20 lg:pl-60">
        <div className="max-w-md mx-auto space-y-6">
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="w-5 h-5 text-primary" />
                Emergency Exit Call
              </CardTitle>
              <CardDescription>
                Simulate an incoming call to exit uncomfortable situations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="caller">Caller Name</Label>
                <Input
                  id="caller"
                  value={callerName}
                  onChange={(e) => setCallerName(e.target.value)}
                  placeholder="e.g., Mom, Boss, Friend"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="delay">Delay (seconds)</Label>
                <Select value={delay.toString()} onValueChange={(val) => setDelay(parseInt(val))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Immediate" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Immediate</SelectItem>
                    <SelectItem value="5">5 seconds</SelectItem>
                    <SelectItem value="10">10 seconds</SelectItem>
                    <SelectItem value="30">30 seconds</SelectItem>
                    <SelectItem value="60">1 minute</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={triggerCall} 
                className="w-full"
                size="lg"
              >
                <Phone className="w-5 h-5 mr-2" />
                Trigger Fake Call
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>How to use</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p className="flex items-start gap-2">
                <User className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Set a believable caller name (family, work, friend)</span>
              </p>
              <p className="flex items-start gap-2">
                <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Choose delay if you need time before the call</span>
              </p>
              <p className="flex items-start gap-2">
                <Phone className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Phone will vibrate and show realistic incoming call screen</span>
              </p>
              <p className="text-xs text-muted-foreground mt-4">
                Tip: Use this feature to politely exit uncomfortable situations or unwanted conversations
              </p>
            </CardContent>
          </Card>

          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <p className="text-xs text-center text-muted-foreground">
                This is a simulated call for safety purposes. It looks realistic but doesn't connect to anyone.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default FakeCall;
