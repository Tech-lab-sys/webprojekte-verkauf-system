import type { Request, Response } from 'express';
import { handleStripeWebhook } from '../_core/paymentService';

/**
 * POST /api/webhook
 * Stripe Webhook Endpoint für Payment Events
 */
export async function webhookHandler(req: Request, res: Response): Promise<void> {
  const signature = req.headers['stripe-signature'] as string;

  if (!signature) {
    console.error('Webhook Fehler: Keine Signatur vorhanden');
    res.status(400).send('Webhook Error: Missing signature');
    return;
  }

  try {
    // Raw Body wird für Webhook Verification benötigt
    const rawBody = req.body;
    
    // Verarbeite Webhook Event
    await handleStripeWebhook(rawBody, signature);

    // Stripe erwartet 200 Response
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook Verarbeitungsfehler:', error);
    
    if (error.message.includes('Signatur')) {
      res.status(400).send(`Webhook Error: ${error.message}`);
    } else {
      res.status(500).send(`Webhook Error: ${error.message}`);
    }
  }
}
