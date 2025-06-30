import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

// Inicializace OpenAI s kontrolou klíče
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starting document analysis API...')
    console.log('🔑 OpenAI key available:', !!process.env.OPENAI_API_KEY)
    
    const body = await request.json()
    const { fileContent, fileName } = body

    if (!fileContent) {
      console.error('❌ Missing file content')
      return NextResponse.json(
        { error: 'Chybí obsah souboru' },
        { status: 400 }
      )
    }

    if (!process.env.OPENAI_API_KEY && !process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
      console.error('❌ Missing OpenAI API key')
      return NextResponse.json(
        { error: 'Chybí OpenAI API klíč' },
        { status: 500 }
      )
    }

    console.log(`📄 Analyzing file: ${fileName}`)
    console.log(`📝 Content length: ${fileContent.length}`)
    console.log(`📝 Content preview: ${fileContent.substring(0, 200)}...`)

    // Pokročilý prompt pro české účetnictví
    const systemPrompt = `Jsi expert na české účetnictví a daňové právo. Tvým úkolem je analyzovat účetní dokument a extrahovat klíčové informace.

PRAVIDLA ANALÝZY:
- Rozpoznej typ dokumentu (faktura přijatá/vystavená, pokladní doklad, bankovní výpis, atd.)
- Extrahuj všechny důležité údaje (dodavatel, částka, datum, číslo dokladu, popis)
- Navrhni správné účtování podle českých účetních předpisů
- Upozorni na možné daňové aspekty (DPH, odpočty, atd.)
- Poskytni zdůvodnění účtování

FORMÁT ODPOVĚDI (pouze JSON, bez dalšího textu):
{
  "typ": "faktura_prijata|faktura_vystavena|pokladni_doklad|banka_vypis|dodaci_list|vratka",
  "dodavatel": "název firmy nebo osoby",
  "odberatel": "název naší firmy (pokud je uvedený)",
  "castka": "celková částka s měnou",
  "datum": "datum dokladu (DD.MM.YYYY)",
  "cisloDokladu": "číslo faktury/dokladu",
  "popis": "popis služby/zboží",
  "dph": "informace o DPH (sazba, částka)",
  "ucty": "MD účet / DA účet (čísla a názvy)",
  "confidence": 0.85,
  "zduvodneni": "zdůvodnění navrhovaného účtování"
}

ČESKÉ ÚČETNÍ ÚČTY (příklady):
- 211000 Pokladna
- 221000 Bankovní účty  
- 311000 Odběratelé
- 321000 Dodavatelé
- 501000 Spotřeba materiálu
- 511000 Opravy a udržování
- 518000 Ostatní služby
- 521000 Mzdové náklady
- 531000 Daň silniční
- 538000 Ostatní daně a poplatky

DŮLEŽITÉ: Odpověz POUZE v JSON formátu, žádný další text!`

    const userPrompt = `Analyzuj tento účetní dokument:

NÁZEV SOUBORU: ${fileName}

OBSAH DOKUMENTU:
${fileContent.substring(0, 4000)}

Proveď podrobnou analýzu a vrať JSON odpověď podle zadaných pravidel.`

    console.log('🤖 Calling OpenAI API...')

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.3,
      max_tokens: 1200
    })

    const aiResponse = completion.choices[0]?.message?.content

    if (!aiResponse) {
      throw new Error('OpenAI nevrátila odpověď')
    }

    console.log('🎯 OpenAI response:', aiResponse)

    // Pokus o parsování JSON odpovědi
    let analysisResult
    try {
      // Očistit odpověď od možných markdown bloků
      const cleanResponse = aiResponse
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .replace(/^[^{]*/, '') // Odstranit text před {
        .replace(/[^}]*$/, '') // Odstranit text za }
        .trim()
      
      console.log('🧹 Cleaned response:', cleanResponse)
      
      analysisResult = JSON.parse(cleanResponse)
      
      // Validace a doplnění základních hodnot
      if (!analysisResult.confidence) {
        analysisResult.confidence = 0.7
      }
      
      if (!analysisResult.typ) {
        analysisResult.typ = 'faktura_prijata'
      }

      if (!analysisResult.datum) {
        analysisResult.datum = new Date().toLocaleDateString('cs-CZ')
      }

      if (!analysisResult.ucty) {
        analysisResult.ucty = 'MD 518000 (Ostatní služby) / DA 321000 (Dodavatelé)'
      }

      console.log('✅ Successfully parsed analysis result:', analysisResult)

    } catch (parseError) {
      console.error('❌ JSON parsing error:', parseError)
      console.log('📝 Raw AI response:', aiResponse)
      
      // Fallback struktura při chybě parsování
      analysisResult = {
        typ: "faktura_prijata",
        dodavatel: "Rozpoznáno z obsahu",
        castka: "Viz obsah dokumentu",
        datum: new Date().toLocaleDateString('cs-CZ'),
        cisloDokladu: "Rozpoznáno z obsahu",
        popis: "AI analýza proběhla - data v obsahu",
        dph: "Zkontrolujte v obsahu dokumentu",
        ucty: "MD 518000 (Ostatní služby) / DA 321000 (Dodavatelé)",
        confidence: 0.6,
        zduvodneni: `AI analýza provedena, ale JSON parsing selhal. Zkontrolujte ruční extrakci údajů.`
      }
    }

    console.log('📤 Returning result:', analysisResult)
    return NextResponse.json(analysisResult)

  } catch (error) {
    console.error('❌ API Error:', error)
    
    const errorResult = {
      typ: "faktura_prijata",
      dodavatel: "API Error - zkontrolujte manuálně",
      castka: "Chyba při načítání",
      datum: new Date().toLocaleDateString('cs-CZ'),
      cisloDokladu: "Chyba",
      popis: "Chyba při zpracování - zkontrolujte obsah ručně",
      dph: "Nerozpoznáno",
      ucty: "MD 518000 / DA 321000",
      confidence: 0.2,
      zduvodneni: `API chyba: ${String(error)}. Zkuste později nebo kontaktujte podporu.`
    }
    
    return NextResponse.json(errorResult, { status: 500 })
  }
}
