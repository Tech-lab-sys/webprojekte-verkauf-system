import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { generateOfferHandler } from './api/generate-offer';
import { createCheckoutHandler } from './api/create-checkout';
import { webhookHandler } from './api/webhook';
import { testEmailConfiguration } from './_core/emailService';
import { cleanupOldBundles } from './_core/bundleGenerator';

// Lade Umgebungsvariablen
dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3000;

// CORS Konfiguration
app.use(cors({
  origin: process.env.APP_URL || 'http://localhost:5173',
  credentials: true,
}));

// Body Parser - WICHTIG: Für Webhook muss raw body beibehalten werden
app.use('/api/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check Endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API Routes
app.post('/api/generate-offer', generateOfferHandler);
app.post('/api/create-checkout', createCheckoutHandler);
app.post('/api/webhook', webhookHandler);

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Route nicht gefunden',
    path: req.path,
  });
});

// Error Handler
app.use((err: Error, req: Request, res: Response, next: any) => {
  console.error('Server Error:', err);
  res.status(500).json({
    success: false,
    error: 'Interner Server Fehler',
    message: err.message,
  });
});

// Server starten
async function startServer() {
  try {
    // Teste Email Konfiguration beim Start
    console.log('⏳ Teste Email Konfiguration...');
    const emailWorking = await testEmailConfiguration();
    if (emailWorking) {
      console.log('✅ Email Service bereit');
    } else {
      console.warn('⚠️ Email Service nicht konfiguriert');
    }

    // Starte Cleanup Task für alte Bundles (einmal täglich)
    setInterval(async () => {
      console.log('🧹 Cleanup alte Bundle Dateien...');
      await cleanupOldBundles();
    }, 24 * 60 * 60 * 1000); // 24 Stunden

    // Server starten
    app.listen(PORT, () => {
      console.log(`\n🚀 Server läuft auf Port ${PORT}`);
      console.log(`🌐 API: http://localhost:${PORT}`);
      console.log(`💚 Health Check: http://localhost:${PORT}/health`);
      console.log('\n💻 Verfügbare Endpoints:');
      console.log('   POST /api/generate-offer');
      console.log('   POST /api/create-checkout');
      console.log('   POST /api/webhook\n');
    });
  } catch (error) {
    console.error('❌ Server Start fehlgeschlagen:', error);
    process.exit(1);
  }
}

// Graceful Shutdown
process.on('SIGTERM', () => {
  console.log('\n🛑 SIGTERM empfangen, fahre Server herunter...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n🛑 SIGINT empfangen, fahre Server herunter...');
  process.exit(0);
});

// Starte Server
startServer();

export default app;
