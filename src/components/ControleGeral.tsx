import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { formatCurrency, parseCurrency } from '../utils/currency';
import { RefreshCw, ExternalLink } from 'lucide-react';

interface BettingHouse {
  id: number;
  name: string;
  link: string;
  totalBalance: number;
}

interface ManualBalance {
  id: number;
  user_id: string;
  type: string;
  amount: number;
  last_updated: string;
}

interface ManualBalances {
  protection: number;
  bankBalance: number;
  fintechBalance: number;
}

interface Metrics {
  totalAccounts: number;
  documentsFinalized: number;
  selfiesPending: number;
  openHouses: number;
  pendingVerifications: number;
  fullVerified: number;
  emOperacao: number;
}

interface User {
  id: string;
  email: string;
  role: string;
}

const ControleGeral = () => {
  const [bettingHouses, setBettingHouses] = useState<BettingHouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const [manualBalances, setManualBalances] = useState<ManualBalances>({
    protection: 0,
    bankBalance: 0,
    fintechBalance: 0
  });
  const [metrics, setMetrics] = useState<Metrics>({
    totalAccounts: 0,
    documentsFinalized: 0,
    selfiesPending: 0,
    openHouses: 0,
    pendingVerifications: 0,
    fullVerified: 0,
    emOperacao: 0
  });
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Get current authenticated user
    const fetchCurrentUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // Get user role from user_profiles table
          const { data: profiles, error: profileError } = await supabase
            .from('user_profiles')
            .select('role')
            .eq('user_id', user.id)
            .single();
          
          if (profileError) {
            console.error('Error fetching user profile:', profileError);
          }
          
          setCurrentUser({
            id: user.id,
            email: user.email || '',
            role: profiles?.role || 'user'
          });
          
          setIsAdmin(profiles?.role === 'admin');
        }
      } catch (error) {
        console.error('Error in fetchCurrentUser:', error);
      }
    };

    fetchCurrentUser();
    
    // We'll fetch these after establishing the user context
    setTimeout(() => {
      fetchBettingHouses();
      fetchManualBalances();
      fetchMetrics();
    }, 500);

    // Subscribe to changes in account_betting_houses table
    const accountBettingHousesSubscription = supabase
      .channel('account_betting_houses_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'account_betting_houses'
        },
        () => {
          setLastUpdate(new Date());
          fetchBettingHouses();
          fetchMetrics();
        }
      )
      .subscribe();

    // Subscribe to changes in accounts table
    const accountsSubscription = supabase
      .channel('accounts_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'accounts'
        },
        () => {
          fetchMetrics();
        }
      )
      .subscribe();

    // Subscribe to changes in manual_balances table
    const manualBalancesSubscription = supabase
      .channel('manual_balances_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'manual_balances'
        },
        (payload) => {
          // Only update if the change affects the current user
          if (currentUser && payload.new && payload.new.user_id === currentUser.id) {
            fetchManualBalances();
          }
        }
      )
      .subscribe();

    return () => {
      accountBettingHousesSubscription.unsubscribe();
      accountsSubscription.unsubscribe();
      manualBalancesSubscription.unsubscribe();
    };
  }, []);

  // Re-fetch data when user changes
  useEffect(() => {
    if (currentUser) {
      fetchBettingHouses();
      fetchManualBalances();
      fetchMetrics();
    }
  }, [currentUser?.id]);

  const fetchManualBalances = async () => {
    try {
      if (!currentUser) return;

      // Fetch shared balances (global balances viewable by all) or user-specific balances
      const query = isAdmin 
        ? supabase.from('manual_balances').select('*').is('user_id', null)  // Global balances for admins
        : supabase.from('manual_balances').select('*').eq('user_id', currentUser.id);  // User-specific balances
      
      const { data, error } = await query;

      if (error) throw error;

      const balances: ManualBalances = {
        protection: 0,
        bankBalance: 0,
        fintechBalance: 0
      };

      data?.forEach((item: ManualBalance) => {
        if (item.type === 'protection') balances.protection = item.amount;
        if (item.type === 'bankBalance') balances.bankBalance = item.amount;
        if (item.type === 'fintechBalance') balances.fintechBalance = item.amount;
      });

      setManualBalances(balances);
    } catch (error) {
      console.error('Error fetching manual balances:', error);
    }
  };

  const handleManualBalanceChange = async (type: keyof ManualBalances, value: string) => {
    if (!currentUser) return;
    
    const numericValue = parseCurrency(value);
    
    // Update local state immediately for responsive UI
    setManualBalances(prev => ({
      ...prev,
      [type]: numericValue
    }));

    try {
      const userId = isAdmin ? null : currentUser.id; // null for global balances (admin only)
      
      // Check if balance record exists
      const { data } = await supabase
        .from('manual_balances')
        .select('id')
        .eq('type', type)
        .eq('user_id', userId)
        .single();

      if (data?.id) {
        // Update existing record
        await supabase
          .from('manual_balances')
          .update({ 
            amount: numericValue,
            last_updated: new Date().toISOString()
          })
          .eq('id', data.id);
      } else {
        // Insert new record
        await supabase
          .from('manual_balances')
          .insert({
            type,
            amount: numericValue,
            user_id: userId,
            last_updated: new Date().toISOString()
          });
      }
      
      setLastUpdate(new Date());
    } catch (error) {
      console.error(`Failed to update ${type} balance:`, error);
    }
  };

  const fetchMetrics = async () => {
    if (!currentUser) return;
    
    try {
      // For non-admin users, we might want to filter metrics by user
      const userFilter = !isAdmin ? { user_id: currentUser.id } : {};
      
      // Total accounts
      const { count: totalAccounts } = await supabase
        .from('accounts')
        .select('*', { count: 'exact', head: true })
        .match(userFilter);

      // Documents finalized (status Verificado)
      const { count: documentsFinalized } = await supabase
        .from('accounts')
        .select('*', { count: 'exact', head: true })
        .match({ ...userFilter, status: 'Verificado' });

      // Selfies pending
      const { count: selfiesPending } = await supabase
        .from('accounts')
        .select('*', { count: 'exact', head: true })
        .match({ ...userFilter, status: 'Selfie' });

      // Houses to open (status ABRIR)
      const { count: openHouses } = await supabase
        .from('accounts')
        .select('*', { count: 'exact', head: true })
        .match({ ...userFilter, status: 'ABRIR' });

      // Pending verifications
      const { count: pendingVerifications } = await supabase
        .from('accounts')
        .select('*', { count: 'exact', head: true })
        .match({ ...userFilter, verification: 'Verificar' });

      // Fully verified accounts (both status and verification are 'Verificado')
      const { count: fullVerified } = await supabase
        .from('accounts')
        .select('*', { count: 'exact', head: true })
        .match({ ...userFilter, status: 'Verificado', verification: 'Verificado' });

      // Fix for the in() operation - first get the account IDs, then use them
      let emOperacao = 0;
      
      if (!isAdmin) {
        // First, get the user's account IDs
        const { data: userAccounts } = await supabase
          .from('accounts')
          .select('id')
          .eq('user_id', currentUser.id);
          
        if (userAccounts && userAccounts.length > 0) {
          // Now use these IDs in the query
          const accountIds = userAccounts.map(account => account.id);
          
          const { data: accountBettingHouses } = await supabase
            .from('account_betting_houses')
            .select('account_id')
            .eq('status', 'Em Operação')
            .in('account_id', accountIds);
            
          // Count unique accounts
          const uniqueAccountsInOperation = new Set(accountBettingHouses?.map(item => item.account_id) || []);
          emOperacao = uniqueAccountsInOperation.size;
        }
      } else {
        // For admin, get all accounts with 'Em Operação' status
        const { data: accountBettingHouses } = await supabase
          .from('account_betting_houses')
          .select('account_id')
          .eq('status', 'Em Operação');

        // Count unique accounts
        const uniqueAccountsInOperation = new Set(accountBettingHouses?.map(item => item.account_id) || []);
        emOperacao = uniqueAccountsInOperation.size;
      }

      setMetrics({
        totalAccounts: totalAccounts || 0,
        documentsFinalized: documentsFinalized || 0,
        selfiesPending: selfiesPending || 0,
        openHouses: openHouses || 0,
        pendingVerifications: pendingVerifications || 0,
        fullVerified: fullVerified || 0,
        emOperacao
      });
    } catch (error) {
      console.error('Error fetching metrics:', error);
    }
  };

  const fetchBettingHouses = async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);

      // Get all betting houses with their details
      const { data: houses, error: housesError } = await supabase
        .from('betting_houses')
        .select(`
          id,
          name,
          link
        `)
        .order('name');

      if (housesError) throw housesError;

      // For each betting house, get the balances from all accounts
      const housesWithBalances = await Promise.all(
        (houses || []).map(async (house) => {
          let query;
          
          if (!isAdmin) {
            // First, get user's account IDs
            const { data: userAccounts } = await supabase
              .from('accounts')
              .select('id')
              .eq('user_id', currentUser.id);
              
            if (userAccounts && userAccounts.length > 0) {
              // Now use these IDs in the query
              const accountIds = userAccounts.map(account => account.id);
              
              query = await supabase
                .from('account_betting_houses')
                .select('saldo')
                .eq('betting_house_id', house.id)
                .in('account_id', accountIds);
            } else {
              // User has no accounts
              return {
                ...house,
                totalBalance: 0
              };
            }
          } else {
            // Admin sees all
            query = await supabase
              .from('account_betting_houses')
              .select('saldo')
              .eq('betting_house_id', house.id);
          }
          
          const { data: balances } = query;

          const totalBalance = (balances || []).reduce((sum, balance) => {
            return sum + parseCurrency(balance.saldo);
          }, 0);

          return {
            ...house,
            totalBalance
          };
        })
      );

      // Sort by balance in descending order
      const sortedHouses = housesWithBalances.sort((a, b) => b.totalBalance - a.totalBalance);

      console.log('Balances updated:', new Date().toISOString());
      setBettingHouses(sortedHouses);
    } catch (err) {
      console.error('Error fetching betting houses:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchBettingHouses();
    await fetchManualBalances();
    await fetchMetrics();
    setLastUpdate(new Date());
  };

  const totalAllHouses = bettingHouses.reduce((sum, house) => sum + house.totalBalance, 0) + 
    manualBalances.protection + manualBalances.bankBalance + manualBalances.fintechBalance;

  const metricCards = [
    { title: 'Total de Contas', value: metrics.totalAccounts, color: 'bg-blue-50 text-blue-800' },
    { title: 'Documentos Finalizados', value: metrics.documentsFinalized, color: 'bg-green-50 text-green-800' },
    { title: 'Selfies Pendentes', value: metrics.selfiesPending, color: 'bg-yellow-50 text-yellow-800' },
    { title: 'Abrir Casas', value: metrics.openHouses, color: 'bg-purple-50 text-purple-800' },
    { title: 'Verificações Pendentes', value: metrics.pendingVerifications, color: 'bg-orange-50 text-orange-800' },
    { title: 'Contas 100%', value: metrics.fullVerified, color: 'bg-teal-50 text-teal-800' },
    { title: 'Em Operação', value: metrics.emOperacao, color: 'bg-emerald-50 text-emerald-800' }
  ];

  if (!currentUser) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <div className="text-xl text-gray-600">Faça login para visualizar o Controle Geral</div>
      </div>
    );
  }

  if (loading && bettingHouses.length === 0) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <div className="text-xl text-gray-600">Carregando...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <div className="text-xl text-red-600">Erro ao carregar os dados: {error}</div>
      </div>
    );
  }

  const CurrencyInput = ({ value, onChange }: { value: number, onChange: (value: string) => void }) => {
    const [rawValue, setRawValue] = useState(String(value * 100));
    const [isFocused, setIsFocused] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const cursorPositionRef = useRef<number>(0);

    useEffect(() => {
      if (!isFocused) {
        setRawValue(String(value * 100));
      }
    }, [value, isFocused]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target;
      const newValue = input.value.replace(/\D/g, '');
      
      cursorPositionRef.current = input.selectionStart || 0;
      
      setRawValue(newValue);
      onChange(formatCurrency(newValue ? parseInt(newValue) / 100 : 0));

      requestAnimationFrame(() => {
        if (inputRef.current) {
          inputRef.current.selectionStart = cursorPositionRef.current;
          inputRef.current.selectionEnd = cursorPositionRef.current;
        }
      });
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      e.target.select();
    };

    const handleBlur = () => {
      setIsFocused(false);
    };

    const displayValue = isFocused
      ? (rawValue ? `R$ ${(parseInt(rawValue) / 100).toFixed(2)}` : 'R$ 0,00')
      : formatCurrency(value);

    return (
      <div className={`
        relative rounded-md border ${isFocused ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-200'} 
        bg-white transition-all duration-200 hover:border-gray-300
      `}>
        <input
          ref={inputRef}
          type="text"
          className="w-full p-3 text-lg font-bold bg-transparent focus:outline-none"
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder="R$ 0,00"
        />
      </div>
    );
  };

  return (
    <div className="flex-1 p-8">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Controle Geral</h1>
          {currentUser && (
            <div className="text-sm text-gray-600">
              Logado como: <span className="font-medium">{currentUser.email}</span>
              {isAdmin && <span className="ml-2 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">Admin</span>}
            </div>
          )}
        </div>
        
        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3 mb-6">
          {metricCards.map((card, index) => (
            <div
              key={index}
              className={`${card.color} p-3 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200`}
            >
              <h3 className="text-xs font-medium opacity-75">{card.title}</h3>
              <p className="text-xl font-bold mt-1">{card.value}</p>
            </div>
          ))}
        </div>

        {/* Total Balance Card */}
        <div className="bg-blue-50 p-4 rounded-lg flex items-center justify-between">
          <div>
            <p className="text-lg text-blue-800">
              Saldo Total em Todas as Casas:{' '}
              <span className="font-bold">{formatCurrency(totalAllHouses)}</span>
            </p>
            <p className="text-sm text-blue-600 mt-1">
              Última atualização: {lastUpdate.toLocaleTimeString()}
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className={`p-2 rounded-full ${
              refreshing ? 'bg-blue-100' : 'bg-blue-200 hover:bg-blue-300'
            } transition-colors duration-200`}
          >
            <RefreshCw 
              className={`w-5 h-5 text-blue-700 ${refreshing ? 'animate-spin' : ''}`}
            />
          </button>
        </div>
      </div>

      {/* Manual Balance Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-50 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 p-4">
          <h3 className="text-sm font-semibold text-slate-800 mb-2">Casa Proteção</h3>
          <CurrencyInput
            value={manualBalances.protection}
            onChange={(value) => handleManualBalanceChange('protection', value)}
          />
        </div>
        <div className="bg-slate-50 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 p-4">
          <h3 className="text-sm font-semibold text-slate-800 mb-2">Saldo em Banco</h3>
          <CurrencyInput
            value={manualBalances.bankBalance}
            onChange={(value) => handleManualBalanceChange('bankBalance', value)}
          />
        </div>
        <div className="bg-slate-50 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 p-4">
          <h3 className="text-sm font-semibold text-slate-800 mb-2">Saldo Fintech Freebet</h3>
          <div className="flex gap-2">
            <CurrencyInput
              value={manualBalances.fintechBalance}
              onChange={(value) => handleManualBalanceChange('fintechBalance', value)}
            />
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className={`p-2 rounded ${
                refreshing ? 'bg-gray-100' : 'bg-gray-200 hover:bg-gray-300'
              } transition-colors duration-200`}
              title="Atualizar Saldo"
            >
              <RefreshCw 
                className={`w-5 h-5 text-gray-700 ${refreshing ? 'animate-spin' : ''}`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Betting Houses Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {bettingHouses.map((house) => (
          <div
            key={house.id}
            className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 p-4"
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-sm font-semibold text-gray-800">{house.name}</h3>
              {house.link && (
                <a
                  href={house.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors duration-200"
                >
                  <span className="mr-1">Abrir Conta</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
            <p className={`text-lg font-bold ${house.totalBalance > 0 ? 'text-green-600' : 'text-gray-800'}`}>
              {formatCurrency(house.totalBalance)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ControleGeral;