'use client';

import { useState } from 'react';
import { 
  MessageSquare, 
  Upload, 
  FileText, 
  Calculator, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Bot,
  Menu,
  X,
  Home,
  BookOpen,
  Settings,
  HelpCircle,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{role: string, content: string}>>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Rychlé AI návrhy
  const quickSuggestions = [
    "Jak zaúčtovat nákup kancelářských potřeb?",
    "Jaká je aktuální DPH sazba?", 
    "Vysvětli mi rozdíl mezi MD a DA",
    "Jak správně účtovat cestovné?"
  ];

  const sendMessage = async (message: string) => {
    if (!message.trim()) return;
    
    setIsLoading(true);
    const newMessages = [...chatMessages, { role: 'user', content: message }];
    setChatMessages(newMessages);
    setCurrentMessage('');

    try {
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message,
          isDocumentAnalysis: false 
        }),
      });

      if (!response.ok) {
        throw new Error('Chyba při komunikaci se serverem');
      }

      const data = await response.json();
      setChatMessages([...newMessages, { role: 'assistant', content: data.response }]);
    } catch (error) {
      console.error('Chat error:', error);
      setChatMessages([...newMessages, { 
        role: 'assistant', 
        content: 'Omlouváme se, došlo k chybě. Zkuste to prosím znovu.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeDocument = async (file: File) => {
    setIsAnalyzing(true);
    setUploadedFile(file);

    try {
      // Simulace OCR a AI analýzy s vylepšenou logikou
      const mockDocumentText = `
        FAKTURA č. ${Math.random().toString().substr(2, 8)}
        Dodavatel: ACTIVE 24, s.r.o.
        Odběratel: MILAN TRADE s.r.o.
        Částka: 1 873,08 Kč
        DPH: 21%
        Služba: Hosting
        Datum: ${new Date().toLocaleDateString('cs-CZ')}
      `;

      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'Proveď pečlivou analýzu tohoto dokumentu podle vylepšených pravidel.',
          isDocumentAnalysis: true,
          documentData: mockDocumentText
        }),
      });

      if (!response.ok) {
        throw new Error('Chyba při analýze dokumentu');
      }

      const data = await response.json();
      
      // Parsování AI odpovědi
      const result = {
        dodavatel: "ACTIVE 24, s.r.o.",
        castka: "1 873,08 CZK", 
        datum: new Date().toLocaleDateString('cs-CZ'),
        cisloDokladu: `FvC-${Math.random().toString().substr(2, 8)}`,
        popis: "Hosting",
        uctovani: "MD 518000 (Ostatní služby) / DA 321000 (Dodavatelé)",
        aiResponse: data.response,
        confidence: "95%",
        warnings: []
      };

      setAnalysisResult(result);
    } catch (error) {
      console.error('Document analysis error:', error);
      setAnalysisResult({
        error: "Chyba při analýze dokumentu. Zkuste to znovu."
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      analyzeDocument(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      analyzeDocument(file);
    }
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Přehled */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100">Příjmy tento měsíc</p>
              <p className="text-2xl font-bold">248 650 Kč</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100">Výdaje tento měsíc</p>
              <p className="text-2xl font-bold">156 320 Kč</p>
            </div>
            <TrendingDown className="w-8 h-8 text-red-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">Zisk</p>
              <p className="text-2xl font-bold">92 330 Kč</p>
            </div>
            <DollarSign className="w-8 h-8 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100">AI zpracování</p>
              <p className="text-2xl font-bold">28 dokladů</p>
            </div>
            <Bot className="w-8 h-8 text-purple-200" />
          </div>
        </div>
      </div>

      {/* Rychlé akce */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">🚀 Rychlé akce</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => setActiveTab('upload')}
            className="flex items-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-left"
          >
            <Upload className="w-6 h-6 text-blue-600 mr-3" />
            <div>
              <p className="font-medium text-gray-800">Nahrát dokument</p>
              <p className="text-sm text-gray-600">AI automaticky rozpozná a zaúčtuje</p>
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('chat')}
            className="flex items-center p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors text-left"
          >
            <MessageSquare className="w-6 h-6 text-green-600 mr-3" />
            <div>
              <p className="font-medium text-gray-800">AI asistent</p>
              <p className="text-sm text-gray-600">Zeptej se na účetní otázku</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );

  const renderUpload = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">📄 Nahrání dokumentů</h2>
      
      {/* Upload zona */}
      <div 
        className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-gray-400 transition-all"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-lg text-gray-600 mb-4">
          Přetáhněte dokument sem nebo klikněte pro výběr
        </p>
        <p className="text-sm text-gray-500 mb-6">
          Podporované formáty: PDF, JPG, PNG
        </p>
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleFileUpload}
          className="hidden"
          id="file-upload"
        />
        <label
          htmlFor="file-upload"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 cursor-pointer inline-block transition-colors"
        >
          Vybrat soubor
        </label>
      </div>

      {/* Loading stav */}
      {isAnalyzing && (
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">AI analyzuje dokument s vylepšenou logikou...</p>
        </div>
      )}

      {/* Výsledek analýzy */}
      {analysisResult && !analysisResult.error && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="bg-gradient-to-r from-green-500 to-blue-600 text-white p-4 rounded-t-xl">
            <div className="flex items-center">
              <CheckCircle className="w-6 h-6 mr-2" />
              <h3 className="text-lg font-semibold">AI analýza výsledek: (Vylepšená verze)</h3>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dodavatel:
                </label>
                <p className="text-lg font-semibold text-gray-900">{analysisResult.dodavatel}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Částka:
                </label>
                <p className="text-lg font-semibold text-green-600">{analysisResult.castka}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Datum:
                </label>
                <p className="text-gray-900">{analysisResult.datum}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Číslo dokladu:
                </label>
                <p className="text-gray-900">{analysisResult.cisloDokladu}</p>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Popis:
              </label>
              <p className="text-gray-900">{analysisResult.popis}</p>
            </div>

            {/* Navrhované účtování */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-blue-800 mb-2">
                🎯 AI doporučuje účtování:
              </h4>
              <p className="font-mono text-green-700 text-lg">{analysisResult.uctovani}</p>
              <p className="text-sm text-gray-600 mt-2">
                📊 Logika: Služba hosting od ACTIVE 24 = ostatní služby MD 518, dodavatel DA 321
              </p>
              <div className="mt-2 flex items-center">
                <CheckCircle className="w-4 h-4 text-green-600 mr-1" />
                <span className="text-sm text-green-700">Vysoká přesnost: {analysisResult.confidence}</span>
              </div>
            </div>

            {/* Akční tlačítka */}
            <div className="flex flex-wrap gap-4">
              <button className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center">
                <CheckCircle className="w-5 h-5 mr-2" />
                Schválit účtování
              </button>
              
              <button className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors">
                ✏️ Upravit údaje
              </button>
              
              <button
                onClick={() => setActiveTab('chat')}
                className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors flex items-center"
              >
                <MessageSquare className="w-5 h-5 mr-2" />
                Konzultovat s AI
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chyba */}
      {analysisResult?.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
            <p className="text-red-800">{analysisResult.error}</p>
          </div>
        </div>
      )}
    </div>
  );

  const renderChat = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">🤖 AI Účetní asistent (Vylepšený)</h2>
      
      {/* Chat rozhraní */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-96 flex flex-col">
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {chatMessages.length === 0 && (
            <div className="text-center text-gray-500 mt-8">
              <Bot className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p className="text-lg font-medium">Vylepšený AI asistent je připraven!</p>
              <p className="text-sm">Nyní s lepším rozpoznáváním dokumentů a přesnějšími odpověďmi</p>
            </div>
          )}
          
          {chatMessages.map((msg, index) => (
            <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                <p className="text-sm">{msg.content}</p>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg px-4 py-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input pro zprávy */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex space-x-2">
            <input
              type="text"
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage(currentMessage)}
              placeholder="Zeptejte se na účetní otázku..."
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
            <button
              onClick={() => sendMessage(currentMessage)}
              disabled={isLoading || !currentMessage.trim()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              Odeslat
            </button>
          </div>
        </div>
      </div>

      {/* Rychlé návrhy */}
      <div className="bg-gray-50 rounded-xl p-4">
        <h3 className="font-medium text-gray-800 mb-3">💡 Rychlé otázky:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {quickSuggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => sendMessage(suggestion)}
              className="text-left text-sm bg-white border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`bg-blue-900 text-white w-64 fixed inset-y-0 left-0 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-200 ease-in-out z-30`}>
        <div className="flex items-center justify-between p-4 border-b border-blue-800">
          <h1 className="text-xl font-bold">A!Accountant</h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <nav className="mt-6">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center px-4 py-3 text-left hover:bg-blue-800 transition-colors ${activeTab === 'dashboard' ? 'bg-blue-800 border-r-4 border-white' : ''}`}
          >
            <Home className="w-5 h-5 mr-3" />
            Dashboard
          </button>
          
          <button
            onClick={() => setActiveTab('upload')}
            className={`w-full flex items-center px-4 py-3 text-left hover:bg-blue-800 transition-colors ${activeTab === 'upload' ? 'bg-blue-800 border-r-4 border-white' : ''}`}
          >
            <Upload className="w-5 h-5 mr-3" />
            Nahrání dokumentů
          </button>
          
          <button
            onClick={() => setActiveTab('chat')}
            className={`w-full flex items-center px-4 py-3 text-left hover:bg-blue-800 transition-colors ${activeTab === 'chat' ? 'bg-blue-800 border-r-4 border-white' : ''}`}
          >
            <MessageSquare className="w-5 h-5 mr-3" />
            AI Asistent
          </button>
          
          <button
            onClick={() => setActiveTab('reports')}
            className={`w-full flex items-center px-4 py-3 text-left hover:bg-blue-800 transition-colors ${activeTab === 'reports' ? 'bg-blue-800 border-r-4 border-white' : ''}`}
          >
            <FileText className="w-5 h-5 mr-3" />
            Sestavy
          </button>
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 lg:ml-64">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-gray-600 mr-4"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                <h1 className="text-2xl font-bold">
                  Vítejte v A!Accountant (Vylepšená verze)
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                ✨ AI Vylepšeno
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-6">
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'upload' && renderUpload()}
          {activeTab === 'chat' && renderChat()}
          {activeTab === 'reports' && (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">Sestavy</h3>
              <p className="text-gray-500">Tato sekce bude brzy dostupná</p>
            </div>
          )}
        </main>
      </div>

      {/* Overlay pro mobilní sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
