'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { createWorker } from 'tesseract.js'

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
  ocrProgress?: number
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

  // AUTOMATICKÉ ČTENÍ VŠECH FORMÁTŮ
  const extractFileContent = async (file: File, fileIndex: number): Promise<string> => {
    console.log(`🔍 Processing file: ${file.name} (${file.type})`)
    
    try {
      // Text soubory - přímé čtení
      if (file.type.startsWith('text/') || file.name.endsWith('.txt') || file.name.endsWith('.csv')) {
        console.log('📝 Reading text file automatically...')
        const text = await file.text()
        return `TEXTOVÝ SOUBOR AUTOMATICKY PŘEČTEN: ${file.name}\n\n${text}`
      }
      
      // CSV soubory - přímé čtení
      else if (file.name.endsWith('.csv')) {
        console.log('📊 Reading CSV file automatically...')
        const text = await file.text()
        return `CSV SOUBOR AUTOMATICKY PŘEČTEN: ${file.name}\n\nOBSAH:\n${text}`
      }
      
      // PDF soubory - automatické čtení přes CDN
      else if (file.type === 'application/pdf') {
        console.log('📄 Reading PDF automatically via CDN...')
        return await extractPDFContentViaCDN(file)
      }
      
      // Obrázky - automatické OCR rozpoznávání
      else if (file.type.startsWith('image/')) {
        console.log('🖼️ Starting automatic OCR recognition...')
        return await extractImageContent(file, fileIndex)
      }
      
      // Excel soubory - instrukce k převodu
      else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        return generateExcelInstructions(file)
      }
      
      // Ostatní formáty
      else {
        return generateGenericInstructions(file)
      }
      
    } catch (error) {
      console.error('❌ File processing error:', error)
      throw error
    }
  }

  // AUTOMATICKÉ ČTENÍ PDF PŘES CDN
  const extractPDFContentViaCDN = async (file: File): Promise<string> => {
    try {
      console.log('📄 Loading PDF.js from CDN...')
      
      // Dynamicky načteme PDF.js z CDN
      const pdfjsLib = await loadPDFJS()
      
      // Convert file to array buffer
      const arrayBuffer = await file.arrayBuffer()
      
      // Load PDF
      const pdf = await pdfjsLib.getDocument({
        data: arrayBuffer,
        verbosity: 0
      }).promise
      
      console.log(`📄 PDF loaded: ${pdf.numPages} pages`)
      
      let fullText = ''
      
      // Extract text from all pages
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum)
        const textContent = await page.getTextContent()
        
        const pageText = textContent.items
          .filter((item: any) => item.str)
          .map((item: any) => item.str)
          .join(' ')
        
        fullText += `\n--- STRÁNKA ${pageNum} ---\n${pageText}\n`
      }
      
      if (!fullText.trim()) {
        // Fallback na chytrou analýzu názvu
        return generateSmartPDFAnalysis(file)
      }
      
      console.log('✅ PDF automatically read via CDN')
      
      return `PDF DOKUMENT AUTOMATICKY PŘEČTEN: ${file.name}
Počet stránek: ${pdf.numPages}
Metoda: Automatické čtení přes PDF.js
Datum zpracování: ${new Date().toLocaleDateString('cs-CZ')}

✅ OBSAH AUTOMATICKY EXTRAHOVÁN:
${fullText.trim()}`

    } catch (error) {
      console.error('❌ PDF CDN reading failed:', error)
      console.log('🔄 Falling back to smart filename analysis...')
      
      // Fallback na chytrou analýzu
      return generateSmartPDFAnalysis(file)
    }
  }

  // Dynamické načtení PDF.js z CDN
  const loadPDFJS = async (): Promise<any> => {
    return new Promise((resolve, reject) => {
      // Zkontrolujeme, jestli už není načteno
      if ((window as any).pdfjsLib) {
        resolve((window as any).pdfjsLib)
        return
      }

      // Vytvoříme script tag pro PDF.js
      const script = document.createElement('script')
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
      script.onload = () => {
        // Set worker
        const pdfjsLib = (window as any).pdfjsLib
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
        resolve(pdfjsLib)
      }
      script.onerror = () => {
        reject(new Error('Failed to load PDF.js from CDN'))
      }
      document.head.appendChild(script)
    })
  }

  // Chytrá analýza PDF (fallback)
  const generateSmartPDFAnalysis = (file: File): string => {
    const fileName = file.name.toLowerCase()
    const fileSize = (file.size / 1024 / 1024).toFixed(2)
    
    let analysis = `PDF DOKUMENT: ${file.name}
Velikost: ${fileSize} MB
Metoda: Chytrá analýza názvu (automatické čtení se pokusilo, ale selhalo)
Datum zpracování: ${new Date().toLocaleDateString('cs-CZ')}

🧠 POKROČILÁ CHYTRÁ ANALÝZA PDF:
`

    let detectedData: any = {}

    if (fileName.includes('faktura') || fileName.includes('invoice') || fileName.includes('fakt')) {
      detectedData.typ = "faktura_prijata"
      detectedData.ucty = "MD 518000 (Ostatní služby) / DA 321000 (Dodavatelé)"
      analysis += `✅ TYP: FAKTURA PŘIJATÁ (detekováno z názvu)\n`
    } else if (fileName.includes('doklad') || fileName.includes('uctenka') || fileName.includes('paragon')) {
      detectedData.typ = "pokladni_doklad"
      detectedData.ucty = "MD 501000 (Spotřeba) / DA 211000 (Pokladna)"
      analysis += `✅ TYP: POKLADNÍ DOKLAD (detekováno z názvu)\n`
    }

    const numberMatches = fileName.match(/(\d{4,})/g)
    if (numberMatches && numberMatches.length > 0) {
      const detectedNumber = numberMatches.reduce((a, b) => a.length > b.length ? a : b)
      detectedData.cisloDokladu = detectedNumber
      analysis += `📄 ČÍSLO DOKLADU: ${detectedNumber} (z názvu)\n`
    }

    analysis += `
💡 AI DOPORUČENÉ ÚČTOVÁNÍ:
${detectedData.ucty || 'MD 518000 (Ostatní služby) / DA 321000 (Dodavatelé)'}

⚡ RYCHLÉ ŘEŠENÍ PRO 100% AUTOMATIZACI:
1. Otevřete PDF v prohlížeči (dvojklik)
2. Označte veškerý text (Ctrl+A)
3. Zkopírujte (Ctrl+C)
4. Vytvořte textový soubor (.txt)
5. Vložte obsah (Ctrl+V) a uložte
6. Nahrajte .txt soubor = okamžitá 100% AI analýza!

🎯 Chytrá analýza poskytla základní detekci, pro kompletní automatizaci převeďte na text.`

    return analysis
  }

  // AUTOMATICKÉ OCR ROZPOZNÁVÁNÍ OBRÁZKŮ
  const extractImageContent = async (file: File, fileIndex: number): Promise<string> => {
    try {
      console.log('🖼️ Starting automatic OCR recognition...')
      
      // Create Tesseract worker with correct API
      const worker = await createWorker('ces+eng', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            const progress = Math.round(m.progress * 100)
            console.log(`OCR Progress: ${progress}%`)
            
            // Update progress in UI
            setFiles(prev => prev.map((f, index) => 
              index === fileIndex ? { ...f, ocrProgress: progress } : f
            ))
          }
        }
      })
      
      // Recognize text
      const { data: { text, confidence } } = await worker.recognize(file)
      
      await worker.terminate()
      
      if (!text.trim()) {
        throw new Error('OCR nerozpoznalo žádný text v obrázku')
      }
      
      console.log(`✅ OCR completed with ${Math.round(confidence)}% confidence`)
      
      return `OBRÁZEK AUTOMATICKY PŘEČTEN: ${file.name}
OCR jistota: ${Math.round(confidence)}%
Datum zpracování: ${new Date().toLocaleDateString('cs-CZ')}

✅ TEXT AUTOMATICKY ROZPOZNÁN:
${text.trim()}`

    } catch (error) {
      console.error('❌ OCR failed:', error)
      throw new Error(`Chyba při automatickém OCR: ${String(error)}`)
    }
  }

  // Instrukce pro Excel
  const generateExcelInstructions = (file: File): string => {
    return `EXCEL SOUBOR: ${file.name}

📊 RYCHLÉ ŘEŠENÍ PRO AUTOMATIZACI:
1. Otevřete v Excelu/Google Sheets
2. Uložte jako CSV (Soubor → Uložit jako → CSV)
3. Nahrajte CSV soubor = automatická AI analýza!

🚀 CSV = plná automatizace bez copy-paste`
  }

  // Obecné instrukce
  const generateGenericInstructions = (file: File): string => {
    return `SOUBOR: ${file.name}
Typ: ${file.type || 'Nerozpoznaný'}

💡 ŘEŠENÍ PRO AUTOMATIZACI:
Převeďte na podporovaný formát:
• Text (.txt) = okamžitá automatika
• CSV = okamžitá automatika
• PDF = pokus o automatiku + fallback
• Obrázky = automatické OCR`
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

      const analysisResult = await response.json()
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

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i]
      console.log(`🔄 Processing: ${file.name}`)
      
      const preview = file.type.includes('image') ? URL.createObjectURL(file) : ''
      const uploadedFile: UploadedFile = {
        file,
        preview,
        status: 'uploading',
        ocrProgress: 0
      }

      setFiles(prev => [...prev, uploadedFile])
      const fileIndex = files.length + i

      try {
        // Update status to analyzing
        setFiles(prev => prev.map((f, index) => 
          index === fileIndex ? { ...f, status: 'analyzing' } : f
        ))

        // AUTOMATICKÉ ČTENÍ OBSAHU
        const fileContent = await extractFileContent(file, fileIndex)
        
        setFiles(prev => prev.map((f, index) => 
          index === fileIndex ? { ...f, fileContent } : f
        ))

        // AI ANALÝZA
        const analysisResult = await analyzeDocument(fileContent, file.name)

        setFiles(prev => prev.map((f, index) => 
          index === fileIndex ? { 
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
        setFiles(prev => prev.map((f, index) => 
          index === fileIndex ? { 
            ...f, 
            status: 'error', 
            errorMessage: String(error)
          } : f
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

  const getStatusText = (status: string, file?: UploadedFile) => {
    switch (status) {
      case 'uploading': return 'Nahrávání...'
      case 'analyzing': 
        if (file?.file.type.startsWith('image/') && file.ocrProgress) {
          return `OCR rozpoznávání... ${file.ocrProgress}%`
        }
        if (file?.file.type === 'application/pdf') {
          return 'Čtu PDF automaticky...'
        }
        return 'AI analyzuje automaticky...'
      case 'completed': return 'Automaticky dokončeno'
      case 'error': return 'Chyba automatiky'
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
        <div className="bg-gradient-to-r from-green-600 to-green-800 text-white p-6 shadow-lg">
          <h2 className="text-2xl font-bold">🚀 Automatická analýza dokumentů</h2>
          <p className="text-green-100 mt-2">OCR obrázků • PDF čtení • Text soubory • Maximální automatizace</p>
        </div>

        {/* Obsah stránky */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            
            {/* Status funkcí */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <span className="text-green-500 text-xl mr-3">✅</span>
                  <div>
                    <h3 className="font-semibold text-green-800">Text soubory</h3>
                    <p className="text-green-600 text-sm">100% automaticky</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <span className="text-green-500 text-xl mr-3">🔍</span>
                  <div>
                    <h3 className="font-semibold text-green-800">Obrázky</h3>
                    <p className="text-green-600 text-sm">Automatické OCR</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center">
                  <span className="text-blue-500 text-xl mr-3">🚀</span>
                  <div>
                    <h3 className="font-semibold text-blue-800">PDF soubory</h3>
                    <p className="text-blue-600 text-sm">Pokus + fallback</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center">
                  <span className="text-yellow-500 text-xl mr-3">📊</span>
                  <div>
                    <h3 className="font-semibold text-yellow-800">Excel</h3>
                    <p className="text-yellow-600 text-sm">Převeďte na CSV</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Upload zona */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                🚀 Automatická analýza dokumentů
              </h3>

              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
                  isDragging 
                    ? 'border-green-400 bg-green-50' 
                    : 'border-gray-300 hover:border-green-400 hover:bg-gray-50'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="text-6xl mb-4">🎯</div>
                <p className="text-lg font-medium text-gray-600">
                  Nahrajte dokumenty - automatická analýza
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  🔍 Obrázky: Automatické OCR rozpoznávání<br />
                  🚀 PDF: Pokus o automatiku + chytrý fallback<br />
                  ✅ Text: 100% automatická analýza
                </p>
                
                <button className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  🚀 Automatická analýza
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

            {/* Stav automatizace */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 mb-6 border border-green-200">
              <div className="flex items-center mb-3">
                <span className="text-green-500 text-2xl mr-3">🎯</span>
                <h3 className="text-lg font-semibold text-green-800">Skutečný stav automatizace</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="bg-white p-3 rounded-lg border border-green-200">
                  <strong className="text-green-600">✅ 100% AUTOMATICKÉ</strong>
                  <br />• Text soubory (.txt, .csv)
                  <br />• Obrázky: OCR rozpoznávání
                  <br />• Žádná ruční práce
                </div>
                <div className="bg-white p-3 rounded-lg border border-blue-200">
                  <strong className="text-blue-600">🚀 PDF: POKUS + FALLBACK</strong>
                  <br />• Pokus o automatické čtení
                  <br />• Při selhání: chytrá analýza
                  <br />• + instrukce k převodu na text
                </div>
                <div className="bg-white p-3 rounded-lg border border-yellow-200">
                  <strong className="text-yellow-600">📊 EXCEL: CSV PŘEVOD</strong>
                  <br />• Uložte jako CSV v Excelu
                  <br />• Nahrajte CSV = automatika
                  <br />• Pracujeme na přímé podpoře
                </div>
              </div>
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
                              {(file.file.type.startsWith('image/') || file.file.type.startsWith('text/')) && (
                                <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                                  🚀 AUTO
                                </span>
                              )}
                              {file.file.type === 'application/pdf' && (
                                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                                  🎯 POKUS+FALLBACK
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
                              {getStatusText(file.status, file)}
                            </p>
                            {file.status === 'analyzing' && file.ocrProgress && (
                              <div className="w-32 bg-gray-200 rounded-full h-2 mt-1">
                                <div 
                                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${file.ocrProgress}%` }}
                                ></div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Chybová zpráva */}
                      {file.status === 'error' && file.errorMessage && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-red-800 text-sm">
                            <strong>Chyba automatiky:</strong> {file.errorMessage}
                          </p>
                        </div>
                      )}

                      {/* AI analýza výsledky */}
                      {file.extractedData && file.status === 'completed' && (
                        <div className="mt-4 p-4 bg-white rounded-lg border">
                          <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                            <span className="mr-2">🎯</span>
                            AI analýza výsledek:
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
                            <div className="mb-4 p-3 bg-green-50 rounded-lg">
                              <p className="text-sm">
                                <span className="font-medium text-green-800">🎯 AI doporučuje účtování:</span>
                                <br />
                                <span className="text-green-700 font-mono">{file.aiSuggestion}</span>
                              </p>
                              {file.extractedData.zduvodneni && (
                                <p className="text-xs text-green-600 mt-1">
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
              <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 text-center border border-green-200">
                <div className="text-4xl mb-4">🚀</div>
                <h3 className="text-lg font-semibold text-green-800 mb-2">Automatická analýza připravena!</h3>
                <p className="text-green-700 mb-4">
                  Maximální automatizace pro všechny formáty:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="bg-white p-3 rounded-lg border border-green-200">
                    <strong className="text-green-600">✅ Text soubory</strong>
                    <br />100% automatická analýza
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-green-200">
                    <strong className="text-green-600">🔍 Obrázky faktury</strong>
                    <br />Automatické OCR rozpoznávání
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-blue-200">
                    <strong className="text-blue-600">🚀 PDF soubory</strong>
                    <br />Pokus o automatiku + chytrý fallback
                  </div>
                </div>
                <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-green-800 text-sm font-medium">
                    🎯 Vyzkoušejte: Obrázek faktury = automatické OCR rozpoznávání!
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
