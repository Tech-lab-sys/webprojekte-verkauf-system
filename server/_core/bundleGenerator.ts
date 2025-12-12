import AdmZip from 'adm-zip';
import fs from 'fs-extra';
import path from 'path';
import { Website, WebsiteType } from '@prisma/client';
import { prisma } from './db';

// Template Dateien für WordPress Bundles
const TEMPLATE_DIR = path.join(process.cwd(), 'templates');
const OUTPUT_DIR = path.join(process.cwd(), 'bundles');

interface BundleConfig {
  websiteId: string;
  type: WebsiteType;
  niche: string;
  plugins?: string[];
  theme?: string;
}

/**
 * Generiert ein WordPress Bundle als ZIP mit allen notwendigen Dateien
 * Inkl. Affiliate XML Inhalte und Plugins
 */
export async function generateWordPressBundle(config: BundleConfig): Promise<string> {
  const { websiteId, type, niche, plugins = [], theme = 'default' } = config;
  
  // Erstelle Output Verzeichnis falls nicht vorhanden
  await fs.ensureDir(OUTPUT_DIR);
  
  const zip = new AdmZip();
  const bundleName = `wordpress-${type.toLowerCase()}-${Date.now()}.zip`;
  const bundlePath = path.join(OUTPUT_DIR, bundleName);

  try {
    // 1. WordPress Core Dateien hinzufügen (aus Template)
    const wpCorePath = path.join(TEMPLATE_DIR, 'wordpress-core');
    if (await fs.pathExists(wpCorePath)) {
      zip.addLocalFolder(wpCorePath, 'wordpress');
    }

    // 2. Theme hinzufügen
    const themePath = path.join(TEMPLATE_DIR, 'themes', theme);
    if (await fs.pathExists(themePath)) {
      zip.addLocalFolder(themePath, 'wordpress/wp-content/themes/' + theme);
    }

    // 3. Plugins hinzufügen
    for (const plugin of plugins) {
      const pluginPath = path.join(TEMPLATE_DIR, 'plugins', plugin);
      if (await fs.pathExists(pluginPath)) {
        zip.addLocalFolder(pluginPath, 'wordpress/wp-content/plugins/' + plugin);
      }
    }

    // 4. Affiliate XML Inhalte generieren basierend auf Typ
    const xmlContent = await generateAffiliateXML(type, niche, websiteId);
    zip.addFile('wordpress/wp-content/uploads/affiliate-products.xml', Buffer.from(xmlContent, 'utf-8'));

    // 5. wp-config.php mit Platzhaltern erstellen
    const wpConfigContent = generateWPConfig();
    zip.addFile('wordpress/wp-config.php', Buffer.from(wpConfigContent, 'utf-8'));

    // 6. Installation Anleitung hinzufügen
    const installGuide = generateInstallGuide(type, niche);
    zip.addFile('INSTALLATION.md', Buffer.from(installGuide, 'utf-8'));

    // 7. SQL Import Datei mit vordefinierten Einstellungen
    const sqlContent = await generateSQLImport(type, niche);
    zip.addFile('wordpress/import.sql', Buffer.from(sqlContent, 'utf-8'));

    // ZIP speichern
    zip.writeZip(bundlePath);

    // Bundle Info in Datenbank speichern
    await prisma.website.update({
      where: { id: websiteId },
      data: {
        bundlePath: bundlePath,
        bundleGenerated: true,
        bundleGeneratedAt: new Date(),
      },
    });

    return bundlePath;
  } catch (error) {
    console.error('Fehler beim Bundle erstellen:', error);
    throw new Error(`Bundle Generierung fehlgeschlagen: ${error.message}`);
  }
}

/**
 * Generiert Affiliate XML mit Produkten basierend auf Nische
 */
async function generateAffiliateXML(type: WebsiteType, niche: string, websiteId: string): Promise<string> {
  // Hole Website Daten aus DB für Affiliate Links
  const website = await prisma.website.findUnique({
    where: { id: websiteId },
  });

  const products = [
    // Beispiel Produkte - In Produktion würden diese aus einer API/DB kommen
    {
      id: 1,
      title: `Premium ${niche} Produkt 1`,
      description: `Hochwertiges Produkt für ${niche} Bereich`,
      price: '49.99',
      affiliateLink: website?.affiliateLinks?.[0] || 'https://example.com/aff',
      image: 'https://via.placeholder.com/400x300',
    },
    {
      id: 2,
      title: `Top ${niche} Lösung`,
      description: `Beste Wahl für ${niche} Enthusiasten`,
      price: '79.99',
      affiliateLink: website?.affiliateLinks?.[1] || 'https://example.com/aff2',
      image: 'https://via.placeholder.com/400x300',
    },
  ];

  // WooCommerce XML Format
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">\n';
  xml += '<channel>\n';
  xml += `<title>Affiliate Produkte - ${niche}</title>\n`;
  
  products.forEach(product => {
    xml += '  <item>\n';
    xml += `    <title><![CDATA[${product.title}]]></title>\n`;
    xml += `    <description><![CDATA[${product.description}]]></description>\n`;
    xml += `    <price>${product.price}</price>\n`;
    xml += `    <link>${product.affiliateLink}</link>\n`;
    xml += `    <image>${product.image}</image>\n`;
    xml += '  </item>\n';
  });
  
  xml += '</channel>\n';
  xml += '</rss>';
  
  return xml;
}

/**
 * Generiert wp-config.php mit Platzhaltern
 */
function generateWPConfig(): string {
  return `<?php
define('DB_NAME', 'your_database_name');
define('DB_USER', 'your_database_user');
define('DB_PASSWORD', 'your_database_password');
define('DB_HOST', 'localhost');
define('DB_CHARSET', 'utf8mb4');
define('DB_COLLATE', '');

define('AUTH_KEY',         'CHANGE_THIS_' + Math.random());
define('SECURE_AUTH_KEY',  'CHANGE_THIS_' + Math.random());
define('LOGGED_IN_KEY',    'CHANGE_THIS_' + Math.random());
define('NONCE_KEY',        'CHANGE_THIS_' + Math.random());
define('AUTH_SALT',        'CHANGE_THIS_' + Math.random());
define('SECURE_AUTH_SALT', 'CHANGE_THIS_' + Math.random());
define('LOGGED_IN_SALT',   'CHANGE_THIS_' + Math.random());
define('NONCE_SALT',       'CHANGE_THIS_' + Math.random());

$table_prefix = 'wp_';
define('WP_DEBUG', false);

if ( !defined('ABSPATH') )
  define('ABSPATH', dirname(__FILE__) . '/');

require_once(ABSPATH . 'wp-settings.php');
?>`;
}

/**
 * Generiert Installations-Anleitung
 */
function generateInstallGuide(type: WebsiteType, niche: string): string {
  return `# WordPress ${type} Bundle - ${niche}

## Installation

1. **Entpacken Sie das ZIP Archiv**
   - Extrahieren Sie den wordpress Ordner auf Ihren Webserver

2. **Datenbank einrichten**
   - Erstellen Sie eine MySQL Datenbank
   - Importieren Sie die Datei 'import.sql'

3. **wp-config.php anpassen**
   - Öffnen Sie wordpress/wp-config.php
   - Tragen Sie Ihre Datenbank Zugangsdaten ein

4. **Affiliate Links konfigurieren**
   - Navigieren Sie zu WordPress Admin
   - Gehen Sie zu Tools > Import
   - Importieren Sie die Datei wp-content/uploads/affiliate-products.xml

5. **Theme aktivieren**
   - Gehen Sie zu Design > Themes
   - Aktivieren Sie das installierte Theme

6. **Permalinks setzen**
   - Gehen Sie zu Einstellungen > Permalinks
   - Wählen Sie "Beitragsname"

## Wichtige Hinweise

- Ändern Sie alle Standard-Passwörter
- Aktivieren Sie SSL für Ihre Domain
- Konfigurieren Sie regelmäßige Backups
- Prüfen Sie alle Affiliate Links

## Support

Bei Fragen wenden Sie sich an: support@example.com
`;
}

/**
 * Generiert SQL Import mit Basiseinstellungen
 */
async function generateSQLImport(type: WebsiteType, niche: string): Promise<string> {
  // Basis WordPress Tabellen und Einstellungen
  return `-- WordPress SQL Import
-- Generiert am: ${new Date().toISOString()}
-- Typ: ${type}
-- Nische: ${niche}

-- Basis Optionen
INSERT INTO wp_options (option_name, option_value) VALUES
('blogname', '${niche} Website'),
('blogdescription', 'Powered by ${type}'),
('siteurl', 'http://localhost'),
('home', 'http://localhost'),
('permalink_structure', '/%postname%/');

-- Standard Admin User (Passwort: changeme123)
INSERT INTO wp_users (user_login, user_pass, user_email, user_registered, user_status, display_name)
VALUES ('admin', MD5('changeme123'), 'admin@example.com', NOW(), 0, 'Administrator');
`;
}

/**
 * Löscht alte Bundle Dateien (älter als 7 Tage)
 */
export async function cleanupOldBundles(): Promise<void> {
  const files = await fs.readdir(OUTPUT_DIR);
  const now = Date.now();
  const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 Tage

  for (const file of files) {
    const filePath = path.join(OUTPUT_DIR, file);
    const stats = await fs.stat(filePath);
    
    if (now - stats.mtimeMs > maxAge) {
      await fs.remove(filePath);
      console.log(`Deleted old bundle: ${file}`);
    }
  }
}
