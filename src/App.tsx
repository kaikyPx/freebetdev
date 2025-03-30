import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LayoutDashboard, Users, ClipboardList, Kanban as LayoutKanban } from 'lucide-react';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import CPFAccounts from './components/CPFAccounts';
import ControleGeral from './components/ControleGeral';
import Organization from './components/Organization';
import MinhasBancas from './components/MinhasBancas';
import Fintech from './components/Fintech';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('isAuthenticated') === 'true';
  });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    localStorage.setItem('isAuthenticated', isAuthenticated.toString());
  }, [isAuthenticated]);

  const handleLogin = (username: string, password: string) => {
    if (username === "admin" && password === "admin123") {
      setIsAuthenticated(true);
    } else {
      alert("Credenciais inválidas!");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('isAuthenticated');
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Router>
      <div className="flex h-screen bg-gray-100">
        <Sidebar 
          onLogout={handleLogout} 
          isCollapsed={isSidebarCollapsed} 
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
        />
        <div className={`flex-1 transition-all duration-300 ${isSidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/fintech" element={<Fintech />} />
            <Route path="/fintech/qrcode" element={<div>QR Code Automático - Em desenvolvimento</div>} />
            <Route path="/fintech/copytrade" element={<div>CopyTrade - Em desenvolvimento</div>} />
            <Route path="/minhas-bancas" element={<MinhasBancas />} />
            <Route path="/contas-cpf" element={<CPFAccounts />} />
            <Route path="/controle-geral" element={<ControleGeral />} />
            <Route path="/organization" element={<Organization />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;