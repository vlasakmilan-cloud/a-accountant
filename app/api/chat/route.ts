// 1. API Route pro OpenAI chat
// Soubor: app/api/chat/route.ts
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

// 2. Aktualizovaná AI Chat komponenta
// Přidáme do page.tsx místo původní AI chat sekce:

const AIChatView = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      content: 'Dobrý den! Jsem váš AI účetní expert. Specializuji se na české účetnictví, DPH a daňovou legislativu. Na čem vám mohu pomoci?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = {
      id: messages.length + 1,
      type: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: input }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      const aiMessage = {
        id: messages.length + 2,
        type: 'ai',
        content: data.message,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage = {
        id: messages.length + 2,
        type: 'ai',
        content: 'Omlouvám se, nastala chyba. Zkuste to prosím znovu.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleRecording = () => {
    if (!isRecording) {
      // Spustit nahrávání
      setIsRecording(true);
      // Zde by byla implementace Web Speech API
      // Pro demo přidáme simulaci
      setTimeout(() => {
        setIsRecording(false);
        setInput('Jak zaúčtovat nákup kancelářských potřeb za 5000 Kč?');
      }, 3000);
    } else {
      setIsRecording(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AI Účetní Expert</h1>
          <p className="text-gray-600 mt-2">Váš osobní AI poradce pro české účetnictví a daně</p>
        </div>
        <div className="flex items-center space-x-2 bg-green-100 text-green-800 px-4 py-2 rounded-lg">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium">AI Online</span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 h-[600px] flex flex-col">
        {/* Chat Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg mr-3">
              <Brain className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">AI Účetní Expert</h3>
              <p className="text-sm text-gray-500">České účetnictví • DPH • Daně • Legislativa</p>
            </div>
          </div>
        </div>
        
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] ${message.type === 'user' ? 'order-2' : 'order-1'}`}>
                {message.type === 'ai' && (
                  <div className="flex items-center mb-2">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-2">
                      <Brain className="w-4 h-4 text-purple-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">AI Expert</span>
                  </div>
                )}
                <div
                  className={`rounded-2xl px-6 py-4 ${
                    message.type === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900 border border-gray-200'
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                </div>
                <p className="text-xs text-gray-500 mt-1 text-center">
                  {message.timestamp.toLocaleTimeString('cs-CZ')}
                </p>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex items-center space-x-2 bg-gray-100 rounded-2xl px-6 py-4">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-sm text-gray-600">AI zpracovává vaši otázku...</span>
              </div>
            </div>
          )}
        </div>
        
        {/* Input */}
        <div className="border-t border-gray-100 p-6">
          <div className="flex items-end space-x-3">
            <div className="flex-1">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Zeptejte se na účetnictví, DPH, daně nebo legislativu..."
                className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 resize-none"
                rows={2}
                disabled={isLoading}
              />
            </div>
            <div className="flex space-x-2">
              <button
                onClick={toggleRecording}
                className={`p-3 rounded-xl transition-colors ${
                  isRecording 
                    ? 'bg-red-600 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                disabled={isLoading}
              >
                <Mic className="w-5 h-5" />
              </button>
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {/* Recording indicator */}
          {isRecording && (
            <div className="mt-3 flex items-center text-red-600">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></div>
              <span className="text-sm">Nahrávám hlasové zadání...</span>
            </div>
          )}
          
          {/* Quick suggestions */}
          <div className="mt-4 flex flex-wrap gap-2">
            {[
              "Jak zaúčtovat nákup zboží?",
              "Sazby DPH v České republice",
              "Co je to účet 311?",
              "Jak na odpočet DPH?"
            ].map((suggestion, index) => (
              <button
                key={index}
                onClick={() => setInput(suggestion)}
                disabled={isLoading}
                className="px-3 py-1 text-xs bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100 transition-colors disabled:opacity-50"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
