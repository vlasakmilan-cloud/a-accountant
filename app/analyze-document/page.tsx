// Vylepšená AI analýza s konkrétním účtováním
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

ODPOVĚZ POUZE JSON (žádný jiný text):
{
  "typ": "faktura_prijata",
  "dodavatel": "ACME s.r.o.",
  "castka": "15125 Kč",
  "datum": "24.06.2025",
  "cisloDokladu": "2025-001",
  "popis": "Služby - konzultace",
  "dph": "2625 Kč",
  "ucty": "MD 518010 (Služby) / DA 321000 (Dodavatelé)",
  "confidence": 0.95,
  "zduvodneni": "Přijatá faktura za služby - standardní účtování dle ČÚS"
}

TYPY DOKUMENTŮ:
- faktura_prijata: MD 518xxx (dle druhu služby) / DA 321xxx (Dodavatelé)
- faktura_vystavena: MD 311xxx (Odběratelé) / DA 601xxx (Tržby)
- pokladni_doklad: MD 501xxx (Spotřeba) / DA 211xxx (Pokladna)
- dodaci_list: MD 132xxx (Zboží) / DA 321xxx (Dodavatelé)
- vratka: MD 321xxx (Dodavatelé) / DA 132xxx (Zboží)
- banka_vypis: MD 221xxx (Banka) / DA dle účelu

PRAVIDLA:
1. VŽDY navrhni konkrétní MD/DA účty s čísly
2. Pro služby použij účet 518xxx
3. Pro zboží použij účet 132xxx  
4. Pro tržby použij účet 601xxx
5. NEPIŠ "vyžaduje konzultaci" - navrhni konkrétní řešení
6. Confidence 0.9+ pro jasné případy, 0.7+ pro složitější

VRAŤ POUZE JSON!`
        }]
      })
    })

    const data = await response.json()
    const aiResponse = data.response || data.message || ''
    
    console.log('🤖 AI Response:', aiResponse)
    
    // Robustní parsing (stejné metody jako předtím)
    let parsedResult = null
    
    // Pokus 1: Čistý JSON
    try {
      parsedResult = JSON.parse(aiResponse)
      console.log('✅ JSON parsing úspěšný')
    } catch (e) {
      console.log('⚠️ JSON parsing failed, trying extraction...')
    }
    
    // Pokus 2: Najít JSON v textu
    if (!parsedResult) {
      try {
        const jsonMatch = aiResponse.match(/\{[\s\S]*?\}/g)
        if (jsonMatch && jsonMatch.length > 0) {
          parsedResult = JSON.parse(jsonMatch[0])
          console.log('✅ JSON extraction úspěšný')
        }
      } catch (e) {
        console.log('⚠️ JSON extraction failed, trying manual...')
      }
    }
    
    // Pokus 3: Manuální extrakce s konkrétním účtováním
    if (!parsedResult) {
      const lines = aiResponse.split('\n')
      const result: any = {
        confidence: 0.7
      }
      
      // Rozpoznání typu dokumentu
      const fullText = (aiResponse + ' ' + ocrText).toLowerCase()
      
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
      } else if (fullText.includes('dodac')) {
        result.typ = 'dodaci_list'
        result.ucty = 'MD 132000 (Zboží na skladě) / DA 321000 (Dodavatelé)'
      } else if (fullText.includes('vratk') || fullText.includes('dobrop')) {
        result.typ = 'vratka'
        result.ucty = 'MD 321000 (Dodavatelé) / DA 132000 (Zboží na skladě)'
      } else if (fullText.includes('bank') || fullText.includes('výpis')) {
        result.typ = 'banka_vypis'
        result.ucty = 'MD 221000 (Bankovní účty) / DA dle účelu platby'
      } else {
        result.typ = 'faktura_prijata' // default
        result.ucty = 'MD 518000 (Ostatní služby) / DA 321000 (Dodavatelé)'
      }
      
      // Extrakce dalších údajů
      for (const line of lines) {
        if (line.includes('Kč') || line.includes('CZK')) {
          const amountMatch = line.match(/(\d+[\s,\.]*\d*)\s*(Kč|CZK)/)
          if (amountMatch) result.castka = amountMatch[0]
        }
        
        if (line.match(/\d{1,2}\.\d{1,2}\.\d{4}/)) {
          const dateMatch = line.match(/\d{1,2}\.\d{1,2}\.\d{4}/)
          if (dateMatch) result.datum = dateMatch[0]
        }

        if (line.toLowerCase().includes('dodavatel') || line.toLowerCase().includes('firma')) {
          const supplierMatch = line.match(/:\s*([^,\n]+)/)
          if (supplierMatch) result.dodavatel = supplierMatch[1].trim()
        }
      }
      
      // Doplnění výchozích hodnot
      result.dodavatel = result.dodavatel || "Rozpoznáno z dokumentu"
      result.popis = result.popis || "Účetní doklad"
      result.zduvodneni = `Automatické rozpoznání typu ${result.typ} s doporučeným účtováním`
      
      parsedResult = result
      console.log('✅ Manual extraction dokončen')
    }

    // Pokus 4: Úplný fallback s konkrétním účtováním
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
        confidence: 0.4,
        zduvodneni: "Fallback - přijatá faktura za služby"
      }
      console.log('⚠️ Používám fallback řešení')
    }

    // Zajistit že máme vždy konkrétní účtování
    if (parsedResult.ucty && parsedResult.ucty.includes('konzultaci')) {
      switch (parsedResult.typ) {
        case 'faktura_prijata':
          parsedResult.ucty = 'MD 518000 (Ostatní služby) / DA 321000 (Dodavatelé)'
          break
        case 'faktura_vystavena':
          parsedResult.ucty = 'MD 311000 (Odběratelé) / DA 601000 (Tržby za služby)'
          break
        case 'pokladni_doklad':
          parsedResult.ucty = 'MD 501000 (Spotřeba materiálu) / DA 211000 (Pokladna)'
          break
        default:
          parsedResult.ucty = 'MD 518000 (Ostatní služby) / DA 321000 (Dodavatelé)'
      }
      parsedResult.zduvodneni = 'Automaticky upraveno na konkrétní účtování'
    }

    console.log('🎯 Finální výsledek:', parsedResult)
    return parsedResult

  } catch (error) {
    console.error('❌ AI analysis error:', error)
    return {
      typ: "faktura_prijata",
      dodavatel: "Chyba při analýze",
      castka: "Nerozpoznáno",
      datum: new Date().toLocaleDateString('cs-CZ'),
      popis: "Vyžaduje ruční kontrolu",
      ucty: "MD 518000 (Ostatní služby) / DA 321000 (Dodavatelé)",
      confidence: 0.2,
      zduvodneni: "Chyba při AI analýze - použito výchozí účtování"
    }
  }
}
