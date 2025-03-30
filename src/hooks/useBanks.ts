import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface Bank {
  id: string;
  name: string;
  initial_capital: number;
  roi: number;
  gross_profit: number;
  created_at: string;
  updated_at: string;
}

export function useBanks() {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBanks();

    // Subscribe to real-time changes
    const subscription = supabase
      .channel('banks_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'banks'
        },
        (payload) => {
          console.log('Change received!', payload);
          fetchBanks(); // Refresh the data when changes occur
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function fetchBanks() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('banks')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;

      console.log('Fetched banks:', data?.length || 0, 'records');
      setBanks(data || []);
    } catch (err) {
      console.error('Error fetching banks:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  async function addBank(bank: Omit<Bank, 'id' | 'created_at' | 'updated_at' | 'user_id'>) {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      const { data, error } = await supabase
        .from('banks')
        .insert([{ ...bank, user_id: userData.user.id }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error adding bank:', err);
      throw err;
    }
  }

  async function updateBank(id: string, updates: Partial<Omit<Bank, 'id' | 'created_at' | 'updated_at' | 'user_id'>>) {
    try {
      const { data, error } = await supabase
        .from('banks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error updating bank:', err);
      throw err;
    }
  }

  async function deleteBank(id: string) {
    try {
      const { error } = await supabase
        .from('banks')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (err) {
      console.error('Error deleting bank:', err);
      throw err;
    }
  }

  return {
    banks,
    loading,
    error,
    addBank,
    updateBank,
    deleteBank,
    refreshBanks: fetchBanks
  };
}