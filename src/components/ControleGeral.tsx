import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { formatCurrency, parseCurrency } from '../utils/currency';
import { RefreshCw, ExternalLink } from 'lucide-react';

interface BettingHouseBalance {
  name: string;
  totalBalance: number;
}

interface ManualBalances {
  protection: number;
  bankBalance: number;
  fintechBalance: number;
}

// Add betting house links mapping
const BETTING_HOUSE_LINKS: Record<string, string> = {
  'BateuBet': 'https://apretailer.com.br/click/67ddfba92bfa8178563c6135/186228/352025/subaccount',
  'BET365': 'https://www.bet365.bet.br/',
  'Betano': 'https://www.betano.bet.br/',
  'Betnacional': 'https://betnacional.bet.br/',
  'Betpix365': 'https://betpix365.bet.br/ptb/bet/main',
  'BR4': 'https://br4.bet.br/',
  'EsportivaBet': 'https://go.affiliapass.com?id=67d487cecbafd8001bbc93de',
  'EstrelaBet': 'https://apretailer.com.br/click/67ddfba92bfa81785c0d8668/182492/352025/subaccount',
  'KTO': 'https://www.kto.bet.br/login/',
  'Lotogreen': 'https://apretailer.com.br/click/67d8bc612bfa814c7b7a62b3/186144/352025/subaccount',
  'MC Games': 'https://go.affiliapass.com?id=67d4884fcbafd8001bbc93f6',
  'Novibet': 'https://go.affiliapass.com?id=67d986a5872f83001ab56252',
  'Superbet': 'https://superbet.bet.br/',
  'Vaidebet': 'https://vaidebet.bet.br/ptb/bet/main'
};

const ControleGeral = () => {
  const [balances, setBalances] = useState<BettingHouseBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const [manualBalances, setManualBalances] = useState<ManualBalances>(() => {
    const saved = localStorage.getItem('manualBalances');
    return saved ? JSON.parse(saved) : { protection: 0, bankBalance: 0, fintechBalance: 0 };
  });
  const [metrics, setMetrics] = useState({
    totalAccounts: 0,
    documentsFinalized: 0,
    selfiesPending: 0,
    openHouses: 0,
    pendingVerifications: 0,
    fullVerified: 0,
    emOperacao: 0
  });

  useEffect(() => {
    fetchBalances();
    fetchMetrics();

    // Subscribe to changes
    const subscription = supabase
      .channel('any_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'account_betting_houses'
        },
        (payload) => {
          console.log('Real-time update received:', payload);
          setLastUpdate(new Date());
          fetchBalances();
          fetchMetrics();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Save manual balances to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('manualBalances', JSON.stringify(manualBalances));
  }, [manualBalances]);

  const handleManualBalanceChange = (type: keyof ManualBalances, value: string) => {
    const numericValue = parseCurrency(value);
    setManualBalances(prev => ({
      ...prev,
      [type]: numericValue
    }));
    setLastUpdate(new Date());
  };

  const fetchMetrics = async () => {
    try {
      // Total accounts
      const { count: totalAccounts } = await supabase
        .from('accounts')
        .select('*', { count: 'exact', head: true });

      // Documents finalized (status Verificado)
      const { count: documentsFinalized } = await supabase
        .from('accounts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Verificado');

      // Selfies pending
      const { count: selfiesPending } = await supabase
        .from('accounts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Selfie');

      // Houses to open (status ABRIR)
      const { count: openHouses } = await supabase
        .from('accounts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'ABRIR');

      // Pending verifications
      const { count: pendingVerifications } = await supabase
        .from('accounts')
        .select('*', { count: 'exact', head: true })
        .eq('verification', 'Verificar');

      // Fully verified accounts (both status and verification are 'Verificado')
      const { count: fullVerified } = await supabase
        .from('accounts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Verificado')
        .eq('verification', 'Verificado');

      // Get accounts with 'Em Operação' status in any betting house
      const { data: accountBettingHouses } = await supabase
        .from('account_betting_houses')
        .select('account_id')
        .eq('status', 'Em Operação');

      // Count unique accounts that have 'Em Operação' status in any betting house
      const uniqueAccountsInOperation = new Set(accountBettingHouses?.map(item => item.account_id) || []);
      const emOperacao = uniqueAccountsInOperation.size;

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

  const fetchBalances = async () => {
    try {
      setLoading(true);

      // Get all betting houses with their balances in a single query
      const { data: bettingHousesWithBalances, error: queryError } = await supabase
        .from('betting_houses')
        .select(`
          id,
          name,
          account_betting_houses (
            saldo
          )
        `)
        .order('name');

      if (queryError) throw queryError;

      // Calculate totals for each betting house
      const totals = (bettingHousesWithBalances || []).map(house => {
        const total = (house.account_betting_houses || []).reduce((sum, balance) => {
          return sum + parseCurrency(balance.saldo);
        }, 0);

        return {
          name: house.name,
          totalBalance: total
        };
      });

      // Sort totals by balance in descending order
      const sortedTotals = totals.sort((a, b) => b.totalBalance - a.totalBalance);

      console.log('Balances updated:', new Date().toISOString());
      setBalances(sortedTotals);
    } catch (err) {
      console.error('Error fetching balances:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchBalances();
    await fetchMetrics();
    setLastUpdate(new Date());
  };

  const totalAllHouses = balances.reduce((sum, house) => sum + house.totalBalance, 0) + 
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

  if (loading && balances.length === 0) {
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
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Controle Geral</h1>
        
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
        {balances.map((house) => (
          <div
            key={house.name}
            className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 p-4"
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-sm font-semibold text-gray-800">{house.name}</h3>
              {BETTING_HOUSE_LINKS[house.name] && (
                <a
                  href={BETTING_HOUSE_LINKS[house.name]}
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