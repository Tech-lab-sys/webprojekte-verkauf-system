import { useState } from 'react';

function App() {
  const [websiteType, setWebsiteType] = useState<'AFFILIATE' | 'AI_BLOG' | 'BUSINESS'>('AFFILIATE');
  const [niche, setNiche] = useState('');
  const [theme, setTheme] = useState('Astra');
  const [primaryColor, setPrimaryColor] = useState('#6366f1'); // Default to indigo
  const [loading, setLoading] = useState(false);
  const [offer, setOffer] = useState<any>(null);

  const handleGenerateOffer = async () => {
    if (!niche) {
      alert('Bitte gib eine Nische ein');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/generate-offer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: websiteType, niche, theme, primaryColor }),
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 font-sans text-white">
      {/* Header */}
      <header className="backdrop-blur-md bg-white/5 border-b border-white/10 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              🚀 WebProjekte Builder
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12 flex flex-col lg:flex-row gap-12">
        {/* Configuration Panel */}
        <div className="lg:w-1/3 flex flex-col gap-8">
          <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-8 border border-white/20 shadow-2xl">
            <h2 className="text-2xl font-bold mb-6">⚙️ Konfiguration</h2>

            {/* Website Type Selector */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-300 mb-3">Website-Typ</label>
              <div className="flex flex-col gap-3">
                {(['AFFILIATE', 'AI_BLOG', 'BUSINESS'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setWebsiteType(type)}
                    className={`py-3 px-4 text-left rounded-xl font-semibold transition-all duration-300 ${
                      websiteType === type
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 shadow-lg'
                        : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10'
                    }`}
                  >
                    {type === 'AFFILIATE' && '🎯 Affiliate'}
                    {type === 'AI_BLOG' && '🤖 KI-Blog'}
                    {type === 'BUSINESS' && '💼 Business'}
                  </button>
                ))}
              </div>
            </div>

            {/* Niche Input */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-300 mb-3">Nische</label>
              <input
                type="text"
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                placeholder="z.B. Fitness, Finanzen..."
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
              />
            </div>

            {/* Theme Selector */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-300 mb-3">Theme Layout</label>
              <div className="grid grid-cols-2 gap-3">
                {['Astra', 'GeneratePress', 'OceanWP', 'Neve'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setTheme(t)}
                    className={`py-2 px-3 text-sm rounded-xl font-semibold transition-all duration-300 ${
                      theme === t
                        ? 'bg-purple-500/50 border-purple-400 border'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Primary Color Picker */}
            <div className="mb-8">
              <label className="block text-sm font-semibold text-gray-300 mb-3">Primärfarbe</label>
              <div className="flex items-center gap-4">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-12 h-12 rounded cursor-pointer border-0 bg-transparent"
                />
                <span className="text-gray-400 font-mono text-sm">{primaryColor.toUpperCase()}</span>
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerateOffer}
              disabled={loading}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white font-bold text-lg transition-all duration-300 shadow-xl shadow-purple-500/30 hover:scale-105 disabled:opacity-50 disabled:scale-100"
            >
              {loading ? 'Generiere...' : '✨ Website Bauen & Angebot Erstellen'}
            </button>
          </div>
        </div>

        {/* Live Preview Panel */}
        <div className="lg:w-2/3 flex flex-col gap-8">
          {/* Visual Mockup */}
          <div className="flex-grow bg-white rounded-3xl overflow-hidden shadow-2xl border-4 border-white/10 flex flex-col">
            {/* Browser Header */}
            <div className="bg-gray-200 px-4 py-3 flex items-center gap-2 border-b border-gray-300">
               <div className="w-3 h-3 rounded-full bg-red-400"></div>
               <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
               <div className="w-3 h-3 rounded-full bg-green-400"></div>
               <div className="ml-4 bg-white px-3 py-1 rounded text-xs text-gray-500 flex-grow text-center max-w-sm mx-auto truncate font-mono">
                  {niche ? `${niche.toLowerCase().replace(/\s+/g, '-')}.de` : 'deine-neue-website.de'}
               </div>
            </div>

            {/* Website Content Preview */}
            <div className="flex-grow bg-slate-50 relative flex flex-col" style={{'--primary': primaryColor} as any}>
               {/* Hero Section */}
               <div className="h-64 flex flex-col justify-center items-center text-center px-8 relative" style={{backgroundColor: `${primaryColor}20`}}>
                  <div className="absolute top-4 left-4 font-bold text-xl" style={{color: primaryColor}}>
                    {niche || 'Logo'}
                  </div>
                  <div className="absolute top-4 right-4 flex gap-4 text-sm font-semibold text-gray-600">
                    <span>Home</span>
                    <span>Über uns</span>
                    <span>Kontakt</span>
                  </div>

                  <h1 className="text-4xl font-extrabold text-gray-900 mb-4 max-w-2xl leading-tight">
                    {websiteType === 'BUSINESS' ? `Professionelle Lösung für ${niche || 'Ihr Business'}` :
                     websiteType === 'AI_BLOG' ? `Alles über ${niche || 'Interessante Themen'}` :
                     `Die besten Angebote für ${niche || 'Dich'}`}
                  </h1>
                  <p className="text-gray-600 max-w-lg mb-6">
                    {theme} Theme Layout • Optimiert für Conversions • Responsive Design
                  </p>
                  <button className="px-8 py-3 rounded-full text-white font-bold shadow-lg" style={{backgroundColor: primaryColor}}>
                    Jetzt Starten
                  </button>
               </div>

               {/* Mock Content Sections */}
               <div className="p-8 flex-grow">
                 <div className="grid grid-cols-3 gap-6 mb-8">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
                         <div className="w-12 h-12 rounded-full mb-4 opacity-20" style={{backgroundColor: primaryColor}}></div>
                         <div className="w-24 h-4 bg-gray-200 rounded mb-2"></div>
                         <div className="w-full h-2 bg-gray-100 rounded mb-1"></div>
                         <div className="w-3/4 h-2 bg-gray-100 rounded"></div>
                      </div>
                    ))}
                 </div>
               </div>
            </div>
          </div>

          {/* Offer Results */}
          {offer && (
            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-green-500/30">
               <h3 className="text-xl font-bold mb-4 text-green-400">✅ Angebot generiert</h3>
               <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-bold text-lg mb-2">{offer.title}</h4>
                    <p className="text-gray-300 text-sm mb-4 line-clamp-3">{offer.description}</p>
                    <ul className="text-sm space-y-2">
                       {offer.highlights?.slice(0,3).map((h: string, i: number) => (
                         <li key={i} className="flex gap-2"><span className="text-green-400">✓</span> {h}</li>
                       ))}
                    </ul>
                  </div>
                  <div className="flex flex-col items-center justify-center bg-black/20 rounded-2xl p-6">
                     <span className="text-gray-400 text-sm line-through mb-1">{Math.round(offer.priceRecommendation * 1.5)} €</span>
                     <span className="text-4xl font-black text-white mb-4">{offer.priceRecommendation} €</span>
                     <button className="w-full py-3 bg-green-500 hover:bg-green-600 rounded-lg font-bold transition-colors">
                       Angebot Annehmen
                     </button>
                  </div>
               </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
