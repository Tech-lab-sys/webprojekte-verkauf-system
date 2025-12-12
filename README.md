# 🚀 Webprojekte-Verkauf-System

**Ein-Klick Website-Verkaufssystem** mit KI-Angebotsgenerierung (Perplexity AI) und automatischer Bundle-Erstellung.

Verkaufe Affiliate, KI-Blog und Business Websites auf Knopfdruck - vollautomatisch!

---

## ⚡ One-Click Installation (NEU!)

### Automatische Installation auf VPS (Debian/Ubuntu)

```bash
# Download & Ausführen des Smart Installers
curl -fsSL https://raw.githubusercontent.com/Tech-lab-sys/webprojekte-verkauf-system/main/install.sh | bash
```

**Das Installationsskript installiert automatisch:**
- ✅ Node.js 20 LTS & pnpm
- ✅ PostgreSQL Datenbank
- ✅ Nginx Reverse Proxy
- ✅ PM2 Process Manager
- ✅ UFW Firewall
- ✅ Let's Encrypt SSL (optional)
- ✅ Application Dependencies
- ✅ Automatische Konfiguration

**Installation dauert: ~10-15 Minuten**

---

## 🔧 Manuelle Installation (5 Minuten)

### 1. Repository klonen
```bash
git clone https://github.com/Tech-lab-sys/webprojekte-verkauf-system.git
cd webprojekte-verkauf-system
```

### 2. Dependencies installieren
```bash
pnpm install
```

### 3. Environment-Variablen konfigurieren
```bash
cp .env.example .env.local
```

**Fülle aus:**
```bash
PERPLEXITY_API_KEY=pplx_dein_key_hier
STRIPE_SECRET_KEY=sk_test_...
DATABASE_URL=postgresql://...
SMTP_HOST=smtp.gmail.com
SMTP_USER=deine@email.de
```

### 4. Datenbank Setup
```bash
pnpm db:push
pnpm db:seed
```

### 5. Development Server starten
```bash
pnpm dev
```

**Fertig!** → Öffne http://localhost:3000 🎉

---

## 🔑 Benötigte API Keys

### 1. Perplexity AI (5€/Monat)
1. Gehe zu: [perplexity.ai/api](https://www.perplexity.ai/api)
2. Klick "Get API Access"
3. Kopiere API Key → `.env.local`

### 2. Stripe (kostenlos für Test-Mode)
1. Gehe zu: [dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys)
2. Kopiere "Secret Key" → `.env.local`

### 3. PostgreSQL Database
- **Lokal:** `postgresql://user:password@localhost:5432/webprojekte`
- **Cloud:** Nutze Supabase, Railway oder Vercel Postgres (kostenlos)

### 4. SMTP für Emails
- **Gmail:** App-Passwort erstellen
- **Sendinblue:** Kostenlos 300 Emails/Tag
- **Resend:** Moderne Alternative

---

## 📦 Projekt-Struktur

```
webprojekte-verkauf-system/
├── client/                 # React Frontend
│   └── src/
│       ├── components/    # UI Components
│       └── lib/           # Utilities
├── server/                # Backend
│   ├── _core/            # Core Services
│   │   ├── bundleGenerator.ts    # ZIP Erstellung
│   │   ├── storage.ts            # S3/Local Storage
│   │   ├── llm-fallback.ts       # Perplexity + OpenAI
│   │   ├── perplexity.ts         # Perplexity Integration
│   │   ├── emailService.ts       # Email Versand
│   │   └── paymentService.ts     # Stripe Payments
│   └── api/              # tRPC Routes
├── prisma/               # Database Schema
├── install.sh            # 🆕 Smart Installer Script
├── IMPLEMENTATION_GUIDE.md
├── VPS_DEPLOYMENT_GUIDE.md
└── README.md
```

---

## 💰 Verdienst-Potenzial

| Paket | Preis | Marge | Potenzial/Monat |
|-------|-------|-------|------------------|
| Affiliate Website | 99€ | 40€ | 1.200€ (30 Sales) |
| KI-Blog Website | 149€ | 60€ | 1.800€ (30 Sales) |
| Business Website | 119€ | 50€ | 1.500€ (30 Sales) |
| **GESAMT** | - | - | **4.500€+** |

**API-Kosten:** Nur 5€/Monat mit Perplexity (statt 95€ mit OpenAI)! ✅

---

## 🔧 Tech Stack

### Frontend
- **React 18** + TypeScript
- **Vite** + Tailwind CSS
- **tRPC** Client

### Backend
- **Node.js** + tRPC + Express
- **Prisma** ORM
- **PostgreSQL** Database

### AI & Payments
- **Perplexity API** (Sonar models)
- **OpenAI** (Fallback)
- **Stripe** (Payments)

### Storage
- **S3-kompatibel** (Bundles)
- **Lokaler Storage** (Fallback)

---

## 📚 Dokumentation

- 📖 [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md) - Kompletter Setup-Guide
- 🖥️ [VPS_DEPLOYMENT_GUIDE.md](./VPS_DEPLOYMENT_GUIDE.md) - VPS Deployment auf Unesty/Hetzner
- ⚙️ [install.sh](./install.sh) - Automatisches Installationsskript

---

## 🚀 Deployment Optionen

### Option 1: VPS mit Installationsskript (Empfohlen)
```bash
curl -fsSL https://raw.githubusercontent.com/Tech-lab-sys/webprojekte-verkauf-system/main/install.sh | bash
```

### Option 2: Vercel (Schnellste Option)
```bash
vercel --prod
```

### Option 3: Docker
```bash
docker-compose up -d
```

---

## 🛠️ Development Commands

```bash
# Dev Server
pnpm dev

# Build
pnpm build

# Start Production
pnpm start

# Database
pnpm db:push      # Schema pushen
pnpm db:seed      # Seed Daten
pnpm db:studio    # Prisma Studio

# Tests
pnpm test
pnpm test:e2e
```

---

## 📊 Features

✅ **KI-Angebotsgenerierung** - Automatisch mit Perplexity AI  
✅ **Bundle-Erstellung** - WordPress ZIP mit allen Dateien  
✅ **Stripe Integration** - Sichere Zahlungsabwicklung  
✅ **Email-Versand** - Automatische Kaufbestätigungen  
✅ **S3 Storage** - Oder lokaler Storage als Fallback  
✅ **Admin Dashboard** - Verkaufsübersicht & Analytics  
✅ **Automatische Preisoptimierung** - KI-basiert  
✅ **3 Paket-Typen** - Affiliate, KI-Blog, Business  

---

## 🔐 Security

- ✅ Environment Variables für Secrets
- ✅ Stripe PCI-DSS konform
- ✅ DSGVO-konforme Datenverarbeitung
- ✅ SQL Injection Protection (Prisma ORM)
- ✅ HTTPS/SSL mit Let's Encrypt
- ✅ UFW Firewall

---

## 📞 Support

**Bei Problemen:**

- 📧 Email: support@yoursite.com
- 💬 [GitHub Issues](https://github.com/Tech-lab-sys/webprojekte-verkauf-system/issues)
- 📚 [Discussions](https://github.com/Tech-lab-sys/webprojekte-verkauf-system/discussions)

---

## 📝 Lizenz

MIT License – siehe [LICENSE](./LICENSE)

---

## 🚢 Roadmap

- [ ] Multi-Language Support (EN, ES, FR)
- [ ] WhatsApp Integration für Customer Support
- [ ] A/B Testing für Preisoptimierung
- [ ] Affiliate-Programm für Reseller
- [ ] White-Label Option

---

## 🎉 Glückwunsch!

Du bist jetzt bereit, dein Website-Verkaufssystem zu launchen! 🚀

**Let's make money! 💰**
