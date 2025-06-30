'use client';

import { useState } from 'react';

export default function AnalyzeDocument() {
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setAnalyzing(true);

    setTimeout(() => {
      setResult(`Dokument "${uploadedFile.name}" byl úspěšně analyzován!`);
      setAnalyzing(false);
    }, 2000);
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f5f5f5', 
      padding: '24px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ 
          fontSize: '32px', 
          fontWeight: 'bold', 
          color: '#333',
          marginBottom: '32px',
          textAlign: 'center'
        }}>
          📄 Analýza dokumentů
        </h1>

        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '48px',
          marginBottom: '24px',
          border: '1px solid #ddd',
          textAlign: 'center'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            backgroundColor: '#e5e5e5',
            borderRadius: '50%',
            margin: '0 auto 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px'
          }}>
            📄
          </div>
          
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: '500', 
            color: '#333',
            marginBottom: '8px'
          }}>
            Nahrajte dokument k analýze
          </h3>
          
          <p style={{ 
            color: '#666', 
            marginBottom: '24px' 
          }}>
            Podporované formáty: PDF, JPG, PNG
          </p>
          
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
            id="file-upload"
          />
          
          <label
            htmlFor="file-upload"
            style={{
              backgroundColor: '#2563eb',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '16px',
              display: 'inline-block'
            }}
          >
            Vybrat soubor
          </label>
        </div>

        {analyzing && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '48px',
            border: '1px solid #ddd',
            textAlign: 'center'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              border: '4px solid #2563eb',
              borderTop: '4px solid transparent',
              borderRadius: '50%',
              margin: '0 auto 16px'
            }} />
            <p style={{ color: '#666' }}>Analyzuji dokument...</p>
          </div>
        )}

        {result && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '32px',
            border: '1px solid #ddd'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              marginBottom: '16px' 
            }}>
              <span style={{ 
                color: '#16a34a', 
                fontSize: '24px', 
                marginRight: '8px' 
              }}>
                ✅
              </span>
              <h3 style={{ 
                fontSize: '18px', 
                fontWeight: '600', 
                color: '#333',
                margin: 0
              }}>
                Analýza dokončena
              </h3>
            </div>
            
            <p style={{ 
              color: '#555',
              marginBottom: '24px'
            }}>
              {result}
            </p>
            
            <button style={{
              backgroundColor: '#16a34a',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '16px'
            }}>
              Přijmout výsledek
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
