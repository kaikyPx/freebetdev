import React, { useState, useEffect, useRef } from 'react';
import { Check, Trash2, FileDown, Plus, Eye, EyeOff, Search, Upload, MessageCircle, Building2, ChevronDown } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useAccounts } from '../hooks/useAccounts';
import { useBettingHouses } from '../hooks/useBettingHouses';
import { useColumnVisibility } from '../hooks/useColumnVisibility';
import { ColumnSelector } from './ColumnSelector';
import { formatCurrency, parseCurrency, sumCurrencyValues } from '../utils/currency';
import type { Account } from '../types/database';
import { authService } from '../services/supabaseService';
import { supabase } from '../lib/supabase';

const tableColumns = [
  { id: 'item', label: 'Item', defaultVisible: true },
  { id: 'responsavel', label: 'Responsável', defaultVisible: true },
  { id: 'status', label: 'Status', defaultVisible: true },
  { id: 'verification', label: 'Verificação', defaultVisible: true },
  { id: 'name', label: 'Nome', defaultVisible: true },
  { id: 'cpf', label: 'CPF', defaultVisible: true },
  { id: 'birth_date', label: 'Data Nasc.', defaultVisible: true },
  { id: 'address', label: 'Endereço', defaultVisible: false },
  { id: 'email1', label: 'Email', defaultVisible: false },
  { id: 'password1', label: 'Senha', defaultVisible: false },
  { id: 'chip', label: 'Chip', defaultVisible: false },
  { id: 'saldo', label: 'Saldo', defaultVisible: true },
  { id: 'deposito', label: 'Depósito', defaultVisible: true },
  { id: 'sacado', label: 'Sacado', defaultVisible: true },
  { id: 'creditos', label: 'Créditos', defaultVisible: true },
  { id: 'obs', label: 'Obs.', defaultVisible: true },
  { id: 'whatsapp', label: 'WhatsApp', defaultVisible: true },
  { id: 'actions', label: 'Ações', defaultVisible: true }
];

const statusOptions = [
  { value: 'Limitado', color: 'bg-red-100 text-red-800' },
  { value: 'Disponivel', color: 'bg-green-100 text-green-800' },
  { value: 'Sem Acesso', color: 'bg-orange-100 text-orange-800' },
  { value: 'Abrir Casa', color: 'bg-gray-100 text-gray-800' },
  { value: 'Verificado', color: 'bg-green-100 text-green-800' },
  { value: 'Verificar', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'Conta Aberta', color: 'bg-green-100 text-green-800' },
  { value: 'ABRIR', color: 'bg-blue-100 text-blue-800' },
  { value: 'Selfie', color: 'bg-red-500 text-white animate-pulse' }
];

const verificationOptions = [
  { value: 'Verificado', color: 'bg-green-100 text-green-800' },
  { value: 'Verificar', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'ABRIR', color: 'bg-blue-100 text-blue-800' }
];

const responsavelOptions = [
  'gabriel',
  'diego',
  'juliana',
  'nubia',
  'emerson',
  'Stanley',
  'Liliane',
  'Rafael Jesus'
];


function CPFAccounts() {
  const {
    accounts,
    loading,
    error,
    addAccount,
    updateAccount,
    deleteAccount
  } = useAccounts();

  const {
    bettingHouses,
    loading: loadingHouses,
    getAccountBettingHouse,
    updateAccountBettingHouse
  } = useBettingHouses();

  const {
    visibleColumns,
    toggleColumn,
    isColumnVisible,
    updateVisibleColumns
  } = useColumnVisibility(tableColumns);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showPasswords, setShowPasswords] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedResponsible, setSelectedResponsible] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedVerification, setSelectedVerification] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newAccount, setNewAccount] = useState<Partial<Account>>({});
  const [importing, setImporting] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [loadingStatuses, setLoadingStatuses] = useState(false);
  const [showTemplateMenu, setShowTemplateMenu] = useState<string | null>(null);
  const [selectedHouse, setSelectedHouse] = useState<string>('');
  const [userId, setUserId] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
const [authChecked, setAuthChecked] = useState(false);
  const [accountStatuses, setAccountStatuses] = useState<Record<string, { 
    status: string | null;
    verification: string | null;
    saldo: string | null;
    deposito: string | null;
    sacado: string | null;
    creditos: string | null;
    obs: string | null;
  }>>({});
  const [showExcelMenu, setShowExcelMenu] = useState(false);
  useEffect(() => {
    if (selectedHouse && accounts.length > 0 && !loadingStatuses) {
      const loadStatuses = async () => {
        setLoadingStatuses(true);
        try {
          await loadAccountStatuses();
        } finally {
          setLoadingStatuses(false);
        }
      };
      loadStatuses();
    }
  }, [selectedHouse, accounts]);

  const itemsPerPage = 10;
  useEffect(() => {
    // Prioriza verificação direta do Supabase antes de qualquer outra coisa
    const checkAuth = async () => {
      try {
        setAuthLoading(true);
        // Verificar diretamente com o Supabase primeiro
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          console.log("Usuário autenticado via Supabase:", session.user.id);
          setUserId(session.user.id);
    
          
          // Opcionalmente, atualizar o localStorage para manter consistência
          if (session.access_token) {
            localStorage.setItem('token', session.access_token);
            localStorage.setItem('user', JSON.stringify({
              id: session.user.id,
              email: session.user.email
            }));
            localStorage.setItem('isAuthenticated', 'true');
          }
        } else {
          // Só como backup verificar o localStorage
          const tokenCheck = authService.verifyToken();
          if (tokenCheck.valid && tokenCheck.user) {
            console.log("Usuário autenticado via localStorage:", tokenCheck.user.id);
            setUserId(tokenCheck.user.id);
            
          } else {
            console.log("Nenhum usuário autenticado");
            setUserId(null);
       
          }
        }
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        setUserId(null);

      } finally {
        setAuthLoading(false);
        setAuthChecked(true);
      }
    };
    
    checkAuth();
  }, []);

  useEffect(() => {
    if (selectedHouse && accounts.length > 0) {
      loadAccountStatuses();
    }
  }, [selectedHouse, accounts]);



// Monitorar mudanças na autenticação
const { data: authListener } = supabase.auth.onAuthStateChange(
  async (event, session) => {
    console.log("Auth state changed:", event, session);
    
    if (session?.user) {
      console.log("Usuário atualizado via evento Supabase:", session.user.id);
      setUserId(session.user.id);
      // Remova esta linha: await fetchBanks(session.user.id);
    } else {
      console.log("Usuário desconectado via evento Supabase");
      setUserId(null);
      // Remova esta linha: setBanks([]);
    }
  }
);

  const loadAccountStatuses = async () => {
    if (!selectedHouse) return;

    const statuses: Record<string, {
      status: string | null;
      verification: string | null;
      saldo: string | null;
      deposito: string | null;
      sacado: string | null;
      creditos: string | null;
      obs: string | null;
    }> = {};
    
    for (const account of accounts) {
      try {
        const houseStatus = await getAccountBettingHouse(account.id, selectedHouse);
        statuses[account.id] = {
          status: houseStatus?.status || null,
          verification: houseStatus?.verification || null,
          saldo: houseStatus?.saldo ? formatCurrency(houseStatus.saldo) : null,
          deposito: houseStatus?.deposito ? formatCurrency(houseStatus.deposito) : null,
          sacado: houseStatus?.sacado ? formatCurrency(houseStatus.sacado) : null,
          creditos: houseStatus?.creditos ? formatCurrency(houseStatus.creditos) : null,
          obs: houseStatus?.obs || null
        };
      } catch (error) {
        console.error('Error loading account status:', error);
      }
    }

    setAccountStatuses(statuses);
  };

  const handleStatusChange = async (accountId: string, field: keyof typeof accountStatuses[string], value: string) => {
    if (!selectedHouse || !accountId) return;
  
    try {
      const currentStatus = accountStatuses[accountId] || {
        status: null,
        verification: null,
        saldo: null,
        deposito: null,
        sacado: null,
        creditos: null,
        obs: null
      };
  
      // Format currency values
      let formattedValue = value;
      if (['saldo', 'deposito', 'sacado', 'creditos'].includes(field)) {
        formattedValue = formatCurrency(value);
      }
  
      const updates = {
        ...currentStatus,
        [field]: formattedValue
      };
  
      await updateAccountBettingHouse(accountId, selectedHouse, updates);
      
      setAccountStatuses(prev => ({
        ...prev,
        [accountId]: updates
      }));
    } catch (error) {
      console.error('Error updating account status:', error);
      alert('Erro ao atualizar o status. Por favor, tente novamente.');
    }
  };

  const formatPhoneNumber = (phone: string | null): string => {
    if (!phone) return '';
    const numbers = phone.replace(/\D/g, '');
    return numbers.startsWith('55') ? numbers : `55${numbers}`;
  };

  const getWhatsAppLink = (phone: string | null, account: Account): string => {
    if (!phone) return '#';
    
    // Formata o número removendo caracteres não numéricos e adicionando 55 se necessário
    const formattedPhone = formatPhoneNumber(phone);
    
    // Se um template está selecionado, gera o link com a mensagem do template
    if (selectedTemplate) {
      const template = whatsappTemplates.find(t => t.name === selectedTemplate);
      if (template) {
        const message = encodeURIComponent(template.template(account.name));
        return `https://wa.me/${formattedPhone}?text=${message}`;
      }
    }
    
    // Link padrão se não há template selecionado
    return `https://wa.me/${formattedPhone}`;
  };

  const handleEdit = async (id: string, field: keyof Account, value: string | number) => {
    try {
      await updateAccount(id, { [field]: value });
    } catch (error) {
      console.error('Error updating account:', error);
      alert('Erro ao atualizar o registro. Por favor, tente novamente.');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta conta?')) {
      try {
        await deleteAccount(id);
      } catch (error) {
        console.error('Error deleting account:', error);
        alert('Erro ao excluir o registro. Por favor, tente novamente.');
      }
    }
  };

  // Add this to your component state
const [newHouseData, setNewHouseData] = useState({
  status: '',
  verification: '',
  saldo: '',
  deposito: '',
  sacado: '',
  creditos: '',
  obs: ''
});

// Then update the handleAddNew function
const handleAddNew = async () => {
  if (isAddingNew && Object.keys(newAccount).length > 0) {
    try {
      const maxItem = Math.max(...accounts.map(a => a.item), 0);
      const accountData = {
        ...newAccount,
        item: maxItem + 1,
        user_id: userId
      } as Omit<Account, 'id' | 'created_at' | 'updated_at'>;
      
      // Add account first to get an ID
      const addedAccount = await addAccount(accountData);

      // Criar o CPF em todas as casas de apostas
      for (const house of bettingHouses) {
        // Use os mesmos dados para todas as casas
        await updateAccountBettingHouse(addedAccount.id, house.id, newHouseData);
      }
      
      // Atualizar o accountStatuses apenas para a casa selecionada
      if (selectedHouse && addedAccount.id) {
        setAccountStatuses(prev => ({
          ...prev,
          [addedAccount.id]: {
            status: newHouseData.status || null,
            verification: newHouseData.verification || null,
            saldo: newHouseData.saldo || null,
            deposito: newHouseData.deposito || null,
            sacado: newHouseData.sacado || null,
            creditos: newHouseData.creditos || null,
            obs: newHouseData.obs || null
          }
        }));
      }
      
      setNewAccount({});
      setNewHouseData({
        status: '',
        verification: '',
        saldo: '',
        deposito: '',
        sacado: '',
        creditos: '',
        obs: ''
      });
    } catch (error) {
      console.error('Error adding account:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao adicionar conta';
      throw new Error(errorMessage);
    }
  }
  setIsAddingNew(!isAddingNew);
};

  const downloadTemplate = () => {
    const template = [
      {
        Item: 'Automático',
        Responsavel: 'gabriel',
        Status: 'Disponivel',
        Nome: 'João Silva',
        CPF: '123.456.789-00',
        'Data Nascimento': '15/11/1999',
        Endereço: 'Rua Example, 123',
        Telefone: '(11) 98765-4321',
        Email: 'exemplo@email.com',
        Senha: 'senha123',
        Chip: 'Vivo',
        Verificação: 'Verificado',
        Saldo: 'R$ 0,00',
        Depósito: 'R$ 0,00',
        Sacado: 'R$ 0,00',
        Créditos: 'R$ 0,00',
        Obs: 'Observações aqui'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, 'template-contas-cpf.xlsx');
  };

  const formatDate = (dateString: string): string => {
    try {
      if (!dateString) throw new Error('Data não fornecida');

      if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        return dateString;
      }

      if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
        const [day, month, year] = dateString.split('/');
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        
        if (isNaN(date.getTime())) {
          throw new Error('Data inválida');
        }
        
        return date.toISOString().split('T')[0];
      }

      throw new Error('Formato de data inválido');
    } catch (error) {
      console.error('Error formatting date:', dateString, error);
      throw new Error(`Data inválida: ${dateString}`);
    }
  };

  const handleImportExcel = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setImporting(true);
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false });

      if (jsonData.length === 0) {
        throw new Error('Arquivo vazio ou sem dados válidos');
      }

      const maxItem = Math.max(...accounts.map(a => a.item), 0);
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];
      
      for (let [index, row] of jsonData.entries()) {
        try {
          if (!row['Nome'] || !row['CPF'] || !row['Data Nascimento'] || !row['Responsavel'] || !row['Status']) {
            throw new Error('Campos obrigatórios faltando (Nome, CPF, Data Nascimento, Responsavel, Status)');
          }

          const birthDate = formatDate(row['Data Nascimento']);

          const account = {
            item: maxItem + index + 1,
            responsavel: row['Responsavel']?.toString().trim(),
            status: row['Status']?.toString().trim(),
            name: row['Nome']?.toString().trim(),
            cpf: row['CPF']?.toString().trim(),
            birth_date: birthDate,
            address: row['Endereço']?.toString().trim() || null,
            phone: row['Telefone']?.toString().trim() || null,
            email1: row['Email']?.toString().trim() || null,
            password1: row['Senha']?.toString().trim() || null,
            chip: row['Chip']?.toString().trim() || null,
            verification: row['Verificação']?.toString().trim() || null
          };

          await addAccount(account as Omit<Account, 'id' | 'created_at' | 'updated_at'>);
          successCount++;
        } catch (error) {
          errorCount++;
          errors.push(`Linha ${index + 2}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        }
      }

      if (errorCount > 0) {
        alert(`Importação concluída com avisos:\n- ${successCount} registros importados com sucesso\n- ${errorCount} erros encontrados:\n\n${errors.join('\n')}`);
      } else {
        alert(`Importação concluída com sucesso! ${successCount} registros importados.`);
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error importing Excel:', error);
      alert(`Erro ao importar o arquivo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setImporting(false);
    }
  };

  const exportToExcel = () => {
    const exportData = accounts.map(account => {
      const houseStatus = selectedHouse ? accountStatuses[account.id] : null;
      return {
        Item: account.item,
        Responsavel: account.responsavel,
        Status: account.status,
        Nome: account.name,
        CPF: account.cpf,
        'Data Nascimento': account.birth_date,
        Endereço: account.address || '',
        Telefone: account.phone || '',
        Email: account.email1 || '',
        Senha: account.password1 || '',
        Chip: account.chip || '',
        Verificação: account.verification || '',
        Saldo: houseStatus?.saldo || '',
        Depósito: houseStatus?.deposito || '',
        Sacado: houseStatus?.sacado || '',
        Créditos: houseStatus?.creditos || '',
        Obs: houseStatus?.obs || ''
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Contas CPF');
    XLSX.writeFile(wb, 'contas-cpf.xlsx');
  };

  const filteredAccounts = accounts.filter(account => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = searchTerm === '' || 
      account.name.toLowerCase().includes(searchLower) ||
      account.cpf.toLowerCase().includes(searchLower) ||
      (account.email1?.toLowerCase() || '').includes(searchLower) ||
      (account.phone?.toLowerCase() || '').includes(searchLower) ||
      (account.address?.toLowerCase() || '').includes(searchLower) ||
      account.status.toLowerCase().includes(searchLower) ||
      (account.verification?.toLowerCase() || '').includes(searchLower) ||
      account.responsavel.toLowerCase().includes(searchLower);
  
    const matchesResponsible = selectedResponsible === '' || 
      account.responsavel.toLowerCase() === selectedResponsible.toLowerCase();
    
    // Verificar se o status e verificação correspondem, considerando tanto a conta geral quanto a casa específica
    let matchesStatus = selectedStatus === '';
    let matchesVerification = selectedVerification === '';
    
    if (selectedHouse && accountStatuses[account.id]) {
      // Se uma casa estiver selecionada, verificar o status e verificação da casa
      if (selectedStatus !== '') {
        matchesStatus = accountStatuses[account.id]?.status === selectedStatus;
      }
      
      if (selectedVerification !== '') {
        matchesVerification = accountStatuses[account.id]?.verification === selectedVerification;
      }
    } else {
      // Se nenhuma casa estiver selecionada, verificar o status e verificação geral da conta
      if (selectedStatus !== '') {
        matchesStatus = account.status === selectedStatus;
      }
      
      if (selectedVerification !== '') {
        matchesVerification = account.verification === selectedVerification;
      }
    }
    
    // Modificar esta linha para filtragem de casas
    const matchesHouse = !selectedHouse || (
      accountStatuses[account.id] !== undefined && 
      Object.values(accountStatuses[account.id]).some(value => value !== null)
    );
  
    return matchesSearch && matchesResponsible && matchesStatus && matchesVerification && matchesHouse;
  });
  const totalPages = Math.ceil(filteredAccounts.length / itemsPerPage);
  const paginatedAccounts = filteredAccounts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Calculate totals
  const totals = {
    totalSaldo: formatCurrency(sumCurrencyValues(Object.values(accountStatuses).map(status => status.saldo))),
    totalDeposito: formatCurrency(sumCurrencyValues(Object.values(accountStatuses).map(status => status.deposito))),
    totalSacado: formatCurrency(sumCurrencyValues(Object.values(accountStatuses).map(status => status.sacado)))
  };

  if (loading || loadingHouses) {
    console.log('Loading states:', { loading, loadingHouses });
    console.log('Data states:', { accounts, bettingHouses });
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <div className="text-xl text-gray-600">Carregando...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <div className="text-xl text-red-600">Erro ao carregar os dados: {error}</div>
      </div>
    );
  }

  const StatusSelect = ({ value, onChange, className = '' }: { value: string, onChange: (value: string) => void, className?: string }) => {
    const selectedOption = statusOptions.find(opt => opt.value === value);
    const baseClasses = `w-full p-1 rounded ${className}`;
    
    return (
      <div className={`relative ${selectedOption?.color || ''}`}>
        <select
          className={`${baseClasses} appearance-none w-full bg-transparent`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
        >
          <option value="" className="bg-white">Selecione...</option>
          {statusOptions.map(option => (
            <option
              key={option.value}
              value={option.value}
              className={`${option.color}`}
            >
              {option.value}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    );
  };

  const whatsappTemplates = [
    { 
      name: 'Boas-vindas', 
      template: (name) => `Olá ${name}, seja bem-vindo(a)! Estamos felizes em ter você conosco.`
    },
    { 
      name: 'Verificação', 
      template: (name) => `Olá ${name}, precisamos verificar sua conta. Poderia enviar um documento com foto?`
    },
    { 
      name: 'Confirmação de Depósito', 
      template: (name) => `Olá ${name}, seu depósito foi confirmado com sucesso!`
    },
    { 
      name: 'Solicitação de Dados', 
      template: (name) => `Olá ${name}, precisamos de alguns dados adicionais para finalizar seu cadastro.`
    },
    { 
      name: 'Suporte', 
      template: (name) => `Olá ${name}, como podemos ajudar você hoje?`
    }
  ];
  const VerificationSelect = ({ value, onChange, className = '' }: { value: string, onChange: (value: string) => void, className?: string }) => {
    const selectedOption = verificationOptions.find(opt => opt.value === value);
    const baseClasses = `w-full p-1 rounded ${className}`;
    
    return (
      <div className={`relative ${selectedOption?.color || ''}`}>
        <select
          className={`${baseClasses} appearance-none w-full bg-transparent`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
        >
          <option value="" className="bg-white">Selecione...</option>
          {verificationOptions.map(option => (
            <option
              key={option.value}
              value={option.value}
              className={`${option.color}`}
            >
              {option.value}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    );
  };

  const CurrencyInput = ({ value, onChange, placeholder = 'R$ 0,00' }: { value: string | null, onChange: (value: string) => void, placeholder?: string }) => {
    // Inicializa com o valor formatado se disponível, ou string vazia
    const [inputValue, setInputValue] = useState(value || '');
    
    // Mantém o controle da posição do cursor
    const inputRef = useRef<HTMLInputElement>(null);
    const cursorPosition = useRef<number | null>(null);
    
    // Atualiza o estado interno quando o valor do pai muda
    useEffect(() => {
      if (value !== undefined && value !== null) {
        setInputValue(value);
      }
    }, [value]);
  
    // Formata como moeda durante a digitação
    const formatCurrencyForTyping = (value: string): string => {
      // Remove tudo exceto dígitos
      const digits = value.replace(/\D/g, '');
      
      if (!digits) {
        return 'R$ 0,00';
      }
      
      // Converte para centavos
      const valueInCents = parseInt(digits);
      
      // Formata com prefixo R$ e vírgula decimal
      const reais = Math.floor(valueInCents / 100);
      const cents = valueInCents % 100;
      
      return `R$ ${reais.toLocaleString('pt-BR')},${cents.toString().padStart(2, '0')}`;
    };
  
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      // Salva a posição atual do cursor
      if (inputRef.current) {
        cursorPosition.current = inputRef.current.selectionStart;
      }
      
      const rawValue = e.target.value;
      
      // Formata o valor durante a digitação
      const formatted = formatCurrencyForTyping(rawValue);
      setInputValue(formatted);
    };
    
    // Depois que o valor muda, tenta manter a posição do cursor
    useEffect(() => {
      if (inputRef.current && cursorPosition.current !== null) {
        requestAnimationFrame(() => {
          if (inputRef.current) {
            const newPosition = Math.min(cursorPosition.current, inputRef.current.value.length);
            inputRef.current.selectionStart = newPosition;
            inputRef.current.selectionEnd = newPosition;
          }
        });
      }
    }, [inputValue]);
    
    const handleBlur = () => {
      // Atualiza o pai apenas quando o foco é perdido
      // Certifica-se de passar um valor formatado corretamente
      onChange(inputValue);
    };
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        inputRef.current?.blur(); // Isso vai acionar o handleBlur
      }
    };
  
    return (
      <input
        ref={inputRef}
        type="text"
        className="w-full p-1 border rounded"
        value={inputValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
      />
    );
  };
  return (
    <div className="flex-1 p-8">
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-gray-800">Contas CPF</h2>
            <div className="flex items-center gap-2">
              <div className="relative">
              <select
                className="pl-10 p-2 border border-gray-300 rounded-md bg-white min-w-[200px]"
                value={selectedHouse}
                onChange={(e) => {
                  setSelectedHouse(e.target.value);
                  if (e.target.value) {
                    loadAccountStatuses();
                  }
                }}
              >
                <option value="">Selecione uma casa</option>
                {bettingHouses.map(house => (
                  <option key={house.id} value={house.id}>
                    {house.name}
                  </option>
                ))}
              </select>
                <Building2 className="absolute left-2 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
            </div>
          </div>
          <div className="flex gap-4">
            <ColumnSelector
              columns={tableColumns}
              visibleColumns={visibleColumns}
              onColumnToggle={toggleColumn}
              onSave={updateVisibleColumns}
            />
            <button
              onClick={() => setShowPasswords(!showPasswords)}
              className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              {showPasswords ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
              {showPasswords ? 'Ocultar Senhas' : 'Mostrar Senhas'}
            </button>
            
            {/* Excel Operations Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowExcelMenu(!showExcelMenu)}
                className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <FileDown className="w-4 h-4 mr-2" />
                Excel
                <ChevronDown className="w-4 h-4 ml-2" />
              </button>
              
              {showExcelMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        downloadTemplate();
                        setShowExcelMenu(false);
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <FileDown className="w-4 h-4 mr-2" />
                      Template Excel
                    </button>
                    <button
                      onClick={() => {
                        exportToExcel();
                        setShowExcelMenu(false);
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <FileDown className="w-4 h-4 mr-2" />
                      Exportar XLSX
                    </button>
                    <button
                      onClick={() => {
                        fileInputRef.current?.click();
                        setShowExcelMenu(false);
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      disabled={importing}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {importing ? 'Importando...' : 'Importar XLSX'}
                    </button>
                  </div>
                </div>
              )}
              
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImportExcel}
                accept=".xlsx,.xls"
                className="hidden"
                disabled={importing}
              />
            </div>

            <button
              onClick={handleAddNew}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Cadastro
            </button>
          </div>
        </div>

        {selectedHouse && (
          <>
            <div className="p-4 space-y-2">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Pesquisar..."
                    className="w-full pl-10 p-2 border border-gray-300 rounded-md"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="w-48">
                  <select
                    className="w-full p-2 border border-gray-300 rounded-md bg-white"
                    value={selectedResponsible}
                    onChange={(e) => setSelectedResponsible(e.target.value)}
                  >
                    <option value="">Todos os Responsáveis</option>
                    {responsavelOptions.map(option => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-48">
                  <select
                    className="w-full p-2 border border-gray-300 rounded-md bg-white"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                  >
                    <option value="">Todos os Status</option>
                    {statusOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.value}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-48">
                  <select
                    className="w-full p-2 border border-gray-300 rounded-md bg-white"
                    value={selectedVerification}
                    onChange={(e) => setSelectedVerification(e.target.value)}
                  >
                    <option value="">Todas as Verificações</option>
                    {verificationOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.value}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="text-sm font-medium text-green-800">Total Saldo</div>
                  <div className="text-lg font-bold text-green-600">{totals.totalSaldo}</div>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="text-sm font-medium text-blue-800">Total Depósito</div>
                  <div className="text-lg font-bold text-blue-600">{totals.totalDeposito}</div>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg">
                  <div className="text-sm font-medium text-purple-800">Total Sacado</div>
                  <div className="text-lg font-bold text-purple-600">{totals.totalSacado}</div>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto max-w-full">
  <table className="w-full table-auto">
                <thead className="bg-gray-50">
                  <tr>
                    {tableColumns.map(column => (
                      isColumnVisible(column.id) && (
                        <th key={column.id} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {column.label}
                        </th>
                      )
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {isAddingNew && (
                    <tr>
                      {isColumnVisible('item') && (
                        <td className="px-6 py-4">
                          <span className="text-gray-500">Auto</span>
                        </td>
                      )}
                      {isColumnVisible('responsavel') && (
                        <td className="px-6 py-4">
                          <select
                            className="w-full p-1 border rounded"
                            value={newAccount.responsavel || ''}
                            onChange={(e) => setNewAccount({ ...newAccount, responsavel: e.target.value })}
                          >
                            <option value="">Selecione...</option>
                            {responsavelOptions.map(option => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        </td>
                      )}
                      {isColumnVisible('status') && (
  <td className="px-6 py-4">
    <StatusSelect
      value={newAccount.status}
      onChange={(value) => setNewAccount({ ...newAccount, status: value })}
      className="border rounded"
    />
  </td>
)}

{isColumnVisible('verification') && (
  <td className="px-6 py-4">
    <VerificationSelect
      value={newHouseData.verification}
      onChange={(value) => setNewHouseData({ ...newHouseData, verification: value })}
      className="border rounded"
    />
  </td>
)}
                      {isColumnVisible('name') && (
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            className="w-full p-1 border rounded"
                            value={newAccount.name || ''}
                            onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                          />
                        </td>
                      )}
                      {isColumnVisible('cpf') && (
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            className="w-full p-1 border rounded"
                            value={newAccount.cpf || ''}
                            onChange={(e) => setNewAccount({ ...newAccount, cpf: e.target.value })}
                          />
                        </td>
                      )}
                      {isColumnVisible('birth_date') && (
                        <td className="px-6 py-4">
                          <input
                            type="date"
                            className="w-full p-1 border rounded"
                            value={newAccount.birth_date || ''}
                            onChange={(e) => setNewAccount({ ...newAccount, birth_date: e.target.value })}
                          />
                        </td>
                      )}
                      {isColumnVisible('address') && (
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            className="w-full p-1 border rounded"
                            value={newAccount.address || ''}
                            onChange={(e) => setNewAccount({ ...newAccount, address: e.target.value })}
                          />
                        </td>
                      )}
                      {isColumnVisible('email1') && (
                        <td className="px-6 py-4">
                          <input
                            type="email"
                            className="w-full p-1 border rounded"
                            value={newAccount.email1 || ''}
                            onChange={(e) => setNewAccount({ ...newAccount, email1: e.target.value })}
                          />
                        </td>
                      )}
                      {isColumnVisible('password1') && (
                        <td className="px-6 py-4">
                          <input
                            type={showPasswords ? "text" : "password"}
                            className="w-full p-1 border rounded"
                            value={newAccount.password1 || ''}
                            onChange={(e) => setNewAccount({ ...newAccount, password1: e.target.value })}
                          />
                        </td>
                      )}
                      {isColumnVisible('chip') && (
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            className="w-full p-1 border rounded"
                            value={newAccount.chip || ''}
                            onChange={(e) => setNewAccount({ ...newAccount, chip: e.target.value })}
                          />
                        </td>
                      )}
                     {isColumnVisible('saldo') && (
                        <td className="px-6 py-4">
                          <CurrencyInput
                            value={newHouseData.saldo}
                            onChange={(value) => setNewHouseData({...newHouseData, saldo: value})}
                            placeholder="R$ 0,00"
                          />
                        </td>
                      )}

                      {isColumnVisible('deposito') && (
                        <td className="px-6 py-4">
                          <CurrencyInput
                            value={newHouseData.deposito}
                            onChange={(value) => setNewHouseData({...newHouseData, deposito: value})}
                            placeholder="R$ 0,00"
                          />
                        </td>
                      )}

{isColumnVisible('sacado') && (
  <td className="px-6 py-4">
    <CurrencyInput
      value={newHouseData.sacado}
      onChange={(value) => setNewHouseData({...newHouseData, sacado: value})}
      placeholder="R$ 0,00"
    />
  </td>
)}

{isColumnVisible('creditos') && (
  <td className="px-6 py-4">
    <CurrencyInput
      value={newHouseData.creditos}
      onChange={(value) => setNewHouseData({...newHouseData, creditos: value})}
      placeholder="R$ 0,00"
    />
  </td>
)}

{isColumnVisible('obs') && (
  <td className="px-6 py-4">
    <input
      type="text"
      className="w-full p-1 border rounded"
      placeholder="Observações"
      value={newHouseData.obs}
      onChange={(e) => setNewHouseData({...newHouseData, obs: e.target.value})}
    />
  </td>
)}
                      {isColumnVisible('whatsapp') && (
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleAddNew()}
                            className="text-green-600 hover:text-green-900"
                          >
                            <Check className="w-5 h-5" />
                          </button>
                        </td>
                      )}
                      {isColumnVisible('actions') && (
                        <td className="px-6 py-4">
                          <button
                            onClick={() => setIsAddingNew(false)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  )}
                  {paginatedAccounts.map((account) => (
                    <tr key={account.id}>
                      {isColumnVisible('item') && (
                        <td className="px-6 py-4">{account.item}</td>
                      )}
                      {isColumnVisible('responsavel') && (
                        <td className="px-6 py-4">
                          <select
                            className="w-full p-1 border rounded"
                            value={account.responsavel}
                            onChange={(e) => handleEdit(account.id, 'responsavel', e.target.value)}
                          >
                            {responsavelOptions.map(option => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        </td>
                      )}
                      {isColumnVisible('status') && (
                        <td className="px-6 py-4">
                          {selectedHouse ? (
                            <StatusSelect
                              value={accountStatuses[account.id]?.status || ''}
                              onChange={(value) => handleStatusChange(account.id, 'status', value)}
                            />
                          ) : (
                            <StatusSelect
                              value={account.status}
                              onChange={(value) => handleEdit(account.id, 'status', value)}
                            />
                          )}
                        </td>
                      )}
                      {isColumnVisible('verification') && (
                        <td className="px-6 py-4">
                          {selectedHouse ? (
                            <VerificationSelect
                              value={accountStatuses[account.id]?.verification || ''}
                              onChange={(value) => handleStatusChange(account.id, 'verification', value)}
                            />
                          ) : (
                            <VerificationSelect
                              value={account.verification || ''}
                              onChange={(value) => handleEdit(account.id, 'verification', value)}
                            />
                          )}
                        </td>
                      )}
                      {isColumnVisible('name') && (
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            className="w-full p-1 border rounded"
                            value={account.name}
                            onChange={(e) => handleEdit(account.id, 'name', e.target.value)}
                          />
                        </td>
                      )}
                      {isColumnVisible('cpf') && (
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            className="w-full p-1 border rounded"
                            value={account.cpf}
                            onChange={(e) => handleEdit(account.id, 'cpf', e.target.value)}
                          />
                        </td>
                      )}
                      {isColumnVisible('birth_date') && (
                        <td className="px-6 py-4">
                          <input
                            type="date"
                            className="w-full p-1 border rounded"
                            value={account.birth_date}
                            onChange={(e) => handleEdit(account.id, 'birth_date', e.target.value)}
                          />
                        </td>
                      )}
                      {isColumnVisible('address') && (
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            className="w-full p-1 border rounded"
                            value={account.address || ''}
                            onChange={(e) => handleEdit(account.id, 'address', e.target.value)}
                          />
                        </td>
                      )}
                      {isColumnVisible('email1') && (
                        <td className="px-6 py-4">
                          <input
                            type="email"
                            className="w-full p-1 border rounded"
                            value={account.email1 || ''}
                            onChange={(e) => handleEdit(account.id, 'email1', e.target.value)}
                          />
                        </td>
                      )}
                      {isColumnVisible('password1') && (
                        <td className="px-6 py-4">
                          <input
                            type={showPasswords ? "text" : "password"}
                            className="w-full p-1 border rounded"
                            value={account.password1 || ''}
                            onChange={(e) => handleEdit(account.id, 'password1', e.target.value)}
                          />
                        </td>
                      )}
                      {isColumnVisible('chip') && (
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            className="w-full p-1 border rounded"
                            value={account.chip || ''}
                            onChange={(e) => handleEdit(account.id, 'chip', e.target.value)}
                          />
                        </td>
                      )}
                      {isColumnVisible('saldo') && (
                        <td className="px-6 py-4">
                          <CurrencyInput
                            value={accountStatuses[account.id]?.saldo || ''}
                            onChange={(value) => handleStatusChange(account.id, 'saldo', value)}
                          />
                        </td>
                      )}
                      {isColumnVisible('deposito') && (
                        <td className="px-6 py-4">
                          <CurrencyInput
                            value={accountStatuses[account.id]?.deposito || ''}
                            onChange={(value) => handleStatusChange(account.id, 'deposito', value)}
                          />
                        </td>
                      )}
                      {isColumnVisible('sacado') && (
                        <td className="px-6 py-4">
                          <CurrencyInput
                            value={accountStatuses[account.id]?.sacado || ''}
                            onChange={(value) => handleStatusChange(account.id, 'sacado', value)}
                          />
                        </td>
                      )}
                      {isColumnVisible('creditos') && (
                        <td className="px-6 py-4">
                          <CurrencyInput
                            value={accountStatuses[account.id]?.creditos || ''}
                            onChange={(value) => handleStatusChange(account.id, 'creditos', value)}
                          />
                        </td>
                      )}
                      {isColumnVisible('obs') && (
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            className="w-full p-1 border rounded"
                            placeholder="Observações"
                            value={accountStatuses[account.id]?.obs || ''}
                            onChange={(e) => handleStatusChange(account.id, 'obs', e.target.value)}
                          />
                        </td>
                      )}
                      {isColumnVisible('whatsapp') && (
                        <td className="px-6 py-4">
                          <div className="flex justify-center items-center">
                            <div className="relative">
                              <button
                                onClick={() => setShowTemplateMenu(showTemplateMenu === account.id ? null : account.id)}
                                className="text-gray-600 hover:text-gray-900"
                              >
                                <MessageCircle className="w-5 h-5" />
                              </button>
                              {showTemplateMenu === account.id && (
                                <div className="absolute z-10 right-0 mt-2 w-48 bg-white rounded-md shadow-lg">
                                  <div className="py-1">
                                    {whatsappTemplates.map(template => (
                                      <a
                                        key={template.name}
                                        href={getWhatsAppLink(account.phone, account)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        onClick={() => setShowTemplateMenu(null)}
                                      >
                                        {template.name}
                                      </a>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      )}
                      {isColumnVisible('actions') && (
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleDelete(account.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="px-6 py-4 flex justify-between items-center border-t border-gray-200">
                <div>
                  <p className="text-sm text-gray-700">
                    Mostrando <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> a{' '}
                    <span className="font-medium">
                      {Math.min(currentPage * itemsPerPage, filteredAccounts.length)}
                    </span>{' '}
                    de <span className="font-medium">{filteredAccounts.length}</span> resultados
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border rounded-md disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border rounded-md disabled:opacity-50"
                  >
                    Próxima
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default CPFAccounts;