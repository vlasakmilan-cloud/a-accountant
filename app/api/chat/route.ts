import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { message } = await request.json();

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `Jste AI účetní expert specializující se na české účetnictví a daňovou legislativu. 

VAŠE ROLE:
- Odpovídáte v češtině
- Specializujete se na české účetní standardy a zákony
- Pomáháte s účtováním, DPH, daněmi z příjmů
- Umíte vysvětlit složité účetní pojmy jednoduše
- Upozorňujete na legislativní změny a rizika

ODPOVÍDEJTE:
- Přesně a prakticky
- S konkrétními příklady
- Podle aktuální české legislativy
- S upozorněním na případná rizika

SPECIALIZACE:
- Podvojné účetnictví
- DPH (sazby, plátcovství, odpočty)
- Daň z příjmů fyzických i právnických osob
- Účetní doklady a jejich náležitosti
- Mzdy a odvody
- Inventarizace a uzávěrky`
        },
        {
          role: "user",
          content: message
        }
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });

    return NextResponse.json({ 
      message: completion.choices[0].message.content 
    });
  } catch (error) {
    console.error('OpenAI API error:', error);
    return NextResponse.json(
      { error: 'Omlouvám se, nastala chyba při komunikaci s AI.' },
      { status: 500 }
    );
  }
}
