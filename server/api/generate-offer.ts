import type { Request, Response } from 'express';
import { generateOffer } from '../_core/perplexity';
import { prisma } from '../_core/db';
import { WebsiteType } from '@prisma/client';

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

    // Generiere Angebot mit Perplexity AI
    const offer = await generateOffer(type, niche);

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
  } catch (error) {
    console.error('Fehler bei Offer Generierung:', error);
    res.status(500).json({
      success: false,
      error: 'Angebot konnte nicht generiert werden',
      details: error.message,
    });
  }
}
