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

interface Bank {
  id: string;
  name: string;
  initialCapital: number;
  roi: number;
  grossProfit: number;
}

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

const Dashboard = () => {
  const [selectedBank, setSelectedBank] = useState<string>('');
  const [banks, setBanks] = useState<Bank[]>(() => {
    const saved = localStorage.getItem('banks');
    return saved ? JSON.parse(saved) : [];
  });
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

  useEffect(() => {
    fetchBettingHouses();
  }, []);

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

  // Sample data for the chart
  const [profitData] = useState({
    labels: [], // We'll hide these labels
    datasets: [
      {
        label: 'Lucro Diário',
        data: [
          { x: '2024-03-01', y: 1500, bets: 5, accounts: 3, investment: 10000 },
          { x: '2024-03-02', y: 2300, bets: 8, accounts: 4, investment: 10000 },
          { x: '2024-03-03', y: 3100, bets: 6, accounts: 3, investment: 10000 },
          { x: '2024-03-04', y: 2800, bets: 7, accounts: 5, investment: 10000 },
          { x: '2024-03-05', y: 3800, bets: 9, accounts: 4, investment: 10000 },
          { x: '2024-03-06', y: 4200, bets: 8, accounts: 6, investment: 10000 },
          { x: '2024-03-07', y: 4900, bets: 10, accounts: 5, investment: 10000 }
        ],
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
  });

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
        max: 5000,
        suggestedMin: 0,
        suggestedMax: 5000
      }
    }
  };

  // Calculate metrics
  const todayData = profitData.datasets[0].data[profitData.datasets[0].data.length - 1];
  
  const todayBets = todayData.bets;
  const todayBetsAverage = todayData.y / todayBets;
  const todayProfit = todayData.y;
  const roi = (todayData.y / todayData.investment) * 100;
  const profitPerAccount = todayData.y / todayData.accounts;

  const handleBankChange = (bankId: string) => {
    setSelectedBank(bankId);
    // Here you would fetch and update the dashboard data based on the selected bank
  };

  const handleFilterSubmit = () => {
    // Here you would apply the filters and update the data
    console.log('Applying filters:', filters);
    setShowFilters(false);
  };

  // Sample data organized by month and day
  const sampleBetsByMonth = [
    {
      month: 'Março 2024',
      days: [
        {
          date: '23 de Março',
          bets: [
            {
              date: '23/03/2024',
              time: '15:30',
              gameName: 'Manchester City vs Arsenal',
              house1: 'bet365',
              house2: 'Betano',
              betAmount: 1000,
              result: 1200,
              profit: 200
            },
            {
              date: '23/03/2024',
              time: '16:45',
              gameName: 'PSG vs Lyon',
              house1: 'Betano',
              house2: 'bet365',
              betAmount: 800,
              result: 750,
              profit: -50
            }
          ]
        },
        {
          date: '22 de Março',
          bets: [
            {
              date: '22/03/2024',
              time: '16:30',
              gameName: 'Liverpool vs Chelsea',
              house1: 'bet365',
              house2: 'Betano',
              betAmount: 1200,
              result: 1000,
              profit: -200
            }
          ]
        }
      ]
    },
    {
      month: 'Fevereiro 2024',
      days: [
        {
          date: '15 de Fevereiro',
          bets: [
            {
              date: '15/02/2024',
              time: '16:30',
              gameName: 'Real Madrid vs Barcelona',
              house1: 'bet365',
              house2: 'Betano',
              betAmount: 1500,
              result: 1800,
              profit: 300
            }
          ]
        },
        {
          date: '10 de Fevereiro',
          bets: [
            {
              date: '10/02/2024',
              time: '14:00',
              gameName: 'Liverpool vs Chelsea',
              house1: 'Betano',
              house2: 'bet365',
              betAmount: 1200,
              result: 1000,
              profit: -200
            }
          ]
        }
      ]
    }
  ];

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
              <option value="">Selecione uma banca</option>
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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-3 mb-4">
        <div className="bg-white rounded-lg shadow-sm p-2.5 border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <span className="text-gray-500 text-xs font-medium">Apostas</span>
                <span className="text-gray-400 text-[10px] hidden sm:inline">
                  (Média: {todayBetsAverage.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})
                </span>
              </div>
              <div className="text-lg font-bold text-gray-800 mt-0.5">
                {todayBets} apostas
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
                {todayProfit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
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
                {roi.toFixed(2)}%
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
                <span className="text-gray-400 text-[10px] hidden sm:inline">({todayData.accounts} contas)</span>
              </div>
              <div className="text-lg font-bold text-gray-800 mt-0.5">
                {profitPerAccount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
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
          <Line data={profitData} options={options} />
        </div>
      </div>

      {/* Monthly Bet Cards */}
      <div className="space-y-4">
        {sampleBetsByMonth.map((monthData, index) => (
          <MonthlyBetCard
            key={index}
            month={monthData.month}
            days={monthData.days}
          />
        ))}
      </div>

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
            // Refresh data after successful operation creation
            // You would implement this based on your data fetching logic
          }}
        />
      )}
    </div>
  );
};

export default Dashboard;