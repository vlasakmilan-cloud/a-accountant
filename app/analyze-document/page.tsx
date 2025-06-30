'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'

interface UploadedFile {
  file: File
  preview: string
  status: 'uploading' | 'analyzing' | 'completed' | 'error'
  fileContent?: string
  documentType?: string
  extractedData?: {
    typ: string
    dodavatel?: string
    odberatel?: string
    castka?: string
    datum?: string
    cisloDokladu?: string
    popis?: string
    dph?: string
    ucty?: string
    zduvodneni?: string
  }
  aiSuggestion?: string
  confidence?: number
  errorMessage?: string
}

export default function AnalyzeDocumentPage() {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFiles = Array.from(e.dataTransfer.files)
    handleFiles(droppedFiles)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files)
      handleFiles(selectedFiles)
    }
  }

  // Zjednodušená extrakce obsahu (jen text)
  const extractFileContent = async (file: File): Promise<string> => {
    console.log(`🔍 Processing file: ${file.name} (${file.type})`)
    
    try {
      // Textové soubory - přímé čtení
      if (file.type.startsWith('text/') || file.name.endsWith('.txt') || file.name.endsWith('.csv')) {
        console.log('📝 Reading text file...')
        const text = await file.text()
        return text
      }
      
      // CSV soubory
      else if (file.name.endsWith('.csv')) {
        console.log('📊 Reading CSV file...')
        const text = await file.text()
        return `CSV SOUBOR: ${file.name}\n\nOBSAH:\n${text}`
      }
      
      // Pro ostatní formáty - instrukce k převodu
      else if (file.type === 'application/pdf') {
        return generatePDFInstructions(file)
      }
      else if (file.type.startsWith('image/')) {
        return generateImageInstructions(file)
      }
      else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        return generateExcelInstructions(file)
      }
      else {
        return generateGenericInstructions(file)
      }
      
    } catch (error) {
      console.error('❌ File processing error:', error)
      return `CHYBA PŘI ČTENÍ SOUBORU: ${file.name}\n\nPopis chyby: ${String(error)}\n\nDoporučení: Zkuste převést soubor na textový formát (.txt) a nahrajte znovu.`
    }
  }

  // Instrukce pro PDF
  const generatePDFInstructions = (file: File): string => {
    const fileName = file.name.toLowerCase()
    let detectedInfo = ""
    
    if (fileName.includes('faktura') || fileName.includes('invoice')) {
      detectedInfo = "🎯 DETEKOVÁNO: Pravděpodobně faktura\n"
    }
    
    return `${detectedInfo}PDF DOKUMENT: ${file.name}
Velikost: ${(file.size / 1024 / 1024).toFixed(2)} MB

⚡ RYCHLÉ ŘEŠENÍ PRO PDF:
1. Otevřete PDF v prohlížeči (dvojklik)
2. Označte veškerý text (Ctrl+A)
3. Zkopírujte (Ctrl+C)
4. Vytvořte nový textový soubor (.txt)
5. Vložte obsah (Ctrl+V) a uložte
6. Nahrajte textový soubor = okamžitá AI analýza!

🚀 PŘIPRAVUJEME: Automatické čtení PDF v příští verzi`
  }

  // Instrukce pro obrázky
  const generateImageInstructions = (file: File): string => {
    return `OBRÁZEK: ${file.name}
Velikost: ${(file.size / 1024 / 1024).toFixed(2)} MB

📸 RYCHLÉ ŘEŠENÍ PRO OBRÁZKY:
1. Otevřete obrázek a přepište klíčové údaje:

   DODAVATEL: ___________________
   ČÁSTKA: _________________ Kč
   DATUM: ___________________
   ČÍSLO DOKLADU: ___________
   POPIS: ___________________

2. Uložte jako textový soubor (.txt)
3. Nahrajte = okamžitá AI analýza!

🚀 PŘIPRAVUJEME: Automatické OCR rozpoznávání`
  }

  // Instrukce pro Excel
  const generateExcelInstructions = (file: File): string => {
    return `EXCEL SOUBOR: ${file.name}

📊 RYCHLÉ ŘEŠENÍ:
1. Otevřete v Excelu/Google Sheets
2. Označte data (Ctrl+A)
3. Zkopírujte (Ctrl+C)
4. Vytvořte textový soubor (.txt)
5. Vložte (Ctrl+V) a uložte
6. Nahrajte = AI analýza všech řádků!

NEBO: Uložte jako CSV a nahrajte`
  }

  // Obecné instrukce
  const generateGenericInstructions = (file: File): string => {
    return `SOUBOR: ${file.name}
Typ: ${file.type || 'Nerozpoznaný'}

💡 UNIVERZÁLNÍ ŘEŠENÍ:
1. Otevřete soubor v příslušném programu
2. Označte obsah (Ctrl+A)
3. Zkopírujte (Ctrl+C)
4. Vložte do Poznámkového bloku
5. Uložte jako .txt
6. Nahrajte = perfektní AI analýza!`
  }

  // AI analýza dokumentu
  const analyzeDocument = async (fileContent: string, fileName: string): Promise<any> => {
    try {
      console.log('🤖 Starting AI analysis...')
      
      const response = await fetch('/api/analyze-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileContent: fileContent,
          fileName: fileName
        })
      })

      console.log('📥 Response status:', response.status)

      const analysisResult = await response.json()
      console.log('🎯 Analysis result:', analysisResult)
      
      return analysisResult

    } catch (error) {
      console.error('❌ AI analysis error:', error)
      
      return {
        typ: "faktura_prijata",
        dodavatel: `Chyba analýzy - ${fileName}`,
        castka: "Chyba při analýze",
        datum: new Date().toLocaleDateString('cs-CZ'),
        popis: "Vyžaduje ruční kontrolu",
        ucty: "MD 518000 / DA 321000",
        confidence: 0.2,
        zduvodneni: `Chyba: ${String(error)}`,
        errorMessage: String(error)
      }
    }
  }

  // Hlavní funkce pro zpracování souborů
  const handleFiles = async (newFiles: File[]) => {
    console.log('📁 Handling files:', newFiles.length)
    
    const validFiles = newFiles.filter(file => {
      if (file.size > 50 * 1024 * 1024) {
        alert(`Soubor ${file.name} je příliš velký (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum je 50 MB.`)
        return false
      }
      return true
    })

    for (const file of validFiles) {
      console.log(`🔄 Processing: ${file.name}`)
      
      const preview = file.type.includes('image') ? URL.createObjectURL(file) : ''
      const uploadedFile: UploadedFile = {
        file,
        preview,
        status: 'uploading'
      }

      setFiles(prev => [...prev, uploadedFile])

      try {
        // Extrakce obsahu
        const fileContent = await extractFileContent(file)
        
        setFiles(prev => prev.map(f => 
          f.file === file ? { ...f, status: 'analyzing', fileContent } : f
        ))

        // AI analýza
        const analysisResult = await analyzeDocument(fileContent, file.name)

        setFiles(prev => prev.map(f => 
          f.file === file ? { 
            ...f, 
            status: 'completed',
            documentType: analysisResult.typ,
            confidence: analysisResult.confidence,
            extractedData: {
              typ: analysisResult.typ,
              dodavatel: analysisResult.dodavatel,
              odberatel: analysisResult.odberatel,
              castka: analysisResult.castka,
              datum: analysisResult.datum,
              cisloDokladu: analysisResult.cisloDokladu,
              popis: analysisResult.popis,
              dph: analysisResult.dph,
              ucty: analysisResult.ucty,
              zduvodneni: analysisResult.zduvodneni
            },
            aiSuggestion: analysisResult.ucty,
            errorMessage: analysisResult.errorMessage
          } : f
        ))

        console.log('✅ File processing completed for:', file.name)

      } catch (error) {
        console.error('❌ Processing error for', file.name, ':', error)
        setFiles(prev => prev.map(f => 
          f.file === file ? { ...f, status: 'error', errorMessage: String(error) } : f
        ))
      }
    }
  }

  // Pomocné funkce pro UI
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'uploading': return '⬆️'
      case 'analyzing': return '🤖'
      case 'completed': return '✅'
      case 'error': return '❌'
      default: return '📄'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'uploading': return 'Nahrávání...'
      case 'analyzing': return 'AI analyzuje...'
      case 'completed': return 'Hotovo'
      case 'error': return 'Chyba'
      default: return 'Zpracovává se'
    }
  }

  const getDocumentTypeIcon = (type: string) => {
    switch (type) {
      case 'faktura_prijata': return '📨'
      case 'faktura_vystavena': return '📋'
      case 'pokladni_doklad': return '💰'
      case 'dodaci_list': return '🚚'
      case 'vratka': return '↩️'
      case 'banka_vypis': return '🏦'
      default: return '📄'
    }
  }

  const getDocumentTypeName = (type: string) => {
    switch (type) {
      case 'faktura_prijata': return 'Přijatá faktura'
      case 'faktura_vystavena': return 'Vystavená faktura'
      case 'pokladni_doklad': return 'Pokladní doklad'
      case 'dodaci_list': return 'Dodací list'
      case 'vratka': return 'Vratka/Dobropis'
      case 'banka_vypis': return 'Bankovní výpis'
      default: return 'Neznámý dokument'
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Levý navigační panel */}
      <div className="w-64 bg-blue-800 text-white p-6">
        <div className="mb-8">
          <h1 className="text-xl font-bold">A!Accountant</h1>
          <p className="text-blue-200 text-sm">AI účetní software</p>
        </div>
        
        <nav className="space-y-4">
          <Link href="/" className="flex items-center p-3 rounded-lg hover:bg-blue-700 text-blue-200 hover:text-white transition-colors">
            <span className="mr-3">📊</span>
            Dashboard
          </Link>
          <Link href="/chat" className="flex items-center p-3 rounded-lg hover:bg-blue-700 text-blue-200 hover:text-white transition-colors">
            <span className="mr-3">🤖</span>
            AI Assistant
          </Link>
          <div className="flex items-center p-3 rounded-lg bg-blue-700 text-white">
            <span className="mr-3">📄</span>
            Analýza dokumentů
          </div>
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

      {/* Hlavní obsah */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white p-6 shadow-lg">
          <h2 className="text-2xl font-bold">🎯 AI analýza dokumentů</h2>
          <p className="text-purple-100 mt-2">Stabilní verze s postupnou automatizací</p>
        </div>

        {/* Obsah stránky */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            
            {/* Status funkcí */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <span className="text-green-500 text-xl mr-3">✅</span>
                  <div>
                    <h3 className="font-semibold text-green-800">Text soubory</h3>
                    <p className="text-green-600 text-sm">TXT, CSV - 100% AI analýza</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center">
                  <span className="text-blue-500 text-xl mr-3">📄</span>
                  <div>
                    <h3 className="font-semibold text-blue-800">PDF, obrázky</h3>
                    <p className="text-blue-600 text-sm">Instrukce k převodu</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center">
                  <span className="text-yellow-500 text-xl mr-3">🚀</span>
                  <div>
                    <h3 className="font-semibold text-yellow-800">Automatizace</h3>
                    <p className="text-yellow-600 text-sm">PDF/OCR v přípravě</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Upload zona */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                🎯 Nahrajte účetní dokument
              </h3>

              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
                  isDragging 
                    ? 'border-purple-400 bg-purple-50' 
                    : 'border-gray-300 hover:border-purple-400 hover:bg-gray-50'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="text-6xl mb-4">🧠</div>
                <p className="text-lg font-medium text-gray-600">
                  Přetáhněte soubory nebo klikněte pro výběr
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  ✅ Text soubory: Okamžitá AI analýza<br />
                  📄 PDF/obrázky: Instrukce k převodu
                </p>
                
                <button className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                  📁 Vyberte soubory
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="*/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {/* Zpracované soubory */}
            {files.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  📄 Analyzované dokumenty ({files.length})
                </h3>
                
                <div className="space-y-6">
                  {files.map((file, index) => (
                    <div key={index} className="border rounded-lg p-6 bg-gray-50">
                      {/* Header souboru */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <div className="text-2xl mr-3">
                            {file.documentType ? getDocumentTypeIcon(file.documentType) : '📄'}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{file.file.name}</p>
                            <p className="text-sm text-gray-500">
                              {(file.file.size / 1024 / 1024).toFixed(2)} MB
                              {file.documentType && (
                                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                                  {getDocumentTypeName(file.documentType)}
                                </span>
                              )}
                              {file.confidence && (
                                <span className={`ml-2 px-2 py-1 rounded text-xs ${
                                  file.confidence > 0.7 ? 'bg-green-100 text-green-800' :
                                  file.confidence > 0.4 ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {Math.round(file.confidence * 100)}% jistota
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        
                        {/* Status */}
                        <div className="flex items-center">
                          <span className="mr-2 text-2xl">{getStatusIcon(file.status)}</span>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-700">
                              {getStatusText(file.status)}
                            </p>
                            {file.status === 'analyzing' && (
                              <div className="w-24 bg-gray-200 rounded-full h-2 mt-1">
                                <div className="bg-purple-600 h-2 rounded-full animate-pulse w-3/4"></div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Chybová zpráva */}
                      {file.status === 'error' && file.errorMessage && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-red-800 text-sm">
                            <strong>Chyba:</strong> {file.errorMessage}
                          </p>
                        </div>
                      )}

                      {/* AI analýza výsledky */}
                      {file.extractedData && file.status === 'completed' && (
                        <div className="mt-4 p-4 bg-white rounded-lg border">
                          <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                            <span className="mr-2">🎯</span>
                            AI analýza:
                          </h4>
                          
                          {/* Extrahované údaje */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-4">
                            {file.extractedData.dodavatel && (
                              <div>
                                <span className="text-gray-600">Dodavatel:</span>
                                <span className="ml-2 font-medium">{file.extractedData.dodavatel}</span>
                              </div>
                            )}
                            {file.extractedData.castka && (
                              <div>
                                <span className="text-gray-600">Částka:</span>
                                <span className="ml-2 font-medium text-green-700">{file.extractedData.castka}</span>
                              </div>
                            )}
                            {file.extractedData.datum && (
                              <div>
                                <span className="text-gray-600">Datum:</span>
                                <span className="ml-2 font-medium">{file.extractedData.datum}</span>
                              </div>
                            )}
                            {file.extractedData.cisloDokladu && (
                              <div>
                                <span className="text-gray-600">Číslo dokladu:</span>
                                <span className="ml-2 font-medium">{file.extractedData.cisloDokladu}</span>
                              </div>
                            )}
                            {file.extractedData.popis && (
                              <div>
                                <span className="text-gray-600">Popis:</span>
                                <span className="ml-2 font-medium">{file.extractedData.popis}</span>
                              </div>
                            )}
                          </div>
                          
                          {/* AI doporučení účtování */}
                          {file.aiSuggestion && (
                            <div className="mb-4 p-3 bg-purple-50 rounded-lg">
                              <p className="text-sm">
                                <span className="font-medium text-purple-800">🎯 AI doporučuje účtování:</span>
                                <br />
                                <span className="text-purple-700 font-mono">{file.aiSuggestion}</span>
                              </p>
                              {file.extractedData.zduvodneni && (
                                <p className="text-xs text-purple-600 mt-1">
                                  📝 {file.extractedData.zduvodneni}
                                </p>
                              )}
                            </div>
                          )}

                          {/* Akční tlačítka */}
                          <div className="flex gap-2 flex-wrap">
                            <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm transition-colors">
                              ✓ Schválit účtování
                            </button>
                            <button className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm transition-colors">
                              ✏️ Upravit údaje
                            </button>
                            <Link href="/chat" className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm transition-colors">
                              🤖 Konzultovat s AI
                            </Link>
                            {file.fileContent && (
                              <button 
                                onClick={() => {
                                  const modal = document.createElement('div')
                                  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
                                  modal.innerHTML = `
                                    <div class="bg-white p-6 rounded-lg max-w-4xl max-h-96 overflow-y-auto">
                                      <h3 class="font-bold mb-4">Obsah: ${file.file.name}</h3>
                                      <pre class="text-sm bg-gray-100 p-4 rounded whitespace-pre-wrap">${file.fileContent}</pre>
                                      <button onclick="this.parentElement.parentElement.remove()" class="mt-4 px-4 py-2 bg-gray-600 text-white rounded">Zavřít</button>
                                    </div>
                                  `
                                  document.body.appendChild(modal)
                                }}
                                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm transition-colors"
                              >
                                👁️ Zobrazit obsah
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Informace pro prázdný stav */}
            {files.length === 0 && (
              <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-6 text-center border border-blue-200">
                <div className="text-4xl mb-4">🎯</div>
                <h3 className="text-lg font-semibold text-blue-800 mb-2">AI systém připraven!</h3>
                <p className="text-blue-700 mb-4">
                  Stabilní verze - okamžitá analýza textových souborů, instrukce pro ostatní:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="bg-white p-3 rounded-lg border border-green-200">
                    <strong className="text-green-600">✅ Textové soubory</strong>
                    <br />Okamžitá 100% AI analýza
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-blue-200">
                    <strong className="text-blue-600">📄 PDF a obrázky</strong>
                    <br />Instrukce k převodu na text
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-yellow-200">
                    <strong className="text-yellow-600">🚀 Automatizace</strong>
                    <br />PDF/OCR v přípravě
                  </div>
                </div>
                <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-green-800 text-sm font-medium">
                    🎯 Stabilní a spolehlivá verze bez chyb buildu!
                  </p>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}
