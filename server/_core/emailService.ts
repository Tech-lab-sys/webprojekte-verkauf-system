import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { Website } from '@prisma/client';

// Email Konfiguration aus Umgebungsvariablen
const transporter: Transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    path: string;
  }>;
}

/**
 * Generische Email Versand Funktion
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@webprojekte-verkauf.de',
      to: options.to,
      subject: options.subject,
      html: options.html,
      attachments: options.attachments,
    });
    console.log(`Email gesendet an ${options.to}`);
  } catch (error) {
    console.error('Fehler beim Email Versand:', error);
    throw new Error(`Email konnte nicht versendet werden: ${error.message}`);
  }
}

/**
 * Sendet Bestätigungsmail nach erfolgreichem Kauf
 */
export async function sendPurchaseConfirmation(
  email: string,
  website: Website,
  bundlePath: string
): Promise<void> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .details { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Kauf bestätigt!</h1>
          <p>Ihre Website ist bereit zum Download</p>
        </div>
        <div class="content">
          <h2>Vielen Dank für Ihren Kauf!</h2>
          <p>Ihre ${website.type} Website für die Nische "${website.niche}" wurde erfolgreich erstellt und ist bereit zur Installation.</p>
          
          <div class="details">
            <h3>📦 Website Details</h3>
            <ul>
              <li><strong>Typ:</strong> ${website.type}</li>
              <li><strong>Nische:</strong> ${website.niche}</li>
              <li><strong>Preis:</strong> €${website.price}</li>
              <li><strong>Bundle ID:</strong> ${website.id}</li>
            </ul>
          </div>

          <div class="details">
            <h3>🚀 Nächste Schritte</h3>
            <ol>
              <li>Laden Sie das ZIP Bundle herunter</li>
              <li>Entpacken Sie die Dateien auf Ihren Webserver</li>
              <li>Folgen Sie der INSTALLATION.md Anleitung</li>
              <li>Konfigurieren Sie Ihre Affiliate Links</li>
            </ol>
          </div>

          <center>
            <a href="${process.env.APP_URL}/download/${website.id}" class="button">
              💾 Bundle herunterladen
            </a>
          </center>

          <div class="details">
            <h3>📚 Wichtige Hinweise</h3>
            <ul>
              <li>Der Download Link ist 7 Tage gültig</li>
              <li>Sichern Sie das Bundle lokal</li>
              <li>Ändern Sie alle Standard-Passwörter nach der Installation</li>
              <li>Aktivieren Sie SSL für Ihre Domain</li>
            </ul>
          </div>

          <p>Bei Fragen oder Problemen stehen wir Ihnen gerne zur Verfügung.</p>
        </div>
        <div class="footer">
          <p>Webprojekte Verkaufssystem &copy; 2025</p>
          <p>Diese Email wurde automatisch generiert</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: `✅ Ihre ${website.type} Website ist bereit!`,
    html,
    attachments: bundlePath ? [{
      filename: `${website.type}-${website.niche}.zip`,
      path: bundlePath,
    }] : undefined,
  });
}

/**
 * Sendet Benachrichtigung an Admin bei neuem Verkauf
 */
export async function sendAdminNotification(website: Website, customerEmail: string): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    console.warn('ADMIN_EMAIL nicht konfiguriert, überspringe Admin Benachrichtigung');
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: monospace; padding: 20px; }
        .sale { background: #e8f5e9; padding: 20px; border-left: 4px solid #4caf50; }
      </style>
    </head>
    <body>
      <div class="sale">
        <h2>💰 Neuer Verkauf!</h2>
        <p><strong>Website Typ:</strong> ${website.type}</p>
        <p><strong>Nische:</strong> ${website.niche}</p>
        <p><strong>Preis:</strong> €${website.price}</p>
        <p><strong>Kunde:</strong> ${customerEmail}</p>
        <p><strong>Zeitpunkt:</strong> ${new Date().toLocaleString('de-DE')}</p>
        <p><strong>Website ID:</strong> ${website.id}</p>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: adminEmail,
    subject: `💰 Neuer Verkauf: ${website.type} - ${website.niche}`,
    html,
  });
}

/**
 * Sendet Fehlerbenachrichtigung an Admin
 */
export async function sendErrorNotification(error: Error, context: string): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: monospace; padding: 20px; }
        .error { background: #ffebee; padding: 20px; border-left: 4px solid #f44336; }
        pre { background: #f5f5f5; padding: 10px; overflow-x: auto; }
      </style>
    </head>
    <body>
      <div class="error">
        <h2>⚠️ System Fehler</h2>
        <p><strong>Kontext:</strong> ${context}</p>
        <p><strong>Zeitpunkt:</strong> ${new Date().toLocaleString('de-DE')}</p>
        <p><strong>Fehlermeldung:</strong></p>
        <pre>${error.message}</pre>
        <p><strong>Stack Trace:</strong></p>
        <pre>${error.stack}</pre>
      </div>
    </body>
    </html>
  `;

  try {
    await sendEmail({
      to: adminEmail,
      subject: `⚠️ System Fehler: ${context}`,
      html,
    });
  } catch (emailError) {
    console.error('Konnte Fehler-Email nicht senden:', emailError);
  }
}

/**
 * Sendet Erinnerungsmail für abgebrochene Käufe
 */
export async function sendAbandonedCartEmail(email: string, website: Website): Promise<void> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #667eea; color: white; padding: 30px; text-align: center; }
        .content { padding: 30px; }
        .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔔 Sie haben etwas vergessen!</h1>
        </div>
        <div class="content">
          <p>Sie waren kurz davor, Ihre ${website.type} Website zu kaufen.</p>
          <p>Die Nische "${website.niche}" wartet noch auf Sie!</p>
          <p><strong>Sonderangebot:</strong> Nutzen Sie den Code <code>COMEBACK10</code> für 10% Rabatt!</p>
          <center>
            <a href="${process.env.APP_URL}/offer/${website.id}" class="button">
              Jetzt abschließen
            </a>
          </center>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: `🔔 Ihre ${website.type} Website wartet noch - 10% Rabatt!`,
    html,
  });
}

/**
 * Testet die Email Konfiguration
 */
export async function testEmailConfiguration(): Promise<boolean> {
  try {
    await transporter.verify();
    console.log('Email Konfiguration erfolgreich getestet');
    return true;
  } catch (error) {
    console.error('Email Konfiguration fehlerhaft:', error);
    return false;
  }
}
