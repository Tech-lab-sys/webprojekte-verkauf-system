import type { Request, Response } from 'express';
import { createCheckoutSession, createCheckoutSessionWithCoupon } from '../_core/paymentService';

/**
 * POST /api/create-checkout
 * Erstellt eine Stripe Checkout Session
 */
export async function createCheckoutHandler(req: Request, res: Response): Promise<void> {
  try {
    const { websiteId, customerEmail, couponCode } = req.body;

    // Validierung
    if (!websiteId || !customerEmail) {
      res.status(400).json({
        success: false,
        error: 'Website ID und Email sind erforderlich',
      });
      return;
    }

    // Email Format prüfen
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerEmail)) {
      res.status(400).json({
        success: false,
        error: 'Ungültige Email Adresse',
      });
      return;
    }

    // URLs für Success/Cancel
    const baseUrl = process.env.APP_URL || 'http://localhost:5173';
    const successUrl = `${baseUrl}/success`;
    const cancelUrl = `${baseUrl}/offer/${websiteId}`;

    let checkoutUrl: string;

    // Mit oder ohne Coupon
    if (couponCode && couponCode.trim() !== '') {
      checkoutUrl = await createCheckoutSessionWithCoupon(
        {
          websiteId,
          customerEmail,
          successUrl,
          cancelUrl,
        },
        couponCode
      );
    } else {
      checkoutUrl = await createCheckoutSession({
        websiteId,
        customerEmail,
        successUrl,
        cancelUrl,
      });
    }

    res.status(200).json({
      success: true,
      data: {
        checkoutUrl,
      },
    });
  } catch (error) {
    console.error('Fehler bei Checkout Erstellung:', error);
    
    // Spezifische Fehlerbehandlung
    if (error.message.includes('Website nicht gefunden')) {
      res.status(404).json({
        success: false,
        error: 'Website nicht gefunden',
      });
      return;
    }

    if (error.message.includes('Rabatt-Code')) {
      res.status(400).json({
        success: false,
        error: 'Ungültiger Rabatt-Code',
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Checkout konnte nicht erstellt werden',
      details: error.message,
    });
  }
}
