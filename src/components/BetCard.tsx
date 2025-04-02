import React, { useState, useEffect } from 'react';
import { Check, Trash2, FileDown, Plus, Eye, EyeOff, Search, Upload, MessageCircle, Building2, ChevronDown, ChevronRight, Minus } from 'lucide-react';
import { useAccounts } from '../hooks/useAccounts';
import { useBettingHouses } from '../hooks/useBettingHouses';
import { formatCurrency } from '../utils/currency';

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
}

interface DayCardProps {
  date: string;
  bets: BetCardProps[];
}

interface MonthlyCardProps {
  month: string;
  days: DayCardProps[];
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
  const [monthName, yearStr] = monthStr.split(' ');
  const monthMap: { [key: string]: number } = {
    'Janeiro': 0, 'Fevereiro': 1, 'Março': 2, 'Abril': 3,
    'Maio': 4, 'Junho': 5, 'Julho': 6, 'Agosto': 7,
    'Setembro': 8, 'Outubro': 9, 'Novembro': 10, 'Dezembro': 11
  };
  
  const year = parseInt(yearStr);
  const month = monthMap[monthName];
  
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  const days: Date[] = [];
  for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d));
  }
  
  return days;
}

export const MonthlyBetCard: React.FC<MonthlyCardProps> = ({ month, days }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDetails, setShowDetails] = useState(true);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  // Get all days in the month as Date objects
  const allDaysInMonth = getDaysInMonth(month);
  
  // Create a map of all days data using the date as key
  const daysMap = new Map(days.map(day => {
    // Ensure we're dealing with a consistent date format
    return [day.date, day];
  }));

  // Create a complete array of all days in the month with data
  const completeDays = allDaysInMonth.map(date => {
    const dateStr = formatDateToString(date);
    return daysMap.get(dateStr) || {
      date: dateStr,
      bets: []
    };
  });

  // Calculate totals for the month
  const totalBetAmount = days.reduce((sum, day) => 
    sum + day.bets.reduce((daySum, bet) => daySum + bet.betAmount, 0), 0);
  const totalResult = days.reduce((sum, day) => 
    sum + day.bets.reduce((daySum, bet) => daySum + bet.result, 0), 0);
  const totalProfit = days.reduce((sum, day) => 
    sum + day.bets.reduce((daySum, bet) => daySum + bet.profit, 0), 0);
  const roi = totalBetAmount > 0 ? (totalProfit / totalBetAmount) * 100 : 0;

  // Get bets for the expanded day
  const expandedDayBets = expandedDay ? 
    (daysMap.get(expandedDay)?.bets || []) : 
    [];

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

  const updateOperationForm = (accountId: string, field: keyof OperationForm, value: string) => {
    setOperationForms(prev => ({
      ...prev,
      [accountId]: {
        ...prev[accountId],
        [field]: value
      }
    }));
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
            />
          </div>

          <div className="col-span-1">
            <select 
              className="w-full p-2 border rounded-md bg-white"
              value={form.casa2}
              onChange={(e) => updateOperationForm(accountId, 'casa2', e.target.value)}
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
            />
          </div>

          <div className="col-span-1">
            <select 
              className="w-full p-2 border rounded-md bg-white"
              value={form.casaProt}
              onChange={(e) => updateOperationForm(accountId, 'casaProt', e.target.value)}
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
            />
          </div>

          <div className="col-span-1">
            <select 
              className={`w-full p-2 border rounded-md ${
                form.casaVencedora ? 'bg-green-50' : 'bg-white'
              }`}
              value={form.casaVencedora || ''}
              onChange={(e) => updateOperationForm(accountId, 'casaVencedora', e.target.value)}
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
    <div className="bg-white p-4 rounded-lg shadow-sm mb-2">
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
              }}
              className={`px-3 py-1 rounded-lg text-sm ${
                statusOptions.find(opt => opt.value === (operationForms[Object.keys(operationForms)[0]]?.status || status))?.color || 'bg-blue-100 text-blue-800'
              }`}
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
                        onClick={() => {
                          setSelectedPromotion(promotion);
                          setIsPromotionOpen(false);
                        }}
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
          </div>
        </div>
      )}
    </div>
  );
};