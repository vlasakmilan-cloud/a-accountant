'use client'

import { useState, useRef } from 'react'
import { Upload, FileText, Image, CheckCircle, AlertTriangle, Loader, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface UploadedFile {
  file: File
  preview: string
  status: 'uploading' | 'processing' | 'completed' | 'error'
  extractedData?: {
    dodavatel: string
    castka: string
    datum: string
    popis: string
  }
  aiSuggestion?: string
}

export default function AnalyzeDocumentPage() {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Drag & Drop handlers
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

  // File selection handler
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files)
      handleFiles(selectedFiles)
    }
  }

  // Process uploaded files
  const handleFiles = async (newFiles: File[]) => {
    const validFiles = newFiles.filter(file => 
      file.type.includes('image') || file.type.includes('pdf')
    )

    for (const file of validFiles) {
      const preview = URL.createObjectURL(file)
      const uploadedFile: UploadedFile = {
        file,
        preview,
        status: 'uploading'
      }

      setFiles(prev => [...prev, uploadedFile])

      // Simulace OCR zpracování
      setTimeout(() => {
        setFiles(prev => prev.map(f => 
          f.file === file ? { ...f, status: 'processing' } : f
        ))
      }, 1000)

      // Simulace dokončení zpracování s AI analýzou
      setTimeout(() => {
        const extractedData = {
          dodavatel: "ACME s.r.o.",
          castka: "15 000 Kč",
          datum: "24.6.2025",
          popis: "Faktura za služby"
        }
        
        setFiles(prev => prev.map(f => 
          f.file === file ? { 
            ...f, 
            status: 'completed',
            extractedData,
            aiSuggestion: "MD 518 (Ostatní služby) / DA 321 (Dodavatelé)"
          } : f
        ))
      }, 3000)
    }
  }

  // AI Chat pro konzultaci
  const [chatMessages, setChatMessages] = useState<Array<{role: 'user' | 'assistant', content: string}>>([
    {
      role: 'assistant',
      content: 'Dobrý den! Jsem váš AI účetní asistent. Nahrajte fakturu a já ji automaticky zpracuji a navrhnu správné účtování. 📄✨'
    }
  ])
  const [chatInput, setChatInput] = useState('')
  const [isAiLoading, setIsAiLoading] = useState(false)

  const sendToAI = async (message: string) => {
    if (!message.trim()) return
    
    setIsAiLoading(true)
    setChatMessages(prev => [...prev, { role: 'user', content: message }])

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...chatMessages, { role: 'user', content: message }]
        })
      })

      const data = await response.json()
      setChatMessages(prev => [...prev, { role: 'assistant', content: data.response }])
    } catch (error) {
      console.error('AI Chat Error:', error)
      setChatMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Omlouvám se, došlo k chybě při komunikaci s AI. Zkuste to prosím znovu.' 
      }])
    } finally {
      setIsAiLoading(false)
      setChatInput('')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Back Button */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center mb-4">
            <Link href="/" className="flex items-center text-purple-100 hover:text-white transition-colors">
              <ArrowLeft className="h-5 w-5 mr-2" />
              Zpět na dashboard
            </Link>
          </div>
          <h1 className="text-3xl font-bold">📄 Nahrát a analyzovat doklady</h1>
          <p className="text-purple-100 mt-2">AI automaticky rozpozná obsah a navrhne správné účtování</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Upload Zone */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <Upload className="mr-3 text-purple-600" />
                Přidejte dokumenty
              </h2>

              {/* Drag & Drop Zone */}
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
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-lg font-medium text-gray-600">
                  Přetáhněte soubory zde nebo klikněte pro výběr
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Podporované formáty: JPG, PNG, PDF (max 10MB)
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf"
                onChange={handleFileSelect}
                className="hidden"
              />

              {/* Uploaded Files List */}
              {files.length > 0 && (
                <div className="mt-6 space-y-4">
                  <h3 className="font-semibold text-gray-800">Nahrané soubory ({files.length}):</h3>
                  {files.map((file, index) => (
                    <div key={index} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          {file.file.type.includes('image') ? (
                            <Image className="h-8 w-8 text-blue-500 mr-3" />
                          ) : (
                            <FileText className="h-8 w-8 text-red-500 mr-3" />
                          )}
                          <div>
                            <p className="font-medium text-gray-800">{file.file.name}</p>
                            <p className="text-sm text-gray-500">
                              {(file.file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        
                        {/* Status */}
                        <div className="flex items-center">
                          {file.status === 'uploading' && (
                            <div className="flex items-center text-blue-600">
                              <Loader className="animate-spin h-5 w-5 mr-2" />
                              Nahrávání...
                            </div>
                          )}
                          {file.status === 'processing' && (
                            <div className="flex items-center text-yellow-600">
                              <Loader className="animate-spin h-5 w-5 mr-2" />
                              AI zpracovává...
                            </div>
                          )}
                          {file.status === 'completed' && (
                            <div className="flex items-center text-green-600">
                              <CheckCircle className="h-5 w-5 mr-2" />
                              Hotovo
                            </div>
                          )}
                          {file.status === 'error' && (
                            <div className="flex items-center text-red-600">
                              <AlertTriangle className="h-5 w-5 mr-2" />
                              Chyba
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Extracted Data */}
                      {file.extractedData && (
                        <div className="mt-4 p-4 bg-white rounded-lg border">
                          <h4 className="font-semibold text-gray-800 mb-2">🤖 AI rozpoznalo:</h4>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Dodavatel:</span>
                              <span className="ml-2 font-medium">{file.extractedData.dodavatel}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Částka:</span>
                              <span className="ml-2 font-medium">{file.extractedData.castka}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Datum:</span>
                              <span className="ml-2 font-medium">{file.extractedData.datum}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Popis:</span>
                              <span className="ml-2 font-medium">{file.extractedData.popis}</span>
                            </div>
                          </div>
                          
                          {file.aiSuggestion && (
                            <div className="mt-3 p-3 bg-purple-50 rounded-lg">
                              <p className="text-sm">
                                <span className="font-medium text-purple-800">💡 AI doporučuje účtování:</span>
                                <br />
                                <span className="text-purple-700">{file.aiSuggestion}</span>
                              </p>
                            </div>
                          )}

                          <div className="mt-4 flex gap-2 flex-wrap">
                            <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm transition-colors">
                              ✓ Schválit a zaúčtovat
                            </button>
                            <button className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm transition-colors">
                              ✏️ Upravit údaje
                            </button>
                            <button 
                              onClick={() => sendToAI(`Prosím zkontroluj účtování faktury od ${file.extractedData?.dodavatel} za ${file.extractedData?.castka}. Je návrh MD 518 / DA 321 správný podle české legislativy?`)}
                              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm transition-colors"
                            >
                              🤖 Konzultovat s AI
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* AI Chat Panel */}
          <div className="bg-white rounded-xl shadow-lg p-6 h-fit sticky top-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              🤖 AI Účetní Asistent
            </h3>
            
            {/* Chat Messages */}
            <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`p-3 rounded-lg ${
                  msg.role === 'user' 
                    ? 'bg-purple-100 ml-4' 
                    : 'bg-gray-100 mr-4'
                }`}>
                  <p className="text-sm">{msg.content}</p>
                </div>
              ))}
              
              {isAiLoading && (
                <div className="bg-gray-100 mr-4 p-3 rounded-lg">
                  <div className="flex items-center text-gray-600">
                    <Loader className="animate-spin h-4 w-4 mr-2" />
                    AI přemýšlí...
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !isAiLoading && chatInput.trim() && sendToAI(chatInput)}
                placeholder="Zeptejte se AI..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                disabled={isAiLoading}
              />
              <button
                onClick={() => !isAiLoading && chatInput.trim() && sendToAI(chatInput)}
                disabled={isAiLoading || !chatInput.trim()}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
              >
                →
              </button>
            </div>

            {/* Quick Suggestions */}
            <div className="mt-4 space-y-2">
              <p className="text-xs text-gray-600">Rychlé dotazy:</p>
              {[
                "Jaké jsou aktuální DPH sazby v ČR?",
                "Jak správně zaúčtovat nákup kancelářských potřeb?",
                "Rozdíl mezi účtem 518 a 538?"
              ].map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => sendToAI(suggestion)}
                  disabled={isAiLoading}
                  className="w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
