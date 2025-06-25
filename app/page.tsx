'use client'
import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, Send, Mic, FileText, DollarSign, TrendingUp, AlertTriangle, 
  Settings, User, LogOut, Menu, X, Camera, PlusCircle, Eye, Check, 
  Calendar, BarChart3, MessageSquare, Calculator, Sparkles, Brain,
  Zap, Shield, Globe, ChevronRight, Home, Users, Building, CreditCard,
  Database, Lock, Bell, Search, Filter, Download, Edit, Trash2,
  ArrowUp, ArrowDown, Activity, Target, Briefcase,
  RefreshCw, CheckCircle, XCircle, Clock
} from 'lucide-react';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { 
      id: 1, 
      type: 'ai', 
      content: 'Dobrý den! Jsem váš AI účetní asistent. Můžu vám pomoci s účtováním, daňovými otázkami, generováním dokladů nebo analýzou financí. Na čem budeme dnes pracovat?',
      timestamp: new Date()
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [documents, setDocuments] = useState([
    { 
      id: 1, 
      name: 'Faktura 2025001.pdf', 
      status: 'processed', 
      amount: 25500, 
      currency: 'CZK',
      date: '2025-06-20',
      vendor: 'ABC s.r.o.',
      confidence: 0.95,
      warnings: []
    },
    { 
      id: 2, 
      name: 'Účtenka Tesco.jpg', 
      status: 'pending', 
      amount: 1250, 
      currency: 'CZK',
      date: '2025-06-22',
      vendor: 'Tesco Stores ČR',
      confidence: 0.88,
      warnings: ['Chybí DIČ dodavatele']
    },
    { 
      id: 3, 
      name: 'Mzdový list.pdf', 
      status: 'review', 
      amount: 45000, 
      currency: 'CZK',
      date: '2025-06-23',
      vendor: 'Vlastní mzdová agenda',
      confidence: 0.92,
      warnings: ['Kontrola sociálního pojištění']
    },
  ]);
  
  const fileInputRef = useRef(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, description: 'Přehled účetnictví' },
    { id: 'documents', label: 'Doklady', icon: FileText, description: 'AI zpracování dokumentů' },
    { id: 'accounting', label: 'Účetnictví', icon: Calculator, description: 'Účetní operace' },
    { id: 'ai-chat', label: 'AI Asistent', icon: Brain, description: 'Chat s AI poradcem' },
    { id: 'reports', label: 'Reporty', icon: BarChart3, description: 'Analýzy a výkazy' },
    { id: 'settings', label: 'Nastavení', icon: Settings, description: 'Konfigurace systému' },
  ];

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    
    const userMessage = {
      id: chatMessages.length + 1,
      type: 'user',
      content: chatInput,
      timestamp: new Date()
    };
    
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsProcessing(true);
    
    // Simulace AI odpovědi s realistic delay
    setTimeout(() => {
      const aiResponse = {
        id: chatMessages.length + 2,
        type: 'ai',
        content: getAIResponse(chatInput),
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, aiResponse]);
      setIsProcessing(false);
    }, 1500);
  };

  const getAIResponse = (input) => {
    const responses = {
      'účtování': 'Pro správné zaúčtování potřebuji znát typ transakce. Můžete mi říct, zda se jedná o nákup, prodej, mzdy, nebo jiný typ operace? Také mi pomozte s částkou a dodavatelem.',
      'faktura': 'Pokud máte fakturu, můžete ji nahrát do sekce Doklady. AI automaticky rozpozná všechny údaje a navrhne správné zaúčtování podle českých účetních standardů.',
      'dph': 'Aktuální sazby DPH v ČR jsou: 21% základní sazba, 12% první snížená sazba, 5% druhá snížená sazba. Podle typu zboží/služeb navrhnu správnou sazbu.',
      'help': 'Můžu vám pomoci s: \n• Zpracováním dokladů a AI rozpoznáváním\n• Generováním účetních zápisů\n• Daňovým poradenstvím\n• Vytvářením reportů\n• Kontrolou legislativní shody'
    };
    
    const key = Object.keys(responses).find(k => input.toLowerCase().includes(k));
    return key ? responses[key] : 'Rozumím vašemu dotazu. Jako AI účetní mohu pomoci s účtováním, daňovými otázkami a generováním dokladů. Můžete být konkrétnější ohledně toho, s čím potřebujete pomoc?';
  };

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    
    for (const file of files) {
      const newDoc = {
        id: documents.length + Math.random(),
        name: file.name,
        status: 'processing',
        amount: 0,
        currency: 'CZK',
        date: new Date().toISOString().split('T')[0],
        vendor: 'Zpracovává se...',
        confidence: 0,
        warnings: []
      };
      
      setDocuments(prev => [...prev, newDoc]);
      
      // Simulace AI zpracování
      setTimeout(() => {
        const processedDoc = {
          ...newDoc,
          status: 'processed',
          amount: Math.floor(Math.random() * 50000) + 1000,
          vendor: 'AI Rozpoznaný dodavatel',
          confidence: 0.85 + Math.random() * 0.15,
          warnings: Math.random() > 0.7 ? ['Ověřte DIČ dodavatele'] : []
        };
        
        setDocuments(prev => 
          prev.map(doc => doc.id === newDoc.id ? processedDoc : doc)
        );
      }, 3000);
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // Zde by byla implementace speech-to-text
    if (!isRecording) {
      setTimeout(() => {
        setIsRecording(false);
        setChatInput('Jak zaúčtovat nákup kancelářských potřeb za 5000 Kč?');
      }, 3000);
    }
  };

  const formatCurrency = (amount, currency = 'CZK') => {
    return new Intl.NumberFormat('cs-CZ', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'processed': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'processing': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'review': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'error': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'processed': return 'Zpracováno';
      case 'pending': return 'Čeká na schválení';
      case 'processing': return 'AI zpracovává...';
      case 'review': return 'Kontrola potřebná';
      case 'error': return 'Chyba zpracování';
      default: return status;
    }
  };

  // Dashboard View
  const DashboardView = () => (
    <div className="space-y-8">
      {/* Header with AI greeting */}
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

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            title: 'Celkové příjmy',
            value: 2450000,
            change: '+12%',
            trend: 'up',
            icon: TrendingUp,
            color: 'green'
          },
          {
            title: 'Celkové výdaje', 
            value: 1850000,
            change: '+5%',
            trend: 'up',
            icon: DollarSign,
            color: 'red'
          },
          {
            title: 'Čistý zisk',
            value: 600000,
            change: '+18%',
            trend: 'up',
            icon: Target,
            color: 'blue'
          },
          {
            title: 'AI zpracování',
            value: 156,
            change: '+23',
            trend: 'up',
            icon: Sparkles,
            color: 'purple'
          }
        ].map((stat, index) => (
          <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {typeof stat.value === 'number' && stat.title.includes('Kč') !== false ? 
                    formatCurrency(stat.value) : 
                    stat.value.toLocaleString()
                  }
                </p>
                <div className="flex items-center mt-2">
                  <ArrowUp className={`w-4 h-4 mr-1 ${stat.color === 'green' ? 'text-green-600' : 
                    stat.color === 'blue' ? 'text-blue-600' : 
                    stat.color === 'purple' ? 'text-purple-600' : 'text-gray-600'}`} />
                  <span className={`text-sm font-medium ${stat.color === 'green' ? 'text-green-600' : 
                    stat.color === 'blue' ? 'text-blue-600' : 
                    stat.color === 'purple' ? 'text-purple-600' : 'text-gray-600'}`}>
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

      {/* AI Insights & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <Brain className="w-5 h-5 mr-2 text-purple-600" />
                AI Doporučení
              </h2>
            </div>
            <div className="p-6 space-y-4">
              {[
                {
                  type: 'warning',
                  title: 'Legislativní upozornění',
                  message: 'Faktura bez uvedeného DIČ - ověřte plátcovství DPH u dodavatele',
                  action: 'Zkontrolovat',
                  icon: AlertTriangle
                },
                {
                  type: 'info', 
                  title: 'Optimalizace daní',
                  message: 'Možnost uplatnit 60% paušální výdaje u příjmů z podnikání',
                  action: 'Zobrazit detail',
                  icon: TrendingUp
                },
                {
                  type: 'success',
                  title: 'Automatické účtování',
                  message: 'AI úspěšně zpracovala 23 dokumentů s 96% přesností',
                  action: 'Zkontrolovat',
                  icon: CheckCircle
                }
              ].map((alert, index) => (
                <div key={index} className={`p-4 rounded-lg border-l-4 ${
                  alert.type === 'warning' ? 'bg-amber-50 border-amber-400' :
                  alert.type === 'info' ? 'bg-blue-50 border-blue-400' :
                  'bg-green-50 border-green-400'
                }`}>
                  <div className="flex items-start">
                    <alert.icon className={`w-5 h-5 mt-0.5 mr-3 ${
                      alert.type === 'warning' ? 'text-amber-600' :
                      alert.type === 'info' ? 'text-blue-600' :
                      'text-green-600'
                    }`} />
                    <div className="flex-1">
                      <h3 className={`font-medium ${
                        alert.type === 'warning' ? 'text-amber-800' :
                        alert.type === 'info' ? 'text-blue-800' :
                        'text-green-800'
                      }`}>
                        {alert.title}
                      </h3>
                      <p className={`text-sm mt-1 ${
                        alert.type === 'warning' ? 'text-amber-700' :
                        alert.type === 'info' ? 'text-blue-700' :
                        'text-green-700'
                      }`}>
                        {alert.message}
                      </p>
                    </div>
                    <button className={`text-sm font-medium ${
                      alert.type === 'warning' ? 'text-amber-800 hover:text-amber-900' :
                      alert.type === 'info' ? 'text-blue-800 hover:text-blue-900' :
                      'text-green-800 hover:text-green-900'
                    }`}>
                      {alert.action}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Rychlé akce</h2>
            </div>
            <div className="p-6 space-y-3">
              {[
                { label: 'Nahrát doklad', icon: Upload, color: 'blue' },
                { label: 'Nová faktura', icon: FileText, color: 'green' },
                { label: 'AI asistent', icon: MessageSquare, color: 'purple' },
                { label: 'Export reportu', icon: Download, color: 'orange' }
              ].map((action, index) => (
                <button key={index} className={`w-full flex items-center p-3 rounded-lg border border-gray-200 hover:border-blue-200 hover:bg-blue-50 transition-all duration-200 group`}>
                  <action.icon className={`w-5 h-5 mr-3 text-blue-600`} />
                  <span className="font-medium text-gray-700 group-hover:text-gray-900">{action.label}</span>
                  <ChevronRight className="w-4 h-4 ml-auto text-gray-400 group-hover:text-gray-600" />
                </button>
              ))}
            </div>
          </div>

          {/* AI Status */}
          <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">AI Status</h3>
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-purple-100">Přesnost AI</span>
                <span className="font-semibold">96.2%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-purple-100">Zpracováno dnes</span>
                <span className="font-semibold">23 dokladů</span>
              </div>
              <div className="flex justify-between">
                <span className="text-purple-100">Úspora času</span>
                <span className="font-semibold">4.2 hodin</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Documents */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Nedávné doklady</h2>
            <button 
              onClick={() => setActiveTab('documents')}
              className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center"
            >
              Zobrazit vše
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {documents.slice(0, 3).map(doc => (
              <div key={doc.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{doc.name}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {new Date(doc.date).toLocaleDateString('cs-CZ')}
                      </span>
                      <span className="flex items-center">
                        <Building className="w-4 h-4 mr-1" />
                        {doc.vendor}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{formatCurrency(doc.amount)}</p>
                    {doc.confidence > 0 && (
                      <p className="text-sm text-green-600">AI: {(doc.confidence * 100).toFixed(0)}%</p>
                    )}
                  </div>
                  <span className={`px-3 py-1 text-xs rounded-full border ${getStatusColor(doc.status)}`}>
                    {getStatusText(doc.status)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // Documents View - zkrácená verze
  const DocumentsView = () => (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AI Zpracování dokladů</h1>
          <p className="text-gray-600 mt-2">Nahrajte dokumenty a nechte AI provést automatické účtování</p>
        </div>
        <div className="flex space-x-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            multiple
            accept="image/*,.pdf,.doc,.docx"
            className="hidden"
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Upload className="w-5 h-5" />
            <span>Nahrát soubory</span>
          </button>
        </div>
      </div>

      {/* Upload Zone */}
      <div 
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-blue-300 rounded-2xl p-12 text-center bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-all duration-300 cursor-pointer group"
      >
        <div className="space-y-6">
          <div className="flex justify-center">
            <div className="p-4 bg-blue-100 rounded-full group-hover:bg-blue-200 transition-colors">
              <Brain className="w-12 h-12 text-blue-600" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">AI Automatické zpracování</h3>
            <p className="text-gray-600 max-w-md mx-auto leading-relaxed">
              Přetáhněte dokumenty nebo klikněte pro výběr. AI automaticky rozpozná text, 
              extrahuje údaje a navrhne správné účtování podle českých standardů.
            </p>
          </div>
        </div>
      </div>

      {/* Documents List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Všechny doklady</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dokument</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dodavatel</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Částka</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">AI Přesnost</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stav</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {documents.map(doc => (
                <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="p-2 bg-blue-100 rounded-lg mr-3">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{doc.name}</div>
                        <div className="text-sm text-gray-500">{new Date(doc.date).toLocaleDateString('cs-CZ')}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-gray-900">{doc.vendor}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{formatCurrency(doc.amount)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {doc.confidence > 0 ? (
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full transition-all duration-500" 
                            style={{ width: `${doc.confidence * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-green-600">
                          {(doc.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center text-gray-400">
                        <Clock className="w-4 h-4 mr-1" />
                        <span className="text-sm">Zpracovává...</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(doc.status)}`}>
                      {doc.status === 'processing' && <RefreshCw className="w-3 h-3 mr-1 animate-spin" />}
                      {doc.status === 'processed' && <CheckCircle className="w-3 h-3 mr-1" />}
                      {getStatusText(doc.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // AI Chat View - zkrácená verze
  const AIChatView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AI Účetní Asistent</h1>
          <p className="text-gray-600 mt-2">Váš osobní AI daňový poradce a účetní expert</p>
        </div>
        <div className="flex items-center space-x-2 bg-green-100 text-green-800 px-4 py-2 rounded-lg">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium">AI Online</span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 h-[700px] flex flex-col">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg mr-3">
              <Brain className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">AI Účetní Expert</h3>
              <p className="text-sm text-gray-500">Specializace: České účetnictví & daně</p>
            </div>
          </div>
        </div>
        
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {chatMessages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] ${message.type === 'user' ? 'order-2' : 'order-1'}`}>
                {message.type === 'ai' && (
                  <div className="flex items-center mb-2">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-2">
                      <Brain className="w-4 h-4 text-purple-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">AI Asistent</span>
                  </div>
                )}
                <div
                  className={`rounded-2xl px-6 py-4 ${
                    message.type === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900 border border-gray-200'
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            </div>
          ))}
          
          {isProcessing && (
            <div className="flex justify-start">
              <div className="flex items-center space-x-2 bg-gray-100 rounded-2xl px-6 py-4">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-sm text-gray-600">AI přemýšlí...</span>
              </div>
            </div>
          )}
          
          <div ref={chatEndRef} />
        </div>
        
        {/* Input */}
        <div className="border-t border-gray-100 p-6">
          <div className="flex items-end space-x-3">
            <div className="flex-1">
              <textarea
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Zeptejte se na účetnictví, daně, nebo požádejte o vygenerování dokladu..."
                className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 resize-none"
                rows="2"
              />
            </div>
            <div className="flex space-x-2">
              <button
                onClick={toggleRecording}
                className={`p-3 rounded-xl transition-colors ${
                  isRecording 
                    ? 'bg-red-600 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Mic className="w-5 h-5" />
              </button>
              <button
                onClick={handleSendMessage}
                disabled={!chatInput.trim() || isProcessing}
                className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
          {isRecording && (
            <div className="mt-3 flex items-center text-red-600">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></div>
              <span className="text-sm">Nahrávám hlasové zadání...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'documents':
        return <DocumentsView />;
      case 'ai-chat':
        return <AIChatView />;
      case 'accounting':
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">Účetní operace</h1>
            <div className="bg-white p-8 rounded-xl text-center border border-gray-200">
              <Calculator className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Účetní modul bude implementován v další verzi</p>
              <p className="text-gray-400 text-sm mt-2">Podvojné účetnictví • Deníky • Rozvahy • Výkazy</p>
            </div>
          </div>
        );
      case 'reports':
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">Reporty a analýzy</h1>
            <div className="bg-white p-8 rounded-xl text-center border border-gray-200">
              <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Reporting modul v přípravě</p>
              <p className="text-gray-400 text-sm mt-2">AI analýzy • Grafy • Export • Dashboardy</p>
            </div>
          </div>
        );
      case 'settings':
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">Nastavení systému</h1>
            <div className="bg-white p-8 rounded-xl text-center border border-gray-200">
              <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Konfigurace bude dostupná brzy</p>
              <p className="text-gray-400 text-sm mt-2">AI nastavení • Integrace • Přístup • Customizace</p>
            </div>
          </div>
        );
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
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
              <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 lg:ml-72">
        {/* Header */}
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

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
