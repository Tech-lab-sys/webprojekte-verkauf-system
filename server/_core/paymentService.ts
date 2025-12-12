import Stripe from 'stripe';
import { prisma } from './db';
import { Website, PaymentStatus } from '@prisma/client';
import { sendPurchaseConfirmation, sendAdminNotification } from './emailService';
import { generateWordPressBundle } from './bundleGenerator';

// Stripe Initialisierung
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

interface CreateCheckoutSessionOptions {
  websiteId: string;
  customerEmail: string;
  successUrl: string;
  cancelUrl: string;
}

/**
 * Erstellt eine Stripe Checkout Session für den Website-Kauf
 */
export async function createCheckoutSession(
  options: CreateCheckoutSessionOptions
): Promise<string> {
  const { websiteId, customerEmail, successUrl, cancelUrl } = options;

  // Hole Website Daten
  const website = await prisma.website.findUnique({
    where: { id: websiteId },
  });

  if (!website) {
    throw new Error('Website nicht gefunden');
  }

  try {
    // Erstelle Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'paypal'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `${website.type} Website - ${website.niche}`,
              description: website.description || `Fertige ${website.type} Website für die Nische ${website.niche}`,
              images: website.previewImage ? [website.previewImage] : undefined,
            },
            unit_amount: Math.round(website.price * 100), // Preis in Cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      customer_email: customerEmail,
      metadata: {
        websiteId: website.id,
        websiteType: website.type,
        niche: website.niche,
      },
    });

    // Speichere Payment Intent in DB
    await prisma.payment.create({
      data: {
        websiteId: website.id,
        stripeSessionId: session.id,
        amount: website.price,
        currency: 'EUR',
        status: PaymentStatus.PENDING,
        customerEmail: customerEmail,
      },
    });

    return session.url!;
  } catch (error) {
    console.error('Fehler bei Checkout Session Erstellung:', error);
    throw new Error(`Checkout Session konnte nicht erstellt werden: ${error.message}`);
  }
}

/**
 * Verarbeitet Stripe Webhook Events
 */
export async function handleStripeWebhook(
  rawBody: Buffer,
  signature: string
): Promise<void> {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    console.error('Webhook Signatur Verifikation fehlgeschlagen:', error);
    throw new Error('Webhook Signatur ungültig');
  }

  // Handle verschiedene Event Types
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
      break;

    case 'payment_intent.succeeded':
      await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
      break;

    case 'payment_intent.payment_failed':
      await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
      break;

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }
}

/**
 * Behandelt erfolgreich abgeschlossene Checkout Sessions
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  const websiteId = session.metadata?.websiteId;
  const customerEmail = session.customer_email;

  if (!websiteId || !customerEmail) {
    console.error('Fehlende Metadaten in Checkout Session');
    return;
  }

  try {
    // Update Payment Status
    await prisma.payment.updateMany({
      where: { stripeSessionId: session.id },
      data: {
        status: PaymentStatus.COMPLETED,
        paidAt: new Date(),
      },
    });

    // Hole Website Daten
    const website = await prisma.website.findUnique({
      where: { id: websiteId },
    });

    if (!website) {
      throw new Error('Website nicht gefunden');
    }

    // Generiere WordPress Bundle
    const bundlePath = await generateWordPressBundle({
      websiteId: website.id,
      type: website.type,
      niche: website.niche,
      plugins: ['woocommerce', 'yoast-seo', 'wpforms'],
      theme: 'astra',
    });

    // Update Website Status
    await prisma.website.update({
      where: { id: websiteId },
      data: {
        sold: true,
        soldAt: new Date(),
        soldTo: customerEmail,
      },
    });

    // Sende Bestätigungsmail an Kunden
    await sendPurchaseConfirmation(customerEmail, website, bundlePath);

    // Sende Benachrichtigung an Admin
    await sendAdminNotification(website, customerEmail);

    console.log(`Website ${websiteId} erfolgreich verkauft an ${customerEmail}`);
  } catch (error) {
    console.error('Fehler bei Checkout Completion Handler:', error);
    // Hier könnte man einen Retry Mechanismus implementieren
  }
}

/**
 * Behandelt erfolgreiche Zahlungen
 */
async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
  console.log(`Payment succeeded: ${paymentIntent.id}`);
  // Zusätzliche Logik falls nötig
}

/**
 * Behandelt fehlgeschlagene Zahlungen
 */
async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
  console.error(`Payment failed: ${paymentIntent.id}`);
  
  // Update Payment Status in DB
  await prisma.payment.updateMany({
    where: { stripeSessionId: paymentIntent.id },
    data: {
      status: PaymentStatus.FAILED,
    },
  });
}

/**
 * Erstellt einen Rabatt-Coupon in Stripe
 */
export async function createDiscountCoupon(
  code: string,
  percentOff: number,
  maxRedemptions?: number
): Promise<Stripe.Coupon> {
  try {
    const coupon = await stripe.coupons.create({
      id: code.toUpperCase(),
      percent_off: percentOff,
      duration: 'once',
      max_redemptions: maxRedemptions,
    });

    console.log(`Coupon erstellt: ${code} (${percentOff}% Rabatt)`);
    return coupon;
  } catch (error) {
    console.error('Fehler bei Coupon Erstellung:', error);
    throw new Error(`Coupon konnte nicht erstellt werden: ${error.message}`);
  }
}

/**
 * Prüft ob ein Coupon gültig ist
 */
export async function validateCoupon(code: string): Promise<boolean> {
  try {
    const coupon = await stripe.coupons.retrieve(code.toUpperCase());
    return coupon.valid;
  } catch (error) {
    console.error('Coupon nicht gefunden:', error);
    return false;
  }
}

/**
 * Erstellt eine Stripe Checkout Session mit Rabatt-Code
 */
export async function createCheckoutSessionWithCoupon(
  options: CreateCheckoutSessionOptions,
  couponCode: string
): Promise<string> {
  const { websiteId, customerEmail, successUrl, cancelUrl } = options;

  const website = await prisma.website.findUnique({
    where: { id: websiteId },
  });

  if (!website) {
    throw new Error('Website nicht gefunden');
  }

  // Validiere Coupon
  const couponValid = await validateCoupon(couponCode);
  if (!couponValid) {
    throw new Error('Ungültiger Rabatt-Code');
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'paypal'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `${website.type} Website - ${website.niche}`,
              description: website.description || `Fertige ${website.type} Website`,
            },
            unit_amount: Math.round(website.price * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      customer_email: customerEmail,
      discounts: [
        {
          coupon: couponCode.toUpperCase(),
        },
      ],
      metadata: {
        websiteId: website.id,
        websiteType: website.type,
        niche: website.niche,
        couponCode: couponCode.toUpperCase(),
      },
    });

    await prisma.payment.create({
      data: {
        websiteId: website.id,
        stripeSessionId: session.id,
        amount: website.price,
        currency: 'EUR',
        status: PaymentStatus.PENDING,
        customerEmail: customerEmail,
      },
    });

    return session.url!;
  } catch (error) {
    console.error('Fehler bei Checkout Session mit Coupon:', error);
    throw new Error(`Checkout Session konnte nicht erstellt werden: ${error.message}`);
  }
}

/**
 * Holt Payment Details für eine Website
 */
export async function getPaymentDetails(websiteId: string): Promise<any> {
  return await prisma.payment.findMany({
    where: { websiteId },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Erstellt eine Testrechnung (für Entwicklung)
 */
export async function createTestInvoice(websiteId: string, customerEmail: string): Promise<void> {
  const website = await prisma.website.findUnique({
    where: { id: websiteId },
  });

  if (!website) {
    throw new Error('Website nicht gefunden');
  }

  await prisma.payment.create({
    data: {
      websiteId: website.id,
      stripeSessionId: 'test_' + Date.now(),
      amount: website.price,
      currency: 'EUR',
      status: PaymentStatus.COMPLETED,
      customerEmail: customerEmail,
      paidAt: new Date(),
    },
  });

  console.log(`Test Rechnung erstellt für ${customerEmail}`);
}
