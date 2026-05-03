import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { supabase, isSupabaseConfigured } from "./supabase";
import type { User, Session } from "@supabase/supabase-js";

interface UserMetadata {
  firstName?: string;
  lastName?: string;
  gender?: string;
  birthYear?: string;
  showBirthDate?: string;
  invoiceName?: string;
  street?: string;
  municipality?: string;
  postcode?: string;
  country?: string;
  btwPlichtig?: string;
  btwNumber?: string;
  kvkNumber?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isConfigured: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null; needsConfirmation: boolean }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>;
  updateUserMetadata: (metadata: UserMetadata) => Promise<{ error: Error | null }>;
  getUserMetadata: () => UserMetadata;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      setInitialized(true);
      return;
    }

    let mounted = true;

    // Subscribe to auth changes FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        
        // Only log significant events, not user updates
        if (event !== 'USER_UPDATED') {
          console.log("Auth state change:", event, !!session);
        }
        
        // For USER_UPDATED events, only update the user object, not session
        // This prevents full re-renders when just updating metadata
        if (event === 'USER_UPDATED' && session?.user) {
          setUser(session.user);
          return;
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        
        // Mark as initialized after first auth event
        if (!initialized) {
          setInitialized(true);
        }
        setLoading(false);
      }
    );

    // THEN get initial session (this order matters for Supabase)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      
      console.log("Initial session:", !!session);
      setSession(session);
      setUser(session?.user ?? null);
      setInitialized(true);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      return { error: new Error("Supabase is not configured. Please set SUPABASE_URL and SUPABASE_ANON_KEY.") };
    }
    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    // Immediately update state if login successful
    if (!error && data.session) {
      setSession(data.session);
      setUser(data.session.user);
    }
    
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
    // Clear state first to prevent race conditions
    setUser(null);
    setSession(null);
    try {
      // Use 'local' scope so we only clear the current device session.
      // 'global' triggers a server round-trip that frequently 403s when the
      // session is already partially cleared, leaving the user stuck.
      await supabase.auth.signOut({ scope: 'local' });
    } catch (error) {
      console.error("Sign out error:", error);
    }
    // Force clear all Supabase localStorage keys
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('sb-')) {
        localStorage.removeItem(key);
      }
    });
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

  const updatePassword = useCallback(async (newPassword: string) => {
    if (!isSupabaseConfigured) {
      return { error: new Error("Supabase is not configured.") };
    }
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    return { error: error as Error | null };
  }, []);

  const updateUserMetadata = useCallback(async (metadata: UserMetadata) => {
    if (!isSupabaseConfigured) {
      return { error: new Error("Supabase is not configured.") };
    }
    const { error, data } = await supabase.auth.updateUser({
      data: metadata,
    });
    
    // Update local user state with new metadata
    if (!error && data.user) {
      setUser(data.user);
    }
    
    return { error: error as Error | null };
  }, []);

  const getUserMetadata = useCallback((): UserMetadata => {
    return (user?.user_metadata as UserMetadata) || {};
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading: loading || !initialized,
        isConfigured: isSupabaseConfigured,
        signIn,
        signUp,
        signOut,
        resetPassword,
        updatePassword,
        updateUserMetadata,
        getUserMetadata,
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

  // Redirect to login when auth has settled and there is no user.
  // Done in an effect to avoid setState-during-render warnings and the
  // setTimeout/redirectedRef race that the previous implementation suffered.
  useEffect(() => {
    if (!loading && isConfigured && !user) {
      setLocation("/login");
    }
  }, [loading, isConfigured, user, setLocation]);

  // Show loading spinner while auth is being initialized OR while we're
  // waiting for the redirect-to-login effect to fire.
  if (loading || (isConfigured && !user)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <>{children}</>;
}
