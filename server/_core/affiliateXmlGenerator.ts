/**
 * Affiliate XML Generator mit Check24 & Tarifcheck24 Integration
 * Generiert WordPress-kompatible XML Feeds mit Affiliate-Links
 */

interface AffiliateConfig {
  check24PartnerId?: string;
  tarifcheck24PartnerId?: string;
  niche: string;
  productCount?: number;
}

interface AffiliateProduct {
  id: string;
  name: string;
  description: string;
  price: string;
  affiliateUrl: string;
  imageUrl: string;
  category: string;
  features: string[];
}

/**
 * Generiert Check24 Affiliate URLs mit Partner-ID
 */
export function generateCheck24Url(partnerId: string, category: string, params?: Record<string, string>): string {
  const baseUrl = 'https://www.check24.de';
  const queryParams = new URLSearchParams({
    pid: partnerId,
    ...params,
  });
  return `${baseUrl}/${category}?${queryParams.toString()}`;
}

/**
 * Generiert Tarifcheck24 Affiliate URLs
 */
export function generateTarifcheck24Url(partnerId: string, vertical: string): string {
  return `https://www.tarifcheck24.com/${vertical}?aid=${partnerId}`;
}

/**
 * Erstellt Affiliate-Produkte basierend auf Nische
 */
export async function generateAffiliateProducts(config: AffiliateConfig): Promise<AffiliateProduct[]> {
  const { check24PartnerId, tarifcheck24PartnerId, niche, productCount = 10 } = config;
  const products: AffiliateProduct[] = [];

  // Nischen-basierte Produkt-Generierung
  const nicheProducts = {
    versicherung: [
      { name: 'Kfz-Versicherung Vergleich', category: 'kfz-versicherung', vertical: 'kfz' },
      { name: 'Krankenversicherung', category: 'krankenversicherung', vertical: 'kranken' },
      { name: 'Haftpflichtversicherung', category: 'haftpflicht', vertical: 'haftpflicht' },
    ],
    strom: [
      { name: 'Stromtarif-Vergleich', category: 'strom', vertical: 'strom' },
      { name: 'Ökostrom Anbieter', category: 'oekostrom', vertical: 'oekostrom' },
    ],
    gas: [
      { name: 'Gasanbieter Vergleich', category: 'gas', vertical: 'gas' },
    ],
    kredit: [
      { name: 'Kreditvergleich', category: 'kredit', vertical: 'kredit' },
      { name: 'Baufinanzierung', category: 'baufinanzierung', vertical: 'baufi' },
    ],
    reisen: [
      { name: 'Reiseversicherung', category: 'reiseversicherung', vertical: 'reise' },
      { name: 'Mietwagen Vergleich', category: 'mietwagen', vertical: 'mietwagen' },
    ],
  };

  const relevantProducts = nicheProducts[niche.toLowerCase()] || [];

  for (let i = 0; i < Math.min(productCount, relevantProducts.length * 3); i++) {
    const template = relevantProducts[i % relevantProducts.length];
    
    const affiliateUrl = check24PartnerId 
      ? generateCheck24Url(check24PartnerId, template.category)
      : tarifcheck24PartnerId
      ? generateTarifcheck24Url(tarifcheck24PartnerId, template.vertical)
      : `https://example.com/affiliate/${template.vertical}`;

    products.push({
      id: `prod-${i + 1}`,
      name: `${template.name} Angebot ${i + 1}`,
      description: `Top ${template.name} mit besten Konditionen. Jetzt vergleichen und sparen!`,
      price: 'Kostenloser Vergleich',
      affiliateUrl,
      imageUrl: `https://via.placeholder.com/400x300?text=${encodeURIComponent(template.name)}`,
      category: template.category,
      features: [
        'Kostenloser Vergleich',
        'Unabhängige Bewertungen',
        'Sofort Online abschließen',
        'Bis zu 850€ sparen',
      ],
    });
  }

  return products;
}

/**
 * Generiert WordPress WooCommerce XML Import
 */
export async function generateWooCommerceXML(config: AffiliateConfig): Promise<string> {
  const products = await generateAffiliateProducts(config);

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<rss version="2.0" xmlns:wp="http://wordpress.org/export/1.2/" xmlns:content="http://purl.org/rss/1.0/modules/content/">\n';
  xml += '<channel>\n';
  xml += `  <title>Affiliate Produkte - ${config.niche}</title>\n`;
  xml += '  <description>Automatisch generierte Affiliate Produkte</description>\n';
  xml += '  <language>de-DE</language>\n';

  products.forEach((product) => {
    xml += '  <item>\n';
    xml += `    <title><![CDATA[${product.name}]]></title>\n`;
    xml += `    <description><![CDATA[${product.description}]]></description>\n`;
    xml += `    <content:encoded><![CDATA[\n`;
    xml += `      <h2>${product.name}</h2>\n`;
    xml += `      <p>${product.description}</p>\n`;
    xml += `      <ul>\n`;
    product.features.forEach(feature => {
      xml += `        <li>${feature}</li>\n`;
    });
    xml += `      </ul>\n`;
    xml += `      <a href="${product.affiliateUrl}" target="_blank" rel="nofollow" class="affiliate-button">Jetzt vergleichen</a>\n`;
    xml += `    ]]></content:encoded>\n`;
    xml += `    <wp:post_type>product</wp:post_type>\n`;
    xml += `    <wp:status>publish</wp:status>\n`;
    xml += `    <category domain="product_cat" nicename="${product.category}"><![CDATA[${product.category}]]></category>\n`;
    xml += `    <wp:postmeta>\n`;
    xml += `      <wp:meta_key>_product_url</wp:meta_key>\n`;
    xml += `      <wp:meta_value><![CDATA[${product.affiliateUrl}]]></wp:meta_value>\n`;
    xml += `    </wp:postmeta>\n`;
    xml += `    <wp:postmeta>\n`;
    xml += `      <wp:meta_key>_price</wp:meta_key>\n`;
    xml += `      <wp:meta_value><![CDATA[${product.price}]]></wp:meta_value>\n`;
    xml += `    </wp:postmeta>\n`;
    xml += '  </item>\n';
  });

  xml += '</channel>\n';
  xml += '</rss>';

  return xml;
}

/**
 * Liste der kostenlosen, lightweight WordPress Themes
 */
export const LIGHTWEIGHT_THEMES = {
  affiliate: [
    { name: 'Astra', repo: 'astra', size: '50KB', features: ['Mega schnell', 'WooCommerce optimiert', 'SEO-freundlich'] },
    { name: 'GeneratePress', repo: 'generatepress', size: '30KB', features: ['Leichtgewicht', 'Accessibility Ready', 'Google Core Web Vitals'] },
    { name: 'Kadence', repo: 'kadence', size: '45KB', features: ['Design Library', 'Responsive', 'Header Builder'] },
    { name: 'Neve', repo: 'neve', size: '40KB', features: ['AMP Ready', 'E-Commerce', 'Schnell'] },
  ],
  blog: [
    { name: 'GeneratePress', repo: 'generatepress', size: '30KB', features: ['Blog-optimiert', 'Typography', 'Speed'] },
    { name: 'Blocksy', repo: 'blocksy', size: '55KB', features: ['Gutenberg', 'Modern', 'Dynamic Headers'] },
    { name: 'OceanWP', repo: 'oceanwp', size: '60KB', features: ['Blog Layouts', 'Sticky Header', 'Extensions'] },
  ],
  business: [
    { name: 'Astra', repo: 'astra', size: '50KB', features: ['Business Templates', 'Page Builder', 'Professional'] },
    { name: 'Neve', repo: 'neve', size: '40KB', features: ['Corporate', 'Multi-purpose', 'Fast'] },
    { name: 'Zakra', repo: 'zakra', size: '35KB', features: ['Business Ready', 'Starter Sites', 'Customizable'] },
  ],
};

/**
 * Empfohlene WordPress Plugins pro Website-Typ
 */
export const RECOMMENDED_PLUGINS = {
  affiliate: [
    'woocommerce', // E-Commerce Basis
    'affiliate-wp', // Affiliate Management
    'pretty-links', // Link Cloaking
    'thirstyaffiliates', // Affiliate Link Manager
    'rank-math-seo', // SEO (kostenlos & lightweight)
    'wp-fastest-cache', // Caching
    'autoptimize', // Performance
    'wordfence', // Security
    'contact-form-7', // Formulare
  ],
  blog: [
    'rank-math-seo', // SEO
    'wp-fastest-cache', // Caching
    'smush', // Bild-Optimierung
    'related-posts', // Related Content
    'mailchimp-for-wp', // Newsletter
    'social-warfare', // Social Sharing
    'wordfence', // Security
    'updraftplus', // Backup
  ],
  business: [
    'elementor', // Page Builder
    'contact-form-7', // Kontakt
    'wp-mail-smtp', // Email
    'rank-math-seo', // SEO
    'wp-fastest-cache', // Performance
    'wordfence', // Security
    'google-analytics-for-wordpress', // Analytics
    'wpforms-lite', // Formulare
  ],
};

export default {
  generateCheck24Url,
  generateTarifcheck24Url,
  generateAffiliateProducts,
  generateWooCommerceXML,
  LIGHTWEIGHT_THEMES,
  RECOMMENDED_PLUGINS,
};
