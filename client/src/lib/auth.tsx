import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { supabase, isSupabaseConfigured } from "./supabase";
import type { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isConfigured: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null; needsConfirmation: boolean }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      return { error: new Error("Supabase is not configured. Please set SUPABASE_URL and SUPABASE_ANON_KEY.") };
    }
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error as Error | null };
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      return { 
        error: new Error("Supabase is not configured. Please set SUPABASE_URL and SUPABASE_ANON_KEY."),
        needsConfirmation: false,
      };
    }
    const { error, data } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });
    
    // Check if email confirmation is required
    const needsConfirmation = !error && data.user && !data.session;
    
    return { 
      error: error as Error | null,
      needsConfirmation: needsConfirmation ?? false,
    };
  }, []);

  const signOut = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    if (!isSupabaseConfigured) {
      return { error: new Error("Supabase is not configured. Please set SUPABASE_URL and SUPABASE_ANON_KEY.") };
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/wachtwoord-reset`,
    });
    return { error: error as Error | null };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isConfigured: isSupabaseConfigured,
        signIn,
        signUp,
        signOut,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Protected route wrapper
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading, isConfigured } = useAuth();
  const [, setLocation] = useLocation();
  const hasRedirected = useRef(false);

  useEffect(() => {
    // Only redirect if not loading, no user, configured, and haven't already redirected
    if (!loading && !user && isConfigured && !hasRedirected.current) {
      hasRedirected.current = true;
      setLocation("/login");
    }
  }, [user, loading, isConfigured, setLocation]);

  // Reset redirect flag when user logs in
  useEffect(() => {
    if (user) {
      hasRedirected.current = false;
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Allow access if Supabase isn't configured (for development/demo purposes)
  if (!isConfigured) {
    return <>{children}</>;
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
