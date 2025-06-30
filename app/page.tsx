'use client';

import { useState } from 'react';

export default function HomePage() {
  const [message, setMessage] = useState('');

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f5f5f5', 
      padding: '24px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <header style={{
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '12px',
          marginBottom: '24px',
          border: '1px solid #ddd'
        }}>
          <h1 style={{ 
            fontSize: '32px', 
            fontWeight: 'bold', 
            color: '#333',
            margin: 0,
            textAlign: 'center'
          }}>
            🤖 A!Accountant - AI Účetní Software
          </h1>
          <p style={{
            textAlign: 'center',
            color: '#666',
            marginTop: '8px',
            fontSize: '18px'
          }}>
            Kompletní účetnictví ovládané umělou inteligencí
          </p>
        </header>

        {/* Rychlé akce */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px',
          marginBottom: '32px'
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '12px',
            border: '1px solid #ddd',
            textAlign: 'center'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              backgroundColor: '#2563eb',
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
              fontSize: '20px', 
              fontWeight: '600', 
              color: '#333',
              marginBottom: '8px'
            }}>
              Analýza dokumentů
            </h3>
            <p style={{ 
              color: '#666', 
              marginBottom: '16px',
              fontSize: '14px'
            }}>
              AI automaticky rozpozná a zaúčtuje faktury
            </p>
            <a 
              href="/analyze-document"
              style={{
                backgroundColor: '#2563eb',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '8px',
                textDecoration: 'none',
                display: 'inline-block',
                fontSize: '16px'
              }}
            >
              Spustit analýzu
            </a>
          </div>

          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '12px',
            border: '1px solid #ddd',
            textAlign: 'center'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              backgroundColor: '#16a34a',
              borderRadius: '50%',
              margin: '0 auto 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px'
            }}>
              💬
            </div>
            <h3 style={{ 
              fontSize: '20px', 
              fontWeight: '600', 
              color: '#333',
              marginBottom: '8px'
            }}>
              AI Asistent
            </h3>
            <p style={{ 
              color: '#666', 
              marginBottom: '16px',
              fontSize: '14px'
            }}>
              Zeptej se na účetní otázky
            </p>
            <a 
              href="/chat"
              style={{
                backgroundColor: '#16a34a',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '8px',
                textDecoration: 'none',
                display: 'inline-block',
                fontSize: '16px'
              }}
            >
              Otevřít chat
            </a>
          </div>

          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '12px',
            border: '1px solid #ddd',
            textAlign: 'center'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              backgroundColor: '#7c3aed',
              borderRadius: '50%',
              margin: '0 auto 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px'
            }}>
              📊
            </div>
            <h3 style={{ 
              fontSize: '20px', 
              fontWeight: '600', 
              color: '#333',
              marginBottom: '8px'
            }}>
              Sestavy
            </h3>
            <p style={{ 
              color: '#666', 
              marginBottom: '16px',
              fontSize: '14px'
            }}>
              Přehled příjmů, výdajů a zisků
            </p>
            <button
              style={{
                backgroundColor: '#7c3aed',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              Zobrazit sestavy
            </button>
          </div>
        </div>

        {/* Statistiky */}
        <div style={{
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '12px',
          border: '1px solid #ddd'
        }}>
          <h2 style={{ 
            fontSize: '24px', 
            fontWeight: '600', 
            color: '#333',
            marginBottom: '24px'
          }}>
            📈 Přehled
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px'
          }}>
            <div style={{
              backgroundColor: '#f0f9ff',
              padding: '16px',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <p style={{ color: '#0369a1', fontSize: '14px', margin: '0 0 4px 0' }}>
                Příjmy tento měsíc
              </p>
              <p style={{ color: '#0c4a6e', fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
                248 650 Kč
              </p>
            </div>

            <div style={{
              backgroundColor: '#fef2f2',
              padding: '16px',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <p style={{ color: '#dc2626', fontSize: '14px', margin: '0 0 4px 0' }}>
                Výdaje tento měsíc
              </p>
              <p style={{ color: '#991b1b', fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
                156 320 Kč
              </p>
            </div>

            <div style={{
              backgroundColor: '#f0fdf4',
              padding: '16px',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <p style={{ color: '#16a34a', fontSize: '14px', margin: '0 0 4px 0' }}>
                Zisk
              </p>
              <p style={{ color: '#15803d', fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
                92 330 Kč
              </p>
            </div>

            <div style={{
              backgroundColor: '#faf5ff',
              padding: '16px',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <p style={{ color: '#7c3aed', fontSize: '14px', margin: '0 0 4px 0' }}>
                AI zpracování
              </p>
              <p style={{ color: '#6b21a8', fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
                28 dokladů
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
