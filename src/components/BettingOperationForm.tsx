import React, { useState, useEffect } from 'react';
import { X, Plus, Trash, Calendar, Clock, DollarSign, Building2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useBanks } from '../hooks/useBanks';

export const BettingOperationForm = ({ onClose, onSuccess, selectedBank, banks: propBanks }) => {
  const { banks: hookBanks, loading: loadingBanks } = propBanks ? { banks: propBanks, loading: false } : useBanks();
  const banks = propBanks || hookBanks;
  const [bettingHouses, setBettingHouses] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [userBanks, setUserBanks] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState(null);
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    game_name: '',
    bank_id: selectedBank || '',
    status: 'pendente',
    promotion_id: '',
    activations: [{ house_id: '', cpf_id: '', stake: '' }],
    protections: [{ house_id: '', cpf_id: '', stake: '' }],
    initial_value: '',
    profit: '',
    final_value: '',
    winning_house_id: '',
    winning_cpf_id: '',
    observation: ''
  });

  useEffect(() => {
    getCurrentUser();
    fetchBettingHouses();
    fetchPromotions();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchUserAccounts();
      fetchUserBanks();
    }
  }, [userId]);

  useEffect(() => {
    if (selectedBank) {
      setFormData(prev => ({ ...prev, bank_id: selectedBank }));
    }
  }, [selectedBank]);


  useEffect(() => {
    getCurrentUser();
    fetchBettingHouses();
    fetchPromotions();
  }, []);
  
  // Modificar getCurrentUser para não usar userData fora de contexto:
  const getCurrentUser = async () => {
    try {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        const { data: user, error } = await supabase
          .from('users')
          .select('id')
          .eq('email', data.session.user.email)
          .single();
        
        if (user) {
          setUserId(user.id);
          console.log("User ID obtido:", user.id);
        } else {
          console.log("Usuário não encontrado");
        }
      }
    } catch (err) {
      console.error("Failed to get current user:", err);
    }
  };
  const fetchUserBanks = async () => {
    try {
      const { data, error } = await supabase
        .from('banks')
        .select('*')
        .eq('user_id', userId)
        .order('name');

      if (error) throw error;
      setUserBanks(data || []);
    } catch (error) {
      console.error('Error fetching user banks:', error);
    }
  };

  const fetchBettingHouses = async () => {
    try {
      const { data, error } = await supabase
        .from('betting_houses')
        .select('*')
        .order('name');
  
      if (error) throw error;
      setBettingHouses(data || []);
    } catch (error) {
      console.error('Error fetching betting houses:', error);
    }
  };

  const fetchUserAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', userId)
        .order('cpf');
  
      if (error) throw error;
      setAccounts(data || []);
    } catch (error) {
      console.error('Error fetching accounts:', error);
    }
  };

  const fetchPromotions = async () => {
    try {
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .order('name');
  
      if (error) throw error;
      setPromotions(data || []);
    } catch (error) {
      console.error('Error fetching promotions:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleCurrencyInput = (e, field) => {
    let rawValue = e.target.value.replace(/\D/g, "");
    if (!rawValue) rawValue = "0";
  
    const number = parseFloat(rawValue) / 100;
    const formattedValue = number.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  
    setFormData(prev => {
      const updatedData = { ...prev, [field]: formattedValue };
      
      if (field === 'initial_value' || field === 'profit') {
        const initialValue = parseCurrencyValue(field === 'initial_value' ? formattedValue : prev.initial_value);
        const profit = parseCurrencyValue(field === 'profit' ? formattedValue : prev.profit);
        
        if (!isNaN(initialValue) && !isNaN(profit)) {
          const finalValue = initialValue + profit;
          updatedData.final_value = finalValue.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          });
        }
      }
      
      return updatedData;
    });
  };

  const handleActivationChange = (index, field, value) => {
    const updatedActivations = [...formData.activations];
    updatedActivations[index] = { ...updatedActivations[index], [field]: value };
    
    setFormData({ ...formData, activations: updatedActivations });
    
    if (field === 'stake') {
      updateInitialValue();
    }
  };

  const handleProtectionChange = (index, field, value) => {
    const updatedProtections = [...formData.protections];
    updatedProtections[index] = { ...updatedProtections[index], [field]: value };
    
    setFormData({ ...formData, protections: updatedProtections });
    
    if (field === 'stake') {
      updateInitialValue();
    }
  };

  const addActivation = () => {
    if (formData.activations.length < 2) {
      setFormData({
        ...formData,
        activations: [...formData.activations, { house_id: '', cpf_id: '', stake: '' }]
      });
    }
  };

  const removeActivation = (index) => {
    const updatedActivations = formData.activations.filter((_, i) => i !== index);
    setFormData({ ...formData, activations: updatedActivations });
    updateInitialValue();
  };

  const addProtection = () => {
    if (formData.protections.length < 3) {
      setFormData({
        ...formData,
        protections: [...formData.protections, { house_id: '', cpf_id: '', stake: '' }]
      });
    }
  };

  const removeProtection = (index) => {
    const updatedProtections = formData.protections.filter((_, i) => i !== index);
    setFormData({ ...formData, protections: updatedProtections });
    updateInitialValue();
  };

  const updateInitialValue = () => {
    let total = 0;
    
    formData.activations.forEach(activation => {
      total += parseCurrencyValue(activation.stake);
    });
    
    formData.protections.forEach(protection => {
      total += parseCurrencyValue(protection.stake);
    });
    
    const formattedValue = total.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
    
    setFormData(prev => {
      const updatedData = { ...prev, initial_value: formattedValue };
      
      const profit = parseCurrencyValue(prev.profit);
      if (!isNaN(profit)) {
        const finalValue = total + profit;
        updatedData.final_value = finalValue.toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        });
      }
      
      return updatedData;
    });
  };

  const parseCurrencyValue = (value) => {
    if (!value) return 0;
    // Remover formatação e converter para número
    const normalized = value.replace(/[R$\s.]/g, '').replace(',', '.');
    const numValue = parseFloat(normalized) || 0;
    
    // Verificar se este valor vem de uma ativação (identificação por contexto)
    // Esta é uma solução temporária
    if (formData.activations.some(act => act.stake === value)) {
      return numValue * 10; // Multiplicar por 10 apenas se for uma ativação
    }
    
    return numValue;
  };

  const validate = () => {
    if (!formData.date) { setError('Data da operação é obrigatória'); return false; }
    if (!formData.game_name) { setError('Nome do jogo é obrigatório'); return false; }
    if (!formData.bank_id) { setError('Banca é obrigatória'); return false; }
    if (!formData.activations[0].house_id) { setError('Casa de apostas é obrigatória'); return false; }
    if (!formData.activations[0].cpf_id) { setError('CPF é obrigatório'); return false; }
    if (!formData.activations[0].stake) { setError('Stake é obrigatório'); return false; }
    if (!userId) { setError('Usuário não identificado'); return false; }
    
    setError('');
    return true;
  };

// Adicione essa função antes do handleSubmit
const formatDateForDB = (dateString) => {
  // Convert YYYY-MM-DD to PostgreSQL date format
  if (!dateString) return null;
  return dateString; // PostgreSQL accepts ISO format YYYY-MM-DD
};


// In the handleSubmit function, replace the operationDetails preparation part with this:

const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (!validate()) return;
  setIsSubmitting(true);
  
  try {
    // Generate a UUID for the betting operation
    const operationId = crypto.randomUUID();
    
    // Prepare data for betting_operations table
    const operation = {
      id: operationId,
      user_id: userId,
      date: formatDateForDB(formData.date),
      time: formData.time,
      game_name: formData.game_name,
      status: formData.status,
      promotion_id: formData.promotion_id || null,
      house1_id: formData.activations[0]?.house_id || null,
      house2_id: formData.activations[1]?.house_id || null,
      bet_amount: parseCurrencyValue(formData.initial_value),
      profit: parseCurrencyValue(formData.profit),
      result: parseCurrencyValue(formData.final_value),
      bank_id: formData.bank_id || null,
      promotion_type: formData.observation || null
    };
    
    // Insert into betting_operations table
    const { error: operationError } = await supabase
      .from('betting_operations')
      .insert([operation]);
    
    if (operationError) throw operationError;
    
    // Helper function to format currency values as strings for text columns
    const formatCurrencyForDB = (value) => {
      if (!value) return '';
      // If it's already a string with currency format, return as is
      if (typeof value === 'string' && value.includes('R$')) return value;
      // If it's a number, format it
      const number = parseFloat(value);
      return number ? number.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      }) : '';
    };
    
    // Prepare data for betting_operation_details table
    const operationDetails = {
      id: crypto.randomUUID(),
      betting_operation_id: operationId,
      account_id: formData.activations[0]?.cpf_id || null,
      
      // First activation (required)
      casa1: formData.activations[0]?.house_id || null,
      cpf1: formData.activations[0]?.cpf_id || null,
      stake1: formData.activations[0]?.stake || '',
      
      // Second activation (optional)
      casa2: formData.activations[1]?.house_id || null,
      cpf2: formData.activations[1]?.cpf_id || null,
      stake2: formData.activations[1]?.stake || '',
      
      // First protection
      casaprot: formData.protections[0]?.house_id || null,
      cpfprot: formData.protections[0]?.cpf_id || null,
      stakeprot: formData.protections[0]?.stake || '',
      
      // Second protection
      casaprot2: formData.protections[1]?.house_id || null,
      cpfprot2: formData.protections[1]?.cpf_id || null,
      stakeprot2: formData.protections[1]?.stake || '',
      
      // Third protection
      casaprot3: formData.protections[2]?.house_id || null,
      cpfprot3: formData.protections[2]?.cpf_id || null,
      stakeprot3: formData.protections[2]?.stake || '',
      
      // Winner info
      casavencedora: formData.winning_house_id || null,
      cpfvencedor: formData.winning_cpf_id || null
    };
    
    // Log for debugging
    console.log('Operation details being sent to DB:', operationDetails);
    
    // Insert into betting_operation_details table
    const { error: detailsError } = await supabase
      .from('betting_operation_details')
      .insert([operationDetails]);
    
    if (detailsError) {
      console.error('Database error:', detailsError);
      throw detailsError;
    }
    
    onSuccess();
  } catch (error) {
    console.error('Error submitting operation:', error);
    setError('Erro ao salvar operação. Por favor, tente novamente: ' + error.message);
  } finally {
    setIsSubmitting(false);
  }
};
  // Helper functions para mostrar nomes no UI (não utilizados para salvar no DB)
  const getHouseName = (houseId) => {
    if (!houseId) return null;
    const house = bettingHouses.find(h => h.id === houseId);
    return house?.name || null;
  };
  
  const getAccountCPF = (accountId) => {
    if (!accountId) return null;
    const account = accounts.find(a => a.id === accountId);
    return account?.cpf || null;
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center overflow-y-auto py-8">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 relative">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Nova Aposta</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 text-red-600 text-sm rounded-md">{error}</div>
        )}
        
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[70vh]">
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Promoção</label>
                  <select name="promotion_id" value={formData.promotion_id} onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md">
                    <option value="">Selecione uma promoção</option>
                    {promotions.map(promotion => (
                      <option key={promotion.id} value={promotion.id}>{promotion.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select name="status" value={formData.status} onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md" required>
                    <option value="Em Operação">Em Operação</option>
                    <option value="Finalizado">Finalizado</option>
                    <option value="Pendente">Pendente</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input type="date" name="date" value={formData.date} onChange={handleChange} 
                      className="pl-10 w-full p-2 border border-gray-300 rounded-md" required />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hora</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input type="time" name="time" value={formData.time} onChange={handleChange}
                      className="pl-10 w-full p-2 border border-gray-300 rounded-md" required />
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jogo/Aposta</label>
                <input type="text" name="game_name" value={formData.game_name} onChange={handleChange}
                  placeholder="Ex: Barcelona vs Real Madrid" className="w-full p-2 border border-gray-300 rounded-md" required />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Banca</label>
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
                    {userBanks.map(bank => (
                      <option key={bank.id} value={bank.id}>{bank.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            
            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-700 mb-3">Ativação</h4>
              
              {formData.activations.map((activation, index) => (
                <div key={`activation-${index}`} className="mb-4 p-3 bg-gray-50 rounded-md">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-medium">Ativação {index + 1}</span>
                    {index > 0 && (
                      <button type="button" onClick={() => removeActivation(index)} className="text-red-500 hover:text-red-700">
                        <Trash className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Casa</label>
                      <select value={activation.house_id} 
                        onChange={(e) => handleActivationChange(index, 'house_id', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md text-sm" required={index === 0}>
                        <option value="">Selecione</option>
                        {bettingHouses.map(house => (
                          <option key={house.id} value={house.id}>{house.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">CPF</label>
                      <select value={activation.cpf_id}
                        onChange={(e) => handleActivationChange(index, 'cpf_id', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md text-sm" required={index === 0}>
                        <option value="">Selecione</option>
                        {accounts.map(account => (
                          <option key={account.id} value={account.id}>{account.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Stake</label>
                      <div className="relative">
                        <DollarSign className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                        <input type="text" value={activation.stake} 
                          onChange={(e) => {
                           // Para ativações (e faça o mesmo para proteções)
const rawValue = e.target.value.replace(/\D/g, "");
if (!rawValue) {
  handleActivationChange(index, 'stake', "");
  return;
}

// Converter para número mantendo precisão decimal
const number = parseFloat(rawValue) / 100;
// Garantir sempre 2 casas decimais
const formattedValue = number.toLocaleString("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

handleActivationChange(index, 'stake', formattedValue);
                          }}
                          placeholder="R$ 0,00" className="pl-8 w-full p-2 border border-gray-300 rounded-md text-sm" required={index === 0} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {formData.activations.length < 2 && (
                <button type="button" onClick={addActivation} 
                  className="flex items-center text-sm text-blue-600 font-medium hover:text-blue-800">
                  <Plus className="w-4 h-4 mr-1" /> Adicionar mais ativação
                </button>
              )}
            </div>
            
            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-700 mb-3">Proteção</h4>
              
              {formData.protections.map((protection, index) => (
                <div key={`protection-${index}`} className="mb-4 p-3 bg-gray-50 rounded-md">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-medium">Proteção {index + 1}</span>
                    <button type="button" onClick={() => removeProtection(index)} className="text-red-500 hover:text-red-700">
                      <Trash className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Casa</label>
                      <select value={protection.house_id} 
                        onChange={(e) => handleProtectionChange(index, 'house_id', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md text-sm">
                        <option value="">Selecione</option>
                        {bettingHouses.map(house => (
                          <option key={house.id} value={house.id}>{house.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">CPF</label>
                      <select value={protection.cpf_id}
                        onChange={(e) => handleProtectionChange(index, 'cpf_id', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md text-sm">
                        <option value="">Selecione</option>
                        {accounts.map(account => (
                          <option key={account.id} value={account.id}>{account.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Stake</label>
                      <div className="relative">
                        <DollarSign className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                        <input type="text" value={protection.stake} 
                          onChange={(e) => {
                            const rawValue = e.target.value.replace(/\D/g, "");
                            if (!rawValue) {
                              handleProtectionChange(index, 'stake', "");
                              return;
                            }
                            
                            const number = parseFloat(rawValue) / 100;
                            const formattedValue = number.toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            });
                            
                            handleProtectionChange(index, 'stake', formattedValue);
                          }}
                          placeholder="R$ 0,00" className="pl-8 w-full p-2 border border-gray-300 rounded-md text-sm" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {formData.protections.length < 3 && (
                <button type="button" onClick={addProtection} 
                  className="flex items-center text-sm text-blue-600 font-medium hover:text-blue-800">
                  <Plus className="w-4 h-4 mr-1" /> Adicionar mais proteção
                </button>
              )}
            </div>
            
            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-700 mb-3">Financeiro</h4>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lucro</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input type="text" value={formData.profit} onChange={(e) => handleCurrencyInput(e, 'profit')}
                      placeholder="R$ 0,00" className="pl-10 w-full p-2 border border-gray-300 rounded-md" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valor Inicial</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input type="text" value={formData.initial_value} readOnly
                      className="pl-10 w-full p-2 border border-gray-300 rounded-md bg-gray-50" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valor Final</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input type="text" value={formData.final_value} readOnly
                      className="pl-10 w-full p-2 border border-gray-300 rounded-md bg-gray-50" />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-700 mb-3">Resultado</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Casa Vencedora (opcional)</label>
                  <select name="winning_house_id" value={formData.winning_house_id} onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md">
                    <option value="">Selecione</option>
                    {bettingHouses.map(house => (
                      <option key={house.id} value={house.id}>{house.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CPF Vencedor (opcional)</label>
                  <select name="winning_cpf_id" value={formData.winning_cpf_id} onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md">
                    <option value="">Selecione</option>
                    {accounts.map(account => (
                      <option key={account.id} value={account.id}>{account.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            
            <div className="border-t pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Observação</label>
              <textarea name="observation" value={formData.observation} onChange={handleChange}
                rows="3" className="w-full p-2 border border-gray-300 rounded-md"></textarea>
            </div>
          </div>
          
          <div className="flex justify-end mt-6">
            <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
              disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Salvar aposta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};