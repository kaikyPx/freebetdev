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
  user_id: string;
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
  user_id: string;
}

export function useBettingOperations() {
  // Declare todos os hooks useState no início, sempre na mesma ordem
  const [operations, setOperations] = useState<BettingOperation[]>([]);
  const [monthlySummaries, setMonthlySummaries] = useState<MonthlySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);

  // Função para buscar operações - não use hooks dentro dela
  async function fetchOperations(userId: string) {
    try {
      const { data, error: fetchError } = await supabase
        .from('betting_operations')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (fetchError) throw fetchError;
      setOperations(data || []);
    } catch (err) {
      console.error('Error fetching operations:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }
  

  // Função para buscar resumos mensais - não use hooks dentro dela
  async function fetchMonthlySummaries(userId: string) {
    try {
      const { data, error: fetchError } = await supabase
        .from('monthly_summaries')
        .select('*')
        .eq('user_id', userId)
        .order('year', { ascending: false })
        .order('month', { ascending: false });

      if (fetchError) throw fetchError;
      setMonthlySummaries(data || []);
    } catch (err) {
      console.error('Error fetching monthly summaries:', err);
    }
  }

  // Apenas um hook useEffect para inicialização e limpeza
  useEffect(() => {
    let isSubscribed = true;
    
    const initializeData = async () => {
      try {
        // Buscar usuário atual
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!isSubscribed) return;
        
        if (user) {
          setCurrentUser(user);
          await fetchOperations(user.id);
          await fetchMonthlySummaries(user.id);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error("Error initializing data:", err);
        if (isSubscribed) {
          setError("Failed to initialize data");
          setLoading(false);
        }
      }
    };

    initializeData();

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
        async (payload) => {
          if (!isSubscribed) return;
          
          try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              // Verificar se a operação atualizada pertence ao usuário atual
              const newData = payload.new as any;
              if (newData && newData.user_id === user.id) {
                await fetchOperations(user.id);
                await fetchMonthlySummaries(user.id);
              }
            }
          } catch (err) {
            console.error("Error handling real-time update:", err);
          }
        }
      )
      .subscribe();

    // Cleanup function
    return () => {
      isSubscribed = false;
      subscription.unsubscribe();
    };
  }, []); // Dependências vazias significam que o efeito será executado apenas uma vez

  async function addOperation(operation: Omit<BettingOperation, 'id' | 'created_at' | 'updated_at'>) {
    if (!currentUser) {
      throw new Error('User not authenticated');
    }
    
    try {
      const operationWithUserId = {
        ...operation,
        user_id: currentUser.id
      };

      const { data, error: addError } = await supabase
        .from('betting_operations')
        .insert([operationWithUserId])
        .select()
        .single();

      if (addError) throw addError;
      return data;
    } catch (err) {
      console.error('Error adding operation:', err);
      throw err;
    }
  }

  async function addOperationAccounts(accounts: Omit<OperationAccount, 'id' | 'created_at' | 'updated_at'>[]) {
    try {
      const { data, error: addError } = await supabase
        .from('operation_accounts')
        .insert(accounts)
        .select();

      if (addError) throw addError;
      return data;
    } catch (err) {
      console.error('Error adding operation accounts:', err);
      throw err;
    }
  }

  async function updateOperation(id: string, updates: Partial<Omit<BettingOperation, 'id' | 'created_at' | 'updated_at'>>) {
    if (!currentUser) {
      throw new Error('User not authenticated');
    }
    
    try {
      // Make sure we're not updating the user_id
      const { user_id, ...safeUpdates } = updates as any;
      
      const { data, error: updateError } = await supabase
        .from('betting_operations')
        .update(safeUpdates)
        .eq('id', id)
        .eq('user_id', currentUser.id)
        .select()
        .single();

      if (updateError) throw updateError;
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
    if (!currentUser) {
      throw new Error('User not authenticated');
    }
    
    try {
      // Verify that the operation belongs to the current user
      const { data: operationData, error: operationError } = await supabase
        .from('betting_operations')
        .select('id')
        .eq('id', operationId)
        .eq('user_id', currentUser.id)
        .single();
      
      if (operationError || !operationData) {
        throw new Error('Operation not found or not owned by current user');
      }

      // First delete existing accounts
      await supabase
        .from('operation_accounts')
        .delete()
        .eq('operation_id', operationId);

      // Then insert new accounts
      const { data, error: addError } = await supabase
        .from('operation_accounts')
        .insert(accounts.map(account => ({ ...account, operation_id: operationId })))
        .select();

      if (addError) throw addError;
      return data;
    } catch (err) {
      console.error('Error updating operation accounts:', err);
      throw err;
    }
  }

  async function deleteOperation(id: string) {
    if (!currentUser) {
      throw new Error('User not authenticated');
    }
    
    try {
      const { error: deleteError } = await supabase
        .from('betting_operations')
        .delete()
        .eq('id', id)
        .eq('user_id', currentUser.id);

      if (deleteError) throw deleteError;
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
    currentUser,
    addOperation,
    addOperationAccounts,
    updateOperation,
    updateOperationAccounts,
    deleteOperation
  };
}