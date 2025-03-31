import React, { useState, useEffect } from 'react';
import { Settings, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Bank {
  id: string;
  name: string;
  initialCapital: number;
  roi: number;
  grossProfit: number;
}

const MinhasBancas: React.FC = () => {
  const navigate = useNavigate();
  const [banks, setBanks] = useState<Bank[]>(() => {
    const saved = localStorage.getItem('banks');
    return saved ? JSON.parse(saved) : [];
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBank, setEditingBank] = useState<Bank | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    initialCapital: ''
  });

  useEffect(() => {
    localStorage.setItem('banks', JSON.stringify(banks));
  }, [banks]);

  // Format number to currency input
  const formatCurrencyInput = (value: string): string => {
    // Remove non-digit characters
    const numericValue = value.replace(/\D/g, "");
    
    if (numericValue === '') return '';
    
    // Convert to decimal (divide by 100)
    const floatValue = parseFloat(numericValue) / 100;
    
    // Format as Brazilian currency
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(floatValue);
  };

  // Parse currency string to number
  const parseCurrencyValue = (value: string): number => {
    // Remove currency symbol, spaces, and replace comma with dot
    return parseFloat(value.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
  };

  const handleCapitalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrencyInput(e.target.value);
    setFormData({ ...formData, initialCapital: formatted });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Parse the currency string to a number
    const capitalValue = parseCurrencyValue(formData.initialCapital);
    
    if (editingBank) {
      setBanks(banks.map(bank => 
        bank.id === editingBank.id 
          ? {
              ...bank,
              name: formData.name,
              initialCapital: capitalValue
            }
          : bank
      ));
    } else {
      const newBank: Bank = {
        id: Date.now().toString(),
        name: formData.name,
        initialCapital: capitalValue,
        roi: 0,
        grossProfit: 0
      };
      setBanks([...banks, newBank]);
    }

    setFormData({ name: '', initialCapital: '' });
    setIsModalOpen(false);
    setEditingBank(null);
  };

  const handleEdit = (e: React.MouseEvent, bank: Bank) => {
    e.stopPropagation(); // Prevent navigation when clicking the edit button
    setEditingBank(bank);
    
    // Format the number to currency for display in the form
    const formattedCapital = formatCurrencyInput((bank.initialCapital * 100).toString());
    
    setFormData({
      name: bank.name,
      initialCapital: formattedCapital
    });
    setIsModalOpen(true);
  };

  const handleCardClick = (bankId: string) => {
    navigate(`/?bank=${bankId}`);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const calculateOperatingCapital = (bank: Bank) => {
    return bank.initialCapital + bank.grossProfit;
  };

  return (
    <div className="flex-1 p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Minhas Bancas</h1>
        <button
          onClick={() => {
            setIsModalOpen(true);
            setFormData({ name: '', initialCapital: '' });
            setEditingBank(null);
          }}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
        >
          <Plus className="w-5 h-5 mr-2" />
          Adicionar Banca
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {banks.map(bank => (
          <div
            key={bank.id}
            onClick={() => handleCardClick(bank.id)}
            className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow duration-200"
          >
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-semibold text-gray-800">{bank.name}</h2>
              <button
                onClick={(e) => handleEdit(e, bank)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                title="Editar banca"
              >
                <Settings className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">ROI</p>
                <p className="text-lg font-bold text-blue-600">{bank.roi}%</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Lucro Bruto</p>
                <p className="text-lg font-bold text-green-600">
                  {formatCurrency(bank.grossProfit)}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Aporte</p>
                <p className="text-lg font-bold text-purple-600">
                  {formatCurrency(bank.initialCapital)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Capital em Operação</p>
                <p className="text-lg font-bold text-indigo-600">
                  {formatCurrency(calculateOperatingCapital(bank))}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">
              {editingBank ? 'Editar Banca' : 'Nova Banca'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome da Banca
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Capital Inicial
                </label>
                <input
                  type="text"
                  value={formData.initialCapital}
                  onChange={handleCapitalChange}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="R$ 0,00"
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingBank(null);
                    setFormData({ name: '', initialCapital: '' });
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MinhasBancas;