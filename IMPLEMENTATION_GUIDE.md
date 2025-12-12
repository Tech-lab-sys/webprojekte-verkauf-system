# 🚀 Implementation Guide - Webprojekte-Verkauf-System

## 📋 Übersicht

Dein One-Click Website-Verkaufssystem ist jetzt **100% produktionsreif**! Dieses Dokument führt dich durch die Implementation in 3 einfachen Phasen.

---

## ✅ Phase 1: Setup (Tag 1-2)

### 1.1 Repository Klonen

```bash
git clone https://github.com/Tech-lab-sys/webprojekte-verkauf-system.git
cd webprojekte-verkauf-system
```

### 1.2 Dependencies Installieren

```bash
pnpm install
```

**Wichtige Dependencies:**
- `@trpc/server` - API
- `@prisma/client` - Datenbank
- `stripe` - Zahlungen
- `nodemailer` - Emails
- `adm-zip` - Bundle-Erstellung
- `axios` - Perplexity API
- `openai` - Fallback
- `@aws-sdk/client-s3` - S3 Storage (optional)

### 1.3 Environment Variables

Erstelle `.env.local`:

```bash
# Datenbank
DATABASE_URL="postgresql://user:password@localhost:5432/webprojekte"

# Stripe (Zahlungen)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Perplexity AI (Primary)
PERPLEXITY_API_KEY="pplx_..."

# OpenAI (Fallback)
OPENAI_API_KEY="sk-..."

# Email (SMTP)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="dein-email@gmail.com"
SMTP_PASS="dein-app-passwort"

# Storage (Optional: S3)
USE_S3_STORAGE="false"
S3_BUCKET_NAME="webprojekte-bundles"
S3_REGION="eu-central-1"
AWS_ACCESS_KEY_ID="AKIA..."
AWS_SECRET_ACCESS_KEY="..."

# Application
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 1.4 Datenbank Setup

```bash
# Prisma Schema Push
pnpm db:push

# Seed Daten (Optional)
pnpm db:seed
```

### 1.5 Test-Server Starten

```bash
pnpm dev
```

Öffne: `http://localhost:3000`

---

## 🧪 Phase 2: Testing (Tag 3-4)

### 2.1 API Keys Testen

**Perplexity API Test:**

```bash
curl -X POST https://api.perplexity.ai/chat/completions \
  -H "Authorization: Bearer $PERPLEXITY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model": "llama-3.1-sonar-small-128k-online", "messages": [{"role": "user", "content": "Test"}]}'
```

**Stripe Test:**

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

### 2.2 Funktionale Tests

```bash
# Unit Tests
pnpm test

# E2E Tests (optional)
pnpm test:e2e
```

### 2.3 Manuelle Tests

- [ ] Angebot mit Perplexity generieren
- [ ] Bundle erstellen
- [ ] Stripe Checkout
- [ ] Email-Versand
- [ ] Bundle-Download

---

## 🚀 Phase 3: Production Deploy (Tag 5-7)

### 3.1 Build Erstellen

```bash
pnpm build
```

### 3.2 Deploy auf Vercel

```bash
# Vercel CLI installieren
npm i -g vercel

# Deploy
vercel --prod
```

**Vercel Environment Variables:**

Füge alle Variablen aus `.env.local` in Vercel Dashboard:

1. Gehe zu `Settings > Environment Variables`
2. Füge jede Variable hinzu
3. Redeploy

### 3.3 Domain Konfigurieren

1. **Vercel:** Settings > Domains
2. Füge deine Domain hinzu (z.B. `webprojekte-verkauf.de`)
3. DNS konfigurieren

### 3.4 Stripe Webhook Setup

1. Gehe zu Stripe Dashboard > Webhooks
2. Füge Endpoint hinzu: `https://deine-domain.de/api/webhooks/stripe`
3. Events auswählen:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
4. Webhook Secret kopieren → `.env.local`

### 3.5 Monitoring Setup

**Empfohlene Tools:**

- **Vercel Analytics** (kostenlos)
- **Sentry** (Error Tracking)
- **LogRocket** (Session Replay)

---

## 📊 Kostenübersicht

| Service | Monatlich | Jährlich |
|---------|-----------|----------|
| Perplexity API | $5 | $60 |
| Vercel (Hobby) | $0 | $0 |
| PostgreSQL (Railway) | $5 | $60 |
| Domain | $1 | $12 |
| Email (SMTP) | $0 | $0 |
| **TOTAL** | **$11** | **$132** |

**Bei 30 Sales/Monat: ROI nach < 1 Woche! 🎉**

---

## 🎯 Go-Live Checklist

### Pre-Launch

- [ ] Alle Tests bestanden
- [ ] Stripe Live-Mode aktiviert
- [ ] Email-Templates getestet
- [ ] Bundle-Erstellung getestet
- [ ] Domain konfiguriert
- [ ] SSL-Zertifikat aktiv

### Launch

- [ ] Vercel Production Deploy
- [ ] Stripe Webhooks aktiv
- [ ] Monitoring läuft
- [ ] First Sale Test (mit Test-Card)

### Post-Launch

- [ ] eBay Listings erstellen
- [ ] Fiverr Gigs erstellen
- [ ] Social Media Posts
- [ ] First Real Sale! 💰

---

## 🛠️ Troubleshooting

### Problem: Perplexity API Fehler

**Lösung:**

1. API Key prüfen: `echo $PERPLEXITY_API_KEY`
2. Fallback auf OpenAI aktiviert?
3. Logs prüfen: `pnpm logs`

### Problem: Bundle Generierung schlägt fehl

**Lösung:**

1. Template-Ordner vorhanden? `ls templates/`
2. Schreibrechte: `chmod -R 755 bundles/`
3. Disk Space: `df -h`

### Problem: Stripe Webhook nicht empfangen

**Lösung:**

1. Webhook Secret korrekt?
2. HTTPS aktiv? (Stripe braucht HTTPS)
3. Stripe CLI testen: `stripe listen`

---

## 📈 Scaling Tipps

### Bei 100+ Sales/Monat

- **Caching:** Redis für Angebote
- **Queue:** BullMQ für Bundle-Erstellung
- **CDN:** Cloudflare für Bundles
- **Database:** Upgrade zu PostgreSQL Pro

### Bei 500+ Sales/Monat

- **Microservices:** Bundle-Service separieren
- **S3 Storage:** AWS S3 statt lokal
- **Load Balancer:** Mehrere Vercel Instanzen

---

## 🎓 Nächste Schritte

### Woche 1: Launch

- Deploy auf Production
- Ersten Sales generieren
- Feedback sammeln

### Woche 2-4: Optimierung

- A/B Testing für Preise
- SEO Optimierung
- Marketing Automation

### Monat 2+: Expansion

- Neue Website-Typen
- Reseller-Programm
- White-Label Option

---

## 📞 Support

**Bei Problemen:**

- 📧 Email: support@yoursite.com
- 💬 GitHub Issues: [Issues öffnen](https://github.com/Tech-lab-sys/webprojekte-verkauf-system/issues)
- 📚 Docs: [Wiki](https://github.com/Tech-lab-sys/webprojekte-verkauf-system/wiki)

---

## 🎉 Glückwunsch!

Du bist jetzt bereit, dein Website-Verkaufssystem zu launchen! 🚀

**Let's make money! 💰**
