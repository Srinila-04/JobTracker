import { supabase } from '../lib/supabase';

export const authService = {
  //Register with Password
  async registerWithPassword(email, password, fullName, role = 'employee') {
    return await supabase.auth.signUp({
      email, 
      password, 
      options: { data: { full_name: fullName, role: role } }
    });
  },

  //Login with Password
  async loginWithPassword(email, password) {
    return await supabase.auth.signInWithPassword({ email, password });
  },

  //Logout
  async logout() {
    return await supabase.auth.signOut();
  }
};