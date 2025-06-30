import { NextRequest, NextResponse } from 'next/server'
import pdf from 'pdf-parse'

export async function POST(request: NextRequest) {
  let fileName = 'unknown.pdf' // Default value for error handling
  
  try {
    console.log('🚀 Starting PDF processing API...')
    
    const body = await request.json()
    const { fileName: bodyFileName, fileData, fileSize } = body
    
    // Set fileName for use throughout the function
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

    try {
      console.log('🔍 Converting base64 to buffer...')
      
      // Převod base64 na buffer
      const buffer = Buffer.from(fileData, 'base64')
      console.log(`📦 Buffer size: ${buffer.length} bytes`)

      console.log('📖 Parsing PDF content...')
      
      // Zpracování PDF pomocí pdf-parse
      const pdfData = await pdf(buffer, {
        // Možnosti pro lepší zpracování
        max: 0, // žádný limit stránek
        version: 'v1.10.100' // použít nejnovější verzi
      })

      console.log(`📄 PDF parsed successfully:`)
      console.log(`   - Pages: ${pdfData.numpages}`)
      console.log(`   - Text length: ${pdfData.text.length}`)
      console.log(`   - Info:`, pdfData.info)

      // Vyčistit a formátovat text
      let cleanText = pdfData.text
        .replace(/\s+/g, ' ') // nahradit více mezer jednou
        .replace(/\n\s*\n/g, '\n') // odstranit prázdné řádky
        .trim()

      // Pokud je text prázdný
      if (!cleanText || cleanText.length < 10) {
        console.warn('⚠️ PDF text is empty or too short')
        return NextResponse.json({
          content: `PDF DOKUMENT: ${fileName}
Stránek: ${pdfData.numpages}
Status: PDF úspěšně načteno, ale neobsahuje rozpoznatelný text

MOŽNÉ PŘÍČINY:
- PDF obsahuje pouze obrázky (skenovaný dokument)
- PDF je chráněno proti kopírování
- Text je v grafické podobě

DOPORUČENÍ:
1. Zkuste otevřít PDF v prohlížeči a zkopírovat text ručně
2. Nebo převeďte PDF na obrázek a použijte OCR (připravujeme)
3. Případně požádejte o textovou verzi dokumentu

AI může stále analyzovat metadata a název souboru pro základní detekci.`,
          metadata: {
            pages: pdfData.numpages,
            info: pdfData.info,
            hasText: false
          }
        })
      }

      // Přidat metadata k textu
      const result = `PDF DOKUMENT AUTOMATICKY PŘEČTEN: ${fileName}
Stránek: ${pdfData.numpages}
Datum zpracování: ${new Date().toLocaleDateString('cs-CZ')}

✅ TEXT OBSAHU AUTOMATICKY EXTRAHOVÁN:

${cleanText}

---
METADATA:
${JSON.stringify(pdfData.info, null, 2)}`

      console.log('✅ PDF processing completed successfully')
      
      return NextResponse.json({
        content: result,
        metadata: {
          pages: pdfData.numpages,
          info: pdfData.info,
          textLength: cleanText.length,
          hasText: true
        }
      })

    } catch (pdfError) {
      console.error('❌ PDF parsing error:', pdfError)
      
      // Detailní error handling pro různé typy chyb
      let errorMessage = 'Neznámá chyba při zpracování PDF'
      
      if (String(pdfError).includes('Invalid PDF')) {
        errorMessage = 'Soubor není platný PDF dokument'
      } else if (String(pdfError).includes('password')) {
        errorMessage = 'PDF je chráněno heslem'
      } else if (String(pdfError).includes('encrypted')) {
        errorMessage = 'PDF je zašifrováno a nelze jej přečíst'
      } else if (String(pdfError).includes('damaged')) {
        errorMessage = 'PDF soubor je poškozený'
      }

      return NextResponse.json({
        error: errorMessage,
        content: `PDF CHYBA: ${fileName}

❌ CHYBA PŘI AUTOMATICKÉM ČTENÍ: ${errorMessage}

🔧 MOŽNÁ ŘEŠENÍ:
1. Zkontrolujte, zda je soubor skutečně PDF
2. Pokud je PDF chráněno heslem, odemkněte ho
3. Zkuste otevřít PDF v prohlížeči:
   - Ctrl+A (označit vše)
   - Ctrl+C (kopírovat)
   - Vytvořte textový soubor a vložte obsah
   - Nahrajte textový soubor pro analýzu

⚡ RYCHLÉ ŘEŠENÍ:
Otevřete PDF → označte text → zkopírujte → vytvořte .txt soubor → nahrajte

🚀 PŘIPRAVUJEME: Pokročilé OCR čtení pro problematické PDF soubory`,
        fallback: true
      }, { status: 200 }) // Vracíme 200, protože máme fallback řešení
    }

  } catch (error) {
    console.error('❌ Complete PDF API error:', error)
    
    return NextResponse.json({
      error: 'Systémová chyba PDF API',
      content: `SYSTÉMOVÁ CHYBA: ${fileName}

❌ Chyba: ${String(error)}

🔧 ŘEŠENÍ:
1. Zkuste soubor nahrát znovu
2. Zkontrolujte připojení k internetu
3. Případně použijte textový formát (.txt)

⚡ RYCHLÉ ŘEŠENÍ:
PDF → otevřít → označit text → kopírovat → .txt soubor → nahrát`,
      fallback: true
    }, { status: 500 })
  }
}
