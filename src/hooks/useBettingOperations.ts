import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface BettingOperation {
  id: string;
  date: string;
  time: string;
  game_name: string;
  house1_id: string;
  house2_id: string;
  bet_amount: number;
  result: number;
  profit: number;
  promotion_type: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

interface OperationAccount {
  id: string;
  operation_id: string;
  account_id: string;
  betting_house_id: string;
  stake: number;
  role: string;
  is_winner: boolean;
}

interface MonthlySummary {
  id: string;
  year: number;
  month: number;
  total_bets: number;
  total_bet_amount: number;
  total_result: number;
  total_profit: number;
  roi: number;
  accounts_used: number;
  profit_per_account: number;
}

export function useBettingOperations() {
  const [operations, setOperations] = useState<BettingOperation[]>([]);
  const [monthlySummaries, setMonthlySummaries] = useState<MonthlySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOperations();
    fetchMonthlySummaries();

    // Subscribe to real-time changes
    const subscription = supabase
      .channel('betting_operations_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'betting_operations'
        },
        () => {
          fetchOperations();
          fetchMonthlySummaries();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function fetchOperations() {
    try {
      const { data, error } = await supabase
        .from('betting_operations')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      setOperations(data || []);
    } catch (err) {
      console.error('Error fetching operations:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  async function fetchMonthlySummaries() {
    try {
      const { data, error } = await supabase
        .from('monthly_summaries')
        .select('*')
        .order('year', { ascending: false })
        .order('month', { ascending: false });

      if (error) throw error;
      setMonthlySummaries(data || []);
    } catch (err) {
      console.error('Error fetching monthly summaries:', err);
    }
  }

  async function addOperation(operation: Omit<BettingOperation, 'id' | 'created_at' | 'updated_at'>) {
    try {
      const { data, error } = await supabase
        .from('betting_operations')
        .insert([operation])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error adding operation:', err);
      throw err;
    }
  }

  async function addOperationAccounts(accounts: Omit<OperationAccount, 'id' | 'created_at' | 'updated_at'>[]) {
    try {
      const { data, error } = await supabase
        .from('operation_accounts')
        .insert(accounts)
        .select();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error adding operation accounts:', err);
      throw err;
    }
  }

  async function updateOperation(id: string, updates: Partial<Omit<BettingOperation, 'id' | 'created_at' | 'updated_at'>>) {
    try {
      const { data, error } = await supabase
        .from('betting_operations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error updating operation:', err);
      throw err;
    }
  }

  async function updateOperationAccounts(
    operationId: string,
    accounts: Partial<Omit<OperationAccount, 'id' | 'created_at' | 'updated_at'>>[]
  ) {
    try {
      // First delete existing accounts
      await supabase
        .from('operation_accounts')
        .delete()
        .eq('operation_id', operationId);

      // Then insert new accounts
      const { data, error } = await supabase
        .from('operation_accounts')
        .insert(accounts.map(account => ({ ...account, operation_id: operationId })))
        .select();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error updating operation accounts:', err);
      throw err;
    }
  }

  async function deleteOperation(id: string) {
    try {
      const { error } = await supabase
        .from('betting_operations')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (err) {
      console.error('Error deleting operation:', err);
      throw err;
    }
  }

  return {
    operations,
    monthlySummaries,
    loading,
    error,
    addOperation,
    addOperationAccounts,
    updateOperation,
    updateOperationAccounts,
    deleteOperation
  };
}