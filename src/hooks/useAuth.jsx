import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Wait for Supabase to check session

  useEffect(() => {
    // 1. Check if user is logged in when app loads
    supabase.auth.getSession().then(({ data: { session } }) => {
      //Optional Chaining Operator (?.) & Nullish Coalescing Operator (??)
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // 2. Listen for any logins or logouts
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Custom hook so any page can just type: const { user } = useAuth();
export const useAuth = () => {
  return useContext(AuthContext);
};