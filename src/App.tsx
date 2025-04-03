import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';

import Login from './components/Login';
import Register from './components/Register';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import CPFAccounts from './components/CPFAccounts';
import ControleGeral from './components/ControleGeral';
import Organization from './components/Organization';
import MinhasBancas from './components/MinhasBancas';
import Fintech from './components/Fintech';
import { authService } from './services/supabaseService';

// Componente de proteção de rotas
interface ProtectedRouteProps {
  children: React.ReactNode;
  isAuthenticated: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, isAuthenticated }) => {
  const location = useLocation();
  
  if (!isAuthenticated) {
    // Redirecionar para login e salvar o local atual para retornar depois do login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<{id: string, email: string} | null>(null);
  const [showRegister, setShowRegister] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Verificar autenticação ao iniciar o app
  useEffect(() => {
    const checkAuth = () => {
      const tokenCheck = authService.verifyToken();
      
      if (tokenCheck.valid && tokenCheck.user) {
        setIsAuthenticated(true);
        setUser(tokenCheck.user);
      } else {
        // Limpar dados inválidos
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('isAuthenticated');
        setIsAuthenticated(false);
        setUser(null);
      }
      
      setIsLoading(false);
    };
    
    checkAuth();
  }, []);

  const handleLogin = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await authService.login(email, password);
      
      if (response.success && response.user) {
        setUser(response.user);
        setIsAuthenticated(true);
        
        // Armazenar o usuário no localStorage
        localStorage.setItem('user', JSON.stringify(response.user));
        localStorage.setItem('isAuthenticated', 'true');
        
        // Se tiver uma sessão do Supabase, podemos usar o access_token dela
        if (response.session && response.session.access_token) {
          localStorage.setItem('token', response.session.access_token);
        }
        
        return true;
      } else {
        alert(response.message || "Credenciais inválidas!");
        return false;
      }
    } catch (error) {
      console.error("Erro durante o login:", error);
      alert("Erro ao tentar fazer login. Tente novamente mais tarde.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await authService.register(email, password);
      
      if (response.success && response.user && response.token) {
        setUser(response.user);
        setIsAuthenticated(true);
        // Armazenar o token para solicitações futuras
        localStorage.setItem('token', response.token);
        return true;
      } else {
        alert(response.message || "Erro ao criar conta!");
        return false;
      }
    } catch (error) {
      console.error("Erro durante o registro:", error);
      alert("Erro ao tentar criar conta. Tente novamente mais tarde.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      // Fazer logout no serviço de autenticação
      await authService.logout(); // Assumindo que seu serviço tenha um método logout()
      
      // Limpar o estado
      setIsAuthenticated(false);
      setUser(null);
      
      // Limpar localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('banks');
      
      // Forçar uma atualização completa da página
      window.location.href = '/login';
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      // Mesmo com erro, tente limpar os dados locais
      setIsAuthenticated(false);
      setUser(null);
      localStorage.clear(); // Limpar tudo para garantir
      window.location.href = '/login';
    }
  };

  // Mostrar carregamento inicial
  if (isLoading && !isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <div className="w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Rotas de autenticação */}
        <Route path="/login" element={
          isAuthenticated ? 
            <Navigate to="/" replace /> : 
            <Login 
              onLogin={handleLogin} 
              switchToRegister={() => setShowRegister(true)} 
              isLoading={isLoading} 
            />
        } />
        
        <Route path="/register" element={
          isAuthenticated ? 
            <Navigate to="/" replace /> : 
            <Register 
              onRegister={handleRegister} 
              switchToLogin={() => setShowRegister(false)} 
              isLoading={isLoading} 
            />
        } />
        
        {/* Layout com Sidebar para usuários autenticados */}
        <Route path="/" element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
          <div className="flex h-screen bg-gray-100">
            <Sidebar 
              onLogout={handleLogout} 
              isCollapsed={isSidebarCollapsed} 
              onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
              user={user}
            />
            <div className={`flex-1 transition-all duration-300 ${isSidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
              <Dashboard user={user} />
            </div>
          </div>
        </ProtectedRoute>
        } />
        
        {/* Rotas protegidas com layout de Sidebar */}
        <Route path="/fintech" element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <div className="flex h-screen bg-gray-100">
              <Sidebar 
                onLogout={handleLogout} 
                isCollapsed={isSidebarCollapsed} 
                onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
                user={user}
              />
              <div className={`flex-1 transition-all duration-300 ${isSidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
                <Fintech />
              </div>
            </div>
          </ProtectedRoute>
        } />
        
        <Route path="/fintech/qrcode" element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <div className="flex h-screen bg-gray-100">
              <Sidebar 
                onLogout={handleLogout} 
                isCollapsed={isSidebarCollapsed} 
                onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
                user={user}
              />
              <div className={`flex-1 transition-all duration-300 ${isSidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
                <div>QR Code Automático - Em desenvolvimento</div>
              </div>
            </div>
          </ProtectedRoute>
        } />
        
        <Route path="/fintech/copytrade" element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <div className="flex h-screen bg-gray-100">
              <Sidebar 
                onLogout={handleLogout} 
                isCollapsed={isSidebarCollapsed} 
                onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
                user={user}
              />
              <div className={`flex-1 transition-all duration-300 ${isSidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
                <div>CopyTrade - Em desenvolvimento</div>
              </div>
            </div>
          </ProtectedRoute>
        } />
        
        <Route path="/minhas-bancas" element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <div className="flex h-screen bg-gray-100">
              <Sidebar 
                onLogout={handleLogout} 
                isCollapsed={isSidebarCollapsed} 
                onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
                user={user}
              />
              <div className={`flex-1 transition-all duration-300 ${isSidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
                <MinhasBancas />
              </div>
            </div>
          </ProtectedRoute>
        } />
        
        <Route path="/contas-cpf" element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <div className="flex h-screen bg-gray-100">
              <Sidebar 
                onLogout={handleLogout} 
                isCollapsed={isSidebarCollapsed} 
                onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
                user={user}
              />
              <div className={`flex-1 transition-all duration-300 ${isSidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
                <CPFAccounts />
              </div>
            </div>
          </ProtectedRoute>
        } />
        
        <Route path="/controle-geral" element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <div className="flex h-screen bg-gray-100">
              <Sidebar 
                onLogout={handleLogout} 
                isCollapsed={isSidebarCollapsed} 
                onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
                user={user}
              />
              <div className={`flex-1 transition-all duration-300 ${isSidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
                <ControleGeral />
              </div>
            </div>
          </ProtectedRoute>
        } />
        
        <Route path="/organization" element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <div className="flex h-screen bg-gray-100">
              <Sidebar 
                onLogout={handleLogout} 
                isCollapsed={isSidebarCollapsed} 
                onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
                user={user}
              />
              <div className={`flex-1 transition-all duration-300 ${isSidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
                <Organization />
              </div>
            </div>
          </ProtectedRoute>
        } />
        
        {/* Redirecionar todas as outras rotas para a página principal */}
        <Route path="*" element={
          isAuthenticated ? 
            <Navigate to="/" replace /> : 
            <Navigate to="/login" replace />
        } />
      </Routes>
    </Router>
  );
}

export default App;