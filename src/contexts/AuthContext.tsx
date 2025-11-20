import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase-temp';
import { useNavigate } from 'react-router-dom';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  isAdmin: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let isInitialized = false;

    // Check for existing session first (before setting up listener)
    const sessionTimeout = setTimeout(() => {
      console.warn('⚠️ Session check timed out, proceeding anyway');
      if (!isInitialized) {
        setIsLoading(false);
      }
    }, 3000);

    supabase.auth.getSession()
      .then(async ({ data: { session } }) => {
        clearTimeout(sessionTimeout);
        if (!isInitialized) {
          isInitialized = true;
          setSession(session);
          setUser(session?.user ?? null);

          if (session?.user) {
            try {
              await checkAdminStatus(session.user.id);
            } catch (error) {
              console.error('Error checking admin status:', error);
              setIsAdmin(false);
            }
          }
          setIsLoading(false);
        }
      })
      .catch((error) => {
        clearTimeout(sessionTimeout);
        console.error('❌ Failed to get session:', error);
        setIsLoading(false);
      });

    // Set up auth state listener (after initial session check)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, 'initialized:', isInitialized);

        // Skip INITIAL_SESSION event to prevent race condition
        // But process all other events (SIGNED_IN, SIGNED_OUT, etc.)
        if (event === 'INITIAL_SESSION' && !isInitialized) {
          // Skip - wait for getSession() to complete
          return;
        }

        setSession(session);
        setUser(session?.user ?? null);

        // Check admin status after state update
        if (session?.user) {
          try {
            await checkAdminStatus(session.user.id);
          } catch (error) {
            console.error('Error checking admin status:', error);
            setIsAdmin(false);
          }
        } else {
          setIsAdmin(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminStatus = async (userId: string) => {
    try {
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const response = await fetch(`${SUPABASE_URL}/rest/v1/user_roles?user_id=eq.${userId}&role=eq.admin`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setIsAdmin(data && data.length > 0);
      } else {
        setIsAdmin(false);
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
    navigate('/auth');
  };

  return (
    <AuthContext.Provider value={{ user, session, isLoading, signOut, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};