import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type AppRole = 'client' | 'team_member' | 'admin' | 'super_admin' | 'broker';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRoles: AppRole[];
  isLoading: boolean;
  hasRole: (role: AppRole) => boolean;
  signIn: (email: string, password: string) => Promise<{ data?: any; error: any }>;
  signInWithBiometric: () => Promise<{ error: any }>;
  registerBiometric: () => Promise<{ error: any }>;
  signUp: (email: string, password: string, firstName: string, lastName: string, invitationCode?: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRoles, setUserRoles] = useState<AppRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserRoles = async (userId: string) => {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching user roles:', error);
      return [];
    }

    return data.map(r => r.role as AppRole);
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer role fetching to avoid blocking
        if (session?.user) {
          setTimeout(() => {
            fetchUserRoles(session.user.id).then(setUserRoles);
          }, 0);
        } else {
          setUserRoles([]);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserRoles(session.user.id).then(roles => {
          setUserRoles(roles);
          setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const hasRole = (role: AppRole) => {
    // Super admins automatically have all roles including broker
    if (userRoles.includes('super_admin')) {
      return true;
    }
    return userRoles.includes(role);
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { data, error };
  };

  const signUp = async (
    email: string, 
    password: string, 
    firstName: string, 
    lastName: string,
    invitationCode?: string
  ) => {
    const redirectUrl = `${window.location.origin}/`;
    
    // If invitation code provided, validate it first
    if (invitationCode) {
      const { data: invitation, error: inviteError } = await supabase
        .from('team_invitations')
        .select('*')
        .eq('invitation_code', invitationCode)
        .is('used_at', null)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (inviteError || !invitation) {
        return { error: { message: 'Invalid or expired invitation code' } };
      }
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          first_name: firstName,
          last_name: lastName,
          invitation_code: invitationCode
        }
      }
    });

    // If signup successful and invitation code was used, mark it as used
    if (!error && data.user && invitationCode) {
      await supabase
        .from('team_invitations')
        .update({ 
          used_at: new Date().toISOString(), 
          used_by_user_id: data.user.id 
        })
        .eq('invitation_code', invitationCode);
    }

    return { error };
  };

  const registerBiometric = async () => {
    try {
      if (!window.PublicKeyCredential) {
        return { error: { message: 'Biometric authentication not supported on this device' } };
      }

      if (!user?.email) {
        return { error: { message: 'Please sign in first to register biometric authentication' } };
      }

      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      const credential = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: {
            name: "Acorn Finance",
            id: window.location.hostname,
          },
          user: {
            id: new TextEncoder().encode(user.id),
            name: user.email,
            displayName: user.email,
          },
          pubKeyCredParams: [{ alg: -7, type: "public-key" }],
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            userVerification: "required",
          },
          timeout: 60000,
        },
      });

      // Store credential ID in localStorage for this demo
      // In production, this should be stored in your backend
      localStorage.setItem(`biometric_${user.id}`, JSON.stringify({
        credentialId: Array.from(new Uint8Array((credential as any).rawId)),
        email: user.email,
      }));

      return { error: null };
    } catch (error: any) {
      console.error('Biometric registration error:', error);
      return { error: { message: error.message || 'Failed to register biometric authentication' } };
    }
  };

  const signInWithBiometric = async () => {
    try {
      if (!window.PublicKeyCredential) {
        return { error: { message: 'Biometric authentication not supported on this device' } };
      }

      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      const credential = await navigator.credentials.get({
        publicKey: {
          challenge,
          timeout: 60000,
          userVerification: "required",
        },
      });

      // In a real implementation, verify the credential with your backend
      // For now, we'll just check if we have a stored credential and sign in with that email
      const credentialId = Array.from(new Uint8Array((credential as any).rawId));
      
      // Find matching stored credential
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('biometric_')) {
          const stored = JSON.parse(localStorage.getItem(key) || '{}');
          if (JSON.stringify(stored.credentialId) === JSON.stringify(credentialId)) {
            // Found matching credential - in production, get a token from backend
            // For demo, we'll show a message that biometric is recognized
            return { error: { message: 'Biometric recognized but passwordless sign-in requires backend integration. Please use email/password for now.' } };
          }
        }
      }

      return { error: { message: 'No registered biometric found for this device' } };
    } catch (error: any) {
      console.error('Biometric sign-in error:', error);
      return { error: { message: error.message || 'Biometric authentication failed' } };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      userRoles,
      isLoading,
      hasRole,
      signIn,
      signInWithBiometric,
      registerBiometric,
      signUp,
      signOut
    }}>
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
