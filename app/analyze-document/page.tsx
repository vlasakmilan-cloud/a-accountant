// Vylepšená extrakce obsahu s lepším PDF zpracováním
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
