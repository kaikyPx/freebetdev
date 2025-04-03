import React, { useState, useEffect } from 'react';
import { Settings, Plus, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface Bank {
  id: string;
  name: string;
  initial_capital: number;
  roi: number;
  gross_profit: number;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
}

const MinhasBancas: React.FC = () => {
  const navigate = useNavigate();
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBank, setEditingBank] = useState<Bank | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    initialCapital: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Verifica o usuário autenticado e define userId
  useEffect(() => {
    checkUser();
    
    // Inscreve-se para alterações de autenticação
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const user = session?.user;
        setUserId(user?.id || null);
        setAuthChecked(true);
        
        if (user) {
          await fetchBanks(user.id);
        } else {
          setBanks([]);
          setLoading(false);
        }
      }
    );

    return () => {
      // Limpa a inscrição
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Verifica se o usuário está autenticado
  const checkUser = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;

      const user = session?.user;
      
      if (user) {
        console.log("Usuário autenticado:", user.id);
        setUserId(user.id);
        await fetchBanks(user.id);
      } else {
        console.log("Nenhum usuário autenticado");
        setUserId(null);
        setBanks([]);
        setLoading(false);
      }
      
      setAuthChecked(true);
    } catch (error) {
      console.error('Erro ao verificar usuário:', error);
      setLoading(false);
      setAuthChecked(true);
    }
  };

  // Busca bancas para um usuário específico
  const fetchBanks = async (uid: string) => {
    try {
      setLoading(true);
      console.log('Buscando bancas para o usuário ID:', uid);
      
      // Certifique-se de que uid é uma string válida
      if (!uid) {
        console.error('ID de usuário inválido para buscar bancas');
        setBanks([]);
        setLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('banks')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Erro do Supabase:', error);
        throw error;
      }
      
      console.log('Bancas recuperadas:', data);
      setBanks(data || []);
    } catch (error) {
      console.error('Erro ao buscar bancas:', error);
      setBanks([]);
    } finally {
      setLoading(false);
    }
  };

  // Adiciona uma nova banca
  const addBank = async (bankData: Omit<Bank, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    if (!userId) {
      console.error('Não é possível adicionar banca: Nenhum usuário autenticado');
      throw new Error('Autenticação necessária');
    }
    
    console.log('Adicionando banca para o usuário ID:', userId);
    
    const { data, error } = await supabase
      .from('banks')
      .insert([{ ...bankData, user_id: userId }])
      .select();
      
    if (error) {
      console.error('Erro de inserção do Supabase:', error);
      throw error;
    }
    
    // Atualiza o estado local
    if (data) {
      setBanks(prevBanks => [...prevBanks, ...data]);
    }
    
    return data;
  };

  // Atualiza uma banca existente
  const updateBank = async (id: string, updates: Partial<Bank>) => {
    if (!userId) {
      console.error('Não é possível atualizar banca: Nenhum usuário autenticado');
      throw new Error('Autenticação necessária');
    }
    
    console.log('Atualizando banca ID:', id, 'para usuário:', userId);
    
    const { data, error } = await supabase
      .from('banks')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select();
      
    if (error) {
      console.error('Erro de atualização do Supabase:', error);
      throw error;
    }
    
    // Atualiza o estado local
    if (data && data[0]) {
      setBanks(prevBanks => prevBanks.map(bank => bank.id === id ? data[0] : bank));
    }
    
    return data;
  };

  // Exclui uma banca
  const deleteBank = async (id: string) => {
    if (!userId) {
      console.error('Não é possível excluir banca: Nenhum usuário autenticado');
      throw new Error('Autenticação necessária');
    }
    
    console.log('Excluindo banca ID:', id, 'para usuário:', userId);
    
    const { error } = await supabase
      .from('banks')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
      
    if (error) {
      console.error('Erro de exclusão do Supabase:', error);
      throw error;
    }
    
    // Atualiza o estado local
    setBanks(prevBanks => prevBanks.filter(bank => bank.id !== id));
  };

  // Formata número para entrada de moeda
  const formatCurrencyInput = (value: string): string => {
    // Remove caracteres não dígitos
    const numericValue = value.replace(/\D/g, "");
    
    if (numericValue === '') return '';
    
    // Converte para decimal (divide por 100)
    const floatValue = parseFloat(numericValue) / 100;
    
    // Formata como moeda brasileira
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(floatValue);
  };

  // Analisa string de moeda para número
  const parseCurrencyValue = (value: string): number => {
    // Remove símbolo de moeda, espaços e substitui vírgula por ponto
    return parseFloat(value.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
  };

  const handleCapitalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrencyInput(e.target.value);
    setFormData({ ...formData, initialCapital: formatted });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId) {
      alert('Você deve estar logado para realizar esta ação');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Analisa a string de moeda para um número
      const capitalValue = parseCurrencyValue(formData.initialCapital);
      
      if (editingBank) {
        // Atualiza banca existente
        await updateBank(editingBank.id, {
          name: formData.name,
          initial_capital: capitalValue
        });
      } else {
        // Cria nova banca
        await addBank({
          name: formData.name,
          initial_capital: capitalValue,
          roi: 0,
          gross_profit: 0
        });
      }
      
      // Redefine o formulário
      setFormData({ name: '', initialCapital: '' });
      setIsModalOpen(false);
      setEditingBank(null);
    } catch (error) {
      console.error('Erro ao enviar formulário:', error);
      alert('Falha ao salvar banca. Por favor, tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, bankId: string) => {
    e.stopPropagation(); // Evita a navegação ao clicar no botão de exclusão
    
    if (!userId) {
      alert('Você deve estar logado para realizar esta ação');
      return;
    }
    
    if (confirm('Tem certeza que deseja excluir esta banca?')) {
      try {
        await deleteBank(bankId);
      } catch (error) {
        console.error('Erro ao excluir banca:', error);
        alert('Falha ao excluir banca. Por favor, tente novamente.');
      }
    }
  };

  const handleEdit = (e: React.MouseEvent, bank: Bank) => {
    e.stopPropagation(); // Evita a navegação ao clicar no botão de edição
    setEditingBank(bank);
    
    // Formata o número para moeda para exibição no formulário
    const formattedCapital = formatCurrencyInput((bank.initial_capital * 100).toString());
    
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
    return bank.initial_capital + bank.gross_profit;
  };

  // Mostra spinner de carregamento enquanto ainda verificamos o status de autenticação
  if (loading && !authChecked) {
    return (
      <div className="flex-1 p-8 flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Minhas Bancas</h1>
        <button
          onClick={() => {
            if (!userId) {
              // Se não estiver logado, redireciona para login em vez de mostrar alerta
              navigate('/login');
              return;
            }
            setIsModalOpen(true);
            setFormData({ name: '', initialCapital: '' });
            setEditingBank(null);
          }}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          disabled={loading || isSubmitting}
        >
          <Plus className="w-5 h-5 mr-2" />
          Adicionar Banca
        </button>
      </div>

      {loading && authChecked && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {!userId && authChecked && !loading && (
        <div className="text-center py-8">
          <p className="text-gray-600">Entre com sua conta para visualizar suas bancas</p>
          <button 
            onClick={() => navigate('/login')} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Ir para Login
          </button>
        </div>
      )}

      {userId && !loading && banks.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-600">Você ainda não adicionou nenhuma banca</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {banks.map(bank => (
          <div
            key={bank.id}
            onClick={() => handleCardClick(bank.id)}
            className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow duration-200"
          >
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-semibold text-gray-800">{bank.name}</h2>
              <div className="flex">
                <button
                  onClick={(e) => handleEdit(e, bank)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                  title="Editar banca"
                >
                  <Settings className="w-5 h-5 text-gray-600" />
                </button>
                <button
                  onClick={(e) => handleDelete(e, bank.id)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                  title="Excluir banca"
                >
                  <Trash2 className="w-5 h-5 text-red-500" />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">ROI</p>
                <p className="text-lg font-bold text-blue-600">{bank.roi}%</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Lucro Bruto</p>
                <p className="text-lg font-bold text-green-600">
                  {formatCurrency(bank.gross_profit)}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Aporte</p>
                <p className="text-lg font-bold text-purple-600">
                  {formatCurrency(bank.initial_capital)}
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
                  disabled={isSubmitting}
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
                  disabled={isSubmitting}
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
                  disabled={isSubmitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Salvando...' : 'Salvar'}
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