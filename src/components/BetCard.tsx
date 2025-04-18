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
  promotion_id?: string; // Adicione esta linha se estiver faltando
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
  // Original protection fields
  casaProt: string;
  cpfProt: string;
  stakeProt: string;
  // New protection fields
  casaProt2: string; 
  cpfProt2: string;
  stakeProt2: string;
  casaProt3: string;
  cpfProt3: string;
  stakeProt3: string;
  // Winner fields
  casaVencedora?: string;
  cpfVencedor?: string;
}

// Adicione essa interface para as promoções
interface Promotion {
  id: string;
  name: string;
}

// Crie um hook para buscar as promoções
export const usePromotions = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPromotions = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const { data, error } = await supabase
          .from('promotions')
          .select('id, name');
        
        if (error) throw error;
        
        console.log('Promoções carregadas do banco:', data);
        setPromotions(data || []);
      } catch (err) {
        console.error("Erro ao buscar promoções:", err);
        setError(err.message || "Falha ao carregar promoções");
      } finally {
        setLoading(false);
      }
    };
    
    fetchPromotions();
  }, []);
  
  return { promotions, loading, error };
};


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
  status,
  promotion_id
}) => {
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isPromotionOpen, setIsPromotionOpen] = useState(false);
  const { accounts, loading: accountsLoading } = useAccounts();
  const { bettingHouses, loading: housesLoading } = useBettingHouses();

  const { promotions, loading: loadingPromotions } = usePromotions();
  const [isExpanded, setIsExpanded] = useState(false);
  const [operationForms, setOperationForms] = useState<Record<string, OperationForm>>({});
  const [casaVencedora, setCasaVencedora] = useState('');
  const [cpfVencedor, setCpfVencedor] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPromotionId, setSelectedPromotionId] = useState<string | null>(promotion_id || null);
  const [selectedPromotion, setSelectedPromotion] = useState<string>('');
  const [updateStatus, setUpdateStatus] = useState<{
    show: boolean;
    success: boolean;
    message: string;
  }>({ show: false, success: false, message: '' });

  useEffect(() => {
    if (id) {
      loadOperationDetails();
    }
  }, [id]); // This will run when the component mounts if an id exists
  

  // Add this new function to load existing operation details
  const loadOperationDetails = async () => {
    if (!id) return;
    
    setIsLoading(true);
    try {
      // First, fetch the promotion_id from the main operation
      const { data: betData, error: betError } = await supabase
        .from('betting_operations')
        .select('promotion_id')
        .eq('id', id)
        .single();
      
      if (betError) throw betError;
      
      if (betData?.promotion_id) {
        setSelectedPromotionId(betData.promotion_id);
      }
      
      // Continue loading operation details
      const { data, error } = await supabase
        .from('betting_operation_details')
        .select('*')
        .eq('betting_operation_id', id);
      
      if (error) throw error;
      
      console.log('Loaded operation details:', data);
      
      if (data && data.length > 0) {
        const formData: Record<string, OperationForm> = {};
        const accountIds: string[] = [];
        
        data.forEach(operation => {
          const accountId = operation.account_id;
          if (accountId) { // Make sure accountId exists
            accountIds.push(accountId);
            
            formData[accountId] = {
              id: accountId,
              status: status || 'Em Operação',
              casa1: operation.casa1 || '',
              cpf1: operation.cpf1 || accountId,
              stake1: operation.stake1 || '',
              casa2: operation.casa2 || '',
              cpf2: operation.cpf2 || '',
              stake2: operation.stake2 || '',
              casaProt: operation.casaprot || '',
              cpfProt: operation.cpfprot || '',
              stakeProt: operation.stakeprot || '',
              // Add new protection fields
              casaProt2: operation.casaprot2 || '',
              cpfProt2: operation.cpfprot2 || '',
              stakeProt2: operation.stakeprot2 || '',
              casaProt3: operation.casaprot3 || '',
              cpfProt3: operation.cpfprot3 || '',
              stakeProt3: operation.stakeprot3 || '',
              casaVencedora: operation.casavencedora || '',
              cpfVencedor: operation.cpfvencedor || ''
            };
          }
        });
        
        // Only update if we found accounts
        if (accountIds.length > 0) {
          setOperationForms(formData);
          setSelectedAccounts(accountIds);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar detalhes da operação:', error);
    } finally {
      setIsLoading(false);
    }
  };
  // Load operations when component expands
  useEffect(() => {
    if (isExpanded && selectedAccounts.length === 0) {
      loadOperationDetails();
    }
  }, [isExpanded]);

  useEffect(() => {
    // Use selectedPromotionId em vez de promotion_id já que é esse que está definido
    if (!loadingPromotions && selectedPromotionId && promotions.length > 0) {
      // Encontre a promoção com o ID correspondente
      const promotion = promotions.find(p => String(p.id) === String(selectedPromotionId));
      
      // Se encontrou, use o nome; caso contrário, use um fallback
      if (promotion) {
        setSelectedPromotion(promotion.name);
      } else {
        setSelectedPromotion(`Promoção #${selectedPromotionId.substring(0, 6)}...`);
      }
    }
  }, [selectedPromotionId, promotions, loadingPromotions]);

  useEffect(() => {
    console.log("Estado atual:", {
      promotion_id,
      promotions,
      loadingPromotions,
      selectedPromotionId,
      selectedPromotion
    });
  }, [promotion_id, promotions, loadingPromotions, selectedPromotionId, selectedPromotion]);

  useEffect(() => {
    console.log("Promoções carregadas:", promotions);
  }, [promotions]);

  const saveBetData = async (data: any) => {
    setIsUpdating(true);
    try {
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

  const saveOperationData = async (accountId: string, formData: OperationForm) => {
    setIsUpdating(true);
    try {
      // Convert camelCase to lowercase to match DB schema
      const dbFormData = {
        betting_operation_id: id,
        account_id: accountId,
        casa1: formData.casa1,
        cpf1: formData.cpf1,
        stake1: formData.stake1,
        casa2: formData.casa2,
        cpf2: formData.cpf2,
        stake2: formData.stake2,
        // Fix these property names to match DB schema
        casaprot: formData.casaProt,
        cpfprot: formData.cpfProt,
        stakeprot: formData.stakeProt,
        // Add new protection fields
        casaprot2: formData.casaProt2,
        cpfprot2: formData.cpfProt2,
        stakeprot2: formData.stakeProt2,
        casaprot3: formData.casaProt3,
        cpfprot3: formData.cpfProt3,
        stakeprot3: formData.stakeProt3,
        casavencedora: formData.casaVencedora,
        cpfvencedor: formData.cpfVencedor,
        updated_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('betting_operation_details')
        .upsert(dbFormData, { onConflict: 'betting_operation_id,account_id' });
      
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
    if (!accountId) return; // Protect against undefined accounts
    
    setSelectedAccounts(prev => {
      if (prev.includes(accountId)) {
        // Remove from selection
        const newSelected = prev.filter(id => id !== accountId);
        
        // Also update forms if needed
        const newForms = { ...operationForms };
        delete newForms[accountId];
        setOperationForms(newForms);
        
        return newSelected;
      } else {
        // Add to selection and create form for this account
        setOperationForms(prev => ({
          ...prev,
          [accountId]: {
            id: accountId,
            status: status || 'Em Operação',
            casa1: '',
            cpf1: accountId,
            stake1: '',
            casa2: '',
            cpf2: '',
            stake2: '',
            casaProt: '',
            cpfProt: '',
            stakeProt: '',
            // Initialize new protection fields
            casaProt2: '',
            cpfProt2: '',
            stakeProt2: '',
            casaProt3: '',
            cpfProt3: '',
            stakeProt3: '',
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
          // Initialize new protection fields
          casaProt2: '',
          cpfProt2: '',
          stakeProt2: '',
          casaProt3: '',
          cpfProt3: '',
          stakeProt3: '',
          casaVencedora: '',
          cpfVencedor: ''
        }
      }), {});
      setOperationForms(newForms);
    }
  };

  const updateOperationForm = async (accountId: string, field: keyof OperationForm, value: string) => {
    setOperationForms(prev => {
      const updatedForm = {
        ...prev[accountId],
        [field]: value
      };
      
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
    
    if (field === 'status') {
      await saveBetData({ status: value });
    }
    
    if (accountId) {
      clearTimeout(window.updateTimeout);
      window.updateTimeout = setTimeout(() => {
        saveOperationData(accountId, operationForms[accountId]);
      }, 500);
    }
  };

  const handlePromotionChange = async (promotion: Promotion) => {
    try {
      console.log('Selecionando promoção:', promotion.name, promotion.id);
      
      setSelectedPromotion(promotion.name);
      setSelectedPromotionId(promotion.id);
      setIsPromotionOpen(false);
      
      const resultado = await saveBetData({ promotion_id: promotion.id });
      
      if (resultado) {
        console.log('Promoção salva com sucesso no banco de dados');
      }
    } catch (erro) {
      console.error('Erro ao selecionar promoção:', erro);
    }
  };

  const truncateName = (name: string) => {
    return name.length > 20 ? name.substring(0, 17) + '...' : name;
  };

  const roi = (profit / betAmount) * 100;
  
  const renderPromotionDropdown = () => {
    console.log('Rendering dropdown with:', {
      selectedPromotion,
      selectedPromotionId,
      loadingPromotions,
      promotionsAvailable: promotions.length
    });
    
    return (
      <div className="relative">
        <button
          onClick={() => setIsPromotionOpen(!isPromotionOpen)}
          className={`px-3 py-1 text-sm border rounded-lg ${selectedPromotionId ? 'bg-green-50 text-green-700' : 'text-gray-700'} hover:bg-gray-50 flex items-center gap-2`}
          disabled={isUpdating || loadingPromotions}
        >
          {loadingPromotions 
            ? 'Carregando...' 
            : (selectedPromotion 
              ? selectedPromotion 
              : `Selecione (ID: ${selectedPromotionId ? selectedPromotionId.substring(0,6)+'...' : 'nenhum'})`)}
          <ChevronDown className="w-4 h-4" />
        </button>
        {isPromotionOpen && !loadingPromotions && (
          <div className="absolute z-20 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200">
            <div className="py-1">
              {promotions.length > 0 ? (
                promotions.map((promotion) => (
                  <button
                    key={promotion.id}
                    onClick={() => handlePromotionChange(promotion)}
                    className={`w-full px-4 py-2 text-left text-sm ${
                      selectedPromotionId === promotion.id ? 'bg-green-50 text-green-800 font-medium' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {promotion.name}
                  </button>
                ))
              ) : (
                <div className="px-4 py-2 text-sm text-gray-500">
                  Nenhuma promoção disponível
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

// Função modificada para permitir duplicar usando a mesma conta
const duplicateOperation = async (sourceAccountId) => {
  setIsUpdating(true);
  
  try {
    // Get source form data to duplicate
    const sourceForm = operationForms[sourceAccountId];
    
    // Find an unused account to use for the duplicate
    const usedAccountIds = selectedAccounts;
    const availableAccounts = accounts.filter(account => 
      !usedAccountIds.includes(account.id)
    );
    
    if (availableAccounts.length === 0) {
      throw new Error("Não há contas disponíveis para duplicação. Todas as contas já estão em uso.");
    }
    
    // Use the first available account
    const newAccountId = availableAccounts[0].id;
    
    // Create a copy of the form data
    const newFormData = {
      ...sourceForm,
      id: newAccountId,
      cpf1: newAccountId // Update the CPF1 field to match the new account
    };
    
    // Insert new record with the different account_id
    const { data, error } = await supabase
      .from('betting_operation_details')
      .insert({
        betting_operation_id: id,
        account_id: newAccountId,
        casa1: newFormData.casa1,
        cpf1: newFormData.cpf1,
        stake1: newFormData.stake1,
        casa2: newFormData.casa2,
        cpf2: newFormData.cpf2,
        stake2: newFormData.stake2,
        casaprot: newFormData.casaProt,
        cpfprot: newFormData.cpfProt,
        stakeprot: newFormData.stakeProt,
        casaprot2: newFormData.casaProt2,
        cpfprot2: newFormData.cpfProt2,
        stakeprot2: newFormData.stakeProt2,
        casaprot3: newFormData.casaProt3,
        cpfprot3: newFormData.cpfProt3,
        stakeprot3: newFormData.stakeProt3,
        casavencedora: newFormData.casaVencedora,
        cpfvencedor: newFormData.cpfVencedor,
        updated_at: new Date().toISOString()
      });
    
    if (error) throw error;
    
    // Update local state
    setSelectedAccounts(prev => [...prev, newAccountId]);
    setOperationForms(prev => ({
      ...prev,
      [newAccountId]: newFormData
    }));
    
    // Reload operation details
    await loadOperationDetails();
    
    setUpdateStatus({
      show: true,
      success: true,
      message: 'Operação duplicada com sucesso!'
    });
    
    setTimeout(() => {
      setUpdateStatus(prev => ({ ...prev, show: false }));
    }, 3000);
    
  } catch (error) {
    console.error('Erro ao duplicar operação:', error);
    setUpdateStatus({
      show: true,
      success: false,
      message: 'Erro ao duplicar: ' + (error?.message || error?.toString() || 'Tente novamente')
    });
  } finally {
    setIsUpdating(false);
  }
};
  
const renderOperationForm = (accountId: string, index: number) => {
  const form = operationForms[accountId];

  // Always show field headers for each form (not just index 0)
  const renderFieldHeaders = () => (
    <>
      {/* Initial fields - Activation + First Protection */}
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
          <span className="text-sm font-medium text-gray-600">Casa Proteção 1</span>
        </div>
        <div className="col-span-1">
          <span className="text-sm font-medium text-gray-600">CPF Proteção 1</span>
        </div>
        <div className="col-span-1">
          <span className="text-sm font-medium text-gray-600">Stake Prot. 1</span>
        </div>
        <div className="col-span-1">
          <span className="text-sm font-medium text-gray-600">Casa Vencedora</span>
        </div>
        <div className="col-span-1">
          <span className="text-sm font-medium text-gray-600">CPF Vencedor</span>
        </div>
      </div>
    </>
  );

  return (
    <div key={accountId} className={`mb-2 ${index > 0 ? 'mt-2 pt-2 border-t border-gray-200' : ''}`}>
      {/* Add duplicate button at the top right of each form */}
      <div className="flex justify-between items-center mb-2">
        {/* <div className="text-sm font-medium text-gray-700">
          Account: {truncateName(accounts.find(acc => acc.id === accountId)?.name || accountId)}
        </div> */}
        <button
          onClick={() => duplicateOperation(accountId)}
          className="px-2 py-1 bg-blue-50 text-blue-600 rounded-md text-sm flex items-center gap-1 hover:bg-blue-100 transition-colors"
          disabled={isUpdating}
          title="Duplicar esta operação para outra conta"
        >
          <Plus className="w-4 h-4" /> Duplicar
        </button>
      </div>
      
      {/* Show field headers for all forms, not just the first one */}
      {renderFieldHeaders()}

      {/* Row 1: Original fields */}
      <div className="grid grid-cols-11 gap-4 mb-4">
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

      {/* Protection Fields Header - Show for all forms */}
      <div className="grid grid-cols-9 gap-4 mt-2 mb-2">
        <div className="col-span-1">
          <span className="text-sm font-medium text-gray-600">Casa Prot. 2</span>
        </div>
        <div className="col-span-1">
          <span className="text-sm font-medium text-gray-600">CPF Prot. 2</span>
        </div>
        <div className="col-span-1">
          <span className="text-sm font-medium text-gray-600">Stake Prot. 2</span>
        </div>
        <div className="col-span-1">
          <span className="text-sm font-medium text-gray-600">Casa Prot. 3</span>
        </div>
        <div className="col-span-1">
          <span className="text-sm font-medium text-gray-600">CPF Prot. 3</span>
        </div>
        <div className="col-span-1">
          <span className="text-sm font-medium text-gray-600">Stake Prot. 3</span>
        </div>
        <div className="col-span-3"></div>
      </div>

      {/* Row 2: Additional Protection Fields */}
      <div className="grid grid-cols-9 gap-4">
        {/* Protection 2 */}
        <div className="col-span-1">
          <select 
            className="w-full p-2 border rounded-md bg-white"
            value={form.casaProt2}
            onChange={(e) => updateOperationForm(accountId, 'casaProt2', e.target.value)}
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
            value={form.cpfProt2}
            onChange={(e) => updateOperationForm(accountId, 'cpfProt2', e.target.value)}
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
            value={form.stakeProt2}
            onChange={(e) => updateOperationForm(accountId, 'stakeProt2', e.target.value)}
            disabled={isUpdating}
          />
        </div>

        {/* Protection 3 */}
        <div className="col-span-1">
          <select 
            className="w-full p-2 border rounded-md bg-white"
            value={form.casaProt3}
            onChange={(e) => updateOperationForm(accountId, 'casaProt3', e.target.value)}
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
            value={form.cpfProt3}
            onChange={(e) => updateOperationForm(accountId, 'cpfProt3', e.target.value)}
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
            value={form.stakeProt3}
            onChange={(e) => updateOperationForm(accountId, 'stakeProt3', e.target.value)}
            disabled={isUpdating}
          />
        </div>

        {/* Empty space for alignment */}
        <div className="col-span-3"></div>
      </div>
    </div>
  );
};
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm mb-2 relative">
      {isUpdating && (
        <div className="absolute inset-0 bg-black bg-opacity-10 flex items-center justify-center rounded-lg z-30">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
        </div>
      )}
      
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
                Object.keys(operationForms).forEach(accountId => {
                  updateOperationForm(accountId, 'status', newStatus);
                });
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
            {renderPromotionDropdown()}
            <div className="relative">
            <button
  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
  className="px-3 py-1 text-sm border rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2"
  disabled={isUpdating || isLoading}
>
  <span>
    {isLoading ? 'Carregando...' : `CPFs (${selectedAccounts.length})`}
  </span>
  <ChevronDown className="w-4 h-4" />
</button>
{isDropdownOpen && (
  <div className="absolute z-20 mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200">
    <div className="p-2 border-b">
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={accounts.length > 0 && selectedAccounts.length === accounts.length}
          onChange={toggleAllAccounts}
          className="rounded border-gray-300"
          disabled={isUpdating || accountsLoading}
        />
        <span className="font-medium">Selecionar Todos</span>
      </label>
    </div>
    <div className="p-2 max-h-48 overflow-y-auto">
      {accountsLoading ? (
        <div className="text-center text-gray-500 py-2">Carregando contas...</div>
      ) : accounts.length === 0 ? (
        <div className="text-center text-gray-500 py-2">Nenhuma conta encontrada</div>
      ) : (
        accounts.map(account => (
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
        ))
      )}
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