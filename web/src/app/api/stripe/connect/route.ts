import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// This would normally use the Stripe SDK
// For now, we'll simulate the Stripe Connect flow

/**
 * POST /api/stripe/connect
 * Initialize Stripe Connect OAuth flow
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'RESTAURANT_OWNER') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get restaurant
    const restaurant = await prisma.restaurant.findUnique({
      where: { userId: session.user.id }
    });

    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      );
    }

    // In a real implementation, this would:
    // 1. Create Stripe Connect account
    // 2. Generate OAuth URL
    // 3. Redirect user to Stripe
    // For demo purposes, we'll simulate successful connection

    const mockStripeAccountId = 'acct_' + Math.random().toString(36).substring(2, 15);
    const mockStripeCustomerId = 'cus_' + Math.random().toString(36).substring(2, 15);

    // Update or create payment info
    const paymentInfo = await prisma.paymentInfo.upsert({
      where: { restaurantId: restaurant.id },
      update: {
        stripeAccountId: mockStripeAccountId,
        stripeCustomerId: mockStripeCustomerId,
        isVerified: true
      },
      create: {
        restaurantId: restaurant.id,
        stripeAccountId: mockStripeAccountId,
        stripeCustomerId: mockStripeCustomerId,
        isVerified: true
      }
    });

    return NextResponse.json({
      success: true,
      accountId: mockStripeAccountId,
      customerId: mockStripeCustomerId,
      paymentInfo,
      message: 'Successfully connected to Stripe!'
    });

  } catch (error) {
    console.error('Stripe Connect error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/stripe/connect
 * Get Stripe Connect status
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'RESTAURANT_OWNER') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get restaurant with payment info
    const restaurant = await prisma.restaurant.findUnique({
      where: { userId: session.user.id },
      include: { paymentInfo: true }
    });

    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      connected: !!restaurant.paymentInfo?.stripeAccountId,
      verified: restaurant.paymentInfo?.isVerified || false,
      accountId: restaurant.paymentInfo?.stripeAccountId,
      customerId: restaurant.paymentInfo?.stripeCustomerId
    });

  } catch (error) {
    console.error('Error fetching Stripe status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}