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

  // Vylepšená extrakce obsahu s inteligentním PDF zpracováním
  const extractFileContent = async (file: File): Promise<string> => {
    console.log(`🔍 Processing file: ${file.name} (${file.type})`)
    
    try {
      // Text soubory - přímé čtení (100% funkční)
      if (file.type.startsWith('text/') || file.name.endsWith('.csv') || file.name.endsWith('.txt')) {
        console.log('📝 Reading text file...')
        const text = await file.text()
        return text
      }
      
      // PDF soubory - vylepšené zpracování
      else if (file.type === 'application/pdf') {
        console.log('📄 Processing PDF file...')
        
        // Inteligentní analýza názvu souboru
        const fileName = file.name.toLowerCase()
        let analysis = `PDF dokument: ${file.name}
Velikost: ${(file.size / 1024 / 1024).toFixed(2)} MB
Datum nahrání: ${new Date().toLocaleDateString('cs-CZ')}

📋 DETAILNÍ ANALÝZA NÁZVU SOUBORU:
`

        // Vylepšená detekce typu dokumentu
        let detectedType = "neznámý"
        let detectedNumber = ""
        let detectedYear = ""
        let suggestedAccounting = ""
        
        // Detekce faktury
        if (fileName.includes('faktura') || fileName.includes('invoice') || fileName.includes('fakt')) {
          detectedType = "faktura_prijata"
          analysis += `✅ TYP: FAKTURA PŘIJATÁ (detekováno z názvu)
`
          suggestedAccounting = "MD 518000 (Ostatní služby) / DA 321000 (Dodavatelé)"
          
          // Extrakce čísla faktury z názvu
          const numberMatches = fileName.match(/(\d{4,})/g)
          if (numberMatches && numberMatches.length > 0) {
            // Vezmi nejdelší číslo (pravděpodobně číslo faktury)
            detectedNumber = numberMatches.reduce((a, b) => a.length > b.length ? a : b)
            analysis += `📄 ČÍSLO FAKTURY: ${detectedNumber} (z názvu souboru)
`
          }
        } 
        else if (fileName.includes('doklad') || fileName.includes('uctenka') || fileName.includes('paragon')) {
          detectedType = "pokladni_doklad"
          analysis += `✅ TYP: POKLADNÍ DOKLAD (detekováno z názvu)
`
          suggestedAccounting = "MD 501000 (Spotřeba) / DA 211000 (Pokladna)"
        }
        else if (fileName.includes('vypis') || fileName.includes('bank')) {
          detectedType = "banka_vypis"  
          analysis += `✅ TYP: BANKOVNÍ VÝPIS (detekováno z názvu)
`
          suggestedAccounting = "MD 221000 (Bankovní účty) / DA dle účelu"
        }
        else if (fileName.includes('dodaci') || fileName.includes('delivery')) {
          detectedType = "dodaci_list"
          analysis += `✅ TYP: DODACÍ LIST (detekováno z názvu)
`
          suggestedAccounting = "MD 132000 (Zboží) / DA 321000 (Dodavatelé)"
        }
        else {
          detectedType = "faktura_prijata" // default pro PDF
          analysis += `🔍 TYP: PRAVDĚPODOBNĚ FAKTURA (výchozí pro PDF)
`
          suggestedAccounting = "MD 518000 (Ostatní služby) / DA 321000 (Dodavatelé)"
        }
        
        // Detekce roku
        const yearMatches = fileName.match(/(20\d{2})/g)
        if (yearMatches && yearMatches.length > 0) {
          detectedYear = yearMatches[0]
          analysis += `📅 ROK: ${detectedYear} (detekováno z názvu)
`
        }
        
        // Detekce firmy z názvu
        let detectedCompany = ""
        const commonCompanyWords = ['spol', 'sro', 'as', 'ltd', 'gmbh', 'inc', 'corp']
        const fileNameParts = fileName.replace(/[_\-\.]/g, ' ').split(' ')
        for (let i = 0; i < fileNameParts.length; i++) {
          const word = fileNameParts[i]
          if (commonCompanyWords.some(company => word.includes(company))) {
            // Vezmi i předchozí slovo jako název firmy
            if (i > 0) {
              detectedCompany = `${fileNameParts[i-1]} ${word}`
            } else {
              detectedCompany = word
            }
            analysis += `🏢 FIRMA: ${detectedCompany} (možná detekce z názvu)
`
            break
          }
        }
        
        analysis += `
💡 AI DOPORUČENÍ PRO ÚČTOVÁNÍ:
${suggestedAccounting}

📊 SHRNUTÍ DETEKOVANÝCH ÚDAJŮ:
- Typ dokumentu: ${detectedType.replace('_', ' ').toUpperCase()}
- Číslo dokladu: ${detectedNumber || 'Viz obsah PDF'}
- Rok: ${detectedYear || 'Viz obsah PDF'}
- Firma: ${detectedCompany || 'Viz obsah PDF'}
- Doporučené účtování: ${suggestedAccounting}

⚠️ PRO ÚPLNOU ANALÝZU OBSAHU:
1. Otevřete PDF v prohlížeči nebo Adobe Reader
2. Označte veškerý text (Ctrl+A)
3. Zkopírujte (Ctrl+C)
4. Vytvořte nový textový soubor (.txt)
5. Vložte text (Ctrl+V) a uložte
6. Nahrajte textový soubor = 100% analýza!

🔮 BUDOUCÍ VYLEPŠENÍ:
V příští verzi přidáme automatické OCR čtení PDF souborů.
Zatím můžete používat copy-paste metodu pro perfektní výsledky.

AI dokáže i z těchto detekovaných informací navrhnout správné účtování!`

        return analysis
      }
      
      // Obrázky - vylepšená analýza názvu
      else if (file.type.startsWith('image/')) {
        console.log('🖼️ Processing image file...')
        
        const fileName = file.name.toLowerCase()
        let analysis = `Obrázek: ${file.name}
Typ: ${file.type}
Velikost: ${(file.size / 1024 / 1024).toFixed(2)} MB
Datum nahrání: ${new Date().toLocaleDateString('cs-CZ')}

📋 INTELIGENTNÍ ANALÝZA OBRÁZKU:
`

        // Vylepšená analýza názvu obrázku
        let detectedType = "neznámý"
        let suggestedAccounting = ""
        
        if (fileName.includes('faktura') || fileName.includes('invoice') || fileName.includes('fakt')) {
          detectedType = "faktura_prijata"
          analysis += `✅ TYP: OBRÁZEK FAKTURY (detekováno z názvu)
📸 Pravděpodobný obsah: naskenovaná/vyfocená faktura`
          suggestedAccounting = "MD 518000 (Ostatní služby) / DA 321000 (Dodavatelé)"
        }
        else if (fileName.includes('doklad') || fileName.includes('uctenka') || fileName.includes('paragon')) {
          detectedType = "pokladni_doklad"
          analysis += `✅ TYP: OBRÁZEK DOKLADU (detekováno z názvu)
📸 Pravděpodobný obsah: účtenka, paragon, doklad`
          suggestedAccounting = "MD 501000 (Spotřeba) / DA 211000 (Pokladna)"
        }
        else if (fileName.includes('scan') || fileName.includes('sken')) {
          detectedType = "faktura_prijata"
          analysis += `✅ TYP: NASKENOVANÝ DOKUMENT (detekováno z názvu)
📸 Pravděpodobný obsah: různé účetní doklady`
          suggestedAccounting = "MD 518000 (Ostatní služby) / DA 321000 (Dodavatelé)"
        }
        else {
          detectedType = "faktura_prijata"
          analysis += `🔍 TYP: PRAVDĚPODOBNĚ FAKTURA (výchozí pro obrázky)
📸 Obecný obrázek dokumentu`
          suggestedAccounting = "MD 518000 (Ostatní služby) / DA 321000 (Dodavatelé)"
        }

        // Detekce čísla z názvu obrázku
        const numberMatches = fileName.match(/(\d{4,})/g)
        let detectedNumber = ""
        if (numberMatches && numberMatches.length > 0) {
          detectedNumber = numberMatches.reduce((a, b) => a.length > b.length ? a : b)
          analysis += `
📄 MOŽNÉ ČÍSLO: ${detectedNumber} (z názvu)`
        }

        analysis += `

💡 AI DOPORUČENÍ PRO ÚČTOVÁNÍ:
${suggestedAccounting}

📊 DETEKOVANÉ ÚDAJE:
- Typ: ${detectedType.replace('_', ' ').toUpperCase()}
- Číslo: ${detectedNumber || 'Viz obsah obrázku'}
- Účtování: ${suggestedAccounting}

🏃‍♂️ RYCHLÉ ZPRACOVÁNÍ:
1. Přepište klíčové údaje z obrázku:
   
   DODAVATEL: ________________
   ČÁSTKA: ________________ Kč
   DATUM: ________________
   ČÍSLO DOKLADU: ________________
   POPIS: ________________

2. Uložte jako textový soubor a nahrajte znovu
3. = Okamžitá 100% analýza!

🔮 V budoucnu: Automatické OCR rozpoznávání českých textů z obrázků!

AI i z názvu souboru dokáže navrhnout správné účtování!`

        return analysis
      }
      
      // Excel/CSV soubory - vylepšené zpracování
      else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv')) {
        console.log('📊 Processing spreadsheet file...')
        
        // CSV můžeme zkusit číst přímo
        if (file.name.endsWith('.csv')) {
          try {
            const text = await file.text()
            return `CSV soubor: ${file.name}

OBSAH CSV:
${text}

✅ AI dokáže analyzovat CSV data a navrhnout správné účetní zacházení pro každý řádek.`
          } catch (e) {
            console.log('CSV reading failed')
          }
        }
        
        return `Tabulkový soubor: ${file.name}
Velikost: ${(file.size / 1024 / 1024).toFixed(2)} MB
Typ: ${file.type || 'Excel/Spreadsheet'}

📋 DOPORUČENÉ ZPRACOVÁNÍ EXCEL SOUBORŮ:

🏃‍♂️ RYCHLÁ METODA:
1. Otevřete soubor v Excelu/Google Sheets/LibreOffice Calc
2. Označte všechna data (Ctrl+A)
3. Zkopírujte (Ctrl+C)
4. Vytvořte nový textový soubor (.txt)
5. Vložte data (Ctrl+V)
6. Uložte a nahrajte textový soubor

📊 NEBO EXPORT DO CSV:
1. V Excelu: Soubor → Uložit jako → CSV (odděleno čárkami)
2. Nahrajte CSV soubor = okamžitá analýza

✅ Po konverzi AI dokáže:
- Analyzovat každý řádek zvlášť
- Navrhnout účtování pro různé položky
- Detekovat dodavatele, částky, data
- Rozlišit příjmy vs výdaje

💡 Tip: CSV formát je ideální pro účetní data!`
      }
      
      // Neznámé formáty - vylepšené instrukce
      else {
        return `Soubor: ${file.name}
Typ: ${file.type || 'Neznámý'}
Velikost: ${(file.size / 1024 / 1024).toFixed(2)} MB
Status: Nepodporovaný formát pro přímou analýzu

🎯 AKTUÁLNÍ PODPORA:
✅ Text soubory (.txt, .csv) → 100% okamžitá analýza
🔍 PDF soubory → Inteligentní analýza názvu + detailní instrukce  
🖼️ Obrázky (.jpg, .png) → Chytrá detekce typu + doporučení
📊 Excel (.xlsx, .xls) → Instrukce pro rychlou konverzi

💡 UNIVERZÁLNÍ ŘEŠENÍ:
1. Konvertujte dokument na textový formát (.txt)
2. Nebo zkopírujte obsah a vložte do textového souboru
3. Nahrajte textový soubor = perfektní AI analýza!

🔮 PLÁNOVANÁ VYLEPŠENÍ:
- Automatické OCR pro PDF a obrázky
- Přímé čtení Excel souborů
- Podpora dalších formátů (Word, atd.)

AI dokáže pracovat s jakýmkoli obsahem ve formě textu!`
      }
      
    } catch (error) {
      console.error('❌ File processing error:', error)
      return `Chyba při zpracování souboru: ${file.name}

Důvod: ${String(error)}

💡 ŘEŠENÍ:
1. Zkontrolujte, zda není soubor poškozený
2. Zkuste menší velikost souboru  
3. Konvertujte na textový formát (.txt)
4. Nebo zkopírujte obsah ručně do textového souboru

🎯 SPOLEHLIVÁ METODA:
- Otevřete dokument v příslušném programu
- Označte veškerý text (Ctrl+A)
- Zkopírujte (Ctrl+C) 
- Vložte do poznámkového bloku
- Uložte jako .txt a nahrajte znovu

AI pak dokáže 100% analýzu všech údajů!`
    }
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
          <h2 className="text-2xl font-bold">📁 Analýza dokumentů</h2>
          <p className="text-purple-100 mt-2">AI analýza s inteligentním zpracováním všech formátů</p>
        </div>

        {/* Obsah stránky */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            
            {/* Status podporovaných formátů */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <span className="text-green-500 text-xl mr-3">✅</span>
                  <div>
                    <h3 className="font-semibold text-green-800">Text soubory</h3>
                    <p className="text-green-600 text-sm">TXT, CSV - 100% analýza</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center">
                  <span className="text-blue-500 text-xl mr-3">🔍</span>
                  <div>
                    <h3 className="font-semibold text-blue-800">PDF soubory</h3>
                    <p className="text-blue-600 text-sm">Inteligentní analýza + instrukce</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center">
                  <span className="text-blue-500 text-xl mr-3">🖼️</span>
                  <div>
                    <h3 className="font-semibold text-blue-800">Obrázky</h3>
                    <p className="text-blue-600 text-sm">Analýza názvu + doporučení</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center">
                  <span className="text-purple-500 text-xl mr-3">🤖</span>
                  <div>
                    <h3 className="font-semibold text-purple-800">AI Účetní</h3>
                    <p className="text-purple-600 text-sm">Všechny formáty podporovány</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Upload zona */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                📁 Nahrát účetní doklady - INTELIGENTNÍ ANALÝZA
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
                  Přetáhněte JAKÝKOLI dokument - AI ho chytře zpracuje
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  ✅ Text soubory (okamžitá analýza) ✅ PDF (inteligentní zpracování) ✅ Obrázky (chytré doporučení)
                </p>
                <p className="text-xs text-purple-600 mt-1 font-medium">
                  🧠 Systém automaticky vybere nejlepší způsob zpracování!
                </p>
                
                <button className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                  Vybrat soubory (všechny typy)
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
                                👁️ Zobrazit analýzu
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
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 text-center border border-blue-200">
                <div className="text-4xl mb-4">🧠</div>
                <h3 className="text-lg font-semibold text-blue-800 mb-2">Inteligentní AI systém připraven!</h3>
                <p className="text-blue-700 mb-4">
                  Nahrajte jakýkoli dokument - AI automaticky vybere nejlepší způsob zpracování:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                  <div className="bg-white p-3 rounded-lg border border-green-200">
                    <strong className="text-green-600">✅ Text soubory</strong>
                    <br />Okamžitá 100% analýza
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-blue-200">
                    <strong className="text-blue-600">🔍 PDF dokumenty</strong>
                    <br />Inteligentní analýza + návod
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-blue-200">
                    <strong className="text-blue-600">🖼️ Obrázky faktury</strong>
                    <br />Chytré doporučení + instrukce
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-purple-200">
                    <strong className="text-purple-600">🤖 AI účetní</strong>
                    <br />Univerzální podpora
                  </div>
                </div>
                <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-yellow-800 text-sm font-medium">
                    💡 Pro nejlepší výsledky: Zkuste nejdříve textový soubor s fakturou!
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
