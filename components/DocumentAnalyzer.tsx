// src/components/DocumentAnalyzer.tsx

'use client';

import { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertTriangle, MessageSquare } from 'lucide-react';

interface AnalysisResult {
  dodavatel: string;
  castka: string;
  datum: string;
  cisloDokladu: string;
  popis: string;
  uctovani: string;
  logika: string;
  varovani?: string[];
}

export default function DocumentAnalyzer() {
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const analyzeDocument = async (documentText: string) => {
    try {
      setAnalyzing(true);
      setError(null);

      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'Proveď detailní analýzu tohoto dokumentu podle kontrolního seznamu.',
          isDocumentAnalysis: true,
          documentData: documentText
        }),
      });

      if (!response.ok) {
        throw new Error('Chyba při analýze dokumentu');
      }

      const data = await response.json();
      
      // Parsování AI odpovědi pro strukturovaná data
      const aiResponse = data.response;
      const parsed = parseAIResponse(aiResponse);
      
      setResult({
        ...parsed,
        logika: aiResponse // Celá AI odpověď jako záložka
      });

    } catch (err) {
      setError('Chyba při analýze dokumentu. Zkuste to znovu.');
      console.error('Document analysis error:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  const parseAIResponse = (response: string): Partial<AnalysisResult> => {
    const lines = response.split('\n');
    const result: Partial<AnalysisResult> = {};
    const varovani: string[] = [];

    lines.forEach(line => {
      if (line.includes('Dodavatel:')) {
        result.dodavatel = line.split('Dodavatel:')[1]?.trim() || '';
      }
      if (line.includes('Částka:')) {
        result.castka = line.split('Částka:')[1]?.trim() || '';
      }
      if (line.includes('Datum:')) {
        result.datum = line.split('Datum:')[1]?.trim() || '';
      }
      if (line.includes('Číslo dokladu:')) {
        result.cisloDokladu = line.split('Číslo dokladu:')[1]?.trim() || '';
      }
      if (line.includes('Popis:')) {
        result.popis = line.split('Popis:')[1]?.trim() || '';
      }
      if (line.includes('MD') && line.includes('DA')) {
        result.uctovani = line.trim();
      }
      if (line.includes('⚠️') || line.includes('POZOR') || line.includes('VAROVÁNÍ')) {
        varovani.push(line.trim());
      }
    });

    if (varovani.length > 0) {
      result.varovani = varovani;
    }

    return result;
  };

  const handleFileUpload = async (uploadedFile: File) => {
    if (!uploadedFile) return;

    setFile(uploadedFile);
    
    // Simulace OCR - v reálné aplikaci by se použil skutečný OCR
    if (uploadedFile.type === 'application/pdf') {
      // Pro PDF by se použila knihovna jako pdf-parse
      await analyzeDocument(`Simulovaný text z PDF: ${uploadedFile.name}`);
    } else if (uploadedFile.type.startsWith('image/')) {
      // Pro obrázky by se použila OCR služba
      await analyzeDocument(`Simulovaný text z obrázku: ${uploadedFile.name}`);
    } else {
      setError('Nepodporovaný formát souboru. Použijte PDF nebo obrázek.');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileUpload(droppedFile);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileUpload(selectedFile);
    }
  };

  const saveEntry = async () => {
    if (!result) return;
    
    // Zde by se uložila položka do Supabase
    alert('Položka byla uložena do účetnictví!');
  };

  const consultWithAI = async () => {
    if (!result) return;
    
    // Otevře AI chat s kontextem tohoto dokumentu
    alert('Otevírám AI konzultaci...');
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        📄 Analýza dokumentů pomocí AI
      </h2>

      {/* Upload zona */}
      <div 
        className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${
          dragOver 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
      >
        <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-lg text-gray-600 mb-4">
          Přetáhněte soubor sem nebo klikněte pro výběr
        </p>
        <p className="text-sm text-gray-500 mb-6">
          Podporované formáty: PDF, JPG, PNG
        </p>
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleFileInput}
          className="hidden"
          id="file-upload"
        />
        <label
          htmlFor="file-upload"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 cursor-pointer inline-block transition-colors"
        >
          Vybrat soubor
        </label>
      </div>

      {/* Loading stav */}
      {analyzing && (
        <div className="mt-8 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">AI analyzuje dokument...</p>
        </div>
      )}

      {/* Chyba */}
      {error && (
        <div className="mt-8 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Výsledek analýzy */}
      {result && (
        <div className="mt-8 bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="bg-gradient-to-r from-green-500 to-blue-600 text-white p-4 rounded-t-xl">
            <div className="flex items-center">
              <CheckCircle className="w-6 h-6 mr-2" />
              <h3 className="text-lg font-semibold">AI analýza výsledek:</h3>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dodavatel:
                </label>
                <p className="text-lg font-semibold text-gray-900">{result.dodavatel}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Částka:
                </label>
                <p className="text-lg font-semibold text-green-600">{result.castka}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Datum:
                </label>
                <p className="text-gray-900">{result.datum}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Číslo dokladu:
                </label>
                <p className="text-gray-900">{result.cisloDokladu}</p>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Popis:
              </label>
              <p className="text-gray-900">{result.popis}</p>
            </div>

            {/* Navrhované účtování */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-blue-800 mb-2">
                🎯 AI doporučuje účtování:
              </h4>
              <p className="font-mono text-green-700 text-lg">{result.uctovani}</p>
              <p className="text-sm text-gray-600 mt-2">
                📊 {result.logika?.split('📊 Logika:')[1]?.split('\n')[0] || 'Logické zdůvodnění'}
              </p>
            </div>

            {/* Varování */}
            {result.varovani && result.varovani.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-yellow-800 mb-2">
                  ⚠️ Upozornění:
                </h4>
                {result.varovani.map((warning, index) => (
                  <p key={index} className="text-yellow-700 text-sm mb-1">
                    {warning}
                  </p>
                ))}
              </div>
            )}

            {/* Akční tlačítka */}
            <div className="flex flex-wrap gap-4">
              <button
                onClick={saveEntry}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center"
              >
                <CheckCircle className="w-5 h-5 mr-2" />
                Schválit účtování
              </button>
              
              <button
                onClick={() => setResult({...result})}
                className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors"
              >
                ✏️ Upravit údaje
              </button>
              
              <button
                onClick={consultWithAI}
                className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors flex items-center"
              >
                <MessageSquare className="w-5 h-5 mr-2" />
                Konzultovat s AI
              </button>
              
              <button
                onClick={() => alert('Zobrazuji obsah dokumentu...')}
                className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
              >
                🔍 Zobrazit obsah
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
