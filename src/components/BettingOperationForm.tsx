import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, Calendar, Clock, DollarSign, Building2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useBanks } from '../hooks/useBanks';

interface BettingOperationFormProps {
  onClose: () => void;
  onSuccess: () => void;
  selectedBank?: string;
  banks?: any[];
}

export const BettingOperationForm: React.FC<BettingOperationFormProps> = ({
  onClose,
  onSuccess,
  selectedBank,
  banks: propBanks
}) => {
  const { banks: hookBanks, loading: loadingBanks } = propBanks ? { banks: propBanks, loading: false } : useBanks();
  const banks = propBanks || hookBanks;
  
  const [bettingHouses, setBettingHouses] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Removed step state since we'll use a single-step form
  const [error, setError] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    game_name: '',
    house1_id: '',
    house2_id: '',
    bet_amount: '',
    result: '',
    profit: '',
    status: 'pending',
    promotion_type: '',
    bank_id: selectedBank || '',
    user_id: '',
    // Keeping accounts structure for API compatibility, but we won't show this step
    accounts: [{ account_id: '', betting_house_id: '', stake: '', role: 'normal', is_winner: false }]
  });

  useEffect(() => {
    const initializeData = async () => {
      await getCurrentUser(); // Get user ID first
      if (userId) {
        fetchBettingHouses();
      }
    };
    
    initializeData();
  }, []);

  // Add a dependency effect to trigger data fetching when userId changes
  useEffect(() => {
    if (userId) {
      fetchBettingHouses();
    }
  }, [userId]);

  useEffect(() => {
    // Update bank_id when selectedBank changes
    if (selectedBank && selectedBank !== formData.bank_id) {
      setFormData(prev => ({ ...prev, bank_id: selectedBank }));
    }
  }, [selectedBank]);

  // Currency formatting function
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

  // Get the current authenticated user's ID
  const getCurrentUser = async () => {
    try {
      // Get user from Supabase auth
      const { data, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('Error getting user:', error);
        return;
      }
      
      if (data && data.user) {
        const currentUserId = data.user.id;
        setUserId(currentUserId);
        setFormData(prev => ({ ...prev, user_id: currentUserId }));
      }
    } catch (err) {
      console.error('Error fetching current user:', err);
    }
  };

  const fetchBettingHouses = async () => {
    try {
      // Wait until we have a userId before fetching
      if (!userId) return;
      
      const { data, error } = await supabase
        .from('betting_houses')
        .select('*')
        .order('name');
  
      if (error) throw error;
      setBettingHouses(data || []);
      
      // Define initial houses if they exist
      if (data && data.length >= 2) {
        setFormData(prev => ({
          ...prev,
          house1_id: data[0].id,
          house2_id: data[1].id
        }));
      }
    } catch (error) {
      console.error('Error fetching betting houses:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleCurrencyInput = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    let rawValue = e.target.value.replace(/\D/g, ""); // remove everything that's not a number
  
    if (!rawValue) rawValue = "0";
  
    const number = parseFloat(rawValue) / 100;
    const formattedValue = number.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  
    // Store the formatted value in the state (visual)
    setFormData(prev => {
      const updatedData = {
        ...prev,
        [field]: formattedValue,
      };
      
      // Automatically calculate profit when bet_amount or result changes
      if (field === 'bet_amount' || field === 'result') {
        const betAmount = parseCurrencyValue(field === 'bet_amount' ? formattedValue : prev.bet_amount);
        const result = parseCurrencyValue(field === 'result' ? formattedValue : prev.result);
        
        if (!isNaN(betAmount) && !isNaN(result)) {
          const profit = result - betAmount;
          updatedData.profit = profit.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          });
        }
      }
      
      return updatedData;
    });
  };

  // Function to get numeric value from currency input
  const parseCurrencyValue = (value: string): number => {
    if (!value) return 0;
    // Remove currency symbol and convert comma to dot for decimal
    return parseFloat(value.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
  };

  const validate = (): boolean => {
    if (!formData.date) {
      setError('Data da operação é obrigatória');
      return false;
    }
    if (!formData.game_name) {
      setError('Nome do jogo é obrigatório');
      return false;
    }
    if (!formData.house1_id) {
      setError('Casa de apostas 1 é obrigatória');
      return false;
    }
    if (!formData.house2_id) {
      setError('Casa de apostas 2 é obrigatória');
      return false;
    }
    if (!formData.bet_amount) {
      setError('Valor da aposta é obrigatório');
      return false;
    }
    if (!formData.result) {
      setError('Resultado é obrigatório');
      return false;
    }
    
    setError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setIsSubmitting(true);
    
    try {
      // Parse currency values
      const bet_amount = parseCurrencyValue(formData.bet_amount);
      const result = parseCurrencyValue(formData.result);
      const profit = parseCurrencyValue(formData.profit);
      
      // Ensure we have the user_id
      if (!formData.user_id) {
        const { data: userData } = await supabase.auth.getUser();
        if (userData && userData.user) {
          formData.user_id = userData.user.id;
        } else {
          throw new Error('User ID not available');
        }
      }
      
      // Create operation - Include user_id
      const { data, error } = await supabase
        .from('betting_operations')
        .insert([{
          date: formData.date,
          time: formData.time,
          game_name: formData.game_name,
          house1_id: formData.house1_id,
          house2_id: formData.house2_id,
          bet_amount,
          result,
          profit,
          status: formData.status,
          promotion_type: formData.promotion_type || null,
          bank_id: formData.bank_id,
          user_id: formData.user_id
        }])
        .select()
        .single();
      
      if (error) {
        console.error('Erro ao inserir operação:', error);
        throw error;
      }
      
      // Update bank profit and ROI if a bank is selected
      if (formData.bank_id) {
        const { data: bankData, error: bankError } = await supabase
          .from('banks')
          .select('gross_profit, initial_capital, user_id')
          .eq('id', formData.bank_id)
          .single();
        
        if (bankError) {
          console.error('Erro ao buscar dados da banca:', bankError);
          throw bankError;
        }
        
        // Only update the bank if it belongs to the current user
        if (bankData && bankData.user_id === userId) {
          const newProfit = bankData.gross_profit + profit;
          const newRoi = (newProfit / bankData.initial_capital) * 100;
          
          const { error: updateError } = await supabase
            .from('banks')
            .update({ 
              gross_profit: newProfit,
              roi: newRoi
            })
            .eq('id', formData.bank_id)
            .eq('user_id', userId); // Additional safety check
          
          if (updateError) {
            console.error('Erro ao atualizar banca:', updateError);
            throw updateError;
          }
        }
      }
      
      onSuccess();
    } catch (error) {
      console.error('Error submitting operation:', error);
      setError('Erro ao salvar operação. Por favor, tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center overflow-y-auto py-8">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-xl mx-4 relative">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Registrar Nova Operação</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 text-red-600 text-sm rounded-md">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    className="pl-10 w-full p-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hora
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="time"
                    name="time"
                    value={formData.time}
                    onChange={handleChange}
                    className="pl-10 w-full p-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Banca
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <select
                  name="bank_id"
                  value={formData.bank_id}
                  onChange={handleChange}
                  className="pl-10 w-full p-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Selecione uma banca</option>
                  {banks.map(bank => (
                    <option key={bank.id} value={bank.id}>
                      {bank.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome do Jogo/Aposta
              </label>
              <input
                type="text"
                name="game_name"
                value={formData.game_name}
                onChange={handleChange}
                placeholder="Ex: Barcelona vs Real Madrid"
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Casa de Aposta 1
                </label>
                <select
                  name="house1_id"
                  value={formData.house1_id}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Selecione</option>
                  {bettingHouses.map(house => (
                    <option key={house.id} value={house.id}>
                      {house.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Casa de Aposta 2
                </label>
                <select
                  name="house2_id"
                  value={formData.house2_id}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Selecione</option>
                  {bettingHouses.map(house => (
                    <option key={house.id} value={house.id}>
                      {house.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valor da Aposta
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={formData.bet_amount}
                    onChange={(e) => handleCurrencyInput(e, 'bet_amount')}
                    placeholder="R$ 0,00"
                    className="pl-10 w-full p-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Resultado
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={formData.result}
                    onChange={(e) => handleCurrencyInput(e, 'result')}
                    placeholder="R$ 0,00"
                    className="pl-10 w-full p-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lucro
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={formData.profit}
                  readOnly
                  className="pl-10 w-full p-2 border border-gray-300 rounded-md bg-gray-50"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              >
                <option value="pending">Pendente</option>
                <option value="won">Ganha</option>
                <option value="lost">Perdida</option>
                <option value="refunded">Reembolsada</option>
                <option value="cashout">Cashout</option>
                <option value="canceled">Cancelada</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Promoção (opcional)
              </label>
              <input
                type="text"
                name="promotion_type"
                value={formData.promotion_type}
                onChange={handleChange}
                placeholder="Ex: Odds Aumentadas, Seguro"
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
          
          <div className="flex justify-end mt-6">
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Salvando...' : 'Registrar Operação'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};