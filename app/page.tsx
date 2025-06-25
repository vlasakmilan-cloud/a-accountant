'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Calculator, 
  Upload, 
  Mic, 
  Send, 
  Bot, 
  User, 
  FileText, 
  DollarSign, 
  TrendingUp, 
  Settings,
  LogOut,
  Plus,
  Search,
  Download,
  Eye,
  Menu,
  X,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

// Simulace Supabase
const supabase = {
  auth: {
    signInWithPassword: async ({ email, password }: { email: string; password: string }) => ({ 
      data: { user: { email } }, 
      error: null 
    }),
    signUp: async ({ email, password }: { email: string; password: string }) => ({ 
      data: { user: { email } }, 
      error: null 
    }),
    signOut: async () => ({ error: null })
  }
};

// Typy
interface User {
  email: string;
}

interface Message {
  id: number;
  type: 'user' | 'ai';
  content: string;
}

interface UploadedFile {
  name: string;
  size: number;
  type: string;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  progress?: number;
  extractedData?: any;
  error?: string;
}

// Komponenta pro přihlášení
function LoginForm({ onLogin }: { onLogin: (user: User) => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) return;
    
    setLoading(true);
    
    try {
      const { data, error } = isLogin 
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });
      
      if (!error && data.user) {
        onLogin(data.user);
      }
    } catch (error) {
      console.error('Chyba při přihlašování:', error);
    }
    
    setLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Calculator className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            A!Accountant
          </h1>
          <p className="text-gray-600 mt-2">AI účetní software</p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="vas@email.cz"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Heslo
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="••••••••"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading || !email || !password}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 font-medium disabled:opacity-50"
          >
            {loading ? 'Načítám...' : (isLogin ? 'Přihlásit se' : 'Registrovat se')}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-purple-600 hover:text-purple-700 text-sm"
            >
              {isLogin ? 'Nemáte účet? Registrujte se' : 'Už máte účet? Přihlaste se'}
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">nebo</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <button 
              type="button" 
              className="flex justify-center items-center py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span className="text-sm font-medium">Google</span>
            </button>
            <button 
              type="button" 
              className="flex justify-center items-center py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span className="text-sm font-medium">MS365</span>
            </button>
            <button 
              type="button" 
              className="flex justify-center items-center py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span className="text-sm font-medium">Apple</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Hlavní komponenta aplikace
export default function AIAccountantApp() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      type: 'ai',
      content: 'Dobrý den! Jsem váš AI účetní asistent - Milanův daňový poradce. Specializuji se na české účetnictví, DPH a daňovou legislativu. Co potřebujete vyřešit?'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (!user) {
    return <LoginForm onLogin={setUser} />;
  }

  const navigation = [
    { id: 'dashboard', name: 'Dashboard', icon: Calculator },
    { id: 'chat', name: 'AI Asistent', icon: Bot },
    { id: 'documents', name: 'Dokumenty', icon: FileText },
    { id: 'upload', name: 'Nahrát doklad', icon: Upload },
    { id: 'voice', name: 'Hlasové zadání', icon: Mic },
    { id: 'reports', name: 'Reporty', icon: TrendingUp },
  ];

  // SKUTEČNÉ AI VOLÁNÍ - NAHRADILO SIMULACI
  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now(),
      type: 'user',
      content: inputMessage
    };

    setMessages(prev => [...prev, userMessage]);
    const currentMessage = inputMessage;
    setInputMessage('');
    setIsTyping(true);

    try {
      // Skutečné volání AI API s vaším promptem
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: currentMessage
        }),
      });

      if (!response.ok) {
        throw new Error('Chyba při komunikaci s AI');
      }

      const data = await response.json();
      
      const aiResponse: Message = {
        id: Date.now() + 1,
        type: 'ai',
        content: data.message || 'Omlouvám se, došlo k chybě při zpracování.'
      };

      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('Error:', error);
      const errorResponse: Message = {
        id: Date.now() + 1,
        type: 'ai',
        content: 'Omlouvám se, momentálně nemohu odpovědět. Zkuste to prosím později. Možná není nastaven OpenAI API klíč.'
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  const startVoiceRecording = () => {
    setIsRecording(true);
    setTimeout(() => {
      setIsRecording(false);
      setInputMessage('Nahrál jsem fakturu za kancelářské potřeby v hodnotě 2500 Kč včetně DPH');
    }, 3000);
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Nový doklad
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: 'Celkové příjmy', value: '2 450 000 Kč', change: '+12%', color: 'green' },
          { title: 'Celkové výdaje', value: '1 850 000 Kč', change: '+5%', color: 'red' },
          { title: 'Čistý zisk', value: '600 000 Kč', change: '+18%', color: 'blue' },
          { title: 'AI zpracování', value: '156 dokladů', change: '+23%', color: 'purple' },
        ].map((stat, index) => (
          <div key={index} className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
                <p className={`text-sm mt-2 ${
                  stat.color === 'green' ? 'text-green-600' : 
                  stat.color === 'red' ? 'text-red-600' : 
                  stat.color === 'blue' ? 'text-blue-600' : 'text-purple-600'
                }`}>
                  {stat.change} vs minulý měsíc
                </p>
              </div>
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                stat.color === 'green' ? 'bg-green-100' : 
                stat.color === 'red' ? 'bg-red-100' : 
                stat.color === 'blue' ? 'bg-blue-100' : 'bg-purple-100'
              }`}>
                <DollarSign className={`w-6 h-6 ${
                  stat.color === 'green' ? 'text-green-600' : 
                  stat.color === 'red' ? 'text-red-600' : 
                  stat.color === 'blue' ? 'text-blue-600' : 'text-purple-600'
                }`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Poslední transakce</h3>
          <div className="space-y-4">
            {[
              { date: '25.6.2025', description: 'Faktura #2025-001', amount: '-12 500 Kč', status: 'Zaúčtováno' },
              { date: '24.6.2025', description: 'Přijatá platba', amount: '+35 000 Kč', status: 'Schváleno' },
              { date: '23.6.2025', description: 'Kancelářské potřeby', amount: '-2 340 Kč', status: 'Zpracovává AI' },
            ].map((transaction, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{transaction.description}</p>
                  <p className="text-sm text-gray-600">{transaction.date}</p>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${transaction.amount.includes('+') ? 'text-green-600' : 'text-red-600'}`}>
                    {transaction.amount}
                  </p>
                  <p className="text-sm text-gray-500">{transaction.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">AI doporučení</h3>
          <div className="space-y-4">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm font-medium text-yellow-800">⚠️ Upozornění na DPH</p>
              <p className="text-sm text-yellow-700 mt-1">
                U faktury #2025-003 zkontrolujte správnost DPH sazby. Mohlo by se jednat o chybu.
              </p>
            </div>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-medium text-blue-800">💡 Tip pro optimalizaci</p>
              <p className="text-sm text-blue-700 mt-1">
                Můžete uplatnit odpočet DPH za pohonné hmoty z minulého měsíce.
              </p>
            </div>
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm font-medium text-green-800">✅ Vše v pořádku</p>
              <p className="text-sm text-green-700 mt-1">
                Účetní období je uzavřeno bez chyb.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderChat = () => (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border" style={{ height: 'calc(100vh - 200px)' }}>
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <Bot className="w-6 h-6 text-purple-600" />
          AI Účetní Asistent
        </h2>
        <p className="text-sm text-gray-600 mt-1">🇨🇿 Milanův daňový poradce - Specializace: České účetnictví, DPH, daňová legislativa</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex gap-3 max-w-3xl ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${message.type === 'user' ? 'bg-purple-600' : 'bg-blue-600'}`}>
                {message.type === 'user' ? (
                  <User className="w-4 h-4 text-white" />
                ) : (
                  <Bot className="w-4 h-4 text-white" />
                )}
              </div>
              <div className={`px-4 py-3 rounded-2xl ${message.type === 'user' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-900'}`}>
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="flex gap-3 max-w-3xl">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="px-4 py-3 rounded-2xl bg-gray-100">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-6 border-t border-gray-200">
        <div className="flex gap-2 mb-3">
          {[
            'Jak zaúčtovat fakturu za PHM?',
            'DPH sazby 2025',
            'Odpočet DPH u materiálu',
            'Kontrolní hlášení'
          ].map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => setInputMessage(suggestion)}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
        
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Zeptejte se na český daňový či účetní problém..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent pr-12"
            />
            <button
              onClick={startVoiceRecording}
              className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full ${isRecording ? 'bg-red-100 text-red-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <Mic className={`w-4 h-4 ${isRecording ? 'animate-pulse' : ''}`} />
            </button>
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isTyping}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  // SKUTEČNÉ ZPRACOVÁNÍ DOKUMENTŮ - NAHRADILO SIMULACI
  const renderUpload = () => {
    const [dragActive, setDragActive] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

    const handleDrag = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.type === "dragenter" || e.type === "dragover") {
        setDragActive(true);
      } else if (e.type === "dragleave") {
        setDragActive(false);
      }
    };

    const processFile = async (file: File) => {
      const fileEntry: UploadedFile = {
        name: file.name,
        size: file.size,
        type: file.type,
        status: 'uploading',
        progress: 0
      };

      setUploadedFiles(prev => [...prev, fileEntry]);

      try {
        // Aktualizace progressu
        setUploadedFiles(prev => prev.map(f => 
          f.name === file.name ? { ...f, status: 'processing', progress: 50 } : f
        ));

        // Skutečné volání API pro analýzu dokumentu
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/analyze-document', {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();

        if (result.success) {
          setUploadedFiles(prev => prev.map(f => 
            f.name === file.name ? { 
              ...f, 
              status: 'completed', 
              progress: 100,
              extractedData: result.data
            } : f
          ));
        } else {
          setUploadedFiles(prev => prev.map(f => 
            f.name === file.name ? { 
              ...f, 
              status: 'error',
              error: result.error || 'Chyba při zpracování'
            } : f
          ));
        }

      } catch (error) {
        console.error('Chyba při zpracování souboru:', error);
        setUploadedFiles(prev => prev.map(f => 
          f.name === file.name ? { 
            ...f, 
            status: 'error',
            error: 'Chyba při komunikaci se serverem'
          } : f
        ));
      }
    };

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
        const files = Array.from(e.dataTransfer.files);
        files.forEach(file => processFile(file));
      }
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        const files = Array.from(e.target.files);
        files.forEach(file => processFile(file));
      }
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Nahrát dokumenty</h2>
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            Hromadné zpracování
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                dragActive ? 'border-purple-500 bg-purple-50' : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Přetáhněte soubory sem
              </h3>
              <p className="text-gray-600 mb-4">
                nebo klikněte pro výběr souborů
              </p>
              <input
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                id="file-upload"
                onChange={handleFileInput}
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <span className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors inline-block">
                  Vybrat soubory
                </span>
              </label>
              <p className="text-sm text-gray-500 mt-2">
                PDF, JPG, PNG do 10MB
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">🤖 AI zpracování</h4>
              <p className="text-sm text-blue-800">
                AI automaticky rozpozná text z dokumentů pomocí OCR, extrahuje klíčové údaje 
                (dodavatel, částka, datum, DPH) a navrhne správné zaúčtování podle 
                české legislativy včetně upozornění na možná rizika.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Zpracované soubory</h3>
            
            {uploadedFiles.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Zatím žádné soubory nenahrány
              </div>
            ) : (
              <div className="space-y-3">
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900 truncate">{file.name}</span>
                      <div className="flex items-center gap-2">
                        {file.status === 'completed' && <CheckCircle className="w-4 h-4 text-green-600" />}
                        {file.status === 'error' && <AlertCircle className="w-4 h-4 text-red-600" />}
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          file.status === 'uploading' ? 'bg-blue-100 text-blue-800' :
                          file.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                          file.status === 'completed' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {file.status === 'uploading' ? 'Nahrávám...' :
                           file.status === 'processing' ? 'Zpracovává AI...' :
                           file.status === 'completed' ? 'Hotovo' : 'Chyba'}
                        </span>
                      </div>
                    </div>
                    
                    {(file.status === 'uploading' || file.status === 'processing') && (
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                        <div 
                          className="bg-purple-600 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${file.progress || 0}%` }}
                        ></div>
                      </div>
                    )}

                    {file.status === 'error' && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                        {file.error}
                      </div>
                    )}
                    
                    {file.extractedData && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <h5 className="font-medium text-gray-900 mb-2">AI analýza dokončena:</h5>
                        
                        {file.extractedData.structuredData ? (
                          <div className="space-y-2">
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div><strong>Dodavatel:</strong> {file.extractedData.structuredData.dodavatel || 'N/A'}</div>
                              <div><strong>Částka:</strong> {file.extractedData.structuredData.castka_celkem || 'N/A'}</div>
                              <div><strong>Datum:</strong> {file.extractedData.structuredData.datum_vystaveni || 'N/A'}</div>
                              <div><strong>DPH:</strong> {file.extractedData.structuredData.dph_castka || 'N/A'}</div>
                            </div>
                            
                            {file.extractedData.structuredData.zauctovani_navrh && (
                              <div className="mt-3 p-2 bg-blue-50 rounded text-sm">
                                <strong>Návrh zaúčtování:</strong><br />
                                MD {file.extractedData.structuredData.zauctovani_navrh.md} / 
                                DAL {file.extractedData.structuredData.zauctovani_navrh.dal}<br />
                                {file.extractedData.structuredData.zauctovani_navrh.popis}
                              </div>
                            )}

                            {file.extractedData.structuredData.upozorneni && (
                              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                                <strong>⚠️ Upozornění:</strong> {file.extractedData.structuredData.upozorneni}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-600 max-h-32 overflow-y-auto">
                            <strong>Rozpoznaný text:</strong><br />
                            {file.extractedData.extractedText?.substring(0, 300)}...
                          </div>
                        )}

                        <div className="mt-3 flex gap-2">
                          <button className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors">
                            Schválit zaúčtování
                          </button>
                          <button className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors">
                            Upravit
                          </button>
                          <button className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors">
                            Detail
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return renderDashboard();
      case 'chat':
        return renderChat();
      case 'upload':
        return renderUpload();
      case 'voice':
        return (
          <div className="bg-white rounded-xl p-8 text-center shadow-sm border">
            <Mic className="w-16 h-16 text-purple-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Hlasové zadávání</h2>
            <p className="text-gray-600 mb-6">
              Řekněte, co chcete zaúčtovat, a AI automaticky vytvoří účetní zápis
            </p>
            <button 
              onClick={startVoiceRecording}
              className={`px-8 py-4 rounded-xl text-white font-medium text-lg transition-all ${
                isRecording 
                  ? 'bg-red-600 hover:bg-red-700 animate-pulse' 
                  : 'bg-purple-600 hover:bg-purple-700'
              }`}
            >
              {isRecording ? 'Nahrávám... (klikněte pro ukončení)' : 'Začít nahrávání'}
            </button>
          </div>
        );
      case 'documents':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Dokumenty</h2>
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <p className="text-gray-600">Seznam všech dokumentů bude zde...</p>
            </div>
          </div>
        );
      case 'reports':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Reporty a analýzy</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                'Výkaz zisku a ztráty',
                'Rozvaha',
                'DPH přehled',
                'Cashflow analýza',
                'Daňový přehled',
                'Vlastní report'
              ].map((report) => (
                <div key={report} className="bg-white rounded-xl p-6 shadow-sm border hover:shadow-md transition-shadow cursor-pointer">
                  <TrendingUp className="w-8 h-8 text-purple-600 mb-3" />
                  <h3 className="font-semibold text-gray-900 mb-2">{report}</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Automaticky generovaný report s AI analýzou
                  </p>
                  <button className="text-purple-600 text-sm font-medium hover:text-purple-700">
                    Generovat →
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      default:
        return renderDashboard();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-white shadow-lg transition-all duration-300 flex flex-col`}>
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {sidebarOpen && (
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  A!Accountant
                </h1>
                <p className="text-sm text-gray-600">AI účetní software</p>
              </div>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <nav className="flex-1 p-4">
          <div className="space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors ${
                    activeTab === item.id
                      ? 'bg-purple-100 text-purple-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {sidebarOpen && <span className="font-medium">{item.name}</span>}
                </button>
              );
            })}
          </div>
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            {sidebarOpen && (
              <div>
                <p className="font-medium text-gray-900 text-sm">{user.email}</p>
                <p className="text-xs text-gray-600">Účetní expert</p>
              </div>
            )}
          </div>
          
          {sidebarOpen && (
            <div className="space-y-2">
              <button className="w-full flex items-center gap-3 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm">
                <Settings className="w-4 h-4" />
                Nastavení
              </button>
              <button 
                onClick={() => setUser(null)}
                className="w-full flex items-center gap-3 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm"
              >
                <LogOut className="w-4 h-4" />
                Odhlásit se
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {navigation.find(item => item.id === activeTab)?.name || 'Dashboard'}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Vítejte v AI účetním systému
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                AI aktivní
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-y-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
