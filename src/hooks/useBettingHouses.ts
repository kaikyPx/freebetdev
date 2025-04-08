import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { BettingHouse, AccountBettingHouse } from '../types/database';

export function useBettingHouses() {
  const [bettingHouses, setBettingHouses] = useState<BettingHouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBettingHouses();
  }, []);

  async function fetchBettingHouses() {
    try {
      const { data, error } = await supabase
        .from('betting_houses')
        .select('*')
        .order('name');
  
      if (error) throw error;
      setBettingHouses(data || []); // Atualiza o estado com os dados
      return data || [];
    } catch (err) {
      console.error('Error fetching betting houses:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  async function getAccountBettingHouse(accountId: string, bettingHouseId: string) {
    try {
      const { data, error } = await supabase
        .from('account_betting_houses')
        .select('*')
        .eq('account_id', accountId)
        .eq('betting_house_id', bettingHouseId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      return data || null;
    } catch (err) {
      console.error('Error fetching account betting house:', err);
      return null;
    }
  }

  async function updateAccountBettingHouse(
    accountId: string,
    bettingHouseId: string,
    updates: Partial<AccountBettingHouse>
  ) {
    try {
      const existing = await getAccountBettingHouse(accountId, bettingHouseId);

      // Format currency values before saving
      const formattedUpdates = {
        ...updates,
        saldo: formatCurrencyForStorage(updates.saldo),
        deposito: formatCurrencyForStorage(updates.deposito),
        sacado: formatCurrencyForStorage(updates.sacado),
        creditos: formatCurrencyForStorage(updates.creditos)
      };

      if (existing) {
        const { data, error } = await supabase
          .from('account_betting_houses')
          .update(formattedUpdates)
          .eq('account_id', accountId)
          .eq('betting_house_id', bettingHouseId)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('account_betting_houses')
          .insert([{
            account_id: accountId,
            betting_house_id: bettingHouseId,
            ...formattedUpdates
          }])
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    } catch (err) {
      console.error('Error updating account betting house:', err);
      throw err;
    }
  }

  // Helper function to format currency for storage
  function formatCurrencyForStorage(value: string | null | undefined): string | null {
    if (!value) return null;
    // Remove currency symbol, dots, and convert comma to dot for decimal
    return value.replace(/[R$\s.]/g, '').replace(',', '.');
  }

  return {
    bettingHouses,
    loading,
    error,
    getAccountBettingHouse,
    updateAccountBettingHouse
  };
}