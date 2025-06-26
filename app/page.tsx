'use client'

import Link from 'next/link'

export default function Dashboard() {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-blue-800 text-white p-6">
        <div className="mb-8">
          <h1 className="text-xl font-bold">A!Accountant</h1>
          <p className="text-blue-200 text-sm">AI účetní software</p>
        </div>
        
        <nav className="space-y-4">
          <Link href="/" className="flex items-center p-3 rounded-lg bg-blue-700 text-white">
            <span className="mr-3">📊</span>
            Dashboard
          </Link>
          <Link href="/chat" className="flex items-center p-3 rounded-lg hover:bg-blue-700 text-blue-200 hover:text-white transition-colors">
            <span className="mr-3">🤖</span>
            AI Assistant
          </Link>
          <Link href="/analyze-document" className="flex items-center p-3 rounded-lg hover:bg-blue-700 text-blue-200 hover:text-white transition-colors">
            <span className="mr-3">📄</span>
            Dokumenty
          </Link>
          <Link href="/analyze-document" className="flex items-center p-3 rounded-lg hover:bg-blue-700 text-blue-200 hover:text-white transition-colors">
            <span className="mr-3">📎</span>
            Nahrát doklad
          </Link>
          <div className="flex items-center p-3 rounded-lg hover:bg-blue-700 text-blue-200 hover:text-white transition-colors cursor-pointer">
            <span className="mr-3">🕐</span>
            Hlasové zadání
          </div>
          <div className="flex items-center p-3 rounded-lg hover:bg-blue-700 text-blue-200 hover:text-white transition-colors cursor-pointer">
            <span className="mr-3">📈</span>
            Reporty
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white p-6 rounded-xl mb-6 shadow-lg">
          <h2 className="text-2xl font-bold">Vítejte v A!Accountant</h2>
          <p className="text-purple-100 mt-2">Váš AI asistent pro účetnictví a daně</p>
          <div className="mt-4">
            <Link href="/analyze-document" className="bg-white text-purple-800 px-6 py-2 rounded-lg font-semibold hover:bg-purple-50 transition-colors">
              + Nový doklad
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600">Celkové příjmy</p>
                <p className="text-2xl font-bold text-gray-800">2 450 000 Kč</p>
                <p className="text-green-600 text-sm">+12% vs minulý měsíc</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <span className="text-green-600 text-2xl">💰</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600">Celkové výdaje</p>
                <p className="text-2xl font-bold text-gray-800">1 850 000 Kč</p>
                <p className="text-red-600 text-sm">+8% vs minulý měsíc</p>
              </div>
              <div className="bg-red-100 p-3 rounded-lg">
                <span className="text-red-600 text-2xl">📉</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600">Čistý zisk</p>
                <p className="text-2xl font-bold text-gray-800">600 000 Kč</p>
                <p className="text-blue-600 text-sm">+18% vs minulý měsíc</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <span className="text-blue-600 text-2xl">📈</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600">AI zpracování</p>
                <p className="text-2xl font-bold text-gray-800">156 dokladů</p>
                <p className="text-purple-600 text-sm">+23% vs minulý měsíc</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <span className="text-purple-600 text-2xl">🤖</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Transactions */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Poslední transakce</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium text-gray-800">Faktura #2025-001</p>
                  <p className="text-sm text-gray-600">24.6.2025</p>
                </div>
                <span className="text-red-600 font-semibold">-12 500 Kč</span>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium text-gray-800">Přijatá platba</p>
                  <p className="text-sm text-gray-600">24.6.2025</p>
                </div>
                <span className="text-green-600 font-semibold">+35 000 Kč</span>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium text-gray-800">Kancelářské potřeby</p>
                  <p className="text-sm text-gray-600">23.6.2025</p>
                </div>
                <span className="text-red-600 font-semibold">-2 340 Kč</span>
              </div>
            </div>
          </div>

          {/* AI Recommendations */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">AI doporučení</h3>
            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
                <p className="text-sm">
                  <span className="font-semibold text-yellow-800">⚠️ Upozornění na DPH</span>
                  <br />
                  U faktury #2025-003 zkontrolujte správnost DPH sazby.
                </p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                <p className="text-sm">
                  <span className="font-semibold text-blue-800">💡 Tip pro optimalizaci</span>
                  <br />
                  Můžete uplatnit odpočet DPH za pohonné hmoty z minulého měsíce.
                </p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-400">
                <p className="text-sm">
                  <span className="font-semibold text-green-800">✅ Vše v pořádku</span>
                  <br />
                  Účetní období je uzavřeno bez chyb.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
