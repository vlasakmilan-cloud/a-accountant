'use client';

import { useState } from 'react';
import { Upload, FileText, CheckCircle } from 'lucide-react';

export default function AnalyzeDocument() {
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setAnalyzing(true);

    // Simulace analýzy (bez tesseract.js)
    setTimeout(() => {
      setResult(`Dokument "${uploadedFile.name}" byl úspěšně analyzován!`);
      setAnalyzing(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">
          📄 Analýza dokumentů
        </h1>

        {/* Upload zona */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6">
          <div className="text-center">
            <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nahrajte dokument k analýze
            </h3>
            <p className="text-gray-500 mb-6">
              Podporované formáty: PDF, JPG, PNG
            </p>
            
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileUpload}
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
        </div>

        {/* Loading */}
        {analyzing && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Analyzuji dokument...</p>
          </div>
        )}

        {/* Výsledek */}
        {result && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-center mb-4">
              <CheckCircle className="w-6 h-6 text-green-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">
                Analýza dokončena
              </h3>
            </div>
            <p className="text-gray-700">{result}</p>
            
            <div className="mt-6">
              <button className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors">
                Přijmout výsledek
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
