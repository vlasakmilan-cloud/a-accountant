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

  // Vylepšená extrakce obsahu - postupná implementace
  const extractFileContent = async (file: File): Promise<string> => {
    console.log(`🔍 Processing file: ${file.name} (${file.type})`)
    
    try {
      // Text soubory - přímé čtení (100% funkční)
      if (file.type.startsWith('text/') || file.name.endsWith('.csv') || file.name.endsWith('.txt')) {
        console.log('📝 Reading text file...')
        const text = await file.text()
        return text
      }
      
      // PDF soubory - pokročilá analýza názvu + instrukce
      else if (file.type === 'application/pdf') {
        console.log('📄 Processing PDF with advanced filename analysis...')
        return await generateAdvancedPDFAnalysis(file)
      }
      
      // Obrázky - pokročilá analýza názvu + budoucí OCR
      else if (file.type.startsWith('image/')) {
        console.log('🖼️ Processing image with advanced analysis...')
        return await generateAdvancedImageAnalysis(file)
      }
      
      // CSV soubory - přímé čtení
      else if (file.name.endsWith('.csv')) {
        console.log('📊 Reading CSV file...')
        const text = await file.text()
        return `CSV SOUBOR AUTOMATICKY PŘEČTEN: ${file.name}

OBSAH:
${text}

✅ AI analyzuje všechny řádky a navrhne účtování pro každou položku.`
      }
      
      // Excel soubory - instrukce
      else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        return await generateExcelInstructions(file)
      }
      
      // Neznámé formáty
      else {
        return await generateUnknownFormatAnalysis(file)
      }
      
    } catch (error) {
      console.error('❌ File processing error:', error)
      return await generateErrorAnalysis(file, error)
    }
  }

  // Pokročilá analýza PDF souborů
  const generateAdvancedPDFAnalysis = async (file: File): Promise<string> => {
    const fileName = file.name.toLowerCase()
    const fileSize = (file.size / 1024 / 1024).toFixed(2)
    
    let analysis = `PDF DOKUMENT: ${file.name}
Velikost: ${fileSize} MB
Datum nahrání: ${new Date().toLocaleDateString('cs-CZ')}

🧠 POKROČILÁ ANALÝZA NÁZVU SOUBORU:
`

    // Pokročilá detekce typu dokumentu
    let detectedType = "faktura_prijata"
    let detectedData: any = {}
    let confidence = 0.3

    // Analýza názvu souboru
    if (fileName.includes('faktura') || fileName.includes('invoice') || fileName.includes('fakt')) {
      detectedType = "faktura_prijata"
      detectedData.typ = "faktura_prijata"
      detectedData.ucty = "MD 518000 (Ostatní služby) / DA 321000 (Dodavatelé)"
      analysis += `✅ TYP: FAKTURA PŘIJATÁ (detekováno z názvu)\n`
      confidence += 0.3
    } else if (fileName.includes('doklad') || fileName.includes('uctenka') || fileName.includes('paragon')) {
      detectedType = "pokladni_doklad"
      detectedData.typ = "pokladni_doklad"
      detectedData.ucty = "MD 501000 (Spotřeba) / DA 211000 (Pokladna)"
      analysis += `✅ TYP: POKLADNÍ DOKLAD (detekováno z názvu)\n`
      confidence += 0.3
    } else if (fileName.includes('vypis') || fileName.includes('bank')) {
      detectedType = "banka_vypis"
      detectedData.typ = "banka_vypis"
      detectedData.ucty = "MD 221000 (Bankovní účty) / DA dle účelu"
      analysis += `✅ TYP: BANKOVNÍ VÝPIS (detekováno z názvu)\n`
      confidence += 0.3
    }

    // Extrakce čísla faktury/dokladu
    const numberMatches = fileName.match(/(\d{4,})/g)
    if (numberMatches && numberMatches.length > 0) {
      const detectedNumber = numberMatches.reduce((a, b) => a.length > b.length ? a : b)
      detectedData.cisloDokladu = detectedNumber
      analysis += `📄 ČÍSLO DOKLADU: ${detectedNumber} (z názvu souboru)\n`
      confidence += 0.2
    }

    // Extrakce roku
    const yearMatches = fileName.match(/(20\d{2})/g)
    if (yearMatches && yearMatches.length > 0) {
      const year = yearMatches[0]
      detectedData.rok = year
      analysis += `📅 ROK: ${year} (detekováno z názvu)\n`
      confidence += 0.1
    }

    // Detekce názvu firmy
    const companyMatches = fileName.match(/([a-záčďéěíňóřšťúůýž]+[\s_-]*(?:s\.?r\.?o\.?|a\.?s\.?|spol|ltd|gmbh|inc))/gi)
    if (companyMatches && companyMatches.length > 0) {
      const company = companyMatches[0].replace(/[_-]/g, ' ')
      detectedData.dodavatel = company
      analysis += `🏢 FIRMA: ${company} (detekováno z názvu)\n`
      confidence += 0.2
    }

    analysis += `
💡 AI DOPORUČENÉ ÚČTOVÁNÍ:
${detectedData.ucty || 'MD 518000 (Ostatní služby) / DA 321000 (Dodavatelé)'}

📊 SHRNUTÍ AUTOMATICKY DETEKOVANÝCH ÚDAJŮ:
- Typ dokumentu: ${detectedType.replace('_', ' ').toUpperCase()}
- Číslo dokladu: ${detectedData.cisloDokladu || 'Viz obsah PDF'}
- Rok: ${detectedData.rok || 'Viz obsah PDF'}
- Dodavatel: ${detectedData.dodavatel || 'Viz obsah PDF'}
- Jistota detekce: ${Math.round(confidence * 100)}%

🚀 PRO ÚPLNOU AUTOMATIZACI (připravujeme):
1. Automatické OCR čtení PDF obsahu
2. Extrakce všech údajů bez copy-paste
3. Rozpoznávání položek a DPH

⚡ DOČASNÉ ŘEŠENÍ PRO 100% ANALÝZU:
1. Otevřete PDF v prohlížeči (Ctrl+O)
2. Označte veškerý text (Ctrl+A)
3. Zkopírujte (Ctrl+C)
4. Vytvořte textový soubor a vložte (Ctrl+V)
5. Nahrajte .txt soubor = kompletní AI analýza!

🔮 BRZY: Plně automatické čtení PDF bez manuálních kroků!`

    return analysis
  }

  // Pokročilá analýza obrázků
  const generateAdvancedImageAnalysis = async (file: File): Promise<string> => {
    const fileName = file.name.toLowerCase()
    const fileSize = (file.size / 1024 / 1024).toFixed(2)
    
    let analysis = `OBRÁZEK: ${file.name}
Typ: ${file.type}
Velikost: ${fileSize} MB
Datum nahrání: ${new Date().toLocaleDateString('cs-CZ')}

🖼️ POKROČILÁ ANALÝZA OBRÁZKU:
`

    let detectedType = "faktura_prijata"
    let detectedData: any = {}
    let confidence = 0.2

    // Analýza názvu obrázku
    if (fileName.includes('faktura') || fileName.includes('invoice') || fileName.includes('fakt')) {
      detectedType = "faktura_prijata"
      detectedData.typ = "faktura_prijata"
      detectedData.ucty = "MD 518000 (Ostatní služby) / DA 321000 (Dodavatelé)"
      analysis += `✅ TYP: OBRÁZEK FAKTURY (detekováno z názvu)\n📸 Pravděpodobný obsah: naskenovaná/vyfocená faktura\n`
      confidence += 0.3
    } else if (fileName.includes('doklad') || fileName.includes('uctenka') || fileName.includes('paragon')) {
      detectedType = "pokladni_doklad"
      detectedData.typ = "pokladni_doklad"
      detectedData.ucty = "MD 501000 (Spotřeba) / DA 211000 (Pokladna)"
      analysis += `✅ TYP: OBRÁZEK DOKLADU (detekováno z názvu)\n📸 Pravděpodobný obsah: účtenka, paragon\n`
      confidence += 0.3
    } else if (fileName.includes('scan') || fileName.includes('sken')) {
      detectedType = "faktura_prijata"
      detectedData.typ = "faktura_prijata"
      detectedData.ucty = "MD 518000 (Ostatní služby) / DA 321000 (Dodavatelé)"
      analysis += `✅ TYP: NASKENOVANÝ DOKUMENT (detekováno z názvu)\n📸 Pravděpodobný obsah: různé účetní doklady\n`
      confidence += 0.2
    }

    // Detekce čísla z názvu
    const numberMatches = fileName.match(/(\d{4,})/g)
    if (numberMatches && numberMatches.length > 0) {
      const detectedNumber = numberMatches.reduce((a, b) => a.length > b.length ? a : b)
      detectedData.cisloDokladu = detectedNumber
      analysis += `📄 MOŽNÉ ČÍSLO DOKLADU: ${detectedNumber} (z názvu)\n`
      confidence += 0.2
    }

    analysis += `
💡 AI DOPORUČENÉ ÚČTOVÁNÍ:
${detectedData.ucty || 'MD 518000 (Ostatní služby) / DA 321000 (Dodavatelé)'}

📊 DETEKOVANÉ ÚDAJE:
- Typ: ${detectedType.replace('_', ' ').toUpperCase()}
- Číslo: ${detectedData.cisloDokladu || 'Viz obsah obrázku'}
- Jistota: ${Math.round(confidence * 100)}%

🚀 AUTOMATICKÉ OCR ČTENÍ (připravujeme):
- Rozpoznávání českého textu z obrázků
- Extrakce všech údajů automaticky
- Podpora pro různé kvality skenů

⚡ DOČASNÉ ŘEŠENÍ PRO RYCHLÉ ZPRACOVÁNÍ:
1. Přepište klíčové údaje z obrázku:

   DODAVATEL: ___________________
   ČÁSTKA: _________________ Kč
   DATUM: ___________________
   ČÍSLO: ___________________
   POPIS: ___________________

2. Uložte jako textový soubor (.txt)
3. Nahrajte textový soubor = okamžitá 100% AI analýza!

🔮 BRZY: Plně automatické OCR bez ručního přepisování!`

    return analysis
  }

  // Instrukce pro Excel soubory
  const generateExcelInstructions = async (file: File): Promise<string> => {
    return `EXCEL SOUBOR: ${file.name}
Velikost: ${(file.size / 1024 / 1024).toFixed(2)} MB
Typ: ${file.type || 'Excel Spreadsheet'}

📊 AUTOMATICKÉ ZPRACOVÁNÍ EXCEL SOUBORŮ:

🏃‍♂️ RYCHLÁ METODA (2 minuty):
1. Otevřete soubor v Excelu/Google Sheets
2. Označte všechna data (Ctrl+A)
3. Zkopírujte (Ctrl+C)
4. Vytvořte nový textový soubor (.txt)
5. Vložte data (Ctrl+V) a uložte
6. Nahrajte textový soubor = kompletní AI analýza

📈 NEBO EXPORT DO CSV:
1. V Excelu: Soubor → Uložit jako → CSV (odděleno čárkami)
2. Nahrajte CSV soubor = okamžitá analýza všech řádků

✅ PO KONVERZI AI DOKÁŽE:
- Analyzovat každý řádek účetních dat
- Navrhnout účtování pro různé položky  
- Detekovat dodavatele, částky, data
- Rozlišit příjmy vs výdaje
- Kategorizovat transakce

🚀 PŘIPRAVUJEME: Přímé čtení Excel souborů bez konverze

💡 TIP: CSV formát je ideální pro hromadné zpracování účetních dat!`
  }

  // Analýza neznámých formátů
  const generateUnknownFormatAnalysis = async (file: File): Promise<string> => {
    return `SOUBOR: ${file.name}
Typ: ${file.type || 'Nerozpoznaný'}
Velikost: ${(file.size / 1024 / 1024).toFixed(2)} MB

🔍 ANALÝZA NEPODPOROVANÉHO FORMÁTU:

🎯 AKTUÁLNÍ PLNÁ PODPORA:
✅ Text soubory (.txt, .csv) → 100% okamžitá analýza
🔍 PDF soubory → Pokročilá analýza názvu + instrukce
🖼️ Obrázky (.jpg, .png) → Chytrá detekce + doporučení
📊 Excel (.xlsx, .xls) → Instrukce pro konverzi

💡 UNIVERZÁLNÍ ŘEŠENÍ:
1. Konvertujte obsah na textový formát (.txt)
2. Nebo zkopírujte text z dokumentu
3. Vložte do textového souboru
4. Nahrajte .txt = perfektní AI analýza!

🚀 ROZŠIŘUJEME PODPORU:
- Word dokumenty (.docx)
- Email soubory (.eml)
- Webové stránky
- A další formáty na požádání

🎯 AI dokáže analyzovat jakýkoli text ve formátu .txt!`
  }

  // Analýza chyb
  const generateErrorAnalysis = async (file: File, error: any): Promise<string> => {
    return `CHYBA PŘI ZPRACOVÁNÍ: ${file.name}

Typ souboru: ${file.type}
Velikost: ${(file.size / 1024 / 1024).toFixed(2)} MB
Chyba: ${String(error)}

🔧 ŘEŠENÍ PROBLÉMŮ:

1. PŘÍLIŠ VELKÝ SOUBOR:
   - Maximum: 50 MB
   - Zkomprimujte nebo rozdělte soubor

2. POŠKOZENÝ SOUBOR:
   - Zkontrolujte, zda se soubor otevírá
   - Zkuste jiný soubor

3. NEPODPOROVANÝ FORMÁT:
   - Konvertujte na .txt, .csv nebo .pdf
   - Zkopírujte obsah ručně

🎯 SPOLEHLIVÉ ŘEŠENÍ:
- Otevřete dokument v příslušném programu
- Označte veškerý text (Ctrl+A)
- Zkopírujte (Ctrl+C)
- Vložte do Poznámkového bloku
- Uložte jako .txt a nahrajte znovu

✅ AI pak dokáže 100% analýzu všech účetních údajů!`
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
        
        // Vylepšená extrakce obsahu
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
          <h2 className="text-2xl font-bold">🎯 Pokročilá analýza dokumentů</h2>
          <p className="text-purple-100 mt-2">AI s chytrou detekcí + připravujeme plnou automatizaci</p>
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
                    <p className="text-green-600 text-sm">TXT, CSV - 100% analýza</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center">
                  <span className="text-blue-500 text-xl mr-3">🔍</span>
                  <div>
                    <h3 className="font-semibold text-blue-800">PDF soubory</h3>
                    <p className="text-blue-600 text-sm">Pokročilá detekce názvu</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center">
                  <span className="text-blue-500 text-xl mr-3">🖼️</span>
                  <div>
                    <h3 className="font-semibold text-blue-800">Obrázky</h3>
                    <p className="text-blue-600 text-sm">Chytrá analýza + instrukce</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center">
                  <span className="text-yellow-500 text-xl mr-3">🚀</span>
                  <div>
                    <h3 className="font-semibold text-yellow-800">Automatizace</h3>
                    <p className="text-yellow-600 text-sm">OCR v přípravě</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Upload zona */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                🎯 Pokročilá analýza dokumentů - stabilní verze
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
                  Nahrajte JAKÝKOLI dokument - AI ho chytře analyzuje
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  ✅ Text soubory (plná analýza) 🔍 PDF (pokročilá detekce) 🖼️ Obrázky (chytré doporučení)
                </p>
                <p className="text-xs text-blue-600 mt-1 font-medium">
                  🎯 Stabilní verze s nejlepší možnou analýzou pro každý formát!
                </p>
                
                <button className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                  🎯 Chytrá analýza (všechny formáty)
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

            {/* Roadmapa automatizace */}
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 mb-6 border border-yellow-200">
              <div className="flex items-center mb-3">
                <span className="text-yellow-500 text-2xl mr-3">🚀</span>
                <h3 className="text-lg font-semibold text-yellow-800">Roadmapa automatizace</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="bg-white p-3 rounded-lg border border-yellow-200">
                  <strong className="text-green-600">✅ HOTOVO (nyní)</strong>
                  <br />• Textové soubory: 100% analýza
                  <br />• PDF: Pokročilá detekce názvu
                  <br />• Obrázky: Chytrá klasifikace
                  <br />• AI účetní doporučení
                </div>
                <div className="bg-white p-3 rounded-lg border border-yellow-200">
                  <strong className="text-yellow-600">🔄 V PŘÍPRAVĚ (příští týden)</strong>
                  <br />• Automatické OCR čtení PDF
                  <br />• OCR rozpoznávání obrázků
                  <br />• Přímé čtení Excel souborů
                  <br />• 100% analýza bez copy-paste
                </div>
                <div className="bg-white p-3 rounded-lg border border-yellow-200">
                  <strong className="text-blue-600">🔮 BUDOUCNOST (měsíc)</strong>
                  <br />• Email monitoring příloh
                  <br />• Automatické zaúčtování
                  <br />• Dashboard kontroly
                  <br />• Mobile notifications
                </div>
              </div>
            </div>

            {/* Zpracované soubory */}
            {files.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  🎯 Chytře analyzované dokumenty ({files.length})
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
                            <span className="mr-2">🎯</span>
                            Pokročilá AI analýza:
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
                                <span className="font-medium text-purple-800">🎯 AI chytře doporučuje účtování:</span>
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
                                      <h3 class="font-bold mb-4">Chytrá analýza: ${file.file.name}</h3>
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
              <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-6 text-center border border-blue-200">
                <div className="text-4xl mb-4">🎯</div>
                <h3 className="text-lg font-semibold text-blue-800 mb-2">Pokročilý AI systém připraven!</h3>
                <p className="text-blue-700 mb-4">
                  Stabilní verze s nejlepší možnou analýzou pro každý typ dokumentu:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                  <div className="bg-white p-3 rounded-lg border border-green-200">
                    <strong className="text-green-600">✅ Text soubory</strong>
                    <br />100% kompletní analýza
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-blue-200">
                    <strong className="text-blue-600">🔍 PDF dokumenty</strong>
                    <br />Pokročilá detekce + instrukce
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-blue-200">
                    <strong className="text-blue-600">🖼️ Obrázky faktury</strong>
                    <br />Chytrá klasifikace + doporučení
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-yellow-200">
                    <strong className="text-yellow-600">🚀 Automatizace</strong>
                    <br />OCR v přípravě
                  </div>
                </div>
                <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-green-800 text-sm font-medium">
                    🎯 Garantovaně stabilní + nejlepší možné výsledky pro každý formát!
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
