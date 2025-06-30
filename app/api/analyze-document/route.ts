import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

// Inicializace OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starting document analysis API...')
    
    const body = await request.json()
    const { fileContent, fileName } = body

    console.log(`📄 Analyzing file: ${fileName}`)
    console.log(`📝 Content length: ${fileContent ? fileContent.length : 0}`)

    // Kontrola vstupních dat
    if (!fileContent) {
      console.error('❌ Missing file content')
      return NextResponse.json(
        { 
          error: 'Chybí obsah souboru',
          typ: "faktura_prijata",
          dodavatel: "Chyba - chybí obsah",
          castka: "0 Kč",
          datum: new Date().toLocaleDateString('cs-CZ'),
          cisloDokladu: "ERROR",
          popis: "Chyba při načítání souboru",
          ucty: "MD 518000 / DA 321000",
          confidence: 0.1,
          zduvodneni: "Chybí obsah souboru pro analýzu"
        },
        { status: 400 }
      )
    }

    // Kontrola OpenAI klíče
    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ Missing OpenAI API key')
      return NextResponse.json({
        typ: "faktura_prijata",
        dodavatel: "Chyba konfigurace",
        castka: "0 Kč", 
        datum: new Date().toLocaleDateString('cs-CZ'),
        cisloDokladu: "CONFIG_ERROR",
        popis: "Chyba konfigurace API",
        ucty: "MD 518000 / DA 321000",
        confidence: 0.1,
        zduvodneni: "Chybí OpenAI API klíč - kontaktujte administrátora"
      })
    }

    console.log('🤖 Calling OpenAI API...')

    // Pokročilý prompt pro české účetnictví
    const systemPrompt = `Jsi expert na české účetnictví a daňové právo. Analyzuješ účetní dokumenty a extrahuješ klíčové informace.

ÚKOL: Analyzuj obsah dokumentu a vrať POUZE JSON odpověď.

FORMÁT ODPOVĚDI:
{
  "typ": "faktura_prijata",
  "dodavatel": "název firmy",
  "castka": "částka s měnou",
  "datum": "DD.MM.YYYY",
  "cisloDokladu": "číslo dokladu",
  "popis": "popis služby/zboží",
  "dph": "info o DPH",
  "ucty": "MD číslo účtu (název) / DA číslo účtu (název)",
  "confidence": 0.85,
  "zduvodneni": "zdůvodnění účtování"
}

ČESKÉ ÚČTY:
- 211000 Pokladna
- 221000 Bankovní účty
- 321000 Dodavatelé  
- 518000 Ostatní služby
- 501000 Spotřeba materiálu

DŮLEŽITÉ: Pouze JSON, žádný další text!`

    const userPrompt = `Analyzuj dokument:

SOUBOR: ${fileName}
OBSAH:
${fileContent.substring(0, 3000)}

Vrať JSON analýzu.`

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.3,
      max_tokens: 800
    })

    const aiResponse = completion.choices[0]?.message?.content

    console.log('🎯 OpenAI response received:', !!aiResponse)

    if (!aiResponse) {
      throw new Error('OpenAI nevrátila odpověď')
    }

    // Parsování JSON odpovědi
    let analysisResult
    try {
      // Vyčistit markdown a extra text
      let cleanResponse = aiResponse.trim()
      
      // Najít JSON blok
      const jsonStart = cleanResponse.indexOf('{')
      const jsonEnd = cleanResponse.lastIndexOf('}') + 1
      
      if (jsonStart !== -1 && jsonEnd > jsonStart) {
        cleanResponse = cleanResponse.substring(jsonStart, jsonEnd)
      }
      
      // Odstranit markdown bloky
      cleanResponse = cleanResponse
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim()
      
      console.log('🧹 Cleaned response for parsing:', cleanResponse.substring(0, 200))
      
      analysisResult = JSON.parse(cleanResponse)
      
      // Validace a doplnění
      analysisResult.confidence = analysisResult.confidence || 0.7
      analysisResult.typ = analysisResult.typ || 'faktura_prijata'
      analysisResult.datum = analysisResult.datum || new Date().toLocaleDateString('cs-CZ')
      analysisResult.ucty = analysisResult.ucty || 'MD 518000 (Ostatní služby) / DA 321000 (Dodavatelé)'
      
      console.log('✅ Successfully parsed result')

    } catch (parseError) {
      console.error('❌ JSON parsing failed:', parseError)
      console.log('📝 Raw response:', aiResponse)
      
      // Fallback výsledek
      analysisResult = {
        typ: "faktura_prijata",
        dodavatel: "Analyzováno AI - zkontrolujte ručně",
        castka: "Viz obsah dokumentu",
        datum: new Date().toLocaleDateString('cs-CZ'),
        cisloDokladu: "Viz obsah",
        popis: "AI analýza dokončena - ověřte údaje",
        dph: "Zkontrolujte v dokumentu",
        ucty: "MD 518000 (Ostatní služby) / DA 321000 (Dodavatelé)",
        confidence: 0.6,
        zduvodneni: "AI analýza proběhla, JSON parsing selhal - zkontrolujte obsah ručně"
      }
    }

    console.log('📤 Returning analysis result')
    return NextResponse.json(analysisResult)

  } catch (error) {
    console.error('❌ Complete API error:', error)
    
    // Error fallback
    return NextResponse.json({
      typ: "faktura_prijata",
      dodavatel: "Chyba při analýze",
      castka: "0 Kč",
      datum: new Date().toLocaleDateString('cs-CZ'),
      cisloDokladu: "ERROR",
      popis: "Systémová chyba - zkuste později",
      dph: "Neanalyzováno",
      ucty: "MD 518000 / DA 321000",
      confidence: 0.2,
      zduvodneni: `Chyba: ${String(error).substring(0, 100)}`
    }, { status: 500 })
  }
}
