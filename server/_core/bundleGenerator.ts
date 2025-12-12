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
  const outputPath = path.join(OUTPUT_DIR, bundleName);

  try {
    // 1. WordPress Core Dateien hinzufügen
    const wpCorePath = path.join(TEMPLATE_DIR, 'wordpress');
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

    // 4. Typ-spezifische Inhalte
    if (type === 'AFFILIATE') {
      await addAffiliateContent(zip, niche);
    } else if (type === 'AI_BLOG') {
      await addAIBlogContent(zip, niche);
    } else if (type === 'BUSINESS') {
      await addBusinessContent(zip, niche);
    }

    // 5. Konfigurationsdateien
    await addConfigFiles(zip, config);

    // 6. Dokumentation
    await addDocumentation(zip, type);

    // 7. SQL Import Datei
    await addDatabaseImport(zip, config);

    // Bundle speichern
    await zip.writeZipPromise(outputPath);

    // In Datenbank speichern
    await prisma.website.update({
      where: { id: websiteId },
      data: { bundlePath: outputPath }
    });

    console.log(`✅ Bundle erstellt: ${bundleName}`);
    return outputPath;

  } catch (error) {
    console.error('❌ Bundle Generierung fehlgeschlagen:', error);
    throw new Error(`Bundle generation failed: ${error}`);
  }
}

/**
 * Fügt Affiliate-spezifische Inhalte hinzu
 */
async function addAffiliateContent(zip: AdmZip, niche: string): Promise<void> {
  const affiliateXMLPath = path.join(TEMPLATE_DIR, 'affiliate', `${niche}.xml`);
  
  if (await fs.pathExists(affiliateXMLPath)) {
    const xmlContent = await fs.readFile(affiliateXMLPath);
    zip.addFile('wordpress/wp-content/uploads/affiliate-products.xml', xmlContent);
  }

  // AAWP Plugin Settings
  const aawpSettings = {
    api_key: 'YOUR_AMAZON_API_KEY',
    partner_id: 'YOUR_PARTNER_ID',
    shop: 'amazon.de'
  };
  zip.addFile('aawp-settings.json', Buffer.from(JSON.stringify(aawpSettings, null, 2)));
}

/**
 * Fügt AI Blog spezifische Inhalte hinzu
 */
async function addAIBlogContent(zip: AdmZip, niche: string): Promise<void> {
  // AI Blog Starter Posts
  const blogPostsPath = path.join(TEMPLATE_DIR, 'blog-posts', niche);
  
  if (await fs.pathExists(blogPostsPath)) {
    const posts = await fs.readdir(blogPostsPath);
    for (const post of posts) {
      const postContent = await fs.readFile(path.join(blogPostsPath, post));
      zip.addFile(`wordpress/wp-content/blog-posts/${post}`, postContent);
    }
  }

  // AI Blog Konfiguration
  const aiConfig = {
    auto_posting: true,
    frequency: 'daily',
    categories: [niche],
    seo_optimization: true
  };
  zip.addFile('ai-blog-config.json', Buffer.from(JSON.stringify(aiConfig, null, 2)));
}

/**
 * Fügt Business Website Inhalte hinzu
 */
async function addBusinessContent(zip: AdmZip, niche: string): Promise<void> {
  // Business Template Pages
  const pagesPath = path.join(TEMPLATE_DIR, 'business-pages', niche);
  
  if (await fs.pathExists(pagesPath)) {
    zip.addLocalFolder(pagesPath, 'wordpress/wp-content/business-pages');
  }

  // Contact Form & CRM Integration
  const crmConfig = {
    enable_contact_form: true,
    email_notifications: true,
    crm_integration: 'none'
  };
  zip.addFile('crm-config.json', Buffer.from(JSON.stringify(crmConfig, null, 2)));
}

/**
 * Fügt Konfigurationsdateien hinzu
 */
async function addConfigFiles(zip: AdmZip, config: BundleConfig): Promise<void> {
  // wp-config.php Template
  const wpConfigTemplate = `<?php
define('DB_NAME', 'your_database_name');
define('DB_USER', 'your_database_user');
define('DB_PASSWORD', 'your_database_password');
define('DB_HOST', 'localhost');
define('DB_CHARSET', 'utf8mb4');
define('DB_COLLATE', '');

// Salts generieren auf: https://api.wordpress.org/secret-key/1.1/salt/
define('AUTH_KEY',         'put your unique phrase here');
define('SECURE_AUTH_KEY',  'put your unique phrase here');
define('LOGGED_IN_KEY',    'put your unique phrase here');
define('NONCE_KEY',        'put your unique phrase here');

$table_prefix = 'wp_';
define('WP_DEBUG', false);

if ( ! defined( 'ABSPATH' ) ) {
  define( 'ABSPATH', __DIR__ . '/' );
}
require_once ABSPATH . 'wp-settings.php';
?>`;

  zip.addFile('wordpress/wp-config.php', Buffer.from(wpConfigTemplate));

  // .htaccess für Pretty URLs
  const htaccessContent = `# BEGIN WordPress
RewriteEngine On
RewriteRule .* - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]
RewriteBase /
RewriteRule ^index\\.php$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.php [L]
# END WordPress`;

  zip.addFile('wordpress/.htaccess', Buffer.from(htaccessContent));
}

/**
 * Fügt Dokumentation hinzu
 */
async function addDocumentation(zip: AdmZip, type: WebsiteType): Promise<void> {
  const installGuide = `# WordPress ${type} Bundle - Installation

## Installation

1. **Entpacken Sie das ZIP Archiv**
   - Extrahieren Sie den wordpress Ordner auf Ihren Webserver

2. **Datenbank einrichten**
   - Erstellen Sie eine MySQL Datenbank
   - Importieren Sie die Datei 'import.sql'

3. **wp-config.php anpassen**
   - Öffnen Sie wordpress/wp-config.php
   - Tragen Sie Ihre Datenbank Zugangsdaten ein

4. **Affiliate Links konfigurieren** ${type === 'AFFILIATE' ? `
   - Navigieren Sie zu WordPress Admin
   - Gehen Sie zu Tools > Import
   - Importieren Sie die Datei wp-content/uploads/affiliate-products.xml` : ''}

5. **Theme aktivieren**
   - Gehen Sie zu Design > Themes
   - Aktivieren Sie das installierte Theme

6. **Permalinks setzen**
   - Gehen Sie zu Einstellungen > Permalinks
   - Wählen Sie "Beitragsname" als Struktur

## Support

Bei Fragen kontaktieren Sie: support@yoursite.com
`;

  zip.addFile('INSTALLATION.md', Buffer.from(installGuide));

  // README
  const readme = `# ${type} WordPress Website Bundle

Dieses Bundle enthält:
- WordPress Core
- Vorinstallierte Plugins
- Optimiertes Theme
- Beispiel-Inhalte
- Installationsanleitung

## Erste Schritte

1. Lesen Sie INSTALLATION.md
2. Folgen Sie den Schritten
3. Starten Sie mit Ihrer Website!

Viel Erfolg! 🚀
`;

  zip.addFile('README.md', Buffer.from(readme));
}

/**
 * Fügt SQL Import Datei hinzu
 */
async function addDatabaseImport(zip: AdmZip, config: BundleConfig): Promise<void> {
  const { type, niche } = config;

  const sqlContent = `-- WordPress ${type} Database Export
-- Generiert am: ${new Date().toISOString()}

CREATE DATABASE IF NOT EXISTS wordpress_${type.toLowerCase()};
USE wordpress_${type.toLowerCase()};

-- Standard Admin User (Passwort: changeme123)
INSERT INTO wp_users (user_login, user_pass, user_email, user_registered, user_status, display_name)
VALUES ('admin', MD5('changeme123'), 'admin@example.com', NOW(), 0, 'Administrator');

`;

  zip.addFile('import.sql', Buffer.from(sqlContent));
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

/**
 * Gibt Bundle Download URL zurück
 */
export function getBundleDownloadUrl(bundlePath: string): string {
  const filename = path.basename(bundlePath);
  return `/api/download/bundle/${filename}`;
}

/**
 * Erstellt Bundle für Website
 */
export async function createBundleForWebsite(websiteId: string): Promise<string> {
  const website = await prisma.website.findUnique({
    where: { id: websiteId },
    include: { package: true }
  });

  if (!website) {
    throw new Error('Website not found');
  }

  const config: BundleConfig = {
    websiteId: website.id,
    type: website.type,
    niche: website.niche,
    plugins: ['aawp', 'rank-math', 'wp-rocket'], // Standard Plugins
    theme: website.package?.name.toLowerCase() || 'default'
  };

  return await generateWordPressBundle(config);
}
