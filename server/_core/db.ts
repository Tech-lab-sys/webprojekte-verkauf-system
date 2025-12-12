import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export { prisma };

// Package Functions
export async function getAllPackages() {
  return await prisma.package.findMany({
    include: { offers: { where: { isActive: true } } }
  });
}

export async function getPackageById(id: string) {
  return await prisma.package.findUnique({
    where: { id },
    include: { offers: true }
  });
}

// Offer Functions
export async function createOffer(data: any) {
  return await prisma.offer.create({ data });
}

export async function getActiveOffers(packageId: string) {
  return await prisma.offer.findMany({
    where: { packageId, isActive: true },
    orderBy: { createdAt: 'desc' }
  });
}

export async function incrementOfferViews(offerId: string) {
  return await prisma.offer.update({
    where: { id: offerId },
    data: { views: { increment: 1 } }
  });
}

// Purchase Functions
export async function createPurchase(data: any) {
  return await prisma.purchase.create({ data });
}

export async function getPurchaseByStripeSession(stripeSessionId: string) {
  return await prisma.purchase.findUnique({
    where: { stripeSessionId }
  });
}

export async function updatePurchaseStatus(id: string, status: string) {
  return await prisma.purchase.update({
    where: { id },
    data: { status }
  });
}

export async function updatePurchaseBundleUrl(id: string, bundleUrl: string) {
  return await prisma.purchase.update({
    where: { id },
    data: { bundleUrl, bundleGenerated: true }
  });
}

// Analytics
export async function trackEvent(event: string, data?: any) {
  return await prisma.analytics.create({
    data: {
      event,
      ...data
    }
  });
}
