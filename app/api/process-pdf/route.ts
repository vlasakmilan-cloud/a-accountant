import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  let fileName = 'unknown.pdf'
  
  try {
    console.log('🚀 Starting PDF processing API (placeholder version)...')
    
    const body = await request.json()
    const { fileName: bodyFileName, fileData, fileSize } = body
    
    fileName = bodyFileName || 'unknown.pdf'

    console.log(`📄 Processing PDF: ${fileName} (${fileSize} bytes)`)

    if (!fileData) {
      console.error('❌ Missing PDF data')
      return NextResponse.json(
        { error: 'Chybí PDF data' },
        { status: 400 }
      )
    }

    // Kontrola velikosti souboru
    if (fileSize > 50 * 1024 * 1024) {
      console.error('❌ PDF too large')
      return NextResponse.json(
        { error: 'PDF soubor je příliš velký (maximum 50 MB)' },
        { status: 400 }
      )
    }

    // Simulace zpracování
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Pokročilá analýza názvu souboru
    const fileNameLower = fileName.toLowerCase()
    let detectedInfo = generatePDFAnalysisFromFilename(fileName, fileSize)

    console.log('✅ PDF analysis completed (filename-based)')
    
    return NextResponse.json({
      content: detectedInfo,
      metadata: {
        hasText: false,
        method: 'filename_analysis',
        size: fileSize
      }
    })

  } catch (error) {
    console.error('❌ PDF API error:', error)
    
    return NextResponse.json({
      error: 'Chyba při zpracování PDF',
      content: `PDF ZPRACOVÁNÍ: ${fileName}

❌ Chyba při analýze: ${String(error)}

🚀 AUTOMATICKÉ ČTENÍ PDF PŘIPRAVUJEME!
Mezitím použijte rychlé řešení:

⚡ RYCHLÉ ŘEŠENÍ:
1. Otevřete PDF v prohlížeči (dvojklik na soubor)
2. Označte veškerý text (Ctrl+A)
3. Zkopírujte text (Ctrl+C)
4. Vytvořte nový textový soubor (.txt)
5. Vložte obsah (Ctrl+V) a uložte
6. Nahrajte textový soubor = okamžitá 100% AI analýza!

🎯 VÝHODA: Text formát = nejpřesnější AI analýza všech údajů!`,
      fallback: true
    }, { status: 200 })
  }
}

function generatePDFAnalysisFromFilename(fileName: string, fileSize: number): string {
  const fileNameLower = fileName.toLowerCase()
  const fileSizeMB = (fileSize / 1024 / 1024).toFixed(2)
  
  let analysis = `PDF DOKUMENT: ${fileName}
Velikost: ${fileSizeMB} MB
Datum nahrání: ${new Date().toLocaleDateString('cs-CZ')}

🧠 POKROČILÁ CHYTRÁ ANALÝZA NÁZVU SOUBORU:
`

  let detectedData: any = {}
  let confidence = 0.3

  // Detekce typu dokumentu z názvu
  if (fileNameLower.includes('faktura') || fileNameLower.includes('invoice') || fileNameLower.includes('fakt')) {
    detectedData.typ = "faktura_prijata"
    detectedData.ucty = "MD 518000 (Ostatní služby) / DA 321000 (Dodavatelé)"
    analysis += `✅ TYP DOKUMENTU: FAKTURA PŘIJATÁ (detekováno z názvu)\n`
    confidence += 0.4
  } else if (fileNameLower.includes('doklad') || fileNameLower.includes('uctenka') || fileNameLower.includes('paragon')) {
    detectedData.typ = "pokladni_doklad"
    detectedData.ucty = "MD 501000 (Spotřeba) / DA 211000 (Pokladna)"
    analysis += `✅ TYP DOKUMENTU: POKLADNÍ DOKLAD (detekováno z názvu)\n`
    confidence += 0.4
  } else if (fileNameLower.includes('vypis') || fileNameLower.includes('bank')) {
    detectedData.typ = "banka_vypis"
    detectedData.ucty = "MD 221000 (Bankovní účty) / DA dle účelu"
    analysis += `✅ TYP DOKUMENTU: BANKOVNÍ VÝPIS (detekováno z názvu)\n`
    confidence += 0.4
  } else {
    analysis += `📄 TYP DOKUMENTU: Pravděpodobně účetní doklad (obecný)\n`
  }

  // Extrakce čísla z názvu
  const numberMatches = fileName.match(/(\d{4,})/g)
  if (numberMatches && numberMatches.length > 0) {
    const detectedNumber = numberMatches.reduce((a, b) => a.length > b.length ? a : b)
    detectedData.cisloDokladu = detectedNumber
    analysis += `📄 ČÍSLO DOKLADU: ${detectedNumber} (extrahováno z názvu souboru)\n`
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

  // Detekce firmy
  const companyMatches = fileName.match(/([a-záčďéěíňóřšťúůýž]+[\s_-]*(?:s\.?r\.?o\.?|a\.?s\.?|spol|ltd|gmbh|inc))/gi)
  if (companyMatches && companyMatches.length > 0) {
    const company = companyMatches[0].replace(/[_-]/g, ' ')
    detectedData.dodavatel = company
    analysis += `🏢 DODAVATEL: ${company} (detekováno z názvu)\n`
    confidence += 0.3
  }

  analysis += `
📊 SHRNUTÍ AUTOMATICKY DETEKOVANÝCH ÚDAJŮ:
- Typ dokumentu: ${detectedData.typ?.replace('_', ' ').toUpperCase() || 'Účetní doklad'}
- Číslo dokladu: ${detectedData.cisloDokladu || 'Bude v PDF obsahu'}
- Rok: ${detectedData.rok || 'Bude v PDF obsahu'}
- Dodavatel: ${detectedData.dodavatel || 'Bude v PDF obsahu'}
- Jistota detekce: ${Math.round(confidence * 100)}%

💡 AI DOPORUČENÉ ÚČTOVÁNÍ:
${detectedData.ucty || 'MD 518000 (Ostatní služby) / DA 321000 (Dodavatelé)'}

🚀 PRO ÚPLNOU AUTOMATIZACI (připravujeme):
Pracujeme na automatickém čtení PDF obsahu bez copy-paste!

⚡ NEJRYCHLEJŠÍ ŘEŠENÍ PRO 100% ANALÝZU:
1. Otevřete PDF v prohlížeči (dvojklik nebo Ctrl+O)
2. Označte veškerý text dokumentu (Ctrl+A)
3. Zkopírujte označený text (Ctrl+C)
4. Vytvořte nový textový soubor v Poznámkovém bloku
5. Vložte zkopírovaný text (Ctrl+V)
6. Uložte jako .txt soubor
7. Nahrajte .txt soubor zde = okamžitá 100% AI analýza všech údajů!

🎯 VÝSLEDEK: Kompletní extrakce všech údajů + přesné účetní doporučení!

🔮 BRZY: Plně automatické čtení PDF bez manuálních kroků!`

  return analysis
}
