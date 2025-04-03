// src/hooks/useBets.ts
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export interface Bet {
  id: string;
  date: string;
  time: string;
  gameName: string;
  house1: string;
  house2: string;
  betAmount: number;
  result: number;
  profit: number;
  status: string;
  user_id: string;
}

export const useBets = (userId: string | null) => {
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchBets = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Query to get bets for the specific user
        const { data, error } = await supabase
          .from('bets')
          .select('*')
          .eq('user_id', userId);

        if (error) throw error;
        setBets(data || []);
      } catch (err) {
        console.error('Error fetching bets:', err);
        setError(err instanceof Error ? err : new Error('Unknown error occurred'));
      } finally {
        setLoading(false);
      }
    };

    fetchBets();
  }, [userId]);

  return { bets, loading, error };
};