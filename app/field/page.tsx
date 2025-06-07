'use client';

export default function FieldApp() {
  return (
    <html lang="en">
      <head>
        <title>Radico Field App</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body>
        <div style={{
          minHeight: '100vh',
          backgroundColor: '#f5f5f5',
          fontFamily: 'Arial, sans-serif',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '10px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            textAlign: 'center',
            maxWidth: '400px',
            width: '100%'
          }}>
            <h1 style={{ 
              fontSize: '24px', 
              fontWeight: 'bold', 
              marginBottom: '16px',
              color: '#1f2937' 
            }}>
              🚀 Radico Field App
            </h1>
            <p style={{ 
              color: '#6b7280', 
              marginBottom: '24px' 
            }}>
              Field Sales Data Collection
            </p>
            <div style={{
              backgroundColor: '#d1fae5',
              color: '#065f46',
              padding: '12px',
              borderRadius: '6px',
              marginBottom: '16px',
              border: '1px solid #34d399'
            }}>
              ✅ Field App is Working!
            </div>
            <div style={{
              backgroundColor: '#eff6ff',
              color: '#1e40af',
              padding: '12px',
              borderRadius: '6px',
              fontSize: '14px'
            }}>
              📱 Ready to build the full PWA here!
            </div>
            <p style={{ 
              fontSize: '12px', 
              color: '#9ca3af', 
              marginTop: '16px' 
            }}>
              Built: {new Date().toLocaleString()}
            </p>
          </div>
        </div>
      </body>
    </html>
  );
}
