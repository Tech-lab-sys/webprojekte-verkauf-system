# 🚀 Webprojekte-Verkauf-System

**Ein-Klick Website-Verkaufssystem** mit KI-Angebotsgenerierung (Perplexity AI) und automatischer Bundle-Erstellung.

Verkaufe Affiliate, KI-Blog und Business Websites auf Knopfdruck - vollautomatisch!

---

## ⚡ Quick Install (5 Minuten)

```bash
# 1. Repository klonen
git clone https://github.com/Tech-lab-sys/webprojekte-verkauf-system.git
cd webprojekte-verkauf-system

# 2. Dependencies installieren
pnpm install

# 3. Environment-Variablen konfigurieren
cp .env.example .env.local

# Fülle aus:
# PERPLEXITY_API_KEY=pplx_dein_key_hier
# STRIPE_SECRET_KEY=sk_test_...
# DATABASE_URL=postgresql://...
# SMTP_HOST=smtp.gmail.com
# SMTP_USER=deine@email.de
# SMTP_PASS=dein_app_passwort

# 4. Datenbank Setup
pnpm db:push
pnpm db:seed

# 5. Development Server starten
pnpm dev
```

**Fertig!** → Öffne `http://localhost:3000` 🎉

---

## 📦 Features

✅ **3 Website-Pakete:** Affiliate, KI-Blog, Business  
✅ **KI-Angebotsgenerierung:** Perplexity API (nur 5€/Monat!)  
✅ **Automatische Bundle-Erstellung:** ZIP mit WordPress, Plugins, Guides  
✅ **Stripe-Zahlungen:** Sichere Payment-Integration  
✅ **Email-Versand:** Automatische Kaufbestätigung + Download-Link  
✅ **Admin-Dashboard:** Verkaufsstatistiken & Analytics  
✅ **Preisoptimierung:** Automatische Rabatt-Berechnung (40-80%)  
✅ **DSGVO-konform:** Rechtssichere Templates  

---

## 💰 Verdienst-Potenzial

| Paket | Preis | Marge | Potenzial/Monat |
|-------|-------|-------|----------------|
| Affiliate Website | 99€ | 40€ | 1.200€ (30 Sales) |
| KI-Blog Website | 149€ | 60€ | 1.800€ (30 Sales) |
| Business Website | 119€ | 50€ | 1.500€ (30 Sales) |
| **GESAMT** | - | - | **4.500€+** |

**API-Kosten:** Nur 5€/Monat mit Perplexity (statt 95€ mit OpenAI) ✅

---

## 🛠️ Tech Stack

- **Frontend:** React + TypeScript + Tailwind CSS
- **Backend:** Node.js + tRPC + Express
- **Database:** PostgreSQL + Prisma ORM
- **AI:** Perplexity API (Sonar models)
- **Payments:** Stripe
- **Email:** Nodemailer + SMTP
- **Storage:** S3-kompatibel (Bundles)

---

## 📂 Projektstruktur

```
webprojekte-verkauf-system/
├── client/               # React Frontend
│   ├── src/
│   │   ├── components/   # React Components
│   │   ├── lib/          # Utils & Hooks
│   │   └── App.tsx       # Main App
├── server/               # Node.js Backend
│   ├── _core/            # Core Services
│   │   ├── db.ts         # Database Queries
│   │   ├── perplexity.ts # Perplexity AI Client
│   │   ├── bundleGenerator.ts
│   │   ├── emailService.ts
│   │   └── paymentService.ts
│   ├── routers/          # tRPC Routers
│   └── index.ts          # Server Entry
├── prisma/
│   └── schema.prisma     # Database Schema
├── docs/                 # Dokumentation
│   ├── SALES_OFFER_EBAY.md
│   ├── SALES_OFFER_FIVERR.md
│   ├── TECHNICAL_DOCUMENTATION.md
│   └── LEGAL_PAGES_GUIDE.md
├── .env.example          # Environment Template
├── package.json
└── README.md
```

---

## 🔑 Benötigte API Keys

### 1. Perplexity AI (5€/Monat)
1. Gehe zu: https://www.perplexity.ai/api
2. Klick "Get API Access"
3. Kopiere API Key → `.env.local`

### 2. Stripe (kostenlos für Test-Mode)
1. Gehe zu: https://dashboard.stripe.com/apikeys
2. Kopiere "Secret Key" → `.env.local`

### 3. PostgreSQL Database
- **Lokal:** `postgresql://user:password@localhost:5432/webprojekte`
- **Cloud:** Nutze Supabase, Railway oder Vercel Postgres (kostenlos)

### 4. SMTP für Emails
- **Gmail:** App-Passwort erstellen
- **Alternative:** SendGrid, Mailgun, Postmark

---

## 🚀 Deployment

### Vercel (empfohlen)
```bash
# 1. Vercel CLI installieren
pnpm i -g vercel

# 2. Deploy
vercel

# 3. Environment-Variablen setzen
vercel env add PERPLEXITY_API_KEY
vercel env add STRIPE_SECRET_KEY
vercel env add DATABASE_URL
```

### Railway
```bash
# 1. Railway CLI installieren
npm i -g @railway/cli

# 2. Deploy
railway up
```

---

## 📊 Dashboard Features

- **Verkaufsstatistiken:** Umsatz, Anzahl, Conversion-Rate
- **Paket-Performance:** Top-Seller, Preisoptimierung
- **Kosten-Tracking:** API-Usage, Gewinnmarge
- **Kundenübersicht:** Downloads, Support-Anfragen

---

## 🧪 Tests

```bash
# Unit-Tests
pnpm test

# E2E-Tests
pnpm test:e2e

# Coverage
pnpm test:coverage
```

---

## 📚 Dokumentation

- **[Quick Install Guide](docs/QUICK_INSTALL.md)** - Setup in 5 Minuten
- **[Technical Documentation](docs/TECHNICAL_DOCUMENTATION.md)** - Architektur & APIs
- **[Sales Offers eBay](docs/SALES_OFFER_EBAY.md)** - eBay-Listings
- **[Sales Offers Fiverr](docs/SALES_OFFER_FIVERR.md)** - Fiverr-Gigs
- **[Legal Pages](docs/LEGAL_PAGES_GUIDE.md)** - DSGVO, Impressum, etc.

---

## 🐛 Troubleshooting

### Database Connection Error
```bash
# Prüfe DATABASE_URL in .env.local
# Test mit:
pnpm db:studio
```

### Perplexity API Error
```bash
# Prüfe API Key:
curl https://api.perplexity.ai/chat/completions \
  -H "Authorization: Bearer $PERPLEXITY_API_KEY"
```

### Build Error
```bash
# Cache löschen
rm -rf .next node_modules
pnpm install
pnpm build
```

---

## 📞 Support

- **Issues:** https://github.com/Tech-lab-sys/webprojekte-verkauf-system/issues
- **Discussions:** https://github.com/Tech-lab-sys/webprojekte-verkauf-system/discussions

---

## 📝 Lizenz

MIT License - siehe [LICENSE](LICENSE)

---

## 🎯 Roadmap

- [ ] Multi-Language Support (EN, ES, FR)
- [ ] WhatsApp Integration für Customer Support
- [ ] A/B Testing für Preisoptimierung
- [ ] Affiliate-Program für Reseller
- [ ] Mobile App (React Native)

---

**Made with ❤️ in Germany** 🇩🇪

**Status: ✅ Production-Ready**
