import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Account } from '../types/database';

export function useAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAccounts();

    // Subscribe to real-time changes
    const subscription = supabase
      .channel('accounts_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'accounts'
        },
        (payload) => {
          console.log('Change received!', payload);
          fetchAccounts(); // Refresh the data when changes occur
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function fetchAccounts() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .order('item', { ascending: true });

      if (error) throw error;

      console.log('Fetched accounts:', data?.length || 0, 'records');
      setAccounts(data || []);
    } catch (err) {
      console.error('Error fetching accounts:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  async function addAccount(account: Omit<Account, 'id' | 'created_at' | 'updated_at'>) {
    try {
      console.log('Adding account:', account);

      // Validate required fields
      if (!account.name || !account.cpf || !account.birth_date || !account.responsavel || !account.status) {
        throw new Error('Todos os campos obrigatórios devem ser preenchidos');
      }

      // Format date if needed
      let formattedDate = account.birth_date;
      if (account.birth_date.includes('/')) {
        const [day, month, year] = account.birth_date.split('/');
        formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }

      const { data, error } = await supabase
        .from('accounts')
        .insert([{ ...account, birth_date: formattedDate }])
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(error.message);
      }

      if (!data) {
        throw new Error('Nenhum dado retornado após a inserção');
      }

      setAccounts(prev => [...prev, data]);
      return data;
    } catch (err) {
      console.error('Error adding account:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao adicionar conta';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }

  async function updateAccount(id: string, updates: Partial<Omit<Account, 'id' | 'created_at' | 'updated_at'>>) {
    try {
      console.log('Updating account:', id, updates);

      // Format date if it's being updated and includes '/'
      if (updates.birth_date?.includes('/')) {
        const [day, month, year] = updates.birth_date.split('/');
        updates.birth_date = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }

      const { data, error } = await supabase
        .from('accounts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(error.message);
      }

      if (!data) {
        throw new Error('Nenhum dado retornado após a atualização');
      }

      setAccounts(prev => prev.map(account => account.id === id ? data : account));
      return data;
    } catch (err) {
      console.error('Error updating account:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar conta';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }

  async function deleteAccount(id: string) {
    try {
      console.log('Deleting account:', id);

      const { error } = await supabase
        .from('accounts')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(error.message);
      }

      setAccounts(prev => prev.filter(account => account.id !== id));
    } catch (err) {
      console.error('Error deleting account:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir conta';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }

  return {
    accounts,
    loading,
    error,
    addAccount,
    updateAccount,
    deleteAccount,
    refreshAccounts: fetchAccounts
  };
}