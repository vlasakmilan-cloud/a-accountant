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

    if (!fileContent) {
      return NextResponse.json(
        { error: 'Chybí obsah souboru' },
        { status: 400 }
      )
    }

    console.log(`📄 Analyzing file: ${fileName}`)
    console.log(`📝 Content length: ${fileContent.length}`)

    // VYLEPŠENÝ PROMPT S ČESKOU ÚČETNÍ LOGIKOU
    const systemPrompt = `Jsi expert na české účetnictví s 20letou praxí. Analyzuješ účetní doklady a navrhuješ SPRÁVNÉ účtování podle českých účetních předpisů.

KLÍČOVÉ PRAVIDLO: VŽDY analyzuj TYP PLATBY a TYP NÁKUPU pro správné účtování!

TYPY PLATEB A JEJICH ÚČTOVÁNÍ:
1. "Platba kartou" / "Kartou" / "Bankovní převod" → VŽDY DA 221000 (Bankovní účty)
2. "Hotově" / "V hotovosti" / "Pokladna" → VŽDY DA 211000 (Pokladna)
3. "Faktura" / "Na fakturu" / "Platba po termínu" → VŽDY DA 321000 (Dodavatelé)

TYPY NÁKUPŮ A JEJICH MD ÚČTY:
1. IT vybavení, hardware, elektronika → MD 501000 (Spotřeba materiálu)
2. Kancelářské potřeby, papír, toner → MD 501000 (Spotřeba materiálu)  
3. Služby, poradenství, software licence → MD 518000 (Ostatní služby)
4. Pohonné hmoty, benzín → MD 501000 (Spotřeba materiálu)
5. Opravy a udržování → MD 511000 (Opravy a udržování)
6. Školení, vzdělávání → MD 518000 (Ostatní služby)

LOGIKA ÚČTOVÁNÍ:
1. VŽDY nejdřív zjisti TYP PLATBY → určí DA účet
2. Pak zjisti TYP NÁKUPU → určí MD účet
3. Kombinuj: MD [typ nákupu] / DA [typ platby]

FORMÁT ODPOVĚDI (pouze JSON):
{
  "typ": "faktura_prijata|pokladni_doklad|banka_vypis",
  "dodavatel": "název dodavatele",
  "castka": "částka s měnou",
  "datum": "DD.MM.YYYY",
  "cisloDokladu": "číslo dokladu",
  "popis": "stručný popis nákupu",
  "dph": "výše DPH nebo 'ano/ne'",
  "ucty": "MD číslo (název) / DA číslo (název)",
  "confidence": 0.85,
  "zduvodneni": "Logika: [typ platby] → DA účet, [typ nákupu] → MD účet"
}

PŘÍKLADY SPRÁVNÉHO ÚČTOVÁNÍ:
- IT hardware + platba kartou → "MD 501000 (Spotřeba materiálu) / DA 221000 (Bankovní účty)"
- Služby + faktura → "MD 518000 (Ostatní služby) / DA 321000 (Dodavatelé)"
- Kancelářské potřeby + hotově → "MD 501000 (Spotřeba materiálu) / DA 211000 (Pokladna)"

DŮLEŽITÉ: Buď konzistentní! Stejný typ transakce = stejné účtování!`

    const userPrompt = `Analyzuj tento účetní dokument podle výše uvedených pravidel:

NÁZEV SOUBORU: ${fileName}

OBSAH DOKUMENTU:
${fileContent.substring(0, 4000)}

ÚKOL:
1. Identifikuj TYP PLATBY (karta/hotově/faktura)
2. Identifikuj TYP NÁKUPU (hardware/služby/materiál)
3. Navrhni SPRÁVNÉ účtování podle logiky
4. Vrať JSON odpověď`

    console.log('🤖 Calling OpenAI API...')

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.1, // Nižší temperatura pro konzistentní výsledky
      max_tokens: 1000
    })

    const aiResponse = completion.choices[0]?.message?.content

    if (!aiResponse) {
      throw new Error('OpenAI nevrátila odpověď')
    }

    console.log('🎯 OpenAI response:', aiResponse)

    // Pokus o parsování JSON odpovědi
    let analysisResult
    try {
      // Vyčistit odpověď od markdown bloků
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
      analysisResult.confidence = analysisResult.confidence || 0.8
      analysisResult.typ = analysisResult.typ || 'faktura_prijata'
      analysisResult.datum = analysisResult.datum || new Date().toLocaleDateString('cs-CZ')
      
      // Fallback účtování pokud chybí
      if (!analysisResult.ucty) {
        analysisResult.ucty = 'MD 501000 (Spotřeba materiálu) / DA 221000 (Bankovní účty)'
        analysisResult.zduvodneni = 'Fallback účtování - zkontrolujte typ platby a nákupu'
      }
      
      console.log('✅ Successfully parsed result')

    } catch (parseError) {
      console.error('❌ JSON parsing failed:', parseError)
      console.log('📝 Raw response:', aiResponse)
      
      // Inteligentní fallback - pokusíme se rozpoznat základní údaje
      const fallbackResult = generateIntelligentFallback(fileContent, fileName)
      
      analysisResult = {
        typ: "faktura_prijata",
        dodavatel: fallbackResult.dodavatel || "Zkontrolujte ručně",
        castka: fallbackResult.castka || "Viz dokument",
        datum: new Date().toLocaleDateString('cs-CZ'),
        cisloDokladu: fallbackResult.cisloDokladu || "Viz dokument",
        popis: fallbackResult.popis || "Účetní doklad",
        dph: fallbackResult.dph || "Zkontrolujte",
        ucty: fallbackResult.ucty || "MD 501000 (Spotřeba materiálu) / DA 221000 (Bankovní účty)",
        confidence: 0.5,
        zduvodneni: "AI parsing selhal - použit inteligentní fallback. Zkontrolujte typ platby a účtování."
      }
    }

    console.log('📤 Returning analysis result')
    return NextResponse.json(analysisResult)

  } catch (error) {
    console.error('❌ Complete API error:', error)
    
    // Error fallback s inteligentním účtováním
    return NextResponse.json({
      typ: "faktura_prijata",
      dodavatel: "Chyba při analýze",
      castka: "0 Kč",
      datum: new Date().toLocaleDateString('cs-CZ'),
      cisloDokladu: "ERROR",
      popis: "Systémová chyba",
      dph: "Neanalyzováno",
      ucty: "MD 501000 (Spotřeba materiálu) / DA 221000 (Bankovní účty)",
      confidence: 0.2,
      zduvodneni: `Systémová chyba - použito výchozí účtování pro materiál a bankovní platbu. Chyba: ${String(error).substring(0, 100)}`
    }, { status: 500 })
  }
}

// Inteligentní fallback - pokusí se rozpoznat základní údaje z obsahu
function generateIntelligentFallback(content: string, fileName: string) {
  const contentLower = content.toLowerCase()
  const result: any = {}

  // Detekce dodavatele
  const dodavatelMatch = content.match(/dodavatel[:\s]*([^\n\r]+)/i) || 
                        content.match/([a-záčďéěíňóřšťúůýž\s]+s\.?r\.?o\.?)/i)
  if (dodavatelMatch) {
    result.dodavatel = dodavatelMatch[1]?.trim()
  }

  // Detekce částky
  const castkaMatch = content.match(/(\d{1,3}(?:[\s,]\d{3})*(?:[.,]\d{2})?)\s*(?:kč|czk|Kč|CZK)/i)
  if (castkaMatch) {
    result.castka = castkaMatch[1] + ' Kč'
  }

  // Detekce čísla dokladu
  const cisloMatch = content.match(/(?:číslo|number|č\.|fvc|inv)[:\s]*([a-z0-9\-\/]+)/i)
  if (cisloMatch) {
    result.cisloDokladu = cisloMatch[1]
  }

  // Detekce typu platby a navržení účtování
  if (contentLower.includes('kartou') || contentLower.includes('platba kartou') || contentLower.includes('bankovní')) {
    result.ucty = 'MD 501000 (Spotřeba materiálu) / DA 221000 (Bankovní účty)'
    result.zduvodneni = 'Detekována platba kartou → bankovní účty'
  } else if (contentLower.includes('hotově') || contentLower.includes('pokladna') || contentLower.includes('cash')) {
    result.ucty = 'MD 501000 (Spotřeba materiálu) / DA 211000 (Pokladna)'  
    result.zduvodneni = 'Detekována hotovostní platba → pokladna'
  } else if (contentLower.includes('faktura') || contentLower.includes('invoice')) {
    result.ucty = 'MD 501000 (Spotřeba materiálu) / DA 321000 (Dodavatelé)'
    result.zduvodneni = 'Detekována faktura → dodavatelé'
  } else {
    result.ucty = 'MD 501000 (Spot
