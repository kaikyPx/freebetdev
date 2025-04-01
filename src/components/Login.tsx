import React, { useState } from 'react';
import { KeyRound, Loader } from 'lucide-react';

interface LoginProps {
  onLogin: (email: string, password: string) => Promise<boolean>;
  switchToRegister: () => void;
  isLoading: boolean;
}

const Login: React.FC<LoginProps> = ({ onLogin, switchToRegister, isLoading }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      const success = await onLogin(email, password);
      if (!success) {
        setError('Falha ao fazer login. Verifique suas credenciais.');
      }
    } catch (err) {
      setError('Erro ao se conectar com o servidor. Tente novamente mais tarde.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-96">
        <div className="flex flex-col items-center mb-6">
          <div className="bg-blue-500 p-3 rounded-full">
            <KeyRound className="w-8 h-8 text-white" />
          </div>
          <h2 className="mt-4 text-2xl font-bold text-gray-900">Painel de Controle</h2>
          <p className="mt-2 text-gray-600">Faça login para continuar</p>
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Digite seu email"
              required
              disabled={isLoading}
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
              Senha
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
              required
              disabled={isLoading}
            />
          </div>
          
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition duration-200 flex items-center justify-center mb-4"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader className="animate-spin w-5 h-5 mr-2" />
                Verificando...
              </>
            ) : (
              'Entrar'
            )}
          </button>
          
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Não possui uma conta?{' '}
              <button 
                type="button" 
                onClick={switchToRegister}
                className="text-blue-500 hover:text-blue-700 font-medium"
              >
                Registre-se
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;