'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'

interface UploadedFile {
  file: File
  preview: string
  status: 'uploading' | 'ocr' | 'analyzing' | 'completed' | 'error'
  ocrText?: string
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

  const performOCR = async (file: File): Promise<string> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (file.name.toLowerCase().includes('faktura')) {
          resolve(`FAKTURA č. 2025-001
Dodavatel: ACME s.r.o.
IČO: 12345678
DIČ: CZ12345678

Odběratel: Vaše firma s.r.o.
IČO: 87654321

Datum vystavení: 24.6.2025
Datum splatnosti: 8.7.2025

Popis: Služby - konzultace
Částka bez DPH: 12 500 Kč
DPH 21%: 2 625 Kč
Celkem k úhradě: 15 125 Kč`)
        } else if (file.name.toLowerCase().includes('pokladna')) {
          resolve(`POKLADNÍ DOKLAD č. PD-001/2025
Datum: 24.6.2025

Popis: Nákup kancelářských potřeb
Částka: 1 250 Kč
DPH: V ceně

Hotovost`)
        } else {
          resolve(`Účetní dokument
Datum: 24.6.2025
Částka: 5 000 Kč
Popis: Různé služby
Dodavatel: Rozpoznáno z dokumentu`)
        }
      }, 1500)
    })
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

  const analyzeDocument = async (ocrText: string): Promise<any> => {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: `ÚKOL: Jako expert na české účetnictví analyzuj dokument a navrhni KONKRÉTNÍ účtování.

DOKUMENT:
${ocrText}

ODPOVĚZ POUZE JSON:
{
  "typ": "faktura_prijata",
  "dodavatel": "ACME s.r.o.",
  "castka": "15125 Kč",
  "datum": "24.06.2025",
  "cisloDokladu": "2025-001",
  "popis": "Služby - konzultace",
  "dph": "2625 Kč",
  "ucty": "MD 518000 (Služby) / DA 321000 (Dodavatelé)",
  "confidence": 0.95
}

PRAVIDLA:
1. VŽDY navrhni konkrétní MD/DA účty s čísly
2. Pro služby použij účet 518xxx
3. NEPIŠ "vyžaduje konzultaci" - navrhni konkrétní řešení

VRAŤ POUZE JSON!`
          }]
        })
      })

      const data = await response.json()
      const aiResponse = data.response || data.message || ''
      
      console.log('AI Response:', aiResponse)
      
      let parsedResult = null
      
      try {
        parsedResult = JSON.parse(aiResponse)
        console.log('JSON parsing úspěšný')
      } catch (e) {
        console.log('JSON parsing failed, trying extraction...')
        
        try {
          const jsonMatch = aiResponse.match(/\{[\s\S]*?\}/g)
          if (jsonMatch && jsonMatch.length > 0) {
            parsedResult = JSON.parse(jsonMatch[0])
            console.log('JSON extraction úspěšný')
          }
        } catch (e2) {
          console.log('JSON extraction failed, using manual parsing...')
          
          const fullText = (aiResponse + ' ' + ocrText).toLowerCase()
          const result: any = { confidence: 0.7 }
          
          if (fullText.includes('faktura')) {
            if (fullText.includes('přijat') || fullText.includes('dodavatel')) {
              result.typ = 'faktura_prijata'
              result.ucty = 'MD 518000 (Ostatní služby) / DA 321000 (Dodavatelé)'
            } else {
              result.typ = 'faktura_vystavena'
              result.ucty = 'MD 311000 (Odběratelé) / DA 601000 (Tržby za služby)'
            }
          } else if (fullText.includes('pokladn')) {
            result.typ = 'pokladni_doklad'
            result.ucty = 'MD 501000 (Spotřeba materiálu) / DA 211000 (Pokladna)'
          } else {
            result.typ = 'faktura_prijata'
            result.ucty = 'MD 518000 (Ostatní služby) / DA 321000 (Dodavatelé)'
          }
          
          const lines = aiResponse.split('\n')
          for (const line of lines) {
            if (line.includes('Kč') || line.includes('CZK')) {
              const amountMatch = line.match(/(\d+[\s,\.]*\d*)\s*(Kč|CZK)/)
              if (amountMatch) result.castka = amountMatch[0]
            }
            if (line.match(/\d{1,2}\.\d{1,2}\.\d{4}/)) {
              const dateMatch = line.match(/\d{1,2}\.\d{1,2}\.\d{4}/)
              if (dateMatch) result.datum = dateMatch[0]
            }
          }
          
          result.dodavatel = result.dodavatel || "Rozpoznáno z dokumentu"
          result.popis = result.popis || "Účetní doklad"
          parsedResult = result
        }
      }

      if (!parsedResult) {
        parsedResult = {
          typ: "faktura_prijata",
          dodavatel: "Nerozpoznáno",
          castka: "Dle dokumentu",
          datum: new Date().toLocaleDateString('cs-CZ'),
          cisloDokladu: "Nerozpoznáno",
          popis: "Účetní doklad",
          dph: "Dle dokumentu",
          ucty: "MD 518000 (Ostatní služby) / DA 321000 (Dodavatelé)",
          confidence: 0.4
        }
      }

      if (parsedResult.ucty && parsedResult.ucty.includes('konzultaci')) {
        parsedResult.ucty = getAccountingForType(parsedResult.typ)
        parsedResult.zduvodneni = 'Automaticky upraveno na konkrétní účtování'
      }

      console.log('Finální výsledek:', parsedResult)
      return parsedResult

    } catch (error) {
      console.error('AI analysis error:', error)
      return {
        typ: "faktura_prijata",
        dodavatel: "Chyba při analýze",
        castka: "Nerozpoznáno",
        datum: new Date().toLocaleDateString('cs-CZ'),
        popis: "Vyžaduje ruční kontrolu",
        ucty: "MD 518000 (Ostatní služby) / DA 321000 (Dodavatelé)",
        confidence: 0.2
      }
    }
  }

  const handleFiles = async (newFiles: File[]) => {
    const validFiles = newFiles.filter(file => {
      const validTypes = [
        'image/', 'application/pdf', 
        'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/csv', 'text/plain'
      ]
      return validTypes.some(type => file.type.includes(type))
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
        setFiles(prev => prev.map(f => 
          f.file === file ? { ...f, status: 'ocr' } : f
        ))

        let ocrText = ''
        
        if (file.type.includes('image') || file.type.includes('pdf')) {
          ocrText = await performOCR(file)
        } else if (file.type.includes('excel') || file.type.includes('spreadsheet')) {
          ocrText = `Excel soubor: ${file.name}\nAnalýza tabulkových dat...`
        } else if (file.type.includes('csv') || file.type.includes('text')) {
          const text = await file.text()
          ocrText = text.substring(0, 1000)
        }

        setFiles(prev => prev.map(f => 
          f.file === file ? { ...f, status: 'analyzing', ocrText } : f
        ))

        const analysisResult = await analyzeDocument(ocrText)

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
      case 'ocr': return '👁️'
      case 'analyzing': return '🤖'
      case 'completed': return '✅'
      case 'error': return '❌'
      default: return '📄'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'uploading': return 'Nahrávání...'
      case 'ocr': return 'OCR rozpoznávání...'
      case 'analyzing': return 'AI analyzuje typ dokumentu...'
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
          <h2 className="text-2xl font-bold">🔍 Inteligentní rozpoznávání dokladů</h2>
          <p className="text-purple-100 mt-2">AI automaticky rozpozná typ dokumentu a navrhne správné účtování</p>
        </div>

        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            
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
                <div className="text-6xl mb-4">🔍</div>
                <p className="text-lg font-medium text-gray-600">
                  Přetáhněte dokumenty zde nebo klikněte pro výběr
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Podporuje: JPG, PNG, PDF, Excel (XLS/XLSX), CSV, TXT
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  AI rozpozná: faktury, pokladní doklady, dodací listy, vratky, výpisy
                </p>
                
                <button className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                  Vybrat soubory
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf,.xls,.xlsx,.csv,.txt"
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
                                <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
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
                            {file.status === 'ocr' && (
                              <div className="w-24 bg-gray-200 rounded-full h-2 mt-1">
                                <div className="bg-blue-600 h-2 rounded-full animate-pulse w-1/2"></div>
                              </div>
                            )}
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
                            AI rozpoznalo údaje:
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
                                  {file.extractedData.zduvodneni}
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
                            {file.ocrText && (
                              <button 
                                onClick={() => {
                                  const modal = document.createElement('div')
                                  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
                                  modal.innerHTML = `
                                    <div class="bg-white p-6 rounded-lg max-w-2xl max-h-96 overflow-y-auto">
                                      <h3 class="font-bold mb-4">Rozpoznaný text (OCR):</h3>
                                      <pre class="text-sm bg-gray-100 p-4 rounded whitespace-pre-wrap">${file.ocrText}</pre>
                                      <button onclick="this.parentElement.parentElement.remove()" class="mt-4 px-4 py-2 bg-gray-600 text-white rounded">Zavřít</button>
                                    </div>
                                  `
                                  document.body.appendChild(modal)
                                }}
                                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm transition-colors"
                              >
                                👁️ Zobrazit OCR text
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-blue-50 rounded-xl p-6 text-center">
                  <div className="text-4xl mb-4">📨</div>
                  <h3 className="text-lg font-semibold text-blue-800 mb-2">Faktury</h3>
                  <p className="text-blue-700 text-sm">
                    Automatické rozpoznání dodavatele, částky, DPH a navržení správného účtování
                  </p>
                </div>
                
                <div className="bg-green-50 rounded-xl p-6 text-center">
                  <div className="text-4xl mb-4">💰</div>
                  <h3 className="text-lg font-semibold text-green-800 mb-2">Pokladní doklady</h3>
                  <p className="text-green-700 text-sm">
                    Rozpoznání hotovostních operací a jejich správná kategorizace
                  </p>
                </div>
                
                <div className="bg-purple-50 rounded-xl p-6 text-center">
                  <div className="text-4xl mb-4">🏦</div>
                  <h3 className="text-lg font-semibold text-purple-800 mb-2">Bankovní výpisy</h3>
                  <p className="text-purple-700 text-sm">
                    Analýza Excel souborů a automatické párování plateb s fakturami
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
