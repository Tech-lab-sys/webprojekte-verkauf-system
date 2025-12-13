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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -inset-[10px] opacity-50">
          <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
          <div className="absolute top-0 -right-4 w-72 h-72 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="backdrop-blur-md bg-white/5 border-b border-white/10">
          <div className="container mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                🚀 WebProjekte Verkauf System
              </h1>
              <div className="flex gap-4">
                <button className="px-6 py-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold transition-all duration-300 shadow-lg shadow-cyan-500/50 hover:shadow-cyan-500/75">
                  Login
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="container mx-auto px-6 py-20">
          <div className="text-center mb-16">
            <h2 className="text-6xl font-extrabold mb-6 bg-gradient-to-r from-cyan-300 via-purple-300 to-pink-300 bg-clip-text text-transparent leading-tight">
              Ein-Klick Website-Verkaufssystem
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Mit KI-Angebotsgenerierung und automatischer Bundle-Erstellung. Verkaufe Affiliate, KI-Blog und Business Websites auf Knopfdruck.
            </p>
          </div>

          {/* Generator Card */}
          <div className="max-w-4xl mx-auto">
            <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-8 border border-white/20 shadow-2xl">
              <h3 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-cyan-300 to-purple-300 bg-clip-text text-transparent">
                ✨ Angebot Generieren
              </h3>

              {/* Website Type Selector */}
              <div className="mb-8">
                <label className="block text-sm font-semibold text-gray-300 mb-4">Website-Typ</label>
                <div className="grid grid-cols-3 gap-4">
                  {(['AFFILIATE', 'AI_BLOG', 'BUSINESS'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setWebsiteType(type)}
                      className={`py-4 px-6 rounded-2xl font-semibold transition-all duration-300 ${
                        websiteType === type
                          ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-lg shadow-purple-500/50 scale-105'
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
              <div className="mb-8">
                <label className="block text-sm font-semibold text-gray-300 mb-4">Nische</label>
                <input
                  type="text"
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  placeholder="z.B. Fitness, Reisen, Technologie..."
                  className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                />
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerateOffer}
                disabled={loading}
                className="w-full py-5 rounded-2xl bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 hover:from-cyan-600 hover:via-purple-600 hover:to-pink-600 text-white font-bold text-lg transition-all duration-300 shadow-2xl shadow-purple-500/50 hover:shadow-purple-500/75 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-3">
                    <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generiere...
                  </span>
                ) : (
                  '🚀 Angebot Generieren'
                )}
              </button>
            </div>

            {/* Results Section */}
            {offer && (
              <div className="mt-8 backdrop-blur-xl bg-white/10 rounded-3xl p-8 border border-white/20 shadow-2xl animate-fadeIn">
                <h4 className="text-2xl font-bold mb-6 bg-gradient-to-r from-green-300 to-cyan-300 bg-clip-text text-transparent">
                  ✅ Dein Angebot ist fertig!
                </h4>
                <div className="space-y-4 text-gray-300">
                  <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                    <p className="text-sm text-gray-400 mb-1">Website-Typ</p>
                    <p className="font-semibold text-lg">{offer.websiteType}</p>
                  </div>
                  <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                    <p className="text-sm text-gray-400 mb-1">Nische</p>
                    <p className="font-semibold text-lg">{offer.niche}</p>
                  </div>
                  <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                    <p className="text-sm text-gray-400 mb-1">Beschreibung</p>
                    <p className="font-semibold">{offer.description}</p>
                  </div>
                  <div className="p-4 bg-gradient-to-r from-green-500/20 to-cyan-500/20 rounded-xl border border-green-500/30">
                    <p className="text-sm text-gray-400 mb-1">Preis</p>
                    <p className="text-3xl font-bold text-green-300">{offer.price} €</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Features Section */}
        <section className="container mx-auto px-6 py-20">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: '⚡', title: 'Blitzschnell', desc: 'Generiere Angebote in Sekunden' },
              { icon: '🎨', title: 'Modern Design', desc: 'Futuristisches UI mit Dark Mode' },
              { icon: '🔒', title: 'Sicher', desc: 'Alle Daten verschlüsselt' },
            ].map((feature, i) => (
              <div
                key={i}
                className="backdrop-blur-xl bg-white/5 rounded-2xl p-8 border border-white/10 hover:border-purple-500/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/25"
              >
                <div className="text-5xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold mb-3 text-white">{feature.title}</h3>
                <p className="text-gray-400">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="backdrop-blur-md bg-white/5 border-t border-white/10 mt-20">
          <div className="container mx-auto px-6 py-8 text-center text-gray-400">
            <p>© 2025 WebProjekte Verkauf System. Made with 💜 by Tech-lab-sys</p>
          </div>
        </footer>
      </div>

      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}

export default App;
