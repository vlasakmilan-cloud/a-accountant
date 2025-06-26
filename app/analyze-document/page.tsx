import Link from 'next/link'

export default function AnalyzeDocumentPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center mb-4">
            <Link href="/" className="flex items-center text-purple-100 hover:text-white">
              ← Zpět na dashboard
            </Link>
          </div>
          <h1 className="text-3xl font-bold">📄 Nahrát doklady</h1>
          <p className="text-purple-100 mt-2">AI automaticky rozpozná obsah a navrhne správné účtování</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            📁 Přidejte dokumenty
          </h2>

          {/* Upload Zone */}
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
            <div className="text-6xl mb-4">📄</div>
            <p className="text-lg font-medium text-gray-600">
              Přetáhněte soubory zde nebo klikněte pro výběr
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Podporované formáty: JPG, PNG, PDF
            </p>
            
            <button className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
              Vybrat soubory
            </button>
          </div>

          {/* Status */}
          <div className="mt-6 p-4 bg-green-50 rounded-lg">
            <div className="flex items-center">
              <div className="text-2xl mr-3">✅</div>
              <div>
                <h3 className="font-semibold text-green-800">Stránka funguje!</h3>
                <p className="text-green-700 text-sm">
                  Upload funkcionalita se přidává postupně. Nyní testujeme základní routing.
                </p>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg text-center">
              <div className="text-3xl mb-2">🤖</div>
              <h4 className="font-semibold text-blue-800">AI Rozpoznávání</h4>
              <p className="text-blue-700 text-sm">Automaticky přečte text z dokumentů</p>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg text-center">
              <div className="text-3xl mb-2">💡</div>
              <h4 className="font-semibold text-yellow-800">Chytré účtování</h4>
              <p className="text-yellow-700 text-sm">AI navrhne správné MD/DA účty</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg text-center">
              <div className="text-3xl mb-2">⚡</div>
              <h4 className="font-semibold text-purple-800">Rychlé zpracování</h4>
              <p className="text-purple-700 text-sm">Výsledky během několika sekund</p>
            </div>
          </div>

          {/* Back Button */}
          <div className="mt-6 text-center">
            <Link href="/" className="inline-flex items-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
              ← Zpět na hlavní stránku
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
