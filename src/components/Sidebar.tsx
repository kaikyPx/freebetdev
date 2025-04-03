import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, ClipboardList, Kanban as LayoutKanban, LogOut, Wallet, Calculator, Crown, ChevronDown, ChevronRight, CircleDollarSign, LineChart, QrCode, Copy, ChevronLeft, ChevronLeft as ChevronDoubleLeft, ChevronRight as ChevronDoubleRight } from 'lucide-react';

interface Bank {
  id: string;
  name: string;
  initialCapital: number;
  roi: number;
  grossProfit: number;
}

interface SidebarProps {
  onLogout: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  user?: {id: string, email: string} | null;
}
const Sidebar: React.FC<SidebarProps> = ({ onLogout, isCollapsed, onToggleCollapse }) => {
  const location = useLocation();
  const [calculatorOpen, setCalculatorOpen] = React.useState(false);
  const [banksOpen, setBanksOpen] = React.useState(false);
  const [fintechOpen, setFintechOpen] = React.useState(false);
  const [banks, setBanks] = useState<Bank[]>([]);
  
  useEffect(() => {
    const savedBanks = localStorage.getItem('banks');
    if (savedBanks) {
      setBanks(JSON.parse(savedBanks));
    }
  }, []);

  const menuItems = [
    { 
      icon: LineChart,
      text: 'Fintech',
      type: 'fintech',
      submenu: [
        { icon: LayoutDashboard, text: 'Dashboard', path: '/fintech' },
        { icon: QrCode, text: 'Casas / Qr Code', path: '/fintech/qrcode' },
        { icon: Copy, text: 'CopyTrade', path: '/fintech/copytrade' }
      ]
    },
    { 
      icon: Wallet, 
      text: 'Minhas Bancas',
      type: 'banks',
      mainPath: '/minhas-bancas', // Added mainPath for the main link
      submenu: banks.map(bank => ({
        icon: CircleDollarSign,
        text: bank.name,
        path: `/?bank=${bank.id}`
      }))
    },
    { 
      icon: LayoutDashboard, 
      text: 'Operações', 
      path: '/' 
    },
    { 
      icon: Users, 
      text: 'Contas CPF', 
      path: '/contas-cpf' 
    },
    { 
      icon: ClipboardList, 
      text: 'Balanço Financeiro', 
      path: '/controle-geral' 
    },
    { 
      icon: LayoutKanban, 
      text: 'Organização', 
      path: '/organization' 
    }
  ];

  const bottomMenuItems = [
    {
      icon: Calculator,
      text: 'Calculadoras',
      type: 'calculator',
      submenu: [
        { text: 'Calculadora Surebet', path: '/calculadora-surebet' },
        { text: 'Calculadora Dutching', path: '/calculadora-dutching' },
        { text: 'Calculadora Lay', path: '/calculadora-lay' }
      ]
    },
    { 
      icon: Crown, 
      text: 'Assinaturas', 
      path: '/assinaturas' 
    }
  ];

  const isSubmenuOpen = (item: any) => {
    if (item.type === 'fintech') return fintechOpen;
    if (item.type === 'banks') return banksOpen;
    if (item.type === 'calculator') return calculatorOpen;
    return false;
  };

  const toggleSubmenu = (item: any) => {
    if (item.type === 'fintech') setFintechOpen(!fintechOpen);
    if (item.type === 'banks') setBanksOpen(!banksOpen);
    if (item.type === 'calculator') setCalculatorOpen(!calculatorOpen);
  };

  const isActive = (item: any) => {
    if (item.mainPath && location.pathname === item.mainPath) return true;
    if (item.submenu) {
      return item.submenu.some((subItem: any) => 
        location.pathname === subItem.path || 
        (subItem.path.includes('?') && location.pathname + location.search === subItem.path)
      );
    }
    return location.pathname === item.path;
  };

  return (
    <div className={`fixed top-0 left-0 h-full bg-white shadow-lg flex flex-col transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
      <div className="p-6 flex justify-between items-center">
        <h2 className={`text-xl font-bold text-gray-800 transition-opacity duration-300 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>
          Freebet Pro
        </h2>
        <button
          onClick={onToggleCollapse}
          className="p-3 rounded-lg hover:bg-gray-100 transition-colors duration-200 cursor-pointer"
          style={{ touchAction: 'manipulation' }}
        >
          {isCollapsed ? (
            <ChevronDoubleRight className="w-8 h-8 text-gray-600" />
          ) : (
            <ChevronDoubleLeft className="w-8 h-8 text-gray-600" />
          )}
        </button>
      </div>
      
      <nav className="flex-1 overflow-y-auto">
        {menuItems.map((item, index) => (
          item.submenu ? (
            <div key={index}>
              {/* Main menu item with link if mainPath exists */}
              {item.mainPath ? (
                <Link
                  to={item.mainPath}
                  className={`w-full flex items-center justify-between px-6 py-4 text-gray-700 hover:bg-blue-50 hover:text-blue-500 transition-colors duration-200 group ${
                    isActive(item) ? 'bg-blue-50 text-blue-500' : ''
                  }`}
                >
                  <div className="flex items-center">
                    <item.icon className="w-5 h-5 mr-3" />
                    <span className={`font-medium transition-opacity duration-300 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>
                      {item.text}
                    </span>
                  </div>
                  {!isCollapsed && (
                    <div 
                      onClick={(e) => {
                        e.preventDefault();
                        toggleSubmenu(item);
                      }}
                      className="focus:outline-none group-hover:text-blue-500"
                    >
                      {isSubmenuOpen(item) ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </div>
                  )}
                </Link>
              ) : (
                <button
                  onClick={() => !isCollapsed && toggleSubmenu(item)}
                  className={`w-full flex items-center justify-between px-6 py-4 text-gray-700 hover:bg-blue-50 hover:text-blue-500 transition-colors duration-200 group ${
                    isActive(item) ? 'bg-blue-50 text-blue-500' : ''
                  }`}
                >
                  <div className="flex items-center">
                    <item.icon className="w-5 h-5 mr-3" />
                    <span className={`font-medium transition-opacity duration-300 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>
                      {item.text}
                    </span>
                  </div>
                  {!isCollapsed && (
                    <div className="focus:outline-none group-hover:text-blue-500">
                      {isSubmenuOpen(item) ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </div>
                  )}
                </button>
              )}
              {!isCollapsed && isSubmenuOpen(item) && item.submenu.length > 0 && (
                <div className="bg-gray-50">
                  {item.submenu.map((subItem, subIndex) => (
                    <Link
                      key={subIndex}
                      to={subItem.path}
                      className={`flex items-center pl-14 pr-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-500 transition-colors duration-200 ${
                        location.pathname === subItem.path || 
                        (subItem.path.includes('?') && location.pathname + location.search === subItem.path)
                          ? 'bg-blue-50 text-blue-500' 
                          : ''
                      }`}
                    >
                      {subItem.icon && <subItem.icon className="w-4 h-4 mr-2" />}
                      <span className="font-medium">{subItem.text}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <Link
              key={index}
              to={item.path}
              className={`flex items-center px-6 py-4 text-gray-700 hover:bg-blue-50 hover:text-blue-500 transition-colors duration-200 ${
                location.pathname === item.path ? 'bg-blue-50 text-blue-500' : ''
              }`}
            >
              <item.icon className="w-5 h-5 mr-3" />
              <span className={`font-medium transition-opacity duration-300 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>
                {item.text}
              </span>
            </Link>
          )
        ))}

        {bottomMenuItems.map((item, index) => (
          item.submenu ? (
            <div key={index}>
              <button
                onClick={() => !isCollapsed && toggleSubmenu(item)}
                className={`w-full flex items-center justify-between px-6 py-4 text-gray-700 hover:bg-blue-50 hover:text-blue-500 transition-colors duration-200 ${
                  isActive(item) ? 'bg-blue-50 text-blue-500' : ''
                }`}
              >
                <div className="flex items-center">
                  <item.icon className="w-5 h-5 mr-3" />
                  <span className={`font-medium transition-opacity duration-300 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>
                    {item.text}
                  </span>
                </div>
                {!isCollapsed && (
                  <div>
                    {isSubmenuOpen(item) ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </div>
                )}
              </button>
              {!isCollapsed && isSubmenuOpen(item) && (
                <div className="bg-gray-50">
                  {item.submenu.map((subItem, subIndex) => (
                    <Link
                      key={subIndex}
                      to={subItem.path}
                      className={`flex items-center pl-14 pr-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-500 transition-colors duration-200 ${
                        location.pathname === subItem.path ? 'bg-blue-50 text-blue-500' : ''
                      }`}
                    >
                      <span className="font-medium">{subItem.text}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <Link
              key={index}
              to={item.path}
              className={`flex items-center px-6 py-4 text-gray-700 hover:bg-blue-50 hover:text-blue-500 transition-colors duration-200 ${
                location.pathname === item.path ? 'bg-blue-50 text-blue-500' : ''
              }`}
            >
              <item.icon className="w-5 h-5 mr-3" />
              <span className={`font-medium transition-opacity duration-300 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>
                {item.text}
              </span>
            </Link>
          )
        ))}
      </nav>

      <button
        onClick={onLogout}
        className="flex items-center px-6 py-4 text-red-600 hover:bg-red-50 transition-colors duration-200 border-t"
      >
        <LogOut className="w-5 h-5 mr-3" />
        <span className={`font-medium transition-opacity duration-300 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>
          Sair
        </span>
      </button>
    </div>
  );
};

export default Sidebar;