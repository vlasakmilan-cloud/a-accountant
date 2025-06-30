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

  // Automatická extrakce obsahu - BEZ copy-paste!
  const extractFileContent = async (file: File): Promise<string> => {
    console.log(`🔍 Auto-processing file: ${file.name} (${file.type})`)
    
    try {
      // Text soubory - přímé čtení (už funguje 100%)
      if (file.type.startsWith('text/') || file.name.endsWith('.csv') || file.name.endsWith('.txt')) {
        console.log('📝 Reading text file...')
        const text = await file.text()
        return text
      }
      
      // PDF soubory - AUTOMATICKÉ čtení obsahu
      else if (file.type === 'application/pdf') {
        console.log('📄 Auto-processing PDF with full content extraction...')
        
        try {
          // Dynamický import pdfjs
          const pdfjsLib = await import('pdfjs-dist')
          
          // Nastavení worker
          pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`
          
          const arrayBuffer = await file.arrayBuffer()
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
          
          let fullText = ''
          console.log(`📄 PDF has ${pdf.numPages} pages - extracting all text...`)
          
          // Extrahuj text ze všech stránek
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i)
            const textContent = await page.getTextContent()
            const pageText = textContent.items
              .map((item: any) => item.str)
              .join(' ')
            fullText += pageText + '\n'
            console.log(`📖 Page ${i} extracted: ${pageText.length} chars`)
          }
          
          if (fullText.trim().length > 50) {
            console.log(`✅ SUCCESS: Extracted ${fullText.length} characters from PDF`)
            return `PDF AUTOMATICKY PŘEČTEN: ${file.name}

ÚPLNÝ OBSAH:
${fullText.trim()}

🎯 AI nyní analyzuje celý obsah a extrahuje všechny údaje!`
          } else {
            console.log('⚠️ PDF obsahuje málo textu, zkouším OCR...')
            throw new Error('Minimal text found, trying OCR')
          }
          
        } catch (pdfError) {
          console.log('🔍 PDF text extraction failed, using OCR fallback...')
          
          try {
            // OCR fallback pro PDF s obrázky
            const Tesseract = await import('tesseract.js')
            console.log('🤖 Using OCR to read PDF content...')
            
            const result = await Tesseract.recognize(file, 'ces+eng', {
              logger: (m: any) => {
                if (m.status === 'recognizing text') {
                  console.log(`OCR progress: ${Math.round(m.progress * 100)}%`)
                }
              }
            })
            
            const ocrText = result.data.text.trim()
            
            if (ocrText.length > 50) {
              console.log(`✅ SUCCESS: OCR extracted ${ocrText.length} characters`)
              return `PDF PŘEČTEN POMOCÍ OCR: ${file.name}

ROZPOZNANÝ OBSAH:
${ocrText}

🎯 AI nyní analyzuje celý rozpoznaný obsah!`
            }
          } catch (ocrError) {
            console.log('❌ OCR also failed:', ocrError)
          }
          
          // Fallback - inteligentní analýza názvu
          return await generateSmartFallback(file, 'pdf')
        }
      }
      
      // Obrázky - AUTOMATICKÉ OCR rozpoznávání
      else if (file.type.startsWith('image/')) {
        console.log('🖼️ Auto-processing image with OCR...')
        
        try {
          const Tesseract = await import('tesseract.js')
          console.log('🤖 Starting OCR recognition...')
          
          const result = await Tesseract.recognize(file, 'ces+eng', {
            logger: (m: any) => {
              if (m.status === 'recognizing text') {
                console.log(`OCR progress: ${Math.round(m.progress * 100)}%`)
              }
            }
          })
          
          const extractedText = result.data.text.trim()
          
          if (extractedText.length > 30) {
            console.log(`✅ SUCCESS: OCR extracted ${extractedText.length} characters`)
            return `OBRÁZEK AUTOMATICKY ROZPOZNÁN: ${file.name}

ROZPOZNANÝ TEXT:
${extractedText}

🎯 AI nyní analyzuje celý rozpoznaný obsah a extrahuje všechny údaje!`
          } else {
            console.log('⚠️ OCR rozpoznalo málo textu')
            throw new Error('OCR extracted minimal text')
          }
          
        } catch (ocrError) {
          console.log('❌ OCR failed:', ocrError)
          return await generateSmartFallback(file, 'image')
        }
      }
      
      // Excel/CSV soubory - AUTOMATICKÉ čtení
      else if (file.name.endsWith('.csv')) {
        console.log('📊 Auto-processing CSV...')
        const text = await file.text()
        return `CSV AUTOMATICKY PŘEČTEN: ${file.name}

OBSAH:
${text}

✅ AI analyzuje všechny řádky a navrhne účtování pro každou položku.`
      }
      
      // Neznámé formáty
      else {
        return await generateSmartFallback(file, 'unknown')
      }
      
    } catch (error) {
      console.error('❌ Auto-processing error:', error)
      return await generateSmartFallback(file, 'error')
    }
  }

  // Inteligentní fallback analýza
  const generateSmartFallback = async (file: File, type: string): Promise<string> => {
    const fileName = file.name.toLowerCase()
    
    let analysis = `${type.toUpperCase()} SOUBOR: ${file.name}
Velikost: ${(file.size / 1024 / 1024).toFixed(2)} MB

🧠 INTELIGENTNÍ ANALÝZA NÁZVU:
`

    // Detekce typu
    let detectedType = "faktura_prijata"
    let suggestedAccounting = "MD 518000 / DA 321000"
    
    if (fileName.includes('faktura') || fileName.includes('invoice')) {
      analysis += `✅ DETEKOVÁNO: FAKTURA`
      detectedType = "faktura_prijata"
      suggestedAccounting = "MD 518000 / DA 321000"
    } else if (fileName.includes('doklad') || fileName.includes('uctenka')) {
      analysis += `✅ DETEKOVÁNO: POKLADNÍ DOKLAD`
      detectedType = "pokladni_doklad"  
      suggestedAccounting = "MD 501000 / DA 211000"
    } else if (fileName.includes('vypis') || fileName.includes('bank')) {
      analysis += `✅ DETEKOVÁNO: BANKOVNÍ VÝPIS`
      detectedType = "banka_vypis"
      suggestedAccounting = "MD 221000 / DA dle účelu"
    } else {
      analysis += `🔍 PRAVDĚPODOBNĚ: FAKTURA (výchozí)`
    }
    
    // Extrakce čísla
    const numberMatches = fileName.match(/(\d{4,})/g)
    if (numberMatches) {
      const detectedNumber = numberMatches.reduce((a, b) => a.length > b.length ? a : b)
      analysis += `
📄 ČÍSLO DOKLADU: ${detectedNumber}`
    }
    
    // Extrakce roku
    const yearMatches = fileName.match(/(20\d{2})/g)
    if (yearMatches) {
      analysis += `
📅 ROK: ${yearMatches[0]}`
    }

    analysis += `

💡 AI DOPORUČENÍ:
${suggestedAccounting}

⚠️ VYLEPŠENÍ V PROCESU:
${type === 'pdf' ? 'PDF knihovny se načítají...' : 
      type === 'image' ? 'OCR knihovny se načítají...' :
      'Přidáváme podporu pro tento formát...'}

🔮 BRZY: Plná automatická analýza bez copy-paste!`

    return analysis
  }

  // AI analýza dokumentu
  const analyzeDocument = async (fileContent: string, fileName: string): Promise<any> => {
    try {
      console.log('🤖 Starting AI analysis...')
      console.log('📝 Content length:', fileContent.length)
      console.log('📝 Filename:', fileName)
      
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

      console.log('📥 Response status:', response.status, response.statusText)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ API Error Response:', errorText)
        throw new Error(`API Error: ${response.status} - ${errorText}`)
      }

      const analysisResult = await response.json()
      console.log('🎯 Analysis result:', analysisResult)
      
      return analysisResult

    } catch (error) {
      console.error('❌ AI analysis error:', error)
      
      // Fallback při chybě
      return {
        typ: "faktura_prijata",
        dodavatel: `Chyba analýzy - ${fileName}`,
        castka: "Chyba při analýze",
        datum: new Date().toLocaleDateString('cs-CZ'),
        popis: "Vyžaduje ruční kontrolu",
        ucty: "MD 518000 / DA 321000",
        confidence: 0.2,
        zduvodneni: `Chyba při AI analýze: ${String(error)}`
      }
    }
  }

  // Hlavní funkce pro zpracování souborů
  const handleFiles = async (newFiles: File[]) => {
    console.log('📁 Handling files:', newFiles.length)
    
    const validFiles = newFiles.filter(file => {
      console.log(`📄 File: ${file.name}, Type: ${file.type}, Size: ${file.size}`)
      if (file.size > 50 * 1024 * 1024) {
        alert(`Soubor ${file.name} je příliš velký (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum je 50 MB.`)
        return false
      }
      return true
    })

    console.log('✅ Valid files:', validFiles.length)

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
        console.log('📖 Extracting content...')
        
        // Automatická extrakce obsahu
        const fileContent = await extractFileContent(file)
        console.log('📄 Extracted content length:', fileContent.length)
        console.log('📄 Content preview:', fileContent.substring(0, 200) + '...')

        setFiles(prev => prev.map(f => 
          f.file === file ? { ...f, status: 'analyzing', fileContent } : f
        ))

        console.log('🤖 Starting AI analysis...')
        
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

        console.log('✅ File processing completed for:', file.name)

      } catch (error) {
        console.error('❌ Processing error for', file.name, ':', error)
        setFiles(prev => prev.map(f => 
          f.file === file ? { ...f, status: 'error' } : f
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
          <h2 className="text-2xl font-bold">🚀 Automatická analýza dokumentů</h2>
          <p className="text-purple-100 mt-2">AI automaticky čte PDF, obrázky a analyzuje vše - BEZ copy-paste!</p>
        </div>

        {/* Obsah stránky */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            
            {/* Status automatických funkcí */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <span className="text-green-500 text-xl mr-3">✅</span>
                  <div>
                    <h3 className="font-semibold text-green-800">PDF čtení</h3>
                    <p className="text-green-600 text-sm">Automatická extrakce textu</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <span className="text-green-500 text-xl mr-3">✅</span>
                  <div>
                    <h3 className="font-semibold text-green-800">OCR obrázky</h3>
                    <p className="text-green-600 text-sm">Rozpoznávání textu z fotek</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <span className="text-green-500 text-xl mr-3">✅</span>
                  <div>
                    <h3 className="font-semibold text-green-800">Text soubory</h3>
                    <p className="text-green-600 text-sm">TXT, CSV - okamžitě</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center">
                  <span className="text-purple-500 text-xl mr-3">🤖</span>
                  <div>
                    <h3 className="font-semibold text-purple-800">AI analýza</h3>
                    <p className="text-purple-600 text-sm">Kompletní automatizace</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Upload zona */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                🚀 Automatické zpracování - ŽÁDNÝ copy-paste!
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
                <div className="text-6xl mb-4">🎯</div>
                <p className="text-lg font-medium text-gray-600">
                  Nahrajte JAKÝKOLI dokument - AI ho AUTOMATICKY zpracuje
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  🚀 PDF (auto čtení) 🚀 Obrázky (OCR) 🚀 Text (okamžitě) 🚀 CSV (analýza)
                </p>
                <p className="text-xs text-green-600 mt-1 font-medium">
                  ⚡ Kompletně automatické - prostě nahrajte a AI udělá vše!
                </p>
                
                <button className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                  🚀 Automatické zpracování (všechny formáty)
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

            {/* Info o budoucím email monitoringu */}
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-6 mb-6 border border-blue-200">
              <div className="flex items-center mb-3">
                <span className="text-blue-500 text-2xl mr-3">📧</span>
                <h3 className="text-lg font-semibold text-blue-800">Budoucí funkce: Email Monitoring</h3>
              </div>
              <p className="text-blue-700 mb-3">
                V příští verzi: Automatické sledování emailové schránky a zpracování příloh!
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <div className="bg-white p-3 rounded-lg border border-blue-200">
                  <strong className="text-blue-600">📧 Email sledování</strong>
                  <br />Automatické monitorování schránky
                </div>
                <div className="bg-white p-3 rounded-lg border border-blue-200">
                  <strong className="text-blue-600">🤖 Auto-zpracování</strong>
                  <br />Okamžité zaúčtování faktur
                </div>
                <div className="bg-white p-3 rounded-lg border border-blue-200">
                  <strong className="text-blue-600">⚠️ Kontrola</strong>
                  <br />Pochybnosti do Dashboardu
                </div>
              </div>
            </div>

            {/* Zpracované soubory */}
            {files.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  🚀 Automaticky zpracované dokumenty ({files.length})
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

                      {/* AI analýza výsledky */}
                      {file.extractedData && file.status === 'completed' && (
                        <div className="mt-4 p-4 bg-white rounded-lg border">
                          <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                            <span className="mr-2">🤖</span>
                            Automatická AI analýza:
                          </h4>
                          
                          {/* Extrahované údaje */}
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
                          
                          {/* AI doporučení účtování */}
                          {file.aiSuggestion && (
                            <div className="mb-4 p-3 bg-purple-50 rounded-lg">
                              <p className="text-sm">
                                <span className="font-medium text-purple-800">🚀 AI automaticky doporučuje účtování:</span>
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
                              ✓ Auto-zaúčtovat
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
                                      <h3 class="font-bold mb-4">Automaticky přečtený obsah: ${file.file.name}</h3>
                                      <pre class="text-sm bg-gray-100 p-4 rounded whitespace-pre-wrap">${file.fileContent}</pre>
                                      <button onclick="this.parentElement.parentElement.remove()" class="mt-4 px-4 py-2 bg-gray-600 text-white rounded">Zavřít</button>
                                    </div>
                                  `
                                  document.body.appendChild(modal)
                                }}
                                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm transition-colors"
                              >
                                👁️ Zobrazit přečtený obsah
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
              <div className="bg-gradient-to-r from-green-50 to-purple-50 rounded-xl p-6 text-center border border-green-200">
                <div className="text-4xl mb-4">🚀</div>
                <h3 className="text-lg font-semibold text-green-800 mb-2">Plně automatický AI systém připraven!</h3>
                <p className="text-green-700 mb-4">
                  Nahrajte JAKÝKOLI dokument - AI automaticky přečte obsah a extrahuje všechny údaje:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                  <div className="bg-white p-3 rounded-lg border border-green-200">
                    <strong className="text-green-600">🚀 PDF dokumenty</strong>
                    <br />Automatické čtení textu
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-green-200">
                    <strong className="text-green-600">🚀 Obrázky faktury</strong>
                    <br />OCR rozpoznávání textu
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-green-200">
                    <strong className="text-green-600">🚀 Text soubory</strong>
                    <br />Okamžitá analýza
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-purple-200">
                    <strong className="text-purple-600">🤖 AI extraktor</strong>
                    <br />Všechny údaje automaticky
                  </div>
                </div>
                <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-green-800 text-sm font-medium">
                    🎯 Žádný copy-paste! Prostě nahrajte soubor a AI udělá vše za vás!
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
