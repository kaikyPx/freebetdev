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
  const [authChecked, setAuthChecked] = useState(false); // Add this state to track if auth check is complete

  // Check for authenticated user and set userId
  useEffect(() => {
    checkUser();
    
    // Subscribe to auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const user = session?.user;
        setUserId(user?.id || null);
        setAuthChecked(true); // Mark auth check as complete regardless of result
        
        if (user) {
          fetchBanks(user.id);
        } else {
          setBanks([]);
          // Don't navigate here - only show login button
        }
      }
    );

    return () => {
      // Clean up subscription
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Check if user is authenticated
  const checkUser = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;

      const user = session?.user;
      setUserId(user?.id || null);
      setAuthChecked(true); // Mark auth check as complete regardless of result
      
      if (user) {
        fetchBanks(user.id);
      } else {
        setBanks([]);
        setLoading(false);
        // Don't navigate here - we'll just show login button if needed
      }
    } catch (error) {
      console.error('Error checking user:', error);
      setLoading(false);
      setAuthChecked(true); // Mark auth check as complete even on error
    }
  };

  // Fetch banks for a specific user
  const fetchBanks = async (uid: string) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('banks')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      setBanks(data || []);
    } catch (error) {
      console.error('Error fetching banks:', error);
    } finally {
      setLoading(false);
    }
  };

  // Add a new bank
  const addBank = async (bankData: Omit<Bank, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    if (!userId) {
      console.error('Cannot add bank: No authenticated user');
      throw new Error('Authentication required');
    }
    
    const { data, error } = await supabase
      .from('banks')
      .insert([{ ...bankData, user_id: userId }])
      .select();
      
    if (error) throw error;
    
    // Update local state
    if (data) {
      setBanks([...banks, ...data]);
    }
    
    return data;
  };

  // Update an existing bank
  const updateBank = async (id: string, updates: Partial<Bank>) => {
    if (!userId) {
      console.error('Cannot update bank: No authenticated user');
      throw new Error('Authentication required');
    }
    
    const { data, error } = await supabase
      .from('banks')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select();
      
    if (error) throw error;
    
    // Update local state
    if (data && data[0]) {
      setBanks(banks.map(bank => bank.id === id ? data[0] : bank));
    }
    
    return data;
  };

  // Delete a bank
  const deleteBank = async (id: string) => {
    if (!userId) {
      console.error('Cannot delete bank: No authenticated user');
      throw new Error('Authentication required');
    }
    
    const { error } = await supabase
      .from('banks')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
      
    if (error) throw error;
    
    // Update local state
    setBanks(banks.filter(bank => bank.id !== id));
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId) {
      alert('You must be logged in to perform this action');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Parse the currency string to a number
      const capitalValue = parseCurrencyValue(formData.initialCapital);
      
      if (editingBank) {
        // Update existing bank
        await updateBank(editingBank.id, {
          name: formData.name,
          initial_capital: capitalValue
        });
      } else {
        // Create new bank
        await addBank({
          name: formData.name,
          initial_capital: capitalValue,
          roi: 0,
          gross_profit: 0
        });
      }
      
      // Reset form
      setFormData({ name: '', initialCapital: '' });
      setIsModalOpen(false);
      setEditingBank(null);
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Failed to save bank. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, bankId: string) => {
    e.stopPropagation(); // Prevent navigation when clicking the delete button
    
    if (!userId) {
      alert('You must be logged in to perform this action');
      return;
    }
    
    if (confirm('Are you sure you want to delete this bank?')) {
      try {
        await deleteBank(bankId);
      } catch (error) {
        console.error('Error deleting bank:', error);
        alert('Failed to delete bank. Please try again.');
      }
    }
  };

  const handleEdit = (e: React.MouseEvent, bank: Bank) => {
    e.stopPropagation(); // Prevent navigation when clicking the edit button
    setEditingBank(bank);
    
    // Format the number to currency for display in the form
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

  // Show loading spinner while we're still checking auth status
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
              // If not logged in, redirect to login instead of showing alert
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
                  title="Edit bank"
                >
                  <Settings className="w-5 h-5 text-gray-600" />
                </button>
                <button
                  onClick={(e) => handleDelete(e, bank.id)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                  title="Delete bank"
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
              {editingBank ? 'Edit Bank' : 'New Bank'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bank Name
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
                  Initial Capital
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
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Save'}
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