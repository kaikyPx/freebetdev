import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { KeyRound, Copy, Search, ChevronLeft, ChevronRight, RefreshCw, Send, FileText, ChevronDown, Plus, Upload, X } from 'lucide-react';
import { useAccounts } from '../hooks/useAccounts';
import { formatCurrency } from '../utils/currency';

const MySwal = withReactContent(Swal);

interface ChildAccount {
  id: string;
  status: 'Aprovado' | 'Pendente' | 'Reprovado';
  cpf: string;
  name: string;
  accountNumber: string;
  balance: number;
  pixKeys: {
    cpf: boolean;
    random: boolean;
    email: boolean;
  };
}

interface FormData {
  cpf: string;
  name: string;
  birthDate: string;
  email: string;
  phone: string;
  motherName: string;
  cep: string;
  address: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  rg: string;
  rgDate: string;
  rgOrgan: string;
  rgState: string;
  frontDoc: File | null;
  backDoc: File | null;
  selfieDoc: File | null;
}

const Fintech: React.FC = () => {
  const { accounts, addAccount } = useAccounts();
  const [childAccounts, setChildAccounts] = useState<ChildAccount[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(7);
  const [searchTerm, setSearchTerm] = useState('');
  const [balance, setBalance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showStatement, setShowStatement] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<ChildAccount | null>(null);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [selectedAccountForDeposit, setSelectedAccountForDeposit] = useState<ChildAccount | null>(null);
  const [qrCodeValue, setQrCodeValue] = useState('');
  const [qrCodeDestination, setQrCodeDestination] = useState('');
  const [qrCodeAmount, setQrCodeAmount] = useState(0);
  const [formData, setFormData] = useState<FormData>({
    cpf: '',
    name: '',
    birthDate: '',
    email: '',
    phone: '',
    motherName: '',
    cep: '',
    address: '',
    number: '',
    neighborhood: '',
    city: '',
    state: '',
    rg: '',
    rgDate: '',
    rgOrgan: '',
    rgState: '',
    frontDoc: null,
    backDoc: null,
    selfieDoc: null
  });

  useEffect(() => {
    const converted = accounts.map(account => ({
      id: account.id,
      status: 'Pendente' as const,
      cpf: account.cpf,
      name: account.name,
      accountNumber: `${Math.floor(Math.random() * 90000) + 10000}-${Math.floor(Math.random() * 9)}`,
      balance: Math.random() * 10000,
      pixKeys: {
        cpf: false,
        random: false,
        email: false
      }
    }));
    setChildAccounts(converted);
  }, [accounts]);

  const handleCopyKey = () => {
    navigator.clipboard.writeText('216aa381-db33-492f-9bcd-8f0eb3908629');
    MySwal.fire({
      title: 'Chave copiada!',
      icon: 'success',
      timer: 1500,
      showConfirmButton: false
    });
  };

  const handleRefreshBalance = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setBalance(prevBalance => prevBalance + 100);
    setIsRefreshing(false);
  };

  const handlePixKeyAction = async (accountId: string, keyType: 'cpf' | 'random' | 'email', isActive: boolean) => {
    const result = await MySwal.fire({
      title: `${isActive ? 'Desativar' : 'Ativar'} chave PIX`,
      text: `Deseja realmente ${isActive ? 'desativar' : 'ativar'} a chave PIX ${keyType.toUpperCase()}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sim',
      cancelButtonText: 'Não'
    });

    if (result.isConfirmed) {
      setChildAccounts(prev => prev.map(account => {
        if (account.id === accountId) {
          return {
            ...account,
            pixKeys: {
              ...account.pixKeys,
              [keyType]: !isActive
            }
          };
        }
        return account;
      }));

      if (!isActive) {
        await MySwal.fire({
          title: 'Chave PIX será vinculada',
          text: 'A chave será vinculada nos próximos segundos.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      }
    }
  };

  const fetchAddressByCep = async (cep: string) => {
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep.replace(/\D/g, '')}/json/`);
      const data = await response.json();
      
      if (!data.erro) {
        setFormData(prev => ({
          ...prev,
          address: data.logradouro,
          neighborhood: data.bairro,
          city: data.localidade,
          state: data.uf
        }));
      }
    } catch (error) {
      console.error('Error fetching CEP:', error);
    }
  };

  const handleStartRegistration = async () => {
    const result = await MySwal.fire({
      title: 'Processo de Abertura de Conta Operação',
      html: `
        <p>Custo de Abertura: R$ 20,00</p>
        <p>Será descontado diariamente de sua conta mãe o valor de R$ 1,00 até completar o custo total em 20 dias, assim não pesará o seu bolso.</p>
        <p>Se não houver saldo em conta mãe a conta será recusada.</p>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sim',
      cancelButtonText: 'Não'
    });

    if (result.isConfirmed) {
      setShowRegistrationModal(true);
      setCurrentStep(1);
    }
  };

  const handleSubmitStep = async () => {
    let isValid = true;

    switch (currentStep) {
      case 1:
        if (!formData.cpf || !formData.name || !formData.birthDate || !formData.email || !formData.phone) {
          isValid = false;
        }
        break;

      case 2:
        if (!formData.motherName || !formData.cep || !formData.address || !formData.number || 
            !formData.neighborhood || !formData.city || !formData.state || !formData.rg || 
            !formData.rgDate || !formData.rgOrgan || !formData.rgState) {
          isValid = false;
        }
        break;

      case 3:
        if (!formData.frontDoc || !formData.backDoc || !formData.selfieDoc) {
          isValid = false;
        }
        break;
    }

    if (!isValid) {
      MySwal.fire({
        title: 'Campos Obrigatórios',
        text: 'Por favor, preencha todos os campos obrigatórios.',
        icon: 'error'
      });
      return;
    }

    if (currentStep < 3) {
      setCurrentStep(prev => prev + 1);
    } else {
      setShowRegistrationModal(false);
      await MySwal.fire({
        title: 'Cadastro Enviado!',
        html: 'Sua conta foi enviada para aprovação na liquidante e pode demorar até <b style="color: red;">48 horas úteis para aprovação ou reprovação</b>.',
        icon: 'success'
      });
    }
  };

  const handlePreviousStep = () => {
    setCurrentStep(prev => Math.max(1, prev - 1));
  };

  const handleDeposit = (account: ChildAccount) => {
    setSelectedAccountForDeposit(account);
    setShowDepositModal(true);
  };

  const handleQrCodeSubmit = async () => {
    // Here you would normally parse the QR code to get destination and amount
    // For this example, we'll simulate parsing a PIX QR code
    const parsedAmount = 150.00; // Example amount
    const parsedDestination = "Mercado Pago"; // Example destination
    
    setQrCodeAmount(parsedAmount);
    setQrCodeDestination(parsedDestination);

    const confirmResult = await MySwal.fire({
      title: 'Confirmar Transferência',
      html: `
        <p>Confirma a transferência no valor de ${formatCurrency(parsedAmount)} para: ${parsedDestination}?</p>
        <p class="text-sm text-gray-600 mt-2">Conta: ${selectedAccountForDeposit?.name}</p>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33'
    });

    if (confirmResult.isConfirmed) {
      await MySwal.fire({
        title: 'Processando Pagamento',
        text: 'O pagamento será processado em alguns instantes.',
        icon: 'info',
        timer: 2000,
        showConfirmButton: false
      });

      setShowDepositModal(false);
      setQrCodeValue('');
      setSelectedAccountForDeposit(null);
    }
  };

  const filteredAccounts = childAccounts.filter(account => 
    account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.cpf.includes(searchTerm) ||
    account.accountNumber.includes(searchTerm)
  );

  const paginatedAccounts = filteredAccounts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredAccounts.length / itemsPerPage);

  return (
    <div className="flex-1 p-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <div>
              <p className="text-sm text-gray-600"><strong>Depósito Conta Mãe:</strong></p>
              <div className="flex items-center gap-2">
                <p className="font-mono text-gray-800">216aa381-db33-492f-9bcd-8f0eb3908629</p>
                <button
                  onClick={handleCopyKey}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <Copy className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>
            <button
              className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg flex items-center gap-2"
              onClick={() => setShowStatement(true)}
            >
              <FileText className="w-4 h-4" />
              Extrato
            </button>
          </div>
          <div className="h-8 w-px bg-gray-200" />
          <div className="flex items-center gap-6">
            <div>
              <p className="text-sm text-gray-600">Saldo Conta Mãe</p>
              <div className="flex items-center gap-2">
                <p className="font-medium text-gray-800">{formatCurrency(balance)}</p>
                <button
                  onClick={handleRefreshBalance}
                  className={`p-1 hover:bg-gray-100 rounded ${isRefreshing ? 'animate-spin' : ''}`}
                  disabled={isRefreshing}
                >
                  <RefreshCw className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>
            <div className="h-8 w-px bg-gray-200" />
            <div className="grid grid-cols-3 gap-2">
              <div>
                <p className="text-sm text-gray-600">Banco</p>
                <p className="font-medium text-gray-800">324</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Agência</p>
                <p className="font-medium text-gray-800">0001</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Conta</p>
                <p className="font-medium text-gray-800">06600000015-3</p>
              </div>
            </div>
          </div>
        </div>
        <button
          onClick={handleStartRegistration}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
        >
          <Plus className="w-5 h-5 mr-2" />
          Cadastrar CPF Real
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">Contas Filhas</h2>
          <div className="flex gap-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar..."
                className="pl-8 pr-4 py-2 border rounded"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
            <select
              className="border rounded p-2"
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option value={7}>7 por página</option>
              <option value={10}>10 por página</option>
              <option value={25}>25 por página</option>
              <option value={50}>50 por página</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">CPF</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nº Conta</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Saldo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Depósito</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ativar Pix</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Extrato</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedAccounts.map((account) => (
                <tr key={account.id}>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      account.status === 'Aprovado' ? 'bg-green-100 text-green-800' :
                      account.status === 'Reprovado' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {account.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">{account.cpf}</td>
                  <td className="px-6 py-4">{account.name}</td>
                  <td className="px-6 py-4">{account.accountNumber}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span>{formatCurrency(account.balance)}</span>
                      <button
                        className="p-1 hover:bg-gray-100 rounded"
                        onClick={() => handleRefreshBalance()}
                        title="Atualizar saldo"
                      >
                        <RefreshCw className="w-4 h-4 text-gray-600" />
                      </button>
                      <button
                        className="p-1 hover:bg-gray-100 rounded"
                        onClick={() => {}}
                        title="Enviar saldo para conta mãe"
                      >
                        <Send className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleDeposit(account)}
                      className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Fazer Depósito
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="relative">
                      <button
                        className="px-3 py-1 border rounded flex items-center gap-2"
                        onClick={() => setOpenDropdownId(openDropdownId === account.id ? null : account.id)}
                      >
                        Chave PIX
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      
                      {openDropdownId === account.id && (
                        <div className="absolute z-10 mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200">
                          <div className="py-1">
                            <div className="px-4 py-2 flex justify-between items-center hover:bg-gray-50">
                              <span>CHAVE CPF</span>
                              <button
                                onClick={() => handlePixKeyAction(account.id, 'cpf', account.pixKeys.cpf)}
                                className={`px-3 py-1 rounded text-sm ${
                                  account.pixKeys.cpf
                                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                                }`}
                              >
                                {account.pixKeys.cpf ? 'Desativar chave' : 'Ativar'}
                              </button>
                            </div>
                            
                            <div className="px-4 py-2 flex justify-between items-center hover:bg-gray-50">
                              <span>CHAVE ALEATÓRIA</span>
                              <button
                                onClick={() => handlePixKeyAction(account.id, 'random', account.pixKeys.random)}
                                className={`px-3 py-1 rounded text-sm ${
                                  account.pixKeys.random
                                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                                }`}
                              >
                                {account.pixKeys.random ? 'Desativar chave' : 'Ativar'}
                              </button>
                            </div>
                            
                            <div className="px-4 py-2 flex justify-between items-center hover:bg-gray-50">
                              <span>CHAVE Email</span>
                              <button
                                onClick={() => handlePixKeyAction(account.id, 'email', account.pixKeys.email)}
                                className={`px-3 py-1 rounded text-sm ${
                                  account.pixKeys.email
                                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                                }`}
                              >
                                {account.pixKeys.email ? 'Desativar chave' : 'Ativar'}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => setShowStatement(true)}
                      className="flex items-center gap-2 px-3 py-1 border rounded hover:bg-gray-100"
                    >
                      <FileText className="w-4 h-4" />
                      Extrato
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 flex justify-between items-center">
          <div className="text-sm text-gray-700">
            Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredAccounts.length)} de {filteredAccounts.length} registros
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 border rounded hover:bg-gray-50 disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 border rounded hover:bg-gray-50 disabled:opacity-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Registration Modal */}
      {showRegistrationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">
                {currentStep === 1 && 'Cadastrar Conta CPF'}
                {currentStep === 2 && 'Endereço e Documentação'}
                {currentStep === 3 && 'Upload de Documentos'}
              </h2>
              <button
                onClick={() => setShowRegistrationModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-8">
              <div className="flex items-center">
                {[1, 2, 3].map((step) => (
                  <React.Fragment key={step}>
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                      step === currentStep ? 'bg-blue-600 text-white' :
                      step < currentStep ? 'bg-green-500 text-white' :
                      'bg-gray-200 text-gray-500'
                    }`}>
                      {step < currentStep ? '✓' : step}
                    </div>
                    {step < 3 && (
                      <div className={`flex-1 h-1 mx-2 ${
                        step < currentStep ? 'bg-green-500' : 'bg-gray-200'
                      }`} />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              {currentStep === 1 && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
                    <input
                      type="text"
                      value={formData.cpf}
                      onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                      placeholder="Digite o CPF"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                      placeholder="Digite o nome completo"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data de Nascimento</label>
                    <input
                      type="date"
                      value={formData.birthDate}
                      onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                      placeholder="Digite o email"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                      placeholder="Digite o telefone"
                    />
                  </div>
                </>
              )}

              {currentStep === 2 && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Mãe</label>
                    <input
                      type="text"
                      value={formData.motherName}
                      onChange={(e) => setFormData({ ...formData, motherName: e.target.value })}
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                      placeholder="Digite o nome da mãe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CEP</label>
                    <input
                      type="text"
                      value={formData.cep}
                      onChange={(e) => {
                        const cep = e.target.value.replace(/\D/g, '');
                        setFormData({ ...formData, cep });
                        if (cep.length === 8) {
                          fetchAddressByCep(cep);
                        }
                      }}
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                      placeholder="Digite o CEP"
                      maxLength={8}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
                      <input
                        type="text"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                        placeholder="Digite o endereço"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Número</label>
                      <input
                        type="text"
                        value={formData.number}
                        onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                        placeholder="Digite o número"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bairro</label>
                      <input
                        type="text"
                        value={formData.neighborhood}
                        onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                        placeholder="Digite o bairro"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                        placeholder="Digite a cidade"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">UF</label>
                      <input
                        type="text"
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                        placeholder="Digite o estado"
                        maxLength={2}
                      />
                    </div>
                  </div>

                  <hr className="my-6" />

                  <h3 className="text-lg font-semibold mb-4">Dados do documento</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Número do RG</label>
                      <input
                        type="text"
                        value={formData.rg}
                        onChange={(e) => setFormData({ ...formData, rg: e.target.value })}
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                        placeholder="Digite o RG"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Data de Expedição</label>
                      <input
                        type="date"
                        value={formData.rgDate}
                        onChange={(e) => setFormData({ ...formData, rgDate: e.target.value })}
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Órgão Expedidor</label>
                      <input
                        type="text"
                        value={formData.rgOrgan}
                        onChange={(e) => setFormData({ ...formData, rgOrgan: e.target.value })}
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                        placeholder="Digite o órgão expedidor"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">UF</label>
                      <input
                        type="text"
                        value={formData.rgState}
                        onChange={(e) => setFormData({ ...formData, rgState: e.target.value })}
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                        placeholder="Digite o estado"
                        maxLength={2}
                      />
                    </div>
                  </div>
                </>
              )}

              {currentStep === 3 && (
                <>
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Envie a FRENTE DO DOCUMENTO</h3>
                    <div
                      className="border-2 border-dashed p-8 rounded-lg text-center cursor-pointer hover:bg-gray-50 transition-colors"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const file = e.dataTransfer.files[0];
                        if (file) {
                          setFormData(prev => ({ ...prev, frontDoc: file }));
                        }
                      }}
                      onClick={() => document.getElementById('frontDoc')?.click()}
                    >
                      <input
                        type="file"
                        id="frontDoc"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setFormData(prev => ({ ...prev, frontDoc: file }));
                          }
                        }}
                      />
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">
                        {formData.frontDoc ? formData.frontDoc.name : 'Arraste o arquivo aqui ou clique para selecionar'}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-4">Envie o VERSO DO DOCUMENTO</h3>
                    <div
                      className="border-2 border-dashed p-8 rounded-lg text-center cursor-pointer hover:bg-gray-50 transition-colors"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const file = e.dataTransfer.files[0];
                        if (file) {
                          setFormData(prev => ({ ...prev, backDoc: file }));
                        }
                      }}
                      onClick={() => document.getElementById('backDoc')?.click()}
                    >
                      <input
                        type="file"
                        id="backDoc"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setFormData(prev => ({ ...prev, backDoc: file }));
                          }
                        }}
                      />
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">
                        {formData.backDoc ? formData.backDoc.name : 'Arraste o arquivo aqui ou clique para selecionar'}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-4">Envie a SELFIE SEGURANDO O DOCUMENTO</h3>
                    <div
                      className="border-2 border-dashed p-8 rounded-lg text-center cursor-pointer hover:bg-gray-50 transition-colors"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const file = e.dataTransfer.files[0];
                        if (file) {
                          setFormData(prev => ({ ...prev, selfieDoc: file }));
                        }
                      }}
                      onClick={() => document.getElementById('selfieDoc')?.click()}
                    >
                      <input
                        type="file"
                        id="selfieDoc"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setFormData(prev => ({ ...prev, selfieDoc: file }));
                          }
                        }}
                      />
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">
                        {formData.selfieDoc ? formData.selfieDoc.name : 'Arraste o arquivo aqui ou clique para selecionar'}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-between mt-8">
              <button
                onClick={handlePreviousStep}
                className={`px-6 py-2 text-gray-600 hover:text-gray-800 ${currentStep === 1 ? 'invisible' : ''}`}
              >
                Voltar
              </button>
              <button
                onClick={handleSubmitStep}
                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                {currentStep === 3 ? 'Concluir Cadastro' : 'Prosseguir'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deposit Modal */}
      {showDepositModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Depósito QR</h3>
              <button
                onClick={() => {
                  setShowDepositModal(false);
                  setQrCodeValue('');
                  setSelectedAccountForDeposit(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-gray-700 mb-2">
                Conta filha: <span className="font-semibold">{selectedAccountForDeposit?.name}</span>
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Insira o QR CODE:
              </label>
              <textarea
                value={qrCodeValue}
                onChange={(e) => setQrCodeValue(e.target.value)}
                className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={4}
                placeholder="Cole o código QR aqui..."
              />
            </div>

            <button
              onClick={handleQrCodeSubmit}
              className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
            >
              Confirmar pagamento
            </button>
          </div>
        </div>
      )}

      {/* Statement Modal */}
      {showStatement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-6xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">
                {selectedAccount ? `EXTRATO - ${selectedAccount.name}` : 'EXTRATO CONTA MÃE'}
              </h2>
              <button
                onClick={() => {
                  setShowStatement(false);
                  setSelectedAccount(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Horário</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoria</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Destino/Origem</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Saldo Anterior</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Saldo Final</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4">23/03/2025 23:32:01</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                        CREDIT
                      </span>
                    </td>
                    <td className="px-6 py-4">PIX</td>
                    <td className="px-6 py-4">{formatCurrency(1500)}</td>
                    <td className="px-6 py-4">João Silva</td>
                    <td className="px-6 py-4">{formatCurrency(1000)}</td>
                    <td className="px-6 py-4">{formatCurrency(2500)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Fintech;