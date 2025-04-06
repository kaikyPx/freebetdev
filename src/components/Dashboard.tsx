import React, { useState, useEffect } from 'react';
import { Plus, TrendingUp, DollarSign, Percent, Calendar, Building2, Filter, X } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { supabase } from '../lib/supabase';
import { MonthlyBetCard } from './BetCard';
import { BettingOperationForm } from './BettingOperationForm';
import { useBanks } from '../hooks/useBanks';
import { useBettingOperations } from '../hooks/useBettingOperations';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
);

interface Filters {
  startDate: string;
  endDate: string;
  title: string;
  status: string;
  sport: string;
  bettingHouse: string;
}

const statusOptions = [
  { value: 'all', label: 'Todos' },
  { value: 'pending', label: 'Pendente' },
  { value: 'won', label: 'Ganha' },
  { value: 'lost', label: 'Perdida' },
  { value: 'refunded', label: 'Reembolsada' },
  { value: 'cashout', label: 'Cashout' },
  { value: 'canceled', label: 'Cancelado' }
];

const sportOptions = [
  { value: 'football', label: 'Futebol' },
  { value: 'basketball', label: 'Basquete' },
  { value: 'tennis', label: 'Tênis' },
  { value: 'volleyball', label: 'Vôlei' },
  { value: 'hockey', label: 'Hóquei' },
  { value: 'table-tennis', label: 'Tênis de Mesa' },
  { value: 'esports', label: 'E-Sports' },
  { value: 'others', label: 'Outros' }
];

interface DashboardProps {
  user: { id: string; email: string } | null;
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  // Use os hooks personalizados para obter os dados do Supabase
  const { banks, loading: loadingBanks } = useBanks();
  const { operations, monthlySummaries, loading: loadingOperations } = useBettingOperations();
  
  const [selectedBank, setSelectedBank] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [showOperationForm, setShowOperationForm] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    title: '',
    status: 'all',
    sport: 'all',
    bettingHouse: 'all'
  });
  const [bettingHouses, setBettingHouses] = useState<Array<{ id: string; name: string }>>([]);
  const [dashboardData, setDashboardData] = useState({
    todayBets: 0,
    todayBetsAverage: 0,
    todayProfit: 0,
    roi: 0,
    profitPerAccount: 0,
    accountsUsed: 0,
    totalInvestment: 0,
    profitData: {
      labels: [] as string[],
      datasets: [
        {
          label: 'Lucro Diário',
          data: [] as any[],
          fill: true,
          borderColor: '#2563eb',
          backgroundColor: (context: any) => {
            const ctx = context.chart.ctx;
            const gradient = ctx.createLinearGradient(0, 0, 0, 300);
            gradient.addColorStop(0, 'rgba(37, 99, 235, 0.2)');
            gradient.addColorStop(1, 'rgba(37, 99, 235, 0)');
            return gradient;
          },
          tension: 0.4,
          pointRadius: 6,
          pointBackgroundColor: '#2563eb',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointHoverRadius: 8,
          pointHoverBackgroundColor: '#1d4ed8',
          pointHoverBorderColor: '#fff',
          pointHoverBorderWidth: 3,
          borderWidth: 3
        }
      ]
    }
  });

  useEffect(() => {
    fetchBettingHouses();
  }, []);

  // Atualiza os dados da dashboard quando mudar o banco selecionado
  // ou quando os dados de operações forem carregados
  useEffect(() => {
    if (loadingOperations) return;
    
    // Se um banco estiver selecionado, filtra as operações para esse banco
    // Caso contrário, usa todas as operações
    updateDashboardData();
  }, [selectedBank, operations, loadingOperations]);

  const fetchBettingHouses = async () => {
    try {
      const { data, error } = await supabase
        .from('betting_houses')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setBettingHouses(data || []);
    } catch (error) {
      console.error('Error fetching betting houses:', error);
    }
  };

  const updateDashboardData = () => {
    // Filtra operações pelo banco selecionado se necessário
    const filteredOperations = selectedBank 
      ? operations.filter(op => op.bank_id === selectedBank) 
      : operations;
    
    // Organiza as operações por data
    const sortedOperations = [...filteredOperations].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    // Agrega os dados para o gráfico (últimos 7 dias ou menos)
    const last7DaysData: any[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Cria entradas para os últimos 7 dias
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      
      // Filtra operações para esta data
      const dayOperations = sortedOperations.filter(op => op.date === dateString);
      
      // Calcula métricas para o dia
      const dayBets = dayOperations.length;
      const dayBetAmount = dayOperations.reduce((sum, op) => sum + op.bet_amount, 0);
      const dayResult = dayOperations.reduce((sum, op) => sum + op.result, 0);
      const dayProfit = dayOperations.reduce((sum, op) => sum + op.profit, 0);
      
      // Determina quantas contas únicas foram usadas neste dia
      const uniqueAccounts = new Set();
      dayOperations.forEach(op => {
        // Presumimos que há uma tabela de relacionamento operation_accounts
        // que liga operações às contas usadas
        // Como não temos acesso direto a isso aqui, usamos um valor estimado
        uniqueAccounts.add(op.id); // Substitua por lógica real se possível
      });
      
      last7DaysData.push({
        x: dateString,
        y: dayProfit,
        bets: dayBets,
        accounts: uniqueAccounts.size || 1, // Evitar divisão por zero
        investment: dayBetAmount
      });
    }
    
    // Calcula métricas totais
    const todayData = last7DaysData[last7DaysData.length - 1] || { y: 0, bets: 0, accounts: 1, investment: 0 };
    const todayBets = todayData.bets;
    const todayBetsAverage = todayData.bets > 0 ? todayData.y / todayData.bets : 0;
    const todayProfit = todayData.y;
    const roi = todayData.investment > 0 ? (todayData.y / todayData.investment) * 100 : 0;
    const profitPerAccount = todayData.accounts > 0 ? todayData.y / todayData.accounts : 0;
    
    // Atualiza o estado da dashboard
    setDashboardData({
      todayBets,
      todayBetsAverage,
      todayProfit,
      roi,
      profitPerAccount,
      accountsUsed: todayData.accounts,
      totalInvestment: todayData.investment,
      profitData: {
        labels: last7DaysData.map(d => d.x),
        datasets: [
          {
            ...dashboardData.profitData.datasets[0],
            data: last7DaysData
          }
        ]
      }
    });
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        padding: 12,
        titleFont: {
          size: 14,
          weight: 'bold',
          family: "'Inter', sans-serif"
        },
        bodyFont: {
          size: 14,
          family: "'Inter', sans-serif"
        },
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        callbacks: {
          title: (context: any) => {
            const date = new Date(context[0].raw.x);
            return date.toLocaleDateString('pt-BR', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            });
          },
          label: (context: any) => {
            return `Lucro: ${context.raw.y.toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL'
            })}`;
          }
        }
      }
    },
    scales: {
      x: {
        display: false
      },
      y: {
        border: {
          display: false
        },
        grid: {
          color: 'rgba(226, 232, 240, 0.5)',
          drawBorder: false
        },
        beginAtZero: true,
        ticks: {
          padding: 10,
          font: {
            size: 12,
            family: "'Inter', sans-serif"
          },
          callback: (value: number) => {
            return value.toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL'
            });
          },
          stepSize: 1000
        },
        min: 0,
        max: Math.max(5000, ...dashboardData.profitData.datasets[0].data.map((d: any) => d.y || 0)),
        suggestedMin: 0,
        suggestedMax: Math.max(5000, ...dashboardData.profitData.datasets[0].data.map((d: any) => d.y || 0))
      }
    }
  };

  const handleBankChange = (bankId: string) => {
    setSelectedBank(bankId);
    // A atualização dos dados é feita pelo useEffect
  };

  const handleFilterSubmit = () => {
    // Aqui você aplicaria os filtros e atualizaria os dados
    console.log('Applying filters:', filters);
    setShowFilters(false);
    // Implemente a lógica de filtro aqui
  };

  // Organiza os dados por mês e dia para exibição

const organizeBetsByMonth = () => {
  const months: Record<string, any> = {};
  
  // Log para debugging
  console.log("Organizando operações:", operations.length, "operações");
  
  // Percorre todas as operações e organiza por mês e dia
  operations.forEach(op => {
    // Se um banco estiver selecionado e não for o mesmo, pula
    if (selectedBank && op.bank_id !== selectedBank) return;
    
    try {
      // Cria um objeto Date a partir da data da operação
      const date = new Date(op.date);
      
      // Verifica se a data é válida
      if (isNaN(date.getTime())) {
        console.error("Data inválida:", op.date);
        return;
      }
      
      // Cria a chave para o mês no formato "Abril 2025" (sem o "de")
      const monthKey = date.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })
                          .replace(' de ', ' '); // Remove o "de" se existir
      
      // Formata a data no padrão DD/MM/YYYY para consistência
      const dayKey = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
      
      // Inicializa o mês se ainda não existir
      if (!months[monthKey]) {
        months[monthKey] = {
          month: monthKey,
          days: {}
        };
      }
      
      // Inicializa o dia se ainda não existir
      if (!months[monthKey].days[dayKey]) {
        months[monthKey].days[dayKey] = {
          date: dayKey, // Usa o formato consistente DD/MM/YYYY
          bets: []
        };
      }
      
      // Busca os nomes das casas de apostas
      const house1 = bettingHouses.find(h => h.id === op.house1_id)?.name || op.house1_id;
      const house2 = bettingHouses.find(h => h.id === op.house2_id)?.name || op.house2_id;
      
      // Adiciona a aposta ao dia
      months[monthKey].days[dayKey].bets.push({
        id: op.id,
        date: dayKey, // Formato consistente DD/MM/YYYY
        time: op.time || '00:00',
        gameName: op.game_name || 'Sem nome',
        house1: house1,
        house2: house2,
        betAmount: op.bet_amount || 0,
        result: op.result || 0,
        profit: op.profit || 0,
        status: op.status || 'Pendente'
      });
    } catch (e) {
      console.error("Erro ao processar operação:", e, op);
    }
  });
  
  // Converte o objeto para o formato array esperado pelo componente
  const monthsArray = Object.values(months).map(month => {
    // Converte o objeto de dias para um array
    const daysArray = Object.values(month.days);
    
    // Retorna o mês com o array de dias
    return {
      month: month.month,
      days: daysArray
    };
  });
  
  console.log("Meses organizados:", monthsArray);
  return monthsArray;
};

  const betsByMonth = organizeBetsByMonth();

  return (
    <div className="flex-1 p-4 lg:p-6 bg-gray-50">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-gray-800">Operações</h1>
            <p className="text-gray-600 text-xs lg:text-sm">Acompanhamento de resultados diários</p>
          </div>
          <div className="relative flex-1 sm:flex-none">
            <select
              className="pl-10 p-2 border border-gray-300 rounded-md bg-white min-w-[200px] w-full sm:w-auto"
              value={selectedBank}
              onChange={(e) => handleBankChange(e.target.value)}
            >
              <option value="">Todas as bancas</option>
              {banks.map(bank => (
                <option key={bank.id} value={bank.id}>
                  {bank.name}
                </option>
              ))}
            </select>
            <Building2 className="absolute left-2 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(true)}
            className="flex items-center px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Filter className="w-5 h-5 mr-2" />
            Filtros
          </button>
          <button
            onClick={() => setShowOperationForm(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-sm hover:shadow-md"
          >
            <Plus className="w-4 h-4 mr-2" />
            Registrar Operação
          </button>
        </div>
      </div>

      {loadingBanks || loadingOperations ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-3 mb-4">
            <div className="bg-white rounded-lg shadow-sm p-2.5 border border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <div className="flex items-center gap-1">
                    <span className="text-gray-500 text-xs font-medium">Apostas</span>
                    <span className="text-gray-400 text-[10px] hidden sm:inline">
                      (Média: {dashboardData.todayBetsAverage.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})
                    </span>
                  </div>
                  <div className="text-lg font-bold text-gray-800 mt-0.5">
                    {dashboardData.todayBets} apostas
                  </div>
                </div>
                <div className="bg-blue-100 p-1.5 rounded-lg">
                  <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-2.5 border border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <div className="flex items-center gap-1">
                    <span className="text-gray-500 text-xs font-medium">Lucro</span>
                    <span className="text-gray-400 text-[10px] hidden sm:inline">(Hoje)</span>
                  </div>
                  <div className="text-lg font-bold text-gray-800 mt-0.5">
                    {dashboardData.todayProfit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </div>
                </div>
                <div className="bg-green-100 p-1.5 rounded-lg">
                  <DollarSign className="w-3.5 h-3.5 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-2.5 border border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <div className="flex items-center gap-1">
                    <span className="text-gray-500 text-xs font-medium">ROI</span>
                    <span className="text-gray-400 text-[10px] hidden sm:inline">(Retorno)</span>
                  </div>
                  <div className="text-lg font-bold text-gray-800 mt-0.5">
                    {dashboardData.roi.toFixed(2)}%
                  </div>
                </div>
                <div className="bg-purple-100 p-1.5 rounded-lg">
                  <Percent className="w-3.5 h-3.5 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-2.5 border border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <div className="flex items-center gap-1">
                    <span className="text-gray-500 text-xs font-medium">Média por CPF</span>
                    <span className="text-gray-400 text-[10px] hidden sm:inline">({dashboardData.accountsUsed} contas)</span>
                  </div>
                  <div className="text-lg font-bold text-gray-800 mt-0.5">
                    {dashboardData.profitPerAccount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </div>
                </div>
                <div className="bg-orange-100 p-1.5 rounded-lg">
                  <Calendar className="w-3.5 h-3.5 text-orange-600" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-3 lg:p-4 border border-gray-100 mb-4">
            <div className="h-[300px]">
              <Line data={dashboardData.profitData} options={options} />
            </div>
          </div>

          {/* Monthly Bet Cards */}
          <div className="space-y-4">
            {betsByMonth.length > 0 ? (
              betsByMonth.map((monthData, index) => (
                <MonthlyBetCard
                  key={index}
                  month={monthData.month}
                  days={monthData.days}
                  onEditBet={(betId) => {
                    console.log('Editar aposta:', betId);
                    // Implementar lógica de edição
                  }}
                />
              ))
            ) : (
              <div className="text-center py-8 bg-white rounded-lg shadow-sm p-6">
                <p className="text-gray-600">Nenhuma operação encontrada</p>
                <button
                  onClick={() => setShowOperationForm(true)}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Registrar sua primeira operação
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Filters Sidebar */}
      {showFilters && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
          <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-lg">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold">Filtros</h3>
              <button
                onClick={() => setShowFilters(false)}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data Início
                </label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  className="w-full p-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data Final
                </label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  className="w-full p-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Título da Aposta
                </label>
                <input
                  type="text"
                  value={filters.title}
                  onChange={(e) => setFilters({ ...filters, title: e.target.value })}
                  placeholder="Buscar por título"
                  className="w-full p-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="w-full p-2 border rounded-md"
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Esporte
                </label>
                <select
                  value={filters.sport}
                  onChange={(e) => setFilters({ ...filters, sport: e.target.value })}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="all">Todos</option>
                  {sportOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Casa de Aposta
                </label>
                <select
                  value={filters.bettingHouse}
                  onChange={(e) => setFilters({ ...filters, bettingHouse: e.target.value })}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="all">Todas</option>
                  {bettingHouses.map(house => (
                    <option key={house.id} value={house.id}>
                      {house.name}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleFilterSubmit}
                className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
              >
                Filtrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Operation Form Modal */}
      {showOperationForm && (
        <BettingOperationForm
          onClose={() => setShowOperationForm(false)}
          onSuccess={() => {
            // Atualizar os dados após registrar uma operação bem-sucedida
            updateDashboardData();
            setShowOperationForm(false);
          }}
          selectedBank={selectedBank}
          banks={banks}
        />
      )}
    </div>
  );
};

export default Dashboard;