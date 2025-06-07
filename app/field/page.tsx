// Force static generation - MUST be at the top
export async function generateStaticParams() {
  return [{}];
}

export const dynamic = 'force-static';
export const revalidate = false;

export default function FieldApp() {
  return (
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
          fontSize: '14px',
          marginBottom: '16px'
        }}>
          📱 Route generation successful!
        </div>
        
        {/* Sample Form */}
        <div style={{ textAlign: 'left', marginBottom: '20px' }}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '14px', 
              fontWeight: '500', 
              color: '#374151', 
              marginBottom: '8px' 
            }}>
              Select Salesman:
            </label>
            <select style={{
              width: '100%',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              padding: '8px 12px',
              fontSize: '14px'
            }}>
              <option>Choose...</option>
              <option>John Doe</option>
              <option>Jane Smith</option>
              <option>Raj Kumar</option>
            </select>
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '14px', 
              fontWeight: '500', 
              color: '#374151', 
              marginBottom: '8px' 
            }}>
              Shop Name:
            </label>
            <input 
              type="text" 
              placeholder="Enter shop name..."
              style={{
                width: '100%',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                padding: '8px 12px',
                fontSize: '14px'
              }}
            />
          </div>

          <button style={{
            width: '100%',
            backgroundColor: '#2563eb',
            color: 'white',
            padding: '12px',
            borderRadius: '6px',
            border: 'none',
            fontSize: '16px',
            fontWeight: '500',
            cursor: 'pointer'
          }}>
            🚀 Start Visit Collection
          </button>
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
  );
}
