'use client'
import React, { useState } from 'react';
import { 
  Home, Brain, Menu, X, Bell, Search, 
  TrendingUp, DollarSign, Target, Sparkles,
  FileText, Calculator, BarChart3, Settings,
  User, ChevronRight, ArrowUp
} from 'lucide-react';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, description: 'Přehled účetnictví' },
    { id: 'documents', label: 'Doklady', icon: FileText, description: 'AI zpracování dokumentů' },
    { id: 'accounting', label: 'Účetnictví', icon: Calculator, description: 'Účetní operace' },
    { id: 'ai-chat', label: 'AI Asistent', icon: Brain, description: 'Chat s AI poradcem' },
    { id: 'reports', label: 'Reporty', icon: BarChart3, description: 'Analýzy a výkazy' },
    { id: 'settings', label: 'Nastavení', icon: Settings, description: 'Konfigurace systému' },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('cs-CZ', {
      style: 'currency',
      currency: 'CZK',
    }).format(amount);
  };

  const DashboardView = () => (
    <div className="space-y-8">
      {/* Beautiful Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 rounded-2xl p-8 text-white">
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Vítejte v A!Accountant</h1>
              <p className="text-blue-100 text-lg">AI revolucionizuje vaše účetnictví</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                <Brain className="w-8 h-8" />
              </div>
              <div className="text-right">
                <p className="text-sm text-blue-100">Dnes</p>
                <p className="font-semibold">{new Date().toLocaleDateString('cs-CZ')}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-purple-400/20 rounded-full blur-2xl"></div>
      </div>

      {/* Beautiful Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            title: 'Celkové příjmy',
            value: 2450000,
            change: '+12%',
            icon: TrendingUp,
            color: 'green'
          },
          {
            title: 'Celkové výdaje', 
            value: 1850000,
            change: '+5%',
            icon: DollarSign,
            color: 'red'
          },
          {
            title: 'Čistý zisk',
            value: 600000,
            change: '+18%',
            icon: Target,
            color: 'blue'
          },
          {
            title: 'AI zpracování',
            value: 156,
            change: '+23',
            icon: Sparkles,
            color: 'purple'
          }
        ].map((stat, index) => (
          <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stat.title.includes('zpracování') ? 
                    stat.value.toLocaleString() : 
                    formatCurrency(stat.value)
                  }
                </p>
                <div className="flex items-center mt-2">
                  <ArrowUp className={`w-4 h-4 mr-1 ${
                    stat.color === 'green' ? 'text-green-600' : 
                    stat.color === 'blue' ? 'text-blue-600' : 
                    stat.color === 'purple' ? 'text-purple-600' : 'text-gray-600'
                  }`} />
                  <span className={`text-sm font-medium ${
                    stat.color === 'green' ? 'text-green-600' : 
                    stat.color === 'blue' ? 'text-blue-600' : 
                    stat.color === 'purple' ? 'text-purple-600' : 'text-gray-600'
                  }`}>
                    {stat.change}
                  </span>
                  <span className="text-sm text-gray-500 ml-1">vs minulý měsíc</span>
                </div>
              </div>
              <div className={`p-3 rounded-xl ${
                stat.color === 'green' ? 'bg-green-100' :
                stat.color === 'red' ? 'bg-red-100' :
                stat.color === 'blue' ? 'bg-blue-100' :
                stat.color === 'purple' ? 'bg-purple-100' : 'bg-gray-100'
              }`}>
                <stat.icon className={`w-6 h-6 ${
                  stat.color === 'green' ? 'text-green-600' :
                  stat.color === 'red' ? 'text-red-600' :
                  stat.color === 'blue' ? 'text-blue-600' :
                  stat.color === 'purple' ? 'text-purple-600' : 'text-gray-600'
                }`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Success Message */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-6">
        <div className="flex items-center justify-center">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse mr-3"></div>
          <p className="text-lg font-semibold text-green-800">✅ Aplikace funguje krásně!</p>
        </div>
        <p className="text-green-600 mt-2 text-center">Design byl úspěšně přidán, můžeme pokračovat s AI funkcemi.</p>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'documents':
        return (
          <div className="text-center p-8 bg-white rounded-xl">
            <FileText className="w-16 h-16 text-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">AI Zpracování dokumentů</h2>
            <p className="text-gray-600">Bude implementováno v další fázi</p>
          </div>
        );
      case 'ai-chat':
        return (
          <div className="text-center p-8 bg-white rounded-xl">
            <Brain className="w-16 h-16 text-purple-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">AI Asistent</h2>
            <p className="text-gray-600">Chat s AI bude přidán brzy</p>
          </div>
        );
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Beautiful Sidebar */}
      <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white shadow-xl transform transition-transform duration-300 ease-in-out`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-2 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl mr-3">
                  <Brain className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">A!Accountant</h2>
                  <p className="text-sm text-gray-500">AI Účetní Software</p>
                </div>
              </div>
              <button 
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {menuItems.map(item => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  activeTab === item.id
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <div className="flex-1 text-left">
                  <div className="font-medium">{item.label}</div>
                  <div className={`text-xs ${activeTab === item.id ? 'text-blue-100' : 'text-gray-400'}`}>
                    {item.description}
                  </div>
                </div>
                {activeTab === item.id && (
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                )}
              </button>
            ))}
          </nav>
          
          {/* User Profile */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center space-x-3 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">Milan Vlasák</p>
                <p className="text-sm text-gray-500 truncate">milan@vlasak.cloud</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 lg:ml-72">
        {/* Beautiful Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button 
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
                >
                  <Menu className="w-6 h-6" />
                </button>
                
                <div className="relative">
                  <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Vyhledat v účetnictví..."
                    className="pl-10 pr-4 py-2 w-80 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <button className="p-2 rounded-lg hover:bg-gray-100 relative">
                  <Bell className="w-6 h-6 text-gray-600" />
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
                </button>
                
                <div className="flex items-center space-x-2 bg-green-100 text-green-800 px-3 py-1 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">AI Active</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          {renderContent()}
        </main>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
