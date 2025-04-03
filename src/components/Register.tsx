
//Register.tsx
import React, { useState } from 'react';
import { UserPlus, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom'; // Importe o hook useNavigate

interface RegisterProps {
  onRegister: (email: string, password: string) => Promise<boolean>;
  switchToLogin: () => void;
  isLoading: boolean;
}
interface RegisterProps {
  onRegister: (email: string, password: string) => Promise<boolean>;
  switchToLogin: () => void; // Podemos manter essa prop por compatibilidade
  isLoading: boolean;
}
const Register: React.FC<RegisterProps> = ({ onRegister, switchToLogin, isLoading }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const navigate = useNavigate();

  // Função para navegar para a página de login
  const goToLogin = () => {
    navigate('/login');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validação de formulário
    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    try {
      const success = await onRegister(email, password);
      if (!success) {
        setError('Falha ao criar conta. Este email pode já estar em uso.');
      }
    } catch (err) {
      setError('Erro ao se conectar com o servidor. Tente novamente mais tarde.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-96">
        <div className="flex flex-col items-center mb-6">
          <div className="bg-green-500 p-3 rounded-full">
            <UserPlus className="w-8 h-8 text-white" />
          </div>
          <h2 className="mt-4 text-2xl font-bold text-gray-900">Criar Conta</h2>
          <p className="mt-2 text-gray-600">Preencha os dados para se registrar</p>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Digite seu email"
              required
              disabled={isLoading}
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
              Senha
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="••••••••"
              required
              disabled={isLoading}
              minLength={6}
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="confirmPassword">
              Confirmar Senha
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="••••••••"
              required
              disabled={isLoading}
            />
          </div>
          
          <button
            type="submit"
            className="w-full bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition duration-200 flex items-center justify-center mb-4"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader className="animate-spin w-5 h-5 mr-2" />
                Processando...
              </>
            ) : (
              'Criar Conta'
            )}
          </button>
          
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Já possui uma conta?{' '}
              <button 
            type="button" 
            onClick={goToLogin} // Use a nova função em vez de switchToLogin
            className="text-blue-500 hover:text-blue-700 font-medium"
          >
            Faça login
          </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;