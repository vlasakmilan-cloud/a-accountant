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

  // Základní extrakce textu bez OCR knihoven
  const extractFileContent = async (file: File): Promise<string> => {
    console.log(`🔍 Processing file: ${file.name} (${file.type})`)
    
    try {
      // Text soubory můžeme číst přímo
      if (file.type.startsWith('text/') || file.name.endsWith('.csv') || file.name.endsWith('.txt')) {
        console.log('📝 Reading text file...')
        const text = await file.text()
        return text
      }
      
      // PDF soubory - bez OCR knihovny můžeme jen základní info
      else if (file.type === 'application/pdf') {
        console.log('📄 PDF detected - OCR libraries needed for full extraction')
        return `PDF soubor: ${file.name}
Velikost: ${(file.size / 1024 / 1024).toFixed(2)} MB
Datum nahrání: ${new Date().toLocaleDateString('cs-CZ')}

⚠️ Pro plné čtení PDF obsahu je potřeba implementovat OCR knihovny.
Zatím můžete:
1. Konvertovat PDF na text soubor
2. Přidat údaje ručně
3. Nebo instalovat OCR knihovny (pdfjs-dist, tesseract.js)`
      }
      
      // Obrázky - bez OCR knihovny nemůžeme číst
      else if (file.type.startsWith('image/')) {
        console.log('🖼️ Image detected - OCR libraries needed')
        return `Obrázek: ${file.name}
Typ: ${file.type}
Velikost: ${(file.size / 1024 / 1024).toFixed(2)} MB
Datum nahrání: ${new Date().toLocaleDateString('cs-CZ')}

⚠️ Pro čtení textu z obrázků je potřeba implementovat OCR.
Zatím můžete:
1. Přepsat údaje ručně
2. Konvertovat obrázek na text
3. Nebo instalovat OCR knihovny (tesseract.js)`
      }
      
      // Excel/Office soubory
      else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        return `Excel soubor: ${file.name}
Velikost: ${(file.size / 1024 / 1024).toFixed(2)} MB
Datum nahrání: ${new Date().toLocaleDateString('cs-CZ')}

⚠️ Pro čtení Excel souborů je potřeba implementovat SheetJS knihovnu.
Zatím můžete:
1. Exportovat Excel do CSV formátu
2. Kopírovat data ručně
3. Nebo instalovat SheetJS knihovnu`
      }
      
      // Neznámé typy
      else {
        return `Soubor: ${file.name}
Typ: ${file.type}
Velikost: ${(file.size / 1024 / 1024).toFixed(2)} MB
Status: Nepodporovaný typ souboru pro analýzu

Podporované formáty:
- Text soubory (.txt, .csv)
- PDF (s OCR knihovnami)  
- Obrázky (s OCR knihovnami)
- Excel (s SheetJS knihovnou)`
      }
      
    } catch (error) {
      console.error('❌ File processing error:', error)
      return `Chyba při zpracování souboru: ${error}`
    }
  }

  const getAccountingForType = (type: string): string => {
    switch (type) {
      case 'faktura_prijata': return 'MD 518000 (Ostatní služby) / DA 321000 (Dodavatelé)'
      case 'faktura_vystavena': return 'MD 311000 (Odběratelé) / DA 601000 (Tržby za služby)'
      case 'pokladni_doklad': return 'MD 501000 (Spotřeba materiálu) / DA 211000 (Pokladna)'
      case 'dodaci_list': return 'MD 132000 (Zboží na skladě) / DA 321000 (Dodavatelé)'
      case 'vratka': return 'MD 321000 (Dodavatelé) / DA 132000 (Zboží na skladě)'
      case 'banka_vypis': return 'MD 221000 (Bankovní účty) / DA dle účelu platby'
      default: return 'MD 518000 (Ostatní služby) / DA 321000 (Dodavatelé)'
    }
  }

  const analyzeDocument = async (fileContent: string, fileName: string): Promise<any> => {
    try {
      console.log('🤖 Sending to AI for analysis...')
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: `ÚKOL: Analyzuj tento obsah souboru a extrahuj účetní údaje pokud jsou dostupné.

NÁZEV SOUBORU: ${fileName}

OBSAH:
${fileContent}

ODPOVĚZ POUZE JSON:
{
  "typ": "faktura_prijata",
  "dodavatel": "název pokud je v textu",
  "castka": "částka pokud je v textu",
  "datum": "datum pokud je v textu",
  "cisloDokladu": "číslo pokud je v textu",
  "popis": "popis pokud je v textu",
  "ucty": "MD 518000 / DA 321000",
  "confidence": 0.8,
  "zduvodneni": "krátké zdůvodnění"
}

PRAVIDLA:
1. Pokud text obsahuje účetní údaje, extrahuj je
2. Pokud ne, navrhni typ dokumentu podle názvu souboru
3. Vždy navrhni konkrétní MD/DA účty
4. Confidence podle dostupnosti údajů (0.1-1.0)

VRAŤ POUZE JSON!`
          }]
        })
      })

      const data = await response.json()
      const aiResponse = data.response || data.message || ''
      
      console.log('🤖 AI Response:', aiResponse)
      
      let parsedResult = null
      
      // Pokus o JSON parsing
      try {
        parsedResult = JSON.parse(aiResponse)
        console.log('✅ JSON parsing úspěšný')
      } catch (e) {
        console.log('⚠️ JSON parsing failed, trying extraction...')
        
        // Pokus o nalezení JSON v textu
        try {
          const jsonMatch = aiResponse.match(/\{[\s\S]*?\}/g)
          if (jsonMatch && jsonMatch.length > 0) {
            parsedResult = JSON.parse(jsonMatch[0])
            console.log('✅ JSON extraction úspěšný')
          }
        } catch (e2) {
          console.log('⚠️ JSON extraction failed, using manual analysis...')
          
          // Manuální analýza obsahu
          const result: any = { confidence: 0.4 }
          
          // Analýza typu podle názvu souboru a obsahu
          const lowerContent = fileContent.toLowerCase()
          const lowerFileName = fileName.toLowerCase()
          
          if (lowerContent.includes('faktura') || lowerFileName.includes('faktura')) {
            result.typ = 'faktura_prijata'
            result.ucty = 'MD 518000 (Ostatní služby) / DA 321000 (Dodavatelé)'
          } else if (lowerContent.includes('doklad') || lowerContent.includes('účtenka')) {
            result.typ = 'pokladni_doklad'
            result.ucty = 'MD 501000 (Spotřeba) / DA 211000 (Pokladna)'
          } else if (lowerContent.includes('výpis') || lowerFileName.includes('bank')) {
            result.typ = 'banka_vypis'
            result.ucty = 'MD 221000 (Bankovní účty) / DA dle účelu'
          } else {
            result.typ = 'faktura_prijata' // default
            result.ucty = 'MD 518000 (Ostatní služby) / DA 321000 (Dodavatelé)'
          }
          
          // Hledání částky v textu
          const amountMatches = fileContent.match(/(\d+[\s,\.]*\d*)\s*(Kč|CZK|czk)/gi)
          if (amountMatches && amountMatches.length > 0) {
            const amounts = amountMatches.map(m => {
              const num = parseFloat(m.replace(/[^\d,\.]/g, '').replace(',', '.'))
              return { text: m.trim(), value: num }
            }).filter(a => !isNaN(a.value))
            
            if (amounts.length > 0) {
              const maxAmount = amounts.reduce((max, curr) => curr.value > max.value ? curr : max)
              result.castka = maxAmount.text
              result.confidence = 0.6 // Vyšší confidence pokud najdeme částku
            }
          }
          
          // Hledání data
          const dateMatches = fileContent.match(/(\d{1,2})[\.\/\-](\d{1,2})[\.\/\-](\d{4})/g)
          if (dateMatches && dateMatches.length > 0) {
            result.datum = dateMatches[0]
            result.confidence = Math.min(result.confidence + 0.1, 1.0)
          }
          
          // Hledání názvu firmy
          const lines = fileContent.split('\n')
          for (const line of lines) {
            if ((line.includes('s.r.o') || line.includes('a.s.') || line.includes('spol.')) && line.length < 100) {
              result.dodavatel = line.trim()
              result.confidence = Math.min(result.confidence + 0.1, 1.0)
              break
            }
          }
          
          // Doplnění výchozích hodnot
          result.dodavatel = result.dodavatel || `Analyzováno ze souboru ${fileName}`
          result.popis = result.popis || "Extrahováno z nahrané ho obsahu"
          result.cisloDokladu = result.cisloDokladu || "Viz obsah souboru"
          result.zduvodneni = "Automatická analýza obsahu souboru"
          
          parsedResult = result
        }
      }

      // Fallback pokud vše selže
      if (!parsedResult) {
        parsedResult = {
          typ: "faktura_prijata",
          dodavatel: `Soubor: ${fileName}`,
          castka: "Nepodařilo se extrahovat",
          datum: new Date().toLocaleDateString('cs-CZ'),
          cisloDokladu: "Viz soubor",
          popis: "Ruční kontrola potřeba",
          ucty: "MD 518000 (Ostatní služby) / DA 321000 (Dodavatelé)",
          confidence: 0.3,
          zduvodneni: "Základní analýza bez OCR knihoven"
        }
      }

      // Oprava účtování pokud AI vrátilo obecnou frázi
      if (parsedResult.ucty && parsedResult.ucty.includes('konzultaci')) {
        parsedResult.ucty = getAccountingForType(parsedResult.typ)
        parsedResult.zduvodneni = (parsedResult.zduvodneni || '') + ' | Účtování automaticky opraveno'
      }

      console.log('🎯 Finální výsledek analýzy:', parsedResult)
      return parsedResult

    } catch (error) {
      console.error('❌ AI analysis error:', error)
      return {
        typ: "faktura_prijata",
        dodavatel: "Chyba při analýze",
        castka: "Chyba při analýze",
        datum: new Date().toLocaleDateString('cs-CZ'),
        popis: "Vyžaduje ruční kontrolu",
        ucty: "MD 518000 (Ostatní služby) / DA 321000 (Dodavatelé)",
        confidence: 0.2,
        zduvodneni: "Chyba při AI analýze"
      }
    }
  }

  const handleFiles = async (newFiles: File[]) => {
    const validFiles = newFiles.filter(file => {
      // Přijmeme všechny soubory, ale upozorníme na omezenou podporu
      return file.size <= 50 * 1024 * 1024 // Max 50MB
    })

    for (const file of validFiles) {
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
            aiSuggestion: analysisResult.ucty
          } : f
        ))

      } catch (error) {
        console.error('Processing error:', error)
        setFiles(prev => prev.map(f => 
          f.file === file ? { ...f, status: 'error' } : f
        ))
      }
    }
  }

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
      case 'analyzing': return 'AI analyzuje obsah...'
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
            Dokumenty
          </div>
          <div className="flex items-center p-3 rounded-lg bg-blue-700 text-white">
            <span className="mr-3">📎</span>
            Nahrát doklad
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

      <div className="flex-1 flex flex-col">
        <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white p-6 shadow-lg">
          <h2 className="text-2xl font-bold">📁 Analýza dokumentů</h2>
          <p className="text-purple-100 mt-2">AI analýza obsahu s podporou pro textové formáty</p>
        </div>

        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            
            {/* Feature Status */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <span className="text-green-500 text-xl mr-3">✅</span>
                  <div>
                    <h3 className="font-semibold text-green-800">Text soubory</h3>
                    <p className="text-green-600 text-sm">TXT, CSV - plná podpora</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center">
                  <span className="text-yellow-500 text-xl mr-3">⚠️</span>
                  <div>
                    <h3 className="font-semibold text-yellow-800">PDF & Obrázky</h3>
                    <p className="text-yellow-600 text-sm">Omezená podpora - potřeba OCR</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center">
                  <span className="text-blue-500 text-xl mr-3">🤖</span>
                  <div>
                    <h3 className="font-semibold text-blue-800">AI Analýza</h3>
                    <p className="text-blue-600 text-sm">Funguje se všemi formáty</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                📁 Nahrát účetní doklady
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
                <div className="text-6xl mb-4">📁</div>
                <p className="text-lg font-medium text-gray-600">
                  Přetáhněte dokumenty zde nebo klikněte pro výběr
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Všechny formáty přijímány - AI analyzuje dostupný obsah
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  💡 Pro nejlepší výsledky použijte textové soubory nebo CSV
                </p>
                
                <button className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                  Vybrat soubory
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

            {files.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Zpracované dokumenty ({files.length})
                </h3>
                
                <div className="space-y-6">
                  {files.map((file, index) => (
                    <div key={index} className="border rounded-lg p-6 bg-gray-50">
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

                      {file.extractedData && file.status === 'completed' && (
                        <div className="mt-4 p-4 bg-white rounded-lg border">
                          <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                            <span className="mr-2">🤖</span>
                            AI analýza:
                          </h4>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-4">
                            {file.extractedData.typ && (
                              <div>
                                <span className="text-gray-600">Typ dokumentu:</span>
                                <span className="ml-2 font-medium">{getDocumentTypeName(file.extractedData.typ)}</span>
                              </div>
                            )}
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
                          
                          {file.aiSuggestion && (
                            <div className="mb-4 p-3 bg-purple-50 rounded-lg">
                              <p className="text-sm">
                                <span className="font-medium text-purple-800">💡 AI doporučuje účtování:</span>
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

                          <div className="flex gap-2 flex-wrap">
                            <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm transition-colors">
                              ✓ Schválit a zaúčtovat
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
                                      <h3 class="font-bold mb-4">Obsah souboru:</h3>
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

            {files.length === 0 && (
              <div className="bg-blue-50 rounded-xl p-6 text-center">
                <div className="text-4xl mb-4">🚀</div>
                <h3 className="text-lg font-semibold text-blue-800 mb-2">Systém je připraven!</h3>
                <p className="text-blue-700 mb-4">
                  Aplikace funguje bez OCR knihoven. Pro nejlepší výsledky nahrajte:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="bg-white p-3 rounded-lg border">
                    <strong className="text-green-600">✅ Text soubory</strong>
                    <br />TXT, CSV s účetními údaji
                  </div>
                  <div className="bg-white p-3 rounded-lg border">
                    <strong className="text-yellow-600">⚠️ PDF soubory</strong>
                    <br />Základní info + AI odhad
                  </div>
                  <div className="bg-white p-3 rounded-lg border">
                    <strong className="text-blue-600">🔮 Obrázky</strong>
                    <br />Název + AI klasifikace
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}
