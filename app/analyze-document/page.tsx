export default function AnalyzeDocumentPage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      {/* Header */}
      <div style={{ 
        background: 'linear-gradient(to right, #9333ea, #7c3aed)', 
        color: 'white', 
        padding: '24px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ marginBottom: '16px' }}>
            <a href="/" style={{ 
              color: '#c4b5fd', 
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center'
            }}>
              ← Zpět na dashboard
            </a>
          </div>
          <h1 style={{ fontSize: '30px', fontWeight: 'bold', margin: 0 }}>
            📄 Nahrát doklady
          </h1>
          <p style={{ color: '#c4b5fd', marginTop: '8px', margin: 0 }}>
            AI automaticky rozpozná obsah a navrhne správné účtování
          </p>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '1024px', margin: '0 auto', padding: '24px' }}>
        <div style={{ 
          backgroundColor: 'white', 
          borderRadius: '12px', 
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          padding: '24px' 
        }}>
          <h2 style={{ 
            fontSize: '20px', 
            fontWeight: '600', 
            color: '#1f2937',
            marginBottom: '16px',
            margin: 0
          }}>
            📁 Přidejte dokumenty
          </h2>

          {/* Upload Zone */}
          <div style={{ 
            border: '2px dashed #d1d5db', 
            borderRadius: '12px', 
            padding: '32px', 
            textAlign: 'center',
            marginTop: '16px'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
            <p style={{ 
              fontSize: '18px', 
              fontWeight: '500', 
              color: '#4b5563',
              margin: 0,
              marginBottom: '8px'
            }}>
              Přetáhněte soubory zde nebo klikněte pro výběr
            </p>
            <p style={{ 
              fontSize: '14px', 
              color: '#6b7280', 
              margin: 0,
              marginBottom: '16px'
            }}>
              Podporované formáty: JPG, PNG, PDF
            </p>
            
            <button style={{ 
              marginTop: '16px',
              padding: '8px 24px', 
              backgroundColor: '#9333ea', 
              color: 'white', 
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '16px'
            }}>
              Vybrat soubory
            </button>
          </div>

          {/* Status */}
          <div style={{ 
            marginTop: '24px', 
            padding: '16px', 
            backgroundColor: '#ecfdf5', 
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center'
          }}>
            <div style={{ fontSize: '24px', marginRight: '12px' }}>✅</div>
            <div>
              <h3 style={{ 
                fontWeight: '600', 
                color: '#065f46',
                margin: 0,
                marginBottom: '4px'
              }}>
                Stránka funguje!
              </h3>
              <p style={{ 
                color: '#047857', 
                fontSize: '14px',
                margin: 0
              }}>
                Upload funkcionalita se přidává postupně. Nyní testujeme základní routing.
              </p>
            </div>
          </div>

          {/* Back Button */}
          <div style={{ marginTop: '24px', textAlign: 'center' }}>
            <a href="/" style={{ 
              display: 'inline-flex',
              alignItems: 'center',
              padding: '12px 24px', 
              backgroundColor: '#4b5563', 
              color: 'white', 
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '16px'
            }}>
              ← Zpět na hlavní stránku
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
