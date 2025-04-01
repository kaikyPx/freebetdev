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
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  
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
    accounts: [{ account_id: '', betting_house_id: '', stake: '', role: 'normal', is_winner: false }]
  });

  useEffect(() => {
    fetchBettingHouses();
    fetchAccounts();
  }, []);

  useEffect(() => {
    // Atualiza bank_id quando selectedBank muda
    if (selectedBank && selectedBank !== formData.bank_id) {
      setFormData(prev => ({ ...prev, bank_id: selectedBank }));
    }
  }, [selectedBank]);

  const fetchBettingHouses = async () => {
    try {
      const { data, error } = await supabase
        .from('betting_houses')
        .select('*')
        .order('name');

      if (error) throw error;
      setBettingHouses(data || []);
      
      // Define casas iniciais se existirem
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

  const fetchAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .order('name');

      if (error) throw error;
      setAccounts(data || []);
      
      // Define conta inicial se existir
      if (data && data.length > 0) {
        setFormData(prev => ({
          ...prev,
          accounts: [{ 
            ...prev.accounts[0], 
            account_id: data[0].id 
          }]
        }));
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Função corrigida para formatar valores monetários
  const handleCurrencyInput = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    // Armazena a posição do cursor antes da atualização
    const cursorPosition = e.target.selectionStart;
    
    // Remove caracteres não numéricos (exceto vírgula e ponto)
    const input = e.target.value;
    const numericString = input.replace(/[^\d,.]/g, '');
    
    // Converte para um formato que possa ser parseado para número
    const normalizedValue = numericString.replace(/\./g, '').replace(',', '.');
    
    // Tenta converter para número
    const numericValue = parseFloat(normalizedValue);
    
    if (!isNaN(numericValue)) {
      // Formato com dois decimais
      const formattedValue = numericValue.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
      
      setFormData(prev => ({ ...prev, [field]: formattedValue }));
      
      // Ajustando a posição do cursor após a formatação
      // Precisamos considerar que a formatação adicionou caracteres
      if (e.target.selectionStart) {
        setTimeout(() => {
          const diff = formattedValue.length - input.length;
          const newPosition = cursorPosition ? Math.min(cursorPosition + diff, formattedValue.length) : formattedValue.length;
          e.target.setSelectionRange(newPosition, newPosition);
        }, 0);
      }
    } else if (numericString === '' || numericString === ',' || numericString === '.') {
      // Se estiver vazio ou apenas com vírgula/ponto, limpa o campo
      setFormData(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleAccountChange = (index: number, field: string, value: any) => {
    const updatedAccounts = [...formData.accounts];
    updatedAccounts[index] = { ...updatedAccounts[index], [field]: value };
    setFormData({ ...formData, accounts: updatedAccounts });
  };

  const addAccount = () => {
    setFormData({
      ...formData,
      accounts: [
        ...formData.accounts,
        { account_id: '', betting_house_id: '', stake: '', role: 'normal', is_winner: false }
      ]
    });
  };

  const removeAccount = (index: number) => {
    if (formData.accounts.length <= 1) return;
    
    const updatedAccounts = formData.accounts.filter((_, i) => i !== index);
    setFormData({ ...formData, accounts: updatedAccounts });
  };

  // Função melhorada para extrair o valor numérico
  const parseCurrencyValue = (value: string): number => {
    if (!value) return 0;
    // Remove símbolo de moeda, espaços, e converte vírgula para ponto
    const numeric = value.replace(/[^\d,-]/g, '').replace(',', '.');
    return parseFloat(numeric) || 0;
  };

  const calculateProfit = () => {
    const betAmount = parseCurrencyValue(formData.bet_amount);
    const result = parseCurrencyValue(formData.result);
    const profit = result - betAmount;
    
    const formattedProfit = profit.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
    
    setFormData({ ...formData, profit: formattedProfit });
  };

  const nextStep = () => {
    if (validateStep()) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  const validateStep = (): boolean => {
    if (step === 1) {
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
    } else if (step === 2) {
      if (!formData.bet_amount) {
        setError('Valor da aposta é obrigatório');
        return false;
      }
      if (!formData.result) {
        setError('Resultado é obrigatório');
        return false;
      }
    }
    
    setError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep()) return;
    
    setIsSubmitting(true);
    
    try {
      // Parse currency values
      const bet_amount = parseCurrencyValue(formData.bet_amount);
      const result = parseCurrencyValue(formData.result);
      const profit = parseCurrencyValue(formData.profit);
      
      // Create operation - Removendo o campo sport que não existe na tabela
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
          bank_id: formData.bank_id
        }])
        .select()
        .single();
      
      if (error) {
        console.error('Erro ao inserir operação:', error);
        throw error;
      }
      
      // Create operation accounts
      if (data) {
        const accountEntries = formData.accounts.map(account => ({
          operation_id: data.id,
          account_id: account.account_id,
          betting_house_id: account.betting_house_id || formData.house1_id,
          stake: parseCurrencyValue(account.stake),
          role: account.role,
          is_winner: account.is_winner
        }));
        
        const { error: accountsError } = await supabase
          .from('operation_accounts')
          .insert(accountEntries);
        
        if (accountsError) {
          console.error('Erro ao inserir contas da operação:', accountsError);
          throw accountsError;
        }
      }
      
      // Update bank profit and ROI if a bank is selected
      if (formData.bank_id) {
        const { data: bankData, error: bankError } = await supabase
          .from('banks')
          .select('gross_profit, initial_capital')
          .eq('id', formData.bank_id)
          .single();
        
        if (bankError) {
          console.error('Erro ao buscar dados da banca:', bankError);
          throw bankError;
        }
        
        if (bankData) {
          const newProfit = bankData.gross_profit + profit;
          const newRoi = (newProfit / bankData.initial_capital) * 100;
          
          const { error: updateError } = await supabase
            .from('banks')
            .update({ 
              gross_profit: newProfit,
              roi: newRoi
            })
            .eq('id', formData.bank_id);
          
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

  // Função para formatar a entrada de moeda para a conta
  const handleAccountCurrencyInput = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    // Armazena a posição do cursor antes da atualização
    const cursorPosition = e.target.selectionStart;
    
    // Remove caracteres não numéricos (exceto vírgula e ponto)
    const input = e.target.value;
    const numericString = input.replace(/[^\d,.]/g, '');
    
    // Converte para um formato que possa ser parseado para número
    const normalizedValue = numericString.replace(/\./g, '').replace(',', '.');
    
    // Tenta converter para número
    const numericValue = parseFloat(normalizedValue);
    
    if (!isNaN(numericValue)) {
      // Formato com dois decimais
      const formattedValue = numericValue.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
      
      handleAccountChange(index, 'stake', formattedValue);
      
      // Ajustando a posição do cursor após a formatação
      if (e.target.selectionStart) {
        setTimeout(() => {
          const diff = formattedValue.length - input.length;
          const newPosition = cursorPosition ? Math.min(cursorPosition + diff, formattedValue.length) : formattedValue.length;
          e.target.setSelectionRange(newPosition, newPosition);
        }, 0);
      }
    } else if (numericString === '' || numericString === ',' || numericString === '.') {
      // Se estiver vazio ou apenas com vírgula/ponto, limpa o campo
      handleAccountChange(index, 'stake', '');
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
          {step === 1 && (
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
            </div>
          )}
          
          {step === 2 && (
            <div className="space-y-4">
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
                      onChange={(e) => {
                        handleCurrencyInput(e, 'result');
                        // Recalcula o lucro quando o resultado muda
                        setTimeout(calculateProfit, 10);
                      }}
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
          )}
          
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-medium text-gray-700">Contas Utilizadas</h4>
                <button
                  type="button"
                  onClick={addAccount}
                  className="p-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              
              {formData.accounts.map((account, index) => (
                <div key={index} className="p-3 border border-gray-200 rounded-md">
                  <div className="flex justify-between items-center mb-2">
                    <h5 className="text-sm font-medium">Conta {index + 1}</h5>
                    {formData.accounts.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeAccount(index)}
                        className="p-1 bg-red-100 text-red-600 rounded hover:bg-red-200"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Conta CPF
                      </label>
                      <select
                        value={account.account_id}
                        onChange={(e) => handleAccountChange(index, 'account_id', e.target.value)}
                        className="w-full p-2 text-sm border border-gray-300 rounded-md"
                        required
                      >
                        <option value="">Selecione</option>
                        {accounts.map(acc => (
                          <option key={acc.id} value={acc.id}>
                            {acc.name} ({acc.cpf})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Casa de Aposta
                      </label>
                      <select
                        value={account.betting_house_id || ''}
                        onChange={(e) => handleAccountChange(index, 'betting_house_id', e.target.value)}
                        className="w-full p-2 text-sm border border-gray-300 rounded-md"
                        required
                      >
                        <option value="">Selecione</option>
                        <option value={formData.house1_id}>
                          {bettingHouses.find(h => h.id === formData.house1_id)?.name || 'Casa 1'}
                        </option>
                        <option value={formData.house2_id}>
                          {bettingHouses.find(h => h.id === formData.house2_id)?.name || 'Casa 2'}
                        </option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Valor Apostado
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                        <input
                          type="text"
                          value={account.stake}
                          onChange={(e) => handleAccountCurrencyInput(index, e)}
                          placeholder="R$ 0,00"
                          className="pl-8 w-full p-1.5 text-sm border border-gray-300 rounded-md"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Função
                      </label>
                      <select
                        value={account.role}
                        onChange={(e) => handleAccountChange(index, 'role', e.target.value)}
                        className="w-full p-1.5 text-sm border border-gray-300 rounded-md"
                      >
                        <option value="normal">Normal</option>
                        <option value="vip">VIP</option>
                        <option value="limited">Limitado</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="mt-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={account.is_winner}
                        onChange={(e) => handleAccountChange(index, 'is_winner', e.target.checked)}
                        className="h-4 w-4 text-blue-600 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">Conta Ganhadora</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="flex justify-between mt-6">
            {step > 1 ? (
              <button
                type="button"
                onClick={prevStep}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={isSubmitting}
              >
                Voltar
              </button>
            ) : (
              <div></div>
            )}
            
            {step < 3 ? (
              <button
                type="button"
                onClick={nextStep}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Próximo
              </button>
            ) : (
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Salvando...' : 'Registrar Operação'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};