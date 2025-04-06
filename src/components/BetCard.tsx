import React, { useState, useEffect } from 'react';
import { Check, Trash2, FileDown, Plus, Eye, EyeOff, Search, Upload, MessageCircle, Building2, ChevronDown, ChevronRight, Minus } from 'lucide-react';
import { useAccounts } from '../hooks/useAccounts';
import { useBettingHouses } from '../hooks/useBettingHouses';
import { formatCurrency } from '../utils/currency';
import { authService } from '../services/supabaseService';
import { supabase } from '../lib/supabase';
interface BetCardProps {
  id?: string;
  date: string;
  time: string;
  gameName: string;
  house1: string;
  house2: string;
  betAmount: number;
  result: number;
  profit: number;
  status?: string;
  user_id?: string; // Add user_id field
}

interface DayCardProps {
  date: string;
  bets: BetCardProps[];
}

interface MonthlyCardProps {
  month: string;
  days: DayCardProps[];
  userId?: string; // Add userId prop to filter data
}

interface OperationForm {
  id: string;
  status: string;
  casa1: string;
  cpf1: string;
  stake1: string;
  casa2: string;
  cpf2: string;
  stake2: string;
  casaProt: string;
  cpfProt: string;
  stakeProt: string;
  casaVencedora?: string;
  cpfVencedor?: string;
}

const promotionOptions = [
  'Freebet',
  'Cashback',
  'Aumento',
  'SuperOdds'
];

const statusOptions = [
  { value: 'Em Operação', color: 'bg-blue-100 text-blue-800' },
  { value: 'Finalizado', color: 'bg-green-100 text-green-800' },
  { value: 'Pendente', color: 'bg-red-100 text-red-800' }
];

// Format a Date object to DD/MM/YYYY
function formatDateToString(date: Date): string {
  return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
}

// Parse a string date in format DD/MM/YYYY to a Date object
function parseStringToDate(dateStr: string): Date {
  const [day, month, year] = dateStr.split('/').map(Number);
  return new Date(year, month - 1, day);
}

// Gets all days in a month, returning Date objects
function getDaysInMonth(monthStr: string): Date[] {
  const monthMap: { [key: string]: number } = {
    'janeiro': 0, 'fevereiro': 1, 'março': 2, 'abril': 3,
    'maio': 4, 'junho': 5, 'julho': 6, 'agosto': 7,
    'setembro': 8, 'outubro': 9, 'novembro': 10, 'dezembro': 11,
    // Versões capitalizadas também
    'Janeiro': 0, 'Fevereiro': 1, 'Março': 2, 'Abril': 3,
    'Maio': 4, 'Junho': 5, 'Julho': 6, 'Agosto': 7,
    'Setembro': 8, 'Outubro': 9, 'Novembro': 10, 'Dezembro': 11
  };
  
  // Normaliza a entrada para lidar com formatos como "abril de 2025"
  const normalizedStr = monthStr.replace(/ de /, " ");
  
  // Divide a string em palavras
  const parts = normalizedStr.split(' ');
  
  // Último elemento é o ano
  const yearStr = parts[parts.length - 1];
  
  // Tudo antes do último elemento é o nome do mês
  const monthName = parts.slice(0, parts.length - 1).join(' ').toLowerCase();
  
  // Converte para números
  const year = parseInt(yearStr);
  const month = monthMap[monthName];
  
  // Verifica se ano e mês são válidos
  if (isNaN(year) || month === undefined) {
    console.error(`Não foi possível analisar o mês e ano de "${monthStr}". Mês: "${monthName}", Ano: "${yearStr}"`);
    // Usa data atual como fallback
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    const days: Date[] = [];
    for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
      days.push(new Date(d));
    }
    return days;
  }
  
  // Gera os dias do mês
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  const days: Date[] = [];
  for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d));
  }
  
  return days;
}

// Create a new hook to get the current user from Supabase
export const useCurrentUser = () => {
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);
  const [loading, setLoading] = useState(true);

  
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        // Get the current session from Supabase
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error fetching user session:", error);
          setLoading(false);
          return;
        }
        
        if (session?.user) {
          setCurrentUser({
            id: session.user.id
          });
        }
      } catch (err) {
        console.error("Failed to get current user:", err);
      } finally {
        setLoading(false);
      }
    };
    
    getCurrentUser();
  }, [supabase]);
  
  return { currentUser, loading };
};

export const MonthlyBetCard: React.FC<MonthlyCardProps> = ({ month, days }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDetails, setShowDetails] = useState(true);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const { currentUser, loading: userLoading } = useCurrentUser(); // Get current user

  // Get all days in the month as Date objects
  const allDaysInMonth = getDaysInMonth(month);
  
  // Filter days to only include bets for the current user
  const filteredDays = days.map(day => ({
    ...day,
    bets: day.bets.filter(bet => !bet.user_id || bet.user_id === currentUser?.id)
  })).filter(day => day.bets.length > 0); // Only show days that have bets for this user
  
  // Ensure consistent date format for mapping (using DD/MM/YYYY format)
  const daysMap = new Map(filteredDays.map(day => {
    // Make sure the date is in the consistent DD/MM/YYYY format
    const formattedDate = day.date.includes('/')
      ? day.date // already in DD/MM/YYYY
      : formatDateFromLocale(day.date); // convert from "12 de Março" to DD/MM/YYYY
    
    return [formattedDate, {
      ...day,
      date: formattedDate
    }];
  }));

  // Create a complete array of all days in the month with data
  const completeDays = allDaysInMonth.map(date => {
    const dateStr = formatDateToString(date);
    return daysMap.get(dateStr) || {
      date: dateStr,
      bets: []
    };
  });

  // Calculate totals for the month (only for filtered bets)
  const totalBetAmount = filteredDays.reduce((sum, day) => 
    sum + day.bets.reduce((daySum, bet) => daySum + bet.betAmount, 0), 0);
  const totalResult = filteredDays.reduce((sum, day) => 
    sum + day.bets.reduce((daySum, bet) => daySum + bet.result, 0), 0);
  const totalProfit = filteredDays.reduce((sum, day) => 
    sum + day.bets.reduce((daySum, bet) => daySum + bet.profit, 0), 0);
  const roi = totalBetAmount > 0 ? (totalProfit / totalBetAmount) * 100 : 0;

  // Get bets for the expanded day
  const expandedDayBets = expandedDay ? 
    (daysMap.get(expandedDay)?.bets || []) : 
    [];

  // Helper function to convert from locale date format to DD/MM/YYYY
  function formatDateFromLocale(localeDate: string): string {
    // Convert "12 de Março" to DD/MM/YYYY
    const parts = localeDate.split(' de ');
    if (parts.length === 2) {
      const day = parts[0].padStart(2, '0');
      const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                          'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
      const monthIndex = monthNames.findIndex(m => m === parts[1]) + 1;
      const month = String(monthIndex).padStart(2, '0');
      // Extract year from the month string
      const [monthName, yearStr] = month.split(' ');
      const year = new Date().getFullYear(); // Fallback to current year if not available
      
      return `${day}/${month}/${year}`;
    }
    return localeDate; // Return as is if format is unexpected
  }

  if (userLoading) {
    return <div className="p-4 text-center">Carregando...</div>;
  }

  // If there are no bets for this user in this month, don't render the component
  if (filteredDays.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-green-100 hover:bg-green-200 transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="w-5 h-5 text-green-600" />
              ) : (
                <ChevronRight className="w-5 h-5 text-green-600" />
              )}
            </button>
            <div>
              <h3 className="text-xl font-semibold text-gray-800">{month}</h3>
            </div>
          </div>

          <div className="flex items-center gap-8">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-gray-500 hover:text-gray-700"
              title={showDetails ? "Ocultar detalhes" : "Mostrar detalhes"}
            >
              {showDetails ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>

            <div className="grid grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-sm text-gray-500">Total Apostado</div>
                <div className={`text-lg font-semibold text-gray-800 ${!showDetails ? 'blur-sm' : ''}`}>
                  {formatCurrency(totalBetAmount)}
                </div>
              </div>

              <div className="text-center">
                <div className="text-sm text-gray-500">Resultado Total</div>
                <div className={`text-lg font-semibold text-gray-800 ${!showDetails ? 'blur-sm' : ''}`}>
                  {formatCurrency(totalResult)}
                </div>
              </div>

              <div className="text-center">
                <div className="text-sm text-gray-500">Lucro Total</div>
                <div className={`text-lg font-semibold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'} ${!showDetails ? 'blur-sm' : ''}`}>
                  {formatCurrency(totalProfit)}
                </div>
              </div>

              <div className="text-center">
                <div className="text-sm text-gray-500">ROI</div>
                <div className={`text-lg font-semibold ${roi >= 0 ? 'text-green-600' : 'text-red-600'} ${!showDetails ? 'blur-sm' : ''}`}>
                  {roi.toFixed(2)}%
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-gray-200 p-2">
          <div className="grid grid-cols-7 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-1">
            {completeDays.map((day, index) => (
              <div key={index} className="flex flex-col">
                <DayCard 
                  {...day} 
                  showDetails={showDetails}
                  isExpanded={expandedDay === day.date}
                  onToggle={() => setExpandedDay(expandedDay === day.date ? null : day.date)}
                />
              </div>
            ))}
          </div>
          {expandedDay && expandedDayBets.length > 0 && (
            <div className="mt-4 border-t border-gray-200 pt-4">
              {expandedDayBets.map((bet, index) => (
                <BetCard key={index} {...bet} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const DayCard: React.FC<DayCardProps & { 
  showDetails: boolean;
  isExpanded: boolean;
  onToggle: () => void;
}> = ({ date, bets, showDetails, isExpanded, onToggle }) => {
  const totalBetAmount = bets.reduce((sum, bet) => sum + bet.betAmount, 0);
  const totalProfit = bets.reduce((sum, bet) => sum + bet.profit, 0);
  const roi = totalBetAmount > 0 ? (totalProfit / totalBetAmount) * 100 : 0;
  
  // Extract just the day number (DD) from the date string (DD/MM/YYYY)
  const dayNumber = date.split('/')[0];
  const hasBets = bets.length > 0;

  if (!showDetails) {
    return null;
  }

  return (
    <div 
      onClick={onToggle}
      className={`
        cursor-pointer rounded border p-2 w-[130px] h-[50px]
        ${hasBets ? (totalProfit > 0 ? 'bg-green-50 hover:bg-green-100 border-green-200' : totalProfit < 0 ? 'bg-red-50 hover:bg-red-100 border-red-200' : 'bg-gray-50 hover:bg-gray-100 border-gray-200') : 'bg-gray-50 hover:bg-gray-100 border-gray-200'}
        ${isExpanded ? 'ring-2 ring-blue-500' : ''}
        transition-all duration-200
      `}
      style={{ minWidth: '130px', minHeight: '50px', maxWidth: '130px', maxHeight: '50px' }}
    >
      <div className="flex flex-col justify-between h-full">
        <div className="flex justify-between items-start">
          <div className="text-sm font-bold">{dayNumber}</div>
          {hasBets && (
            <span className="text-[10px] text-gray-600">
              {bets.length} {bets.length === 1 ? 'aposta' : 'apostas'}
            </span>
          )}
        </div>
        {hasBets && (
          <div className="flex-1 flex items-center justify-center">
            <span className={`text-xs font-semibold ${totalProfit > 0 ? 'text-green-600' : totalProfit < 0 ? 'text-red-600' : 'text-gray-600'}`}>
              {formatCurrency(totalProfit)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export const BetCard: React.FC<BetCardProps> = ({
  id,
  date,
  time,
  gameName,
  house1,
  house2,
  betAmount,
  result,
  profit,
  status
}) => {
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isPromotionOpen, setIsPromotionOpen] = useState(false);
  const [selectedPromotion, setSelectedPromotion] = useState<string>('');
  const { accounts } = useAccounts();
  const { bettingHouses } = useBettingHouses();
  const [isExpanded, setIsExpanded] = useState(false);
  const [operationForms, setOperationForms] = useState<Record<string, OperationForm>>({});
  const [casaVencedora, setCasaVencedora] = useState('');
  const [cpfVencedor, setCpfVencedor] = useState('');
  // Novos estados para gerenciar o feedback de atualização
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<{
    show: boolean;
    success: boolean;
    message: string;
  }>({ show: false, success: false, message: '' });

// In the saveBetData function, modify your catch block like this:
const saveBetData = async (data: any) => {
  setIsUpdating(true);
  try {
    // Assumindo que você tem uma tabela 'bets' no Supabase
    const { error } = await supabase
      .from('betting_operations')
      .update(data)
      .eq('id', id);
    
    if (error) throw error;
    
    setUpdateStatus({
      show: true,
      success: true,
      message: 'Atualizado com sucesso!'
    });
    
    // Esconder a mensagem de sucesso após 3 segundos
    setTimeout(() => {
      setUpdateStatus(prev => ({ ...prev, show: false }));
    }, 3000);
    
    return true;
  } catch (error) {
    console.error('Erro ao atualizar aposta:', error);
    setUpdateStatus({
      show: true,
      success: false,
      message: 'Erro ao atualizar: ' + (error?.message || error?.toString() || 'Tente novamente')
    });
    return false;
  } finally {
    setIsUpdating(false);
  }
};

// Similarly in the saveOperationData function:
const saveOperationData = async (accountId: string, formData: OperationForm) => {
  setIsUpdating(true);
  try {
    // Se já existe um registro, atualiza; caso contrário, insere
    const { data, error } = await supabase
      .from('betting_operations')
      .upsert({
        bet_id: id,
        account_id: accountId,
        ...formData
      }, { onConflict: 'bet_id,account_id' });
    
    if (error) throw error;
    
    setUpdateStatus({
      show: true,
      success: true,
      message: 'Operação atualizada!'
    });
    
    setTimeout(() => {
      setUpdateStatus(prev => ({ ...prev, show: false }));
    }, 3000);
    
    return true;
  } catch (error) {
    console.error('Erro ao atualizar operação:', error);
    setUpdateStatus({
      show: true,
      success: false,
      message: 'Erro ao atualizar operação: ' + (error?.message || error?.toString() || 'Tente novamente')
    });
    return false;
  } finally {
    setIsUpdating(false);
  }
};

  const toggleAccount = (accountId: string) => {
    setSelectedAccounts(prev => {
      if (prev.includes(accountId)) {
        const newForms = { ...operationForms };
        delete newForms[accountId];
        setOperationForms(newForms);
        return prev.filter(id => id !== accountId);
      } else {
        setOperationForms(prev => ({
          ...prev,
          [accountId]: {
            id: accountId,
            status: 'Em Operação',
            casa1: '',
            cpf1: accountId,
            stake1: '',
            casa2: '',
            cpf2: '',
            stake2: '',
            casaProt: '',
            cpfProt: '',
            stakeProt: '',
            casaVencedora: '',
            cpfVencedor: ''
          }
        }));
        return [...prev, accountId];
      }
    });
  };

  const toggleAllAccounts = () => {
    if (selectedAccounts.length === accounts.length) {
      setSelectedAccounts([]);
      setOperationForms({});
    } else {
      const allAccountIds = accounts.map(account => account.id);
      setSelectedAccounts(allAccountIds);
      const newForms = allAccountIds.reduce((acc, accountId) => ({
        ...acc,
        [accountId]: {
          id: accountId,
          status: 'Em Operação',
          casa1: '',
          cpf1: accountId,
          stake1: '',
          casa2: '',
          cpf2: '',
          stake2: '',
          casaProt: '',
          cpfProt: '',
          stakeProt: '',
          casaVencedora: '',
          cpfVencedor: ''
        }
      }), {});
      setOperationForms(newForms);
    }
  };

  // Função modificada para atualizar em tempo real
  const updateOperationForm = async (accountId: string, field: keyof OperationForm, value: string) => {
    // Atualiza o estado local primeiro para feedback imediato
    setOperationForms(prev => {
      const updatedForm = {
        ...prev[accountId],
        [field]: value
      };
      
      // Se for status, atualiza em todos os formulários
      if (field === 'status') {
        const newForms = { ...prev };
        Object.keys(newForms).forEach(id => {
          newForms[id] = {
            ...newForms[id],
            status: value
          };
        });
        return newForms;
      }
      
      return {
        ...prev,
        [accountId]: updatedForm
      };
    });
    
    // Se o campo for status, atualize o status principal da aposta também
    if (field === 'status') {
      await saveBetData({ status: value });
    }
    
    // Salva no banco de dados após um curto delay para evitar muitas requisições
    // se o usuário estiver fazendo múltiplas mudanças rapidamente
    if (accountId) {
      // Use debounce para evitar muitas requisições
      clearTimeout(window.updateTimeout);
      window.updateTimeout = setTimeout(() => {
        saveOperationData(accountId, operationForms[accountId]);
      }, 500);
    }
  };

  // Modificada para atualizar em tempo real
  const handlePromotionChange = async (promotion: string) => {
    setSelectedPromotion(promotion);
    setIsPromotionOpen(false);
    
    // Salva no banco
    await saveBetData({ promotion_id });
  };

  const truncateName = (name: string) => {
    return name.length > 20 ? name.substring(0, 17) + '...' : name;
  };

  const roi = (profit / betAmount) * 100;

  const renderOperationForm = (accountId: string, index: number) => {
    const form = operationForms[accountId];

    return (
      <div key={accountId} className={`mb-2 ${index > 0 ? 'mt-2 pt-2 border-t border-gray-200' : ''}`}>
        {index === 0 && (
          <div className="grid grid-cols-11 gap-4 mb-2">
            <div className="col-span-1">
              <span className="text-sm font-medium text-gray-600">Casa 1 Ativação</span>
            </div>
            <div className="col-span-1">
              <span className="text-sm font-medium text-gray-600">CPF 1 Ativação</span>
            </div>
            <div className="col-span-1">
              <span className="text-sm font-medium text-gray-600">Stake 1</span>
            </div>
            <div className="col-span-1">
              <span className="text-sm font-medium text-gray-600">Casa 2 Ativação</span>
            </div>
            <div className="col-span-1">
              <span className="text-sm font-medium text-gray-600">CPF 2 Ativação</span>
            </div>
            <div className="col-span-1">
              <span className="text-sm font-medium text-gray-600">Stake 2</span>
            </div>
            <div className="col-span-1">
              <span className="text-sm font-medium text-gray-600">Casa 3 Proteção</span>
            </div>
            <div className="col-span-1">
              <span className="text-sm font-medium text-gray-600">CPF Proteção</span>
            </div>
            <div className="col-span-1">
              <span className="text-sm font-medium text-gray-600">Stake</span>
            </div>
            <div className="col-span-1">
              <span className="text-sm font-medium text-gray-600">Casa Vencedora</span>
            </div>
            <div className="col-span-1">
              <span className="text-sm font-medium text-gray-600">CPF Vencedor</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-11 gap-4">
          <div className="col-span-1">
            <select 
              className="w-full p-2 border rounded-md bg-white"
              value={form.casa1}
              onChange={(e) => updateOperationForm(accountId, 'casa1', e.target.value)}
              disabled={isUpdating}
            >
              <option value="">Selecione</option>
              {bettingHouses.map(house => (
                <option key={house.id} value={house.id}>{house.name}</option>
              ))}
            </select>
          </div>

          <div className="col-span-1">
            <select 
              className="w-full p-2 border rounded-md bg-white"
              value={form.cpf1}
              onChange={(e) => updateOperationForm(accountId, 'cpf1', e.target.value)}
              disabled={isUpdating}
            >
              <option value="">Selecione</option>
              {accounts.map(account => (
                <option key={account.id} value={account.id} title={account.name}>
                  {truncateName(account.name)}
                </option>
              ))}
            </select>
          </div>

          <div className="col-span-1">
            <input
              type="text"
              className="w-full p-2 border rounded-md bg-white"
              placeholder="R$ 0,00"
              value={form.stake1}
              onChange={(e) => updateOperationForm(accountId, 'stake1', e.target.value)}
              disabled={isUpdating}
            />
          </div>

          <div className="col-span-1">
            <select 
              className="w-full p-2 border rounded-md bg-white"
              value={form.casa2}
              onChange={(e) => updateOperationForm(accountId, 'casa2', e.target.value)}
              disabled={isUpdating}
            >
              <option value="">Selecione</option>
              {bettingHouses.map(house => (
                <option key={house.id} value={house.id}>{house.name}</option>
              ))}
            </select>
          </div>

          <div className="col-span-1">
            <select 
              className="w-full p-2 border rounded-md bg-white"
              value={form.cpf2}
              onChange={(e) => updateOperationForm(accountId, 'cpf2', e.target.value)}
              disabled={isUpdating}
            >
              <option value="">Selecione</option>
              {accounts.map(account => (
                <option key={account.id} value={account.id} title={account.name}>
                  {truncateName(account.name)}
                </option>
              ))}
            </select>
          </div>

          <div className="col-span-1">
            <input
              type="text"
              className="w-full p-2 border rounded-md bg-white"
              placeholder="R$ 0,00"
              value={form.stake2}
              onChange={(e) => updateOperationForm(accountId, 'stake2', e.target.value)}
              disabled={isUpdating}
            />
          </div>

          <div className="col-span-1">
            <select 
              className="w-full p-2 border rounded-md bg-white"
              value={form.casaProt}
              onChange={(e) => updateOperationForm(accountId, 'casaProt', e.target.value)}
              disabled={isUpdating}
            >
              <option value="">Selecione</option>
              {bettingHouses.map(house => (
                <option key={house.id} value={house.id}>{house.name}</option>
              ))}
            </select>
          </div>

          <div className="col-span-1">
            <select 
              className="w-full p-2 border rounded-md bg-white"
              value={form.cpfProt}
              onChange={(e) => updateOperationForm(accountId, 'cpfProt', e.target.value)}
              disabled={isUpdating}
            >
              <option value="">Selecione</option>
              {accounts.map(account => (
                <option key={account.id} value={account.id} title={account.name}>
                  {truncateName(account.name)}
                </option>
              ))}
            </select>
          </div>

          <div className="col-span-1">
            <input
              type="text"
              className="w-full p-2 border rounded-md bg-white"
              placeholder="R$ 0,00"
              value={form.stakeProt}
              onChange={(e) => updateOperationForm(accountId, 'stakeProt', e.target.value)}
              disabled={isUpdating}
            />
          </div>

          <div className="col-span-1">
            <select 
              className={`w-full p-2 border rounded-md ${
                form.casaVencedora ? 'bg-green-50' : 'bg-white'
              }`}
              value={form.casaVencedora || ''}
              onChange={(e) => updateOperationForm(accountId, 'casaVencedora', e.target.value)}
              disabled={isUpdating}
            >
              <option value="">Selecione</option>
              {bettingHouses.map(house => (
                <option key={house.id} value={house.id}>{house.name}</option>
              ))}
            </select>
          </div>

          <div className="col-span-1">
            <select 
              className={`w-full p-2 border rounded-md ${
                form.cpfVencedor ? 'bg-green-50' : 'bg-white'
              }`}
              value={form.cpfVencedor || ''}
              onChange={(e) => updateOperationForm(accountId, 'cpfVencedor', e.target.value)}
              disabled={isUpdating}
            >
              <option value="">Selecione</option>
              {accounts.map(account => (
                <option key={account.id} value={account.id} title={account.name}>
                  {truncateName(account.name)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm mb-2 relative">
      {/* Indicador de atualização */}
      {isUpdating && (
        <div className="absolute inset-0 bg-black bg-opacity-10 flex items-center justify-center rounded-lg z-30">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
        </div>
      )}
      
      {/* Mensagem de status */}
      {updateStatus.show && (
        <div className={`absolute top-2 right-2 px-4 py-2 rounded-md text-white text-sm z-40 ${
          updateStatus.success ? 'bg-green-500' : 'bg-red-500'
        }`}>
          {updateStatus.message}
        </div>
      )}
      
      <div className="flex items-center gap-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-green-100 hover:bg-green-200 transition-colors"
        >
          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-green-600" />
          ) : (
            <ChevronRight className="w-5 h-5 text-green-600" />
          )}
        </button>

        <div className="flex-1">
          <div className="text-xs text-gray-500">
            {time}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-lg font-medium text-gray-800">
              {gameName}
            </span>
            <select
              value={operationForms[Object.keys(operationForms)[0]]?.status || status || 'Em Operação'}
              onChange={(e) => {
                const newStatus = e.target.value;
                // Atualiza o status localmente imediatamente
                Object.keys(operationForms).forEach(accountId => {
                  updateOperationForm(accountId, 'status', newStatus);
                });
                // Também atualiza o status principal da aposta
                saveBetData({ status: newStatus });
              }}
              className={`px-3 py-1 rounded-lg text-sm ${
                statusOptions.find(opt => opt.value === (operationForms[Object.keys(operationForms)[0]]?.status || status))?.color || 'bg-blue-100 text-blue-800'
              }`}
              disabled={isUpdating}
            >
              {statusOptions.map(option => (
                <option 
                  key={option.value} 
                  value={option.value}
                  className={option.color}
                >
                  {option.value}
                </option>
              ))}
            </select>
            <div className="relative">
              <button
                onClick={() => setIsPromotionOpen(!isPromotionOpen)}
                className="px-3 py-1 text-sm border rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                disabled={isUpdating}
              >
                {selectedPromotion || 'Selecione a Promoção'}
                <ChevronDown className="w-4 h-4" />
              </button>
              {isPromotionOpen && (
                <div className="absolute z-20 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200">
                  <div className="py-1">
                    {promotionOptions.map((promotion) => (
                      <button
                        key={promotion}
                        onClick={() => handlePromotionChange(promotion)}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                      >
                        {promotion}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="px-3 py-1 text-sm border rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                disabled={isUpdating}
              >
                <span>CPFs ({selectedAccounts.length})</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              {isDropdownOpen && (
                <div className="absolute z-20 mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200">
                  <div className="p-2 border-b">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedAccounts.length === accounts.length}
                        onChange={toggleAllAccounts}
                        className="rounded border-gray-300"
                        disabled={isUpdating}
                      />
                      <span className="font-medium">Selecionar Todos</span>
                    </label>
                  </div>
                  <div className="p-2 max-h-48 overflow-y-auto">
                    {accounts.map(account => (
                      <label key={account.id} className="flex items-center gap-2 py-1">
                        <input
                          type="checkbox"
                          checked={selectedAccounts.includes(account.id)}
                          onChange={() => toggleAccount(account.id)}
                          className="rounded border-gray-300"
                          disabled={isUpdating}
                        />
                        <span title={account.name}>{truncateName(account.name)}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className="flex items-center gap-4">
            <div className="text-gray-700">{house1}</div>
            <div className="text-gray-400">vs</div>
            <div className="text-gray-700">{house2}</div>
          </div>

          <div className="text-center">
            <div className="text-lg font-semibold text-gray-800">
              {formatCurrency(betAmount)}
            </div>
            <div className="text-sm text-gray-500">Apostado</div>
          </div>

          <div className="text-center">
            <div className="text-lg font-semibold text-gray-800">
              {formatCurrency(result)}
            </div>
            <div className="text-sm text-gray-500">Resultado</div>
          </div>

          <div className="text-center">
            <div className={`text-lg font-semibold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(profit)}
            </div>
            <div className="text-sm text-gray-500">Lucro</div>
          </div>

          <div className="text-center">
            <div className={`text-lg font-semibold ${roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {roi.toFixed(2)}%
            </div>
            <div className="text-sm text-gray-500">ROI</div>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 pl-9 space-y-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            {selectedAccounts.map((accountId, index) => renderOperationForm(accountId, index))}
            {selectedAccounts.length === 0 && (
              <div className="text-center py-6 text-gray-500">
                Selecione CPFs para gerenciar operações
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};