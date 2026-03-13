import { supabase } from '../lib/supabaseClient';

export const AuthService = {
  /**
   * Registers a new user and sends a verification email via your SMTP.
   */
  signUp: async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
        // After they click the email link, they can be redirected back to the app
        emailRedirectTo: 'https://your-app-url.com/welcome', 
      },
    });

    if (error) throw error;
    return data;
  },

  /**
   * Signs in an existing user
   */
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    return data;
  }
};