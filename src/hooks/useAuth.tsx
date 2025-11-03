import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type AppRole = 'client' | 'team_member' | 'admin';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRoles: AppRole[];
  isLoading: boolean;
  hasRole: (role: AppRole) => boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
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

  const hasRole = (role: AppRole) => userRoles.includes(role);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
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
