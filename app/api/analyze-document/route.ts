import { NextRequest, NextResponse } from 'next/server';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const DOCUMENT_ANALYSIS_PROMPT = `Jsi český daňový poradce. Analyzuj text z faktury a extrahuj klíčové údaje.

ÚKOL: Z textu faktury extrahuj strukturované údaje ve formátu JSON.

POŽADOVANÝ VÝSTUP JSON:
{
  "dodavatel": "název firmy",
  "ico": "IČO pokud je uvedeno",
  "dic": "DIČ pokud je uvedeno", 
  "castka_bez_dph": "částka bez DPH v Kč",
  "dph_sazba": "DPH sazba v %",
  "dph_castka": "výše DPH v Kč",
  "castka_celkem": "celková částka včetně DPH v Kč",
  "datum_vystaveni": "datum vystavení faktury",
  "datum_splatnosti": "datum splatnosti",
  "cislo_faktury": "číslo faktury",
  "predmet_plneni": "popis zboží/služeb",
  "zauctovani_navrh": {
    "md": "návrh účtu MD (např. 501, 518)",
    "dal": "návrh účtu DAL (např. 321, 331)",
    "popis": "popis účetního případu"
  },
  "dph_typ": "standardní/snížená/osvobozená/reverse_charge",
  "upozorneni": "případné legislativní upozornění",
  "kvalita_rozpoznani": "vysoká/střední/nízká - podle čitelnosti"
}

Pokud nějaký údaj nenajdeš, použij null.
Při návrhu zaúčtování dodržuj české účetní standardy.
Upozorni na případné nesrovnalosti s DPH nebo legislativou.`;

export async function POST(req: NextRequest) {
  try {
    if (!OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API klíč není nastaven' }, 
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'Žádný soubor nebyl nahrán' }, 
        { status: 400 }
      );
    }

    // Kontrola typu souboru
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Nepodporovaný typ souboru. Použijte JPG, PNG nebo PDF.' }, 
        { status: 400 }
      );
    }

    // Kontrola velikosti (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Soubor je příliš velký. Maximum je 10MB.' }, 
        { status: 400 }
      );
    }

    console.log('Zpracovávám soubor:', file.name, file.type, file.size);

    // Převod souboru na buffer pro zpracování
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Pro jednoduchost zatím simulujeme OCR
    // V produkci by zde bylo skutečné OCR zpracování
    const simulatedText = `
    FAKTURA č. 2025-001
    Dodavatel: ACME s.r.o.
    IČO: 12345678
    DIČ: CZ12345678
    
    Odběratel: Vaše firma s.r.o.
    
    Předmět plnění: Kancelářské potřeby
    Datum vystavení: 25.6.2025
    Datum splatnosti: 25.7.2025
    
    Částka bez DPH: 10 330 Kč
    DPH 21%: 2 169 Kč
    Celkem k úhradě: 12 499 Kč
    `;

    console.log('Simulace OCR dokončena, odesílám k AI analýze...');

    // AI analýza extrahovaného textu
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: DOCUMENT_ANALYSIS_PROMPT
          },
          {
            role: 'user',
            content: `Analyzuj tento text z faktury:\n\n${simulatedText}`
          }
        ],
        temperature: 0.1,
        max_tokens: 1500
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const aiData = await response.json();
    const analysisResult = aiData.choices[0]?.message?.content;

    console.log('AI analýza dokončena');

    // Pokus o parsování JSON odpovědi
    let structuredData = null;
    try {
      // Extrakce JSON z AI odpovědi
      const jsonMatch = analysisResult.match(/```json\n([\s\S]*?)\n```/) || 
                       analysisResult.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        structuredData = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      }
    } catch (parseError) {
      console.log('Chyba při parsování JSON, použiji raw text');
    }

    return NextResponse.json({
      success: true,
      data: {
        filename: file.name,
        extractedText: simulatedText.trim(),
        structuredData: structuredData,
        rawAnalysis: analysisResult
      }
    });

  } catch (error) {
    console.error('Chyba při zpracování dokumentu:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Chyba při zpracování dokumentu: ' + (error as Error).message 
      }, 
      { status: 500 }
    );
  }
}
