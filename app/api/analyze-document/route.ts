import { NextRequest, NextResponse } from 'next/server'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY

export async function POST(req: NextRequest) {
  try {
    console.log('📄 Analyze Document API called')
    
    if (!OPENAI_API_KEY) {
      console.error('❌ OPENAI_API_KEY není nastaven!')
      return NextResponse.json(
        { error: 'API klíč není nastaven' }, 
        { status: 500 }
      )
    }

    const body = await req.json()
    const { fileContent, fileName } = body
    
    console.log('📝 Analyzing file:', fileName)
    console.log('📄 Content length:', fileContent?.length || 0)

    if (!fileContent || !fileName) {
      return NextResponse.json(
        { error: 'fileContent a fileName jsou povinné' }, 
        { status: 400 }
      )
    }

    const analysisPrompt = `ÚKOL: Analyzuj obsah účetního dokumentu a extrahuj klíčové údaje.

NÁZEV SOUBORU: ${fileName}

OBSAH DOKUMENTU:
${fileContent.substring(0, 3000)}${fileContent.length > 3000 ? '\n...(text zkrácen)' : ''}

INSTRUKCE:
Analyzuj obsah a extrahuj účetní údaje. Odpověz POUZE ve formátu JSON bez dalšího textu:

{
  "typ": "faktura_prijata|faktura_vystavena|pokladni_doklad|dodaci_list|vratka|banka_vypis",
  "dodavatel": "název firmy nebo 'nenalezeno'",
  "castka": "částka s měnou nebo 'nenalezeno'",
  "datum": "DD.MM.YYYY nebo 'nenalezeno'",
  "cisloDokladu": "číslo dokladu nebo 'nenalezeno'", 
  "popis": "stručný popis nebo 'účetní doklad'",
  "ucty": "MD XXXXX / DA XXXXX",
  "confidence": 0.8,
  "zduvodneni": "krátké zdůvodnění analýzy"
}

ÚČETNÍ PRAVIDLA (České účetnictví):
- Faktura přijatá: MD 518000 (Ostatní služby) / DA 321000 (Dodavatelé)
- Faktura vystavená: MD 311000 (Odběratelé) / DA 601000 (Tržby za služby)  
- Pokladní doklad výdaj: MD 501000 (Spotřeba materiálu) / DA 211000 (Pokladna)
- Pokladní doklad příjem: MD 211000 (Pokladna) / DA 601000 (Tržby)
- Dodací list: MD 132000 (Zboží na skladě) / DA 321000 (Dodavatelé)
- Bankovní výpis: MD 221000 (Bankovní účty) / DA dle účelu platby

PRAVIDLA ANALÝZY:
1. Pokud obsahuje slova "faktura", "invoice" → typ: faktura_prijata nebo faktura_vystavena
2. Pokud obsahuje "doklad", "účtenka", "paragon" → typ: pokladni_doklad  
3. Hledej částky ve formátech: "1000 Kč", "1.000,-", "€100", "$50"
4. Hledej data ve formátech: DD.MM.YYYY, DD/MM/YYYY, YYYY-MM-DD
5. Hledej čísla dokladů: "č.", "číslo", "No.", "number"
6. Confidence: 0.9+ pokud najdeš všechny údaje, 0.7+ pokud většinu, 0.5+ pokud základní, 0.3 pokud jen název
7. Vždy navrhni konkrétní účty MD/DA podle typu dokumentu

ODPOVĚZ POUZE JSON - žádný další text!`

    console.log('🤖 Calling OpenAI API...')

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Levnější model, stačí pro analýzu
        messages: [
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        max_tokens: 800,
        temperature: 0.2 // Nízká kreativita pro přesnou analýzu
      })
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('❌ OpenAI API Error:', response.status, errorData)
      
      // Fallback analýza při chybě API
      return NextResponse.json({
        typ: "faktura_prijata",
        dodavatel: "API nedostupné - kontrola potřeba",
        castka: "Nelze analyzovat",
        datum: new Date().toLocaleDateString('cs-CZ'),
        cisloDokladu: "Viz soubor",
        popis: "Vyžaduje ruční kontrolu",
        ucty: "MD 518000 / DA 321000",
        confidence: 0.2,
        zduvodneni: "OpenAI API nedostupné - základní klasifikace"
      })
    }

    const data = await response.json()
    const aiResponse = data.choices[0]?.message?.content || ''
    
    console.log('✅ OpenAI Response:', aiResponse.substring(0, 200) + '...')

    // Pokus o parsing JSON odpovědi
    let analysisResult
    try {
      // Najdi JSON v odpovědi
      const jsonMatch = aiResponse.match(/\{[\s\S]*?\}/g)
      if (jsonMatch && jsonMatch.length > 0) {
        analysisResult = JSON.parse(jsonMatch[0])
        console.log('✅ JSON parsing úspěšný')
      } else {
        throw new Error('JSON not found in response')
      }
    } catch (parseError) {
      console.log('⚠️ JSON parsing failed, using manual analysis...')
      
      // Manuální analýza jako fallback
      analysisResult = performManualAnalysis(fileContent, fileName)
    }

    // Validace a oprava výsledku
    analysisResult = validateAndFixResult(analysisResult, fileName)
    
    console.log('🎯 Final analysis result:', analysisResult)
    
    return NextResponse.json(analysisResult)

  } catch (error) {
    console.error('❌ Analysis API error:', error)
    
    return NextResponse.json({
      typ: "faktura_prijata",
      dodavatel: "Systémová chyba",
      castka: "Nelze analyzovat", 
      datum: new Date().toLocaleDateString('cs-CZ'),
      cisloDokladu: "Kontrola potřeba",
      popis: "Ruční zpracování nutné",
      ucty: "MD 518000 / DA 321000",
      confidence: 0.1,
      zduvodneni: `Systémová chyba: ${String(error)}`
    }, { status: 500 })
  }
}

// Manuální analýza jako fallback
function performManualAnalysis(fileContent: string, fileName: string): any {
  const result: any = { confidence: 0.4 }
  
  const lowerContent = fileContent.toLowerCase()
  const lowerFileName = fileName.toLowerCase()
  
  // Určení typu dokumentu
  if (lowerContent.includes('faktura') || lowerFileName.includes('faktura')) {
    result.typ = 'faktura_prijata'
    result.ucty = 'MD 518000 (Ostatní služby) / DA 321000 (Dodavatelé)'
  } else if (lowerContent.includes('doklad') || lowerContent.includes('účtenka') || lowerContent.includes('paragon')) {
    result.typ = 'pokladni_doklad'
    result.ucty = 'MD 501000 (Spotřeba) / DA 211000 (Pokladna)'
  } else if (lowerContent.includes('výpis') || lowerFileName.includes('bank')) {
    result.typ = 'banka_vypis'
    result.ucty = 'MD 221000 (Bankovní účty) / DA dle účelu'
  } else if (lowerContent.includes('dodací') || lowerFileName.includes('dodaci')) {
    result.typ = 'dodaci_list'
    result.ucty = 'MD 132000 (Zboží) / DA 321000 (Dodavatelé)'
  } else {
    result.typ = 'faktura_prijata' // default
    result.ucty = 'MD 518000 (Ostatní služby) / DA 321000 (Dodavatelé)'
  }
  
  // Hledání částky
  const amountMatches = fileContent.match(/(\d+[\s,\.]*\d*)\s*(Kč|CZK|czk|,-)/gi)
  if (amountMatches && amountMatches.length > 0) {
    const amounts = amountMatches.map(m => {
      const num = parseFloat(m.replace(/[^\d,\.]/g, '').replace(',', '.'))
      return { text: m.trim(), value: num }
    }).filter(a => !isNaN(a.value))
    
    if (amounts.length > 0) {
      const maxAmount = amounts.reduce((max, curr) => curr.value > max.value ? curr : max)
      result.castka = maxAmount.text
      result.confidence = Math.min(result.confidence + 0.2, 1.0)
    }
  }
  
  // Hledání data
  const dateMatches = fileContent.match(/(\d{1,2})[\.\/\-](\d{1,2})[\.\/\-](\d{4})/g)
  if (dateMatches && dateMatches.length > 0) {
    result.datum = dateMatches[0]
    result.confidence = Math.min(result.confidence + 0.1, 1.0)
  }
  
  // Hledání názvu firmy/dodavatele
  const lines = fileContent.split('\n')
  for (const line of lines) {
    const trimmedLine = line.trim()
    if ((trimmedLine.includes('s.r.o') || trimmedLine.includes('a.s.') || 
         trimmedLine.includes('spol.') || trimmedLine.includes('Ltd.')) && 
        trimmedLine.length < 100 && trimmedLine.length > 5) {
      result.dodavatel = trimmedLine
      result.confidence = Math.min(result.confidence + 0.1, 1.0)
      break
    }
  }
  
  // Hledání čísla dokladu
  const documentNumberMatches = fileContent.match(/(č\.|číslo|no\.|number|invoice).?\s*(\d+)/gi)
  if (documentNumberMatches && documentNumberMatches.length > 0) {
    result.cisloDokladu = documentNumberMatches[0]
    result.confidence = Math.min(result.confidence + 0.1, 1.0)
  }
  
  return result
}

// Validace a oprava výsledku
function validateAndFixResult(result: any, fileName: string): any {
  // Doplnění chybějících povinných polí
  if (!result.dodavatel || result.dodavatel === 'nenalezeno') {
    result.dodavatel = `Soubor: ${fileName}`
  }
  
  if (!result.castka || result.castka === 'nenalezeno') {
    result.castka = 'Nepodařilo se extrahovat'
  }
  
  if (!result.datum || result.datum === 'nenalezeno') {
    result.datum = new Date().toLocaleDateString('cs-CZ')
  }
  
  if (!result.cisloDokladu || result.cisloDokladu === 'nenalezeno') {
    result.cisloDokladu = 'Viz soubor'
  }
  
  if (!result.popis) {
    result.popis = 'Extrahováno z nahraného dokumentu'
  }
  
  if (!result.ucty) {
    result.ucty = 'MD 518000 / DA 321000'
  }
  
  if (!result.confidence) {
    result.confidence = 0.3
  }
  
  if (!result.zduvodneni) {
    result.zduvodneni = 'Automatická analýza obsahu dokumentu'
  }
  
  if (!result.typ) {
    result.typ = 'faktura_prijata'
  }
  
  return result
}
