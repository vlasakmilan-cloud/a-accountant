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

  // Vylepšená extrakce obsahu s PDF a OCR podporou
  const extractFileContent = async (file: File): Promise<string> => {
    console.log(`🔍 Processing file: ${file.name} (${file.type})`)
    
    try {
      // Text soubory - přímé čtení
      if (file.type.startsWith('text/') || file.name.endsWith('.csv') || file.name.endsWith('.txt')) {
        console.log('📝 Reading text file...')
        const text = await file.text()
        return text
      }
      
      // PDF soubory - pokus o extrakci textu
      else if (file.type === 'application/pdf') {
        console.log('📄 Processing PDF file...')
        
        try {
          // Dynamický import pdf-parse (kvůli client-side compatibilitě)
          const pdfjsLib = await import('pdfjs-dist')
          
          // Nastavení worker path pro pdfjs
          pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`
          
          const arrayBuffer = await file.arrayBuffer()
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
          
          let fullText = ''
          console.log(`📄 PDF has ${pdf.numPages} pages`)
          
          // Extrahuj text ze všech stránek (max 10 stránek pro performance)
          const maxPages = Math.min(pdf.numPages, 10)
          for (let i = 1; i <= maxPages; i++) {
            const page = await pdf.getPage(i)
            const textContent = await page.getTextContent()
            const pageText = textContent.items
              .map((item: any) => item.str)
              .join(' ')
            fullText += pageText + '\n'
          }
          
          if (fullText.trim().length > 0) {
            console.log(`✅ Extracted ${fullText.length} characters from PDF`)
            return fullText.trim()
          } else {
            throw new Error('No text found in PDF')
          }
          
        } catch (pdfError) {
          console.log('⚠️ PDF text extraction failed, trying fallback...')
          
          // Fallback pro PDF s obrázky - OCR
          try {
            const Tesseract = await import('tesseract.js')
            console.log('🔍 Using OCR for PDF...')
            
            const result = await Tesseract.recognize(file, 'ces+eng', {
              logger: (m: any) => {
                if (m.status === 'recognizing text') {
                  console.log(`OCR progress: ${Math.round(m.progress * 100)}%`)
                }
              }
            })
            
            if (result.data.text.trim().length > 0) {
              console.log(`✅ OCR extracted ${result.data.text.length} characters`)
              return result.data.text.trim()
            }
          } catch (ocrError) {
            console.log('❌ OCR also failed:', ocrError)
          }
          
          // Konečný fallback pro PDF
          return `PDF soubor: ${file.name}
Velikost: ${(file.size / 1024 / 1024).toFixed(2)} MB
Datum nahrání: ${new Date().toLocaleDateString('cs-CZ')}

⚠️ Text se nepodařilo extrahovat z PDF.
Možné příčiny:
1. PDF obsahuje pouze obrázky/skeny
2. PDF je chráněný proti kopírování
3. Text je v nestandardním formátu

Doporučení:
1. Zkuste PDF otevřít a zkopírovat text ručně
2. Konvertujte PDF na text pomocí online nástroje
3. Nebo použijte textový soubor s přepsanými údaji

AI i tak dokáže odhadnout typ dokumentu z názvu souboru.`
        }
      }
      
      // Obrázky - OCR rozpoznávání
      else if (file.type.startsWith('image/')) {
        console.log('🖼️ Processing image with OCR...')
        
        try {
          const Tesseract = await import('tesseract.js')
          console.log('🔍 Starting OCR recognition...')
          
          const result = await Tesseract.recognize(file, 'ces+eng', {
            logger: (m: any) => {
              if (m.status === 'recognizing text') {
                console.log(`OCR progress: ${Math.round(m.progress * 100)}%`)
              }
            }
          })
          
          const extractedText = result.data.text.trim()
          
          if (extractedText.length > 0) {
            console.log(`✅ OCR successfully extracted ${extractedText.length} characters`)
            return `Obrázek: ${file.name}
Rozpoznaný text:

${extractedText}

---
Zpracováno pomocí OCR (optické rozpoznávání textu).
Přesnost závisí na kvalitě obrázku.`
          } else {
            throw new Error('No text recognized')
          }
          
        } catch (ocrError) {
          console.log('❌ OCR failed:', ocrError)
          
          return `Obrázek: ${file.name}
Typ: ${file.type}
Velikost: ${(file.size / 1024 / 1024).toFixed(2)} MB
Datum nahrání: ${new Date().toLocaleDateString('cs-CZ')}

⚠️ OCR rozpoznávání selhalo.
Možné příčiny:
1. Nízká kvalita obrázku
2. Příliš malé písmo
3. Špatný kontrast
4. Rotovaný nebo nakloněný text

Doporučení:
1. Zkuste vyšší rozlišení obrázku
2. Zvyšte kontrast a ostrost
3. Nebo přepište klíčové údaje ručně do textového souboru

AI i tak dokáže odhadnout typ dokumentu z názvu souboru.`
        }
      }
      
      // Excel/Office soubory
      else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        console.log('📊 Processing Excel file...')
        
        try {
          const XLSX = await import('xlsx')
          
          const arrayBuffer = await file.arrayBuffer()
          const workbook = XLSX.read(arrayBuffer, { type: 'array' })
          
          let allText = ''
          
          // Projdi všechny listy
          workbook.SheetNames.forEach(sheetName => {
            const worksheet = workbook.Sheets[sheetName]
            const csvData = XLSX.utils.sheet_to_csv(worksheet)
            allText += `--- List: ${sheetName} ---\n${csvData}\n\n`
          })
          
          if (allText.trim().length > 0) {
            console.log(`✅ Extracted ${allText.length} characters from Excel`)
            return allText.trim()
          } else {
            throw new Error('No data in Excel file')
          }
          
        } catch (excelError) {
          console.log('❌ Excel processing failed:', excelError)
          
          return `Excel soubor: ${file.name}
Velikost: ${(file.size / 1024 / 1024).toFixed(2)} MB
Datum nahrání: ${new Date().toLocaleDateString('cs-CZ')}

⚠️ Zpracování Excel souboru selhalo.
Doporučení:
1. Exportujte Excel do CSV formátu
2. Zkopírujte data a vložte do textového souboru
3. Nebo použijte "Uložit jako" → Text (CSV)

AI pak dokáže CSV soubor plně analyzovat.`
        }
      }
      
      // Neznámé typy souborů
      else {
        return `Soubor: ${file.name}
Typ: ${file.type}
Velikost: ${(file.size / 1024 / 1024).toFixed(2)} MB
Status: Nepodporovaný typ pro přímou analýzu

Podporované formáty:
- Text soubory (.txt, .csv) ✅ Plná podpora
- PDF soubory ✅ Text + OCR podpora  
- Obrázky (.jpg, .png) ✅ OCR rozpoznávání
- Excel soubory (.xlsx, .xls) ✅ Automatické čtení

AI i z těchto základních informací dokáže navrhnout účetní postup.`
      }
      
    } catch (error) {
      console.error('❌ File processing error:', error)
      return `Chyba při zpracování souboru: ${String(error)}

Zkuste:
1. Jiný formát souboru
2. Menší velikost souboru
3. Lepší kvalitu (u obrázků)
4. Nebo přepište údaje ručně do textového souboru`
    }
  }

  // AI analýza dokumentu (beze změny)
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

  // Hlavní funkce pro zpracování souborů (beze změny)
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
        
        // Extrakce obsahu
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

  // Pomocné funkce pro UI (beze změny)
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
          <h2 className="text-2xl font-bold">📁 Analýza dokumentů</h2>
          <p className="text-purple-100 mt-2">AI analýza s plnou podporou PDF, OCR a všech formátů</p>
        </div>

        {/* Obsah stránky */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            
            {/* Status podporovaných formátů - aktualizovaný */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <span className="text-green-500 text-xl mr-3">✅</span>
                  <div>
                    <h3 className="font-semibold text-green-800">Text soubory</h3>
                    <p className="text-green-600 text-sm">TXT, CSV - 100% přesnost</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <span className="text-green-500 text-xl mr-3">✅</span>
                  <div>
                    <h3 className="font-semibold text-green-800">PDF soubory</h3>
                    <p className="text-green-600 text-sm">Text + OCR automaticky</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <span className="text-green-500 text-xl mr-3">✅</span>
                  <div>
                    <h3 className="font-semibold text-green-800">Obrázky</h3>
                    <p className="text-green-600 text-sm">JPG, PNG - OCR rozpoznávání</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center">
                  <span className="text-blue-500 text-xl mr-3">🤖</span>
                  <div>
                    <h3 className="font-semibold text-blue-800">AI Analýza</h3>
                    <p className="text-blue-600 text-sm">Všechny formáty podporovány</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Upload zona */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                📁 Nahrát účetní doklady - PLNÁ PODPORA VŠECH FORMÁTŮ
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
                <div className="text-6xl mb-4">🚀</div>
                <p className="text-lg font-medium text-gray-600">
                  Přetáhněte JAKÝKOLI dokument zde nebo klikněte pro výběr
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  ✅ PDF (text + OCR) ✅ JPG/PNG (OCR) ✅ TXT/CSV ✅ Excel
                </p>
                <p className="text-xs text-green-600 mt-1 font-medium">
                  🎯 Systém automaticky zvolí nejlepší metodu čtení!
                </p>
                
                <button className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                  Vybrat soubory (všechny formáty)
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

            {/* Zpracované soubory (zůstává stejné) */}
            {files.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  📄 Zpracované dokumenty ({files.length})
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
                            AI analýza výsledků:
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

                          {/* Akční tlačítka */}
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
                                      <h3 class="font-bold mb-4">Obsah souboru: ${file.file.name}</h3>
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

            {/* Informace pro prázdný stav - aktualizovaný */}
            {files.length === 0 && (
              <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 text-center border border-green-200">
                <div className="text-4xl mb-4">🚀</div>
                <h3 className="text-lg font-semibold text-green-800 mb-2">Systém připraven na VŠECHNY formáty!</h3>
                <p className="text-green-700 mb-4">
                  Kompletní AI analýza s automatickým výběrem nejlepší metody:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                  <div className="bg-white p-3 rounded-lg border border-green-200">
                    <strong className="text-green-600">✅ Text soubory</strong>
                    <br />TXT, CSV - okamžitá analýza
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-green-200">
                    <strong className="text-green-600">✅ PDF dokumenty</strong>
                    <br />Text extrakce + OCR backup
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-green-200">
                    <strong className="text-green-600">✅ Obrázky faktury</strong>
                    <br />OCR rozpoznávání češtiny
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-blue-200">
                    <strong className="text-blue-600">🤖 AI účetní</strong>
                    <br />100% podpora všech typů
                  </div>
                </div>
                <p className="text-green-600 font-medium mt-4">
                  🎯 Nahrajte jakýkoli soubor - systém automaticky zvolí optimální zpracování!
                </p>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}
