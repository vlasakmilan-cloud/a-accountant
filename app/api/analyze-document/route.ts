import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'Žádný soubor nebyl nahrán' }, { status: 400 });
    }

    // Převod souboru na base64 pro OpenAI Vision API
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');

    const completion = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "system",
          content: `Jste AI expert na rozpoznávání účetních dokladů. Analyzujte obrázek účetního dokladu a extrahujte tyto informace:

POŽADOVANÉ ÚDAJE:
- dodavatel (název firmy/obchodu)
- castka (celková částka s DPH)
- datum (datum vystavení)
- ico (IČO dodavatele, pokud je uvedeno)
- dic (DIČ dodavatele, pokud je uvedeno) 
- typ_dokladu (faktura/účtenka/pokladní doklad)
- polozky (seznam položek s částkami)
- dph_sazba (sazba DPH v %)

NAVRHNĚTE ÚČTOVÁNÍ:
- ucet_md (účet má dáti - např. 501, 518)
- ucet_dal (účet dal - např. 321, 211)
- popis_uctovani (stručný popis operace)

ODPOVĚĎ VE FORMÁTU JSON:
{
  "dodavatel": "název",
  "castka": 1234.50,
  "datum": "2025-06-25",
  "ico": "12345678",
  "dic": "CZ12345678", 
  "typ_dokladu": "faktura",
  "polozky": ["položka 1: 100 Kč", "položka 2: 200 Kč"],
  "dph_sazba": 21,
  "ucet_md": "501",
  "ucet_dal": "321", 
  "popis_uctovani": "Nákup materiálu",
  "kvalita_rozpoznani": 0.95,
  "upozorneni": ["Zkontrolujte DIČ dodavatele"]
}

Pokud nějaký údaj není čitelný, vraťte null.`
        },
        {
          role: "user", 
          content: [
            {
              type: "text",
              text: "Analyzujte tento účetní doklad a extrahujte informace podle instrukcí:"
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${file.type};base64,${base64}`
              }
            }
          ]
        }
      ],
      max_tokens: 1000,
    });

    const response = completion.choices[0].message.content;
    
    try {
      const parsed = JSON.parse(response);
      return NextResponse.json({ success: true, data: parsed });
    } catch (parseError) {
      return NextResponse.json({ 
        success: false, 
        data: {
          dodavatel: "AI nemohla rozpoznat",
          castka: 0,
          datum: new Date().toISOString().split('T')[0],
          popis_uctovani: "Ruční kontrola potřebná",
          kvalita_rozpoznani: 0.1,
          upozorneni: ["Dokument není dostatečně čitelný"]
        }
      });
    }
  } catch (error) {
    console.error('Document analysis error:', error);
    return NextResponse.json(
      { error: 'Chyba při analýze dokumentu' },
      { status: 500 }
    );
  }
}
