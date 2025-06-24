'use client'
import React, { useState } from 'react'
import { Calculator, MessageSquare, FileText, Upload, TrendingUp, Users, Settings, Menu, X, Send, Mic, DollarSign } from 'lucide-react'

export default function HomePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [chatInput, setChatInput] = useState('')
  const [chatMessages, setChatMessages] = useState([
    { id: 1, type: 'ai', content: 'Dobrý den! Jsem váš AI účetní asistent. Jak vám mohu pomoci s účetnictvím?' }
  ])

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
    { id: 'documents', label: 'Doklady', icon: FileText },
    { id: 'accounting', label: 'Účetnictví', icon: Calculator },
    { id: 'ai-chat', label: 'AI Asistent', icon: MessageSquare },
    { id: 'settings', label: 'Nastavení', icon: Settings },
  ]

  const handleSendMessage = () => {
    if (!chatInput.trim()) return
    
    const newMessage = {
      id: chatMessages.length + 1,
      type: 'user' as const,
      content: chatInput
    }
    
    setChatMessages([...chatMessages, newMessage])
    setChatInput('')
    
    // Simulace AI odpovědi
    setTimeout(() => {
      const aiResponse = {
        id: chatMessages.length + 2,
        type: 'ai' as const,
        content: 'Rozumím vašemu dotazu o účetnictví. Můžu vám pomoci s účtováním, daňovými otázkami nebo generováním dokladů. Na čem konkrétně pracujete?'
      }
      setChatMessages(prev => [...prev, aiResponse])
    }, 1000)
  }

  const stats = [
    {
      title: 'Celkové příjmy',
      value: '2,450,000 Kč',
      change: '+12%',
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Celkové výdaje',
      value: '1,850,000 Kč',
      change: '+5%',
      icon: DollarSign,
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    },
    {
      title: 'Čistý zisk',
      value: '600,000 Kč',
      change: '+18%',
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Zpracované doklady',
      value: '156',
      change: '+23',
      icon: FileText,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    }
  ]

  const documents = [
    { id: 1, name: 'Faktura 2025001.pdf', status: 'processed', amount: '25,500 Kč', date: '2025-06-20' },
    { id: 2, name: 'Účtenka Tesco.jpg', status: 'pending', amount: '1,250 Kč', date: '2025-06-22' },
    { id: 3, name: 'Mzdový list.pdf', status: 'review', amount: '45,000 Kč', date: '2025-06-23' },
  ]

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <div className="text-sm text-gray-500">
                Dnes: {new Date().toLocaleDateString('cs-CZ')}
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <div key={index} className="bg-white p-6 rounded-xl shadow-sm border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                      <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
                      <p className={`text-sm mt-1 ${stat.color}`}>
                        {stat.change} oproti minulému měsíci
                      </p>
                    </div>
                    <div className={`p-3 rounded-full ${stat.bgColor}`}>
                      <stat.icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* AI Alert */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <MessageSquare className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-amber-800">AI Upozornění</h3>
                  <p className="text-sm text-amber-700 mt-1">
                    Byla detekována faktura bez uvedeného DIČ. Doporučuji ověřit u dodavatele před zaúčtováním.
                  </p>
                </div>
              </div>
            </div>

            {/* Recent Documents */}
            <div className="bg-white rounded-xl shadow-sm border">
              <div className="p-6 border-b">
                <h2 className="text-lg font-semibold text-gray-900">Nedávné doklady</h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {documents.map(doc => (
                    <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-5 h-5 text-gray-500" />
                        <div>
                          <p className="font-medium text-gray-900">{doc.name}</p>
                          <p className="text-sm text-gray-500">{doc.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="font-medium text-gray-900">{doc.amount}</span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          doc.status === 'processed' ? 'bg-green-100 text-green-800' :
                          doc.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {doc.status === 'processed' ? 'Zpracováno' :
                           doc.status === 'pending' ? 'Čeká na schválení' : 'Ke kontrole'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )

      case 'documents':
        return (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold text-gray-900">Správa dokladů</h1>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700">
                <Upload className="w-4 h-4" />
                <span>Nahrát doklady</span>
              </button>
            </div>

            {/* Upload Zone */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-600">Přetáhněte soubory sem</p>
              <p className="text-sm text-gray-500 mt-2">nebo klikněte pro výběr souborů</p>
              <p className="text-xs text-gray-400 mt-1">Podporované formáty: PDF, JPG, PNG</p>
            </div>

            {/* Documents List */}
            <div className="bg-white rounded-xl shadow-sm border">
              <div className="p-6 border-b">
                <h2 className="text-lg font-semibold text-gray-900">Všechny doklady</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Název</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Částka</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Datum</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stav</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {documents.map(doc => (
                      <tr key={doc.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <FileText className="w-5 h-5 text-gray-400 mr-3" />
                            <span className="font-medium">{doc.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">{doc.amount}</td>
                        <td className="px-6 py-4">{doc.date}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            doc.status === 'processed' ? 'bg-green-100 text-green-800' :
                            doc.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {doc.status === 'processed' ? 'Zpracováno' :
                             doc.status === 'pending' ? 'Čeká na schválení' : 'Ke kontrole'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )

      case 'ai-chat':
        return (
          <div className="space-y-8">
            <h1 className="text-3xl font-bold text-gray-900">AI Asistent</h1>
            
            <div className="bg-white rounded-xl shadow-sm border h-[600px] flex flex-col">
              <div className="p-4 border-b">
                <h3 className="font-semibold text-gray-900 flex items-center">
                  <MessageSquare className="w-5 h-5 mr-2" />
                  AI Účetní Asistent
                </h3>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-2 ${
                        message.type === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="border-t p-4">
                <div className="flex items-center space-x-2">
                  <input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Zeptejte se na účetnictví..."
                    className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                  <button className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200">
                    <Mic className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleSendMessage}
                    className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">{activeTab}</h1>
            <div className="bg-white p-8 rounded-xl text-center">
              <p className="text-gray-500">Tato sekce je v přípravě...</p>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-bold text-blue-600">A!Accountant</h2>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <nav className="flex-1 p-4 space-y-2">
            {menuItems.map(item => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id)
                  setSidebarOpen(false)
                }}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                  activeTab === item.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
          
          <div className="p-4 border-t">
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <Users className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium">Milan Vlasák</p>
                <p className="text-xs text-gray-500">milan@vlasak.cloud</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm border-b p-4 lg:ml-0">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex-1 max-w-md mx-4">
              <input
                type="text"
                placeholder="Vyhledat v účetnictví..."
                className="w-full pl-4 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex items-center space-x-3">
              <button className="p-2 rounded-lg hover:bg-gray-100 relative">
                <MessageSquare className="w-5 h-5 text-gray-600" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 overflow-auto lg:ml-0">
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
  )
}
