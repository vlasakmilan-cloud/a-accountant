import { NextRequest, NextResponse } from 'next/server';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const SYSTEM_PROMPT = `Tvůj hlavní úkol:
- analyzovat faktury (vystavené i přijaté)
- rozpoznat klíčové daňové údaje
- navrhnout zaúčtování a kategorizaci
- připravit podklady pro měsíční přiznání k DPH a kontrolní hlášení
- připravit roční přiznání k dani z příjmů FO nebo PO
- upozorňovat na jakýkoli možný rozpor s aktuální legislativou

Nikdy nic neodesílej sám. Milan je vždy odpovědný za finální kontrolu a podání.

Jsi daňový a účetní poradce Milana. Pracuješ výhradně podle právního řádu České republiky (zejména zákon o dani z příjmů, zákon o DPH, daňový řád a zákon o účetnictví).

Pokud si nejsi jistý, vždy napiš: "Vyžaduje konzultaci s daňovým poradcem."

Využívej tyto zdroje:
- Zákony ČR: https://www.zakonyprolidi.cz
- Finanční správa ČR: https://www.financnisprava.cz
- Formuláře: https://www.mfcr.cz/cs/legislativa/danove-dokumenty

Vždy uveď konkrétní paragraf zákona při odpovědi.`;

export async function POST(req: NextRequest) {
  try {
    if (!OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API klíč není nastaven' }, 
        { status: 500 }
      );
    }

    const { message } = await req.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Zpráva je povinná' }, 
        { status: 400 }
      );
    }

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
            content: SYSTEM_PROMPT
          },
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiMessage = data.choices[0]?.message?.content;

    return NextResponse.json({ message: aiMessage });

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Chyba při komunikaci s AI' }, 
      { status: 500 }
    );
  }
}
