import { supabase } from '../lib/supabaseClient';

export const UsageService = {
  saveVisit: async (userId: string, query: string, destination: string) => {
    const { error } = await supabase
      .from('app_usage')
      .insert([
        { 
          user_id: userId, 
          search_query: query, 
          destination: destination,
          duration_seconds: 0 // Adding a default value to satisfy the database
        }
      ]);
    if (error) throw error;
  },
  // ... rest of service

  /**
   * This fulfills your requirement for the dashboard.
   */
  getLatestThreeVisits: async (userId: string) => {
    const { data, error } = await supabase
      .from('app_usage')
      .select('search_query, destination, timestamp')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false }) // Newest first
      .limit(3); // Only get the top 3

    if (error) throw error;
    return data;
  }
};