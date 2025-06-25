// 1. API Route pro analýzu dokumentů
// Soubor: app/api/analyze-document/route.ts

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

// 2. Upload komponenta pro page.tsx
// Nahraďte DocumentsView komponentu touto verzí:

const DocumentsView = () => {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = async (files) => {
    setIsAnalyzing(true);
    
    for (let file of files) {
      // Přidej soubor do seznamu
      const newFile = {
        id: Date.now() + Math.random(),
        name: file.name,
        size: file.size,
        status: 'analyzing',
        data: null
      };
      
      setUploadedFiles(prev => [...prev, newFile]);

      // Analyzuj soubor pomocí AI
      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await fetch('/api/analyze-document', {
          method: 'POST',
          body: formData
        });

        const result = await response.json();
        
        // Aktualizuj soubor s výsledky
        setUploadedFiles(prev => 
          prev.map(f => 
            f.id === newFile.id 
              ? { 
                  ...f, 
                  status: 'completed', 
                  data: result.data,
                  confidence: result.data.kvalita_rozpoznani 
                }
              : f
          )
        );
      } catch (error) {
        setUploadedFiles(prev => 
          prev.map(f => 
            f.id === newFile.id 
              ? { ...f, status: 'error' }
              : f
          )
        );
      }
    }
    
    setIsAnalyzing(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AI Zpracování dokumentů</h1>
          <p className="text-gray-600 mt-2">Nahrajte faktury, účtenky nebo jiné doklady pro automatickou analýzu</p>
        </div>
      </div>

      {/* Beautiful Drag & Drop Zone */}
      <div
        className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 cursor-pointer ${
          dragActive 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => document.getElementById('fileInput').click()}
      >
        <input
          id="fileInput"
          type="file"
          multiple
          accept="image/*,.pdf"
          onChange={handleChange}
          className="hidden"
        />
        
        <div className="space-y-6">
          <div className="flex justify-center">
            <div className={`p-6 rounded-full transition-colors ${
              dragActive ? 'bg-blue-200' : 'bg-blue-100'
            }`}>
              <Brain className="w-16 h-16 text-blue-600" />
            </div>
          </div>
          
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              {dragActive ? 'Pusťte soubory zde!' : 'AI Automatická analýza'}
            </h3>
            <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Přetáhněte faktury, účtenky nebo doklady nebo klikněte pro výběr. 
              AI automaticky rozpozná text, extrahuje všechny údaje a navrhne správné účtování.
            </p>
            <div className="mt-4 text-sm text-gray-500">
              Podporované formáty: JPG, PNG, PDF • Max velikost: 10MB
            </div>
          </div>
          
          <div className="flex justify-center">
            <button className="bg-blue-600 text-white px-8 py-3 rounded-xl hover:bg-blue-700 transition-colors font-medium">
              Vybrat soubory
            </button>
          </div>
        </div>

        {isAnalyzing && (
          <div className="absolute inset-0 bg-white/90 rounded-2xl flex items-center justify-center">
            <div className="text-center">
              <div className="flex space-x-1 justify-center mb-4">
                <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce"></div>
                <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
              <p className="text-lg font-semibold text-gray-900">AI analyzuje dokumenty...</p>
              <p className="text-gray-600">Rozpoznávám text a extrahuji údaje</p>
            </div>
          </div>
        )}
      </div>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Analyzované dokumenty</h2>
          </div>
          
          <div className="p-6 space-y-4">
            {uploadedFiles.map(file => (
              <div key={file.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-8 h-8 text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-900">{file.name}</p>
                      <p className="text-sm text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {file.status === 'analyzing' && (
                      <span className="text-blue-600 text-sm">Analyzuji...</span>
                    )}
                    {file.status === 'completed' && file.confidence && (
                      <span className="text-green-600 text-sm font-medium">
                        AI: {(file.confidence * 100).toFixed(0)}%
                      </span>
                    )}
                    {file.status === 'error' && (
                      <span className="text-red-600 text-sm">Chyba</span>
                    )}
                  </div>
                </div>
                
                {file.data && file.status === 'completed' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-gray-50 rounded-lg p-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Dodavatel</p>
                      <p className="font-medium">{file.data.dodavatel || 'Nerozpoznáno'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Částka</p>
                      <p className="font-medium">{file.data.castka ? `${file.data.castka} Kč` : 'Nerozpoznáno'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Datum</p>
                      <p className="font-medium">{file.data.datum || 'Nerozpoznáno'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Navrhované účtování</p>
                      <p className="font-medium text-blue-600">
                        {file.data.ucet_md && file.data.ucet_dal 
                          ? `${file.data.ucet_md} / ${file.data.ucet_dal}`
                          : 'Ruční kontrola'
                        }
                      </p>
                    </div>
                    
                    {file.data.upozorneni && file.data.upozorneni.length > 0 && (
                      <div className="col-span-full">
                        <p className="text-xs text-amber-600 mb-1">Upozornění</p>
                        <ul className="text-sm text-amber-700">
                          {file.data.upozorneni.map((warning, idx) => (
                            <li key={idx}>• {warning}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
