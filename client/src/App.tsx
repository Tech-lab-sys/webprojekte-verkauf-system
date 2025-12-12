import { useState } from 'react';

function App() {
  const [websiteType, setWebsiteType] = useState<'AFFILIATE' | 'AI_BLOG' | 'BUSINESS'>('AFFILIATE');
  const [niche, setNiche] = useState('');
  const [loading, setLoading] = useState(false);
  const [offer, setOffer] = useState<any>(null);

  const handleGenerateOffer = async () => {
    if (!niche) {
      alert('Bitte gib eine Nische ein');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:3000/api/generate-offer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: websiteType, niche }),
      });

      const data = await response.json();
      if (data.success) {
        setOffer(data.data);
      } else {
        alert('Fehler: ' + data.error);
      }
    } catch (error) {
      alert('Verbindungsfehler');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🚀 Webprojekte Verkaufssystem</h1>
      <p>Generiere KI-basierte Website-Angebote auf Knopfdruck</p>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '10px' }}>
          <strong>Website Typ:</strong>
        </label>
        <select 
          value={websiteType} 
          onChange={(e) => setWebsiteType(e.target.value as any)}
          style={{ width: '100%', padding: '10px', fontSize: '16px' }}
        >
          <option value="AFFILIATE">Affiliate Website</option>
          <option value="AI_BLOG">KI-Blog</option>
          <option value="BUSINESS">Business Website</option>
        </select>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '10px' }}>
          <strong>Nische:</strong>
        </label>
        <input
          type="text"
          value={niche}
          onChange={(e) => setNiche(e.target.value)}
          placeholder="z.B. Fitness, Gaming, Reisen..."
          style={{ width: '100%', padding: '10px', fontSize: '16px' }}
        />
      </div>

      <button
        onClick={handleGenerateOffer}
        disabled={loading}
        style={{
          width: '100%',
          padding: '15px',
          fontSize: '18px',
          background: loading ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: loading ? 'not-allowed' : 'pointer',
        }}
      >
        {loading ? '⏳ Generiere Angebot...' : '✨ Angebot generieren'}
      </button>

      {offer && (
        <div style={{ marginTop: '30px', padding: '20px', background: '#f9f9f9', borderRadius: '10px' }}>
          <h2>📋 Dein Website-Angebot</h2>
          <h3>{offer.title}</h3>
          <p><strong>Beschreibung:</strong> {offer.description}</p>
          <p><strong>Preis:</strong> €{offer.price}</p>
          <p><strong>Setup Zeit:</strong> {offer.estimatedSetupTime}</p>
          
          <div style={{ marginTop: '20px' }}>
            <h4>Features:</h4>
            <ul>
              {offer.features?.map((feature: string, i: number) => (
                <li key={i}>{feature}</li>
              ))}
            </ul>
          </div>

          <div style={{ marginTop: '20px' }}>
            <h4>Tech Stack:</h4>
            <p>{offer.technicalStack?.join(', ')}</p>
          </div>

          <button
            style={{
              marginTop: '20px',
              padding: '12px 30px',
              background: '#4caf50',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '16px',
            }}
            onClick={() => alert('Checkout-Funktion wird implementiert!')}
          >
            💳 Jetzt kaufen
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
