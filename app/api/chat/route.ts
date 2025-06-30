// src/app/api/ai-chat/route.ts

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Vylepšený AI prompt pro účetní analýzu
const ACCOUNTING_SYSTEM_PROMPT = `Jsi expert na české účetnictví a daňové právo. Specializuješ se na:

🎯 ANALÝZA DOKUMENTŮ:
1. PEČLIVĚ rozliš DODAVATELE vs ODBĚRATELE:
   - DODAVATEL = ten, kdo fakturuje/vystavuje doklad (většinou nahoře dokumentu)
   - ODBĚRATEL = ten, kdo platí/příjemce faktury (většinou dole nebo v rámečku)
   
2. ČÍSELNÉ HODNOTY čti EXTRA PEČLIVĚ:
   - Kontroluj desetinné tečky a čárky
   - 11 230,00 není 112300!
   - Vždy ověř logiku částky (hosting za 112 tisíc je nereálný)

3. LOGICKÁ KONTROLA:
   - Zkontroluj, jestli dodavatel a služba dává smysl (ACTIVE 24 = hosting ✓)
   - Ověř rozumnost částek podle typu služby

🏢 ČESKÉ ÚČETNICTVÍ:
- Podvojné účetnictví s MD/DA větvami
- DPH sazby: 21% základní, 15% snížená, 10% knihy/léky
- Účty: 1xx-5xx (aktiva), 6xx (náklady), 2xx-4xx (pasiva)

📋 ÚČTOVÁNÍ PŘÍKLADŮ:
- Nákup materiálu: MD 501xxx (spotřeba) / DA 321xxx (dodavatelé)
- Služby: MD 518xxx (ostatní služby) / DA 321xxx (dodavatelé)
- DPH: MD 343xxx (DPH na vstupu) při nákupu

⚖️ LEGISLATIVNÍ KONTROLA:
- Upozorni na chybějící povinné údaje
- Kontroluj DPH sazby a nároky na odpočet
- Varuj před rizikovými transakcemi

🗣️ KOMUNIKACE:
- Odpovídej v češtině, profesionálně ale přátelsky
- Dávej konkrétní příklady s čísly účtů
- Nabízej alternativní řešení při pochybnostech`;

const DOCUMENT_ANALYSIS_PROMPT = `ANALYZUJ TENTO DOKUMENT EXTRA PEČLIVĚ:

🔍 KONTROLNÍ SEZNAM:
1. KDO JE DODAVATEL? (vystavovatel faktury - obvykle nahoře)
2. KDO JE ODBĚRATEL? (platič - obvykle dole nebo v rámečku)  
3. ČÁSTKA - čti pomalu, kontroluj tečky/čárky
4. DATUM a číslo dokladu
5. POPIS služby/zboží
6. DPH sazba a částka

📝 FORMÁT ODPOVĚDI:
Dodavatel: [SPRÁVNÝ název firmy, která VYSTAVUJE fakturu]
Částka: [PŘESNÁ částka včetně měny - kontroluj desetinná místa!]
Datum: [datum vystavení]
Číslo dokladu: [číslo faktury/dokladu]
Popis: [stručný popis]

AI doporučuje účtování:
MD [číslo účtu] ([název účtu]) / DA [číslo účtu] ([název účtu])
📊 Logika: [vysvětlení proč tento účet]

⚠️ KONTROLUJ: Je dodavatel logický pro danou službu? Je částka reálná?`;

export async function POST(request: NextRequest) {
  try {
    const { message, isDocumentAnalysis, documentData } = await request.json();

    let prompt = message;
    let systemPrompt = ACCOUNTING_SYSTEM_PROMPT;

    // Pokud jde o analýzu dokumentu, použij speciální prompt
    if (isDocumentAnalysis && documentData) {
      systemPrompt = ACCOUNTING_SYSTEM_PROMPT + "\n\n" + DOCUMENT_ANALYSIS_PROMPT;
      prompt = `ANALYZUJ TENTO DOKUMENT:

${documentData}

${message}`;
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user", 
          content: prompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.1, // Nízká teplota pro přesnost
    });

    const aiResponse = completion.choices[0]?.message?.content || 'Omlouváme se, došlo k chybě při zpracování.';

    return NextResponse.json({ response: aiResponse });

  } catch (error) {
    console.error('AI Chat Error:', error);
    return NextResponse.json(
      { error: 'Chyba při komunikaci s AI' },
      { status: 500 }
    );
  }
}
