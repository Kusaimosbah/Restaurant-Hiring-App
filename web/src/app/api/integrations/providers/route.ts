import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { IntegrationService } from '@/lib/services/IntegrationService';

/**
 * Integration Providers API
 * Returns available integration providers
 */

const integrationService = new IntegrationService();

/**
 * Get all available integration providers
 * GET /api/integrations/providers
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const category = url.searchParams.get('category') as any;
    const type = url.searchParams.get('type') as any;

    let providers = integrationService.getProviders(category);

    // Filter by type if specified
    if (type) {
      providers = providers.filter(p => p.type === type);
    }

    // Group providers by category for easier UI consumption
    const providersByCategory = providers.reduce((acc, provider) => {
      if (!acc[provider.category]) {
        acc[provider.category] = [];
      }
      acc[provider.category].push(provider);
      return acc;
    }, {} as Record<string, typeof providers>);

    return NextResponse.json({
      providers,
      providersByCategory,
      categories: Object.keys(providersByCategory),
      totalCount: providers.length
    });

  } catch (error) {
    console.error('Get providers error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch providers' },
      { status: 500 }
    );
  }
}