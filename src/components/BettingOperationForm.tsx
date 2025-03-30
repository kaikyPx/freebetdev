import React, { useState } from 'react';
import { X, Check, ChevronDown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAccounts } from '../hooks/useAccounts';
import { useBettingHouses } from '../hooks/useBettingHouses';
import { formatCurrency } from '../utils/currency';

interface BettingOperationFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const BettingOperationForm: React.FC<BettingOperationFormProps> = ({
  onClose,
  onSuccess
}) => {
  // Initial form state
  const [step, setStep] = useState<'initial' | 'details'>('initial');
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    gameName: '',
    activationHouses: '2',
    protectionHouses: '1'
  });

  // Operation details state
  const [operationId, setOperationId] = useState<string | null>(null);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [accountStatuses, setAccountStatuses] = useState<Record<string, {
    casa1: string;
    cpf1: string;
    stake1: string;
    casa2: string;
    cpf2: string;
    stake2: string;
    casaProt: string;
    cpfProt: string;
    stakeProt: string;
    casaVencedora: string;
    cpfVencedor: string;
  }>>({});

  const { accounts } = useAccounts();
  const { bettingHouses } = useBettingHouses();

  const handleInitialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Insert into betting_operations table
      const { data, error } = await supabase
        .from('betting_operations')
        .insert([{
          date: formData.date,
          time: formData.time,
          game_name: formData.gameName,
          status: 'Em Operação'
        }])
        .select()
        .single();

      if (error) throw error;

      setOperationId(data.id);
      setStep('details');
    } catch (error) {
      console.error('Error creating betting operation:', error);
      alert('Erro ao criar operação. Por favor, tente novamente.');
    }
  };

  const handleAccountSelect = (accountId: string) => {
    setSelectedAccounts(prev => {
      if (prev.includes(accountId)) {
        const newAccounts = prev.filter(id => id !== accountId);
        const newStatuses = { ...accountStatuses };
        delete newStatuses[accountId];
        setAccountStatuses(newStatuses);
        return newAccounts;
      } else {
        setAccountStatuses(prev => ({
          ...prev,
          [accountId]: {
            casa1: '',
            cpf1: accountId,
            stake1: '',
            casa2: '',
            cpf2: '',
            stake2: '',
            casaProt: '',
            cpfProt: '',
            stakeProt: '',
            casaVencedora: '',
            cpfVencedor: ''
          }
        }));
        return [...prev, accountId];
      }
    });
  };

  const handleStatusUpdate = (accountId: string, field: string, value: string) => {
    setAccountStatuses(prev => ({
      ...prev,
      [accountId]: {
        ...prev[accountId],
        [field]: value
      }
    }));
  };

  const handleFinalSubmit = async () => {
    try {
      // Save operation accounts
      const operationAccounts = selectedAccounts.flatMap(accountId => {
        const status = accountStatuses[accountId];
        const accounts = [];

        if (status.casa1 && status.stake1) {
          accounts.push({
            operation_id: operationId,
            account_id: status.cpf1,
            betting_house_id: status.casa1,
            stake: parseFloat(status.stake1),
            role: 'activation1'
          });
        }

        if (status.casa2 && status.stake2) {
          accounts.push({
            operation_id: operationId,
            account_id: status.cpf2,
            betting_house_id: status.casa2,
            stake: parseFloat(status.stake2),
            role: 'activation2'
          });
        }

        if (status.casaProt && status.stakeProt) {
          accounts.push({
            operation_id: operationId,
            account_id: status.cpfProt,
            betting_house_id: status.casaProt,
            stake: parseFloat(status.stakeProt),
            role: 'protection'
          });
        }

        return accounts;
      });

      const { error } = await supabase
        .from('operation_accounts')
        .insert(operationAccounts);

      if (error) throw error;

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving operation details:', error);
      alert('Erro ao salvar detalhes da operação. Por favor, tente novamente.');
    }
  };

  if (step === 'initial') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Nova Operação</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleInitialSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hora
              </label>
              <input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome do Jogo
              </label>
              <input
                type="text"
                value={formData.gameName}
                onChange={(e) => setFormData({ ...formData, gameName: e.target.value })}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: Manchester City vs Arsenal"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantidade de Casas de Ativação
              </label>
              <select
                value={formData.activationHouses}
                onChange={(e) => setFormData({ ...formData, activationHouses: e.target.value })}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              >
                <option value="1">1 Casa</option>
                <option value="2">2 Casas</option>
                <option value="3">3 Casas</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantidade de Casas de Proteção
              </label>
              <select
                value={formData.protectionHouses}
                onChange={(e) => setFormData({ ...formData, protectionHouses: e.target.value })}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              >
                <option value="1">1 Casa</option>
                <option value="2">2 Casas</option>
                <option value="3">3 Casas</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Próximo
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-7xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold">{formData.gameName}</h2>
            <p className="text-sm text-gray-600">
              {new Date(formData.date).toLocaleDateString('pt-BR')} às {formData.time}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-6">
          <div className="relative">
            <button
              className="px-4 py-2 border rounded flex items-center gap-2"
              onClick={() => {}}
            >
              <span>CPFs Selecionados ({selectedAccounts.length})</span>
              <ChevronDown className="w-4 h-4" />
            </button>
            <div className="absolute z-10 mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200">
              <div className="p-2 border-b">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedAccounts.length === accounts.length}
                    onChange={() => {
                      if (selectedAccounts.length === accounts.length) {
                        setSelectedAccounts([]);
                        setAccountStatuses({});
                      } else {
                        const allAccountIds = accounts.map(acc => acc.id);
                        setSelectedAccounts(allAccountIds);
                        const newStatuses = Object.fromEntries(
                          allAccountIds.map(id => [id, {
                            casa1: '',
                            cpf1: id,
                            stake1: '',
                            casa2: '',
                            cpf2: '',
                            stake2: '',
                            casaProt: '',
                            cpfProt: '',
                            stakeProt: '',
                            casaVencedora: '',
                            cpfVencedor: ''
                          }])
                        );
                        setAccountStatuses(newStatuses);
                      }
                    }}
                    className="rounded border-gray-300"
                  />
                  <span className="font-medium">Selecionar Todos</span>
                </label>
              </div>
              <div className="p-2 max-h-48 overflow-y-auto">
                {accounts.map(account => (
                  <label key={account.id} className="flex items-center gap-2 py-1">
                    <input
                      type="checkbox"
                      checked={selectedAccounts.includes(account.id)}
                      onChange={() => handleAccountSelect(account.id)}
                      className="rounded border-gray-300"
                    />
                    <span>{account.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left">Casa 1 Ativação</th>
                <th className="px-4 py-2 text-left">CPF 1 Ativação</th>
                <th className="px-4 py-2 text-left">Stake 1</th>
                <th className="px-4 py-2 text-left">Casa 2 Ativação</th>
                <th className="px-4 py-2 text-left">CPF 2 Ativação</th>
                <th className="px-4 py-2 text-left">Stake 2</th>
                <th className="px-4 py-2 text-left">Casa Proteção</th>
                <th className="px-4 py-2 text-left">CPF Proteção</th>
                <th className="px-4 py-2 text-left">Stake</th>
                <th className="px-4 py-2 text-left">Casa Vencedora</th>
                <th className="px-4 py-2 text-left">CPF Vencedor</th>
              </tr>
            </thead>
            <tbody>
              {selectedAccounts.map(accountId => {
                const status = accountStatuses[accountId];
                return (
                  <tr key={accountId}>
                    <td className="px-4 py-2">
                      <select
                        className="w-full p-2 border rounded"
                        value={status.casa1}
                        onChange={(e) => handleStatusUpdate(accountId, 'casa1', e.target.value)}
                      >
                        <option value="">Selecione</option>
                        {bettingHouses.map(house => (
                          <option key={house.id} value={house.id}>{house.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-2">
                      <select
                        className="w-full p-2 border rounded"
                        value={status.cpf1}
                        onChange={(e) => handleStatusUpdate(accountId, 'cpf1', e.target.value)}
                      >
                        <option value="">Selecione</option>
                        {accounts.map(account => (
                          <option key={account.id} value={account.id}>{account.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        className="w-full p-2 border rounded"
                        value={status.stake1}
                        onChange={(e) => handleStatusUpdate(accountId, 'stake1', e.target.value)}
                        placeholder="R$ 0,00"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <select
                        className="w-full p-2 border rounded"
                        value={status.casa2}
                        onChange={(e) => handleStatusUpdate(accountId, 'casa2', e.target.value)}
                      >
                        <option value="">Selecione</option>
                        {bettingHouses.map(house => (
                          <option key={house.id} value={house.id}>{house.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-2">
                      <select
                        className="w-full p-2 border rounded"
                        value={status.cpf2}
                        onChange={(e) => handleStatusUpdate(accountId, 'cpf2', e.target.value)}
                      >
                        <option value="">Selecione</option>
                        {accounts.map(account => (
                          <option key={account.id} value={account.id}>{account.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        className="w-full p-2 border rounded"
                        value={status.stake2}
                        onChange={(e) => handleStatusUpdate(accountId, 'stake2', e.target.value)}
                        placeholder="R$ 0,00"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <select
                        className="w-full p-2 border rounded"
                        value={status.casaProt}
                        onChange={(e) => handleStatusUpdate(accountId, 'casaProt', e.target.value)}
                      >
                        <option value="">Selecione</option>
                        {bettingHouses.map(house => (
                          <option key={house.id} value={house.id}>{house.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-2">
                      <select
                        className="w-full p-2 border rounded"
                        value={status.cpfProt}
                        onChange={(e) => handleStatusUpdate(accountId, 'cpfProt', e.target.value)}
                      >
                        <option value="">Selecione</option>
                        {accounts.map(account => (
                          <option key={account.id} value={account.id}>{account.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        className="w-full p-2 border rounded"
                        value={status.stakeProt}
                        onChange={(e) => handleStatusUpdate(accountId, 'stakeProt', e.target.value)}
                        placeholder="R$ 0,00"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <select
                        className="w-full p-2 border rounded"
                        value={status.casaVencedora}
                        onChange={(e) => handleStatusUpdate(accountId, 'casaVencedora', e.target.value)}
                      >
                        <option value="">Selecione</option>
                        {bettingHouses.map(house => (
                          <option key={house.id} value={house.id}>{house.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-2">
                      <select
                        className="w-full p-2 border rounded"
                        value={status.cpfVencedor}
                        onChange={(e) => handleStatusUpdate(accountId, 'cpfVencedor', e.target.value)}
                      >
                        <option value="">Selecione</option>
                        {accounts.map(account => (
                          <option key={account.id} value={account.id}>{account.name}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancelar
          </button>
          <button
            onClick={handleFinalSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            Salvar Operação
          </button>
        </div>
      </div>
    </div>
  );
};