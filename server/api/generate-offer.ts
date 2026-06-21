import type { Request, Response } from 'express';
import { generateOffer } from '../_core/perplexity';
import { prisma } from '../_core/db';
import { WebsiteType } from '@prisma/client';

// Simple in-memory cache for generated offers to save LLM API costs and reduce latency
const offerCache = new Map<string, any>();
const MAX_CACHE_SIZE = 1000;

/**
 * POST /api/generate-offer
 * Generiert ein KI-basiertes Angebot für eine Website
 */
export async function generateOfferHandler(req: Request, res: Response): Promise<void> {
  try {
    const { type, niche } = req.body;

    // Validierung
    if (!type || !niche) {
      res.status(400).json({
        success: false,
        error: 'Typ und Nische sind erforderlich',
      });
      return;
    }

    // Prüfe ob Typ gültig ist
    const validTypes: WebsiteType[] = ['AFFILIATE', 'AI_BLOG', 'BUSINESS'];
    if (!validTypes.includes(type)) {
      res.status(400).json({
        success: false,
        error: 'Ungültiger Website Typ',
      });
      return;
    }

    // Check cache first to avoid redundant LLM calls
    const cacheKey = `${type}-${niche.toLowerCase().trim()}`;
    let offer = offerCache.get(cacheKey);

    if (!offer) {
      // Generiere Angebot mit Perplexity AI
      offer = await generateOffer(type, niche);

      // Prevent unbounded memory growth
      if (offerCache.size >= MAX_CACHE_SIZE) {
        offerCache.clear();
      }

      offerCache.set(cacheKey, offer);
    }

    // Speichere Website in Datenbank
    const website = await prisma.website.create({
      data: {
        type: type as WebsiteType,
        niche: niche,
        title: offer.title,
        description: offer.description,
        features: offer.features,
        price: offer.price,
        technicalStack: offer.technicalStack,
        estimatedSetupTime: offer.estimatedSetupTime,
        affiliateLinks: offer.suggestedAffiliateNetworks,
      },
    });

    res.status(200).json({
      success: true,
      data: {
        websiteId: website.id,
        ...offer,
      },
    });
  } catch (error: any) {
    console.error('Fehler bei Offer Generierung:', error);
    res.status(500).json({
      success: false,
      error: 'Angebot konnte nicht generiert werden',
      details: error.message || String(error),
    });
  }
}
