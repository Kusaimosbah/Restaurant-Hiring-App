import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { IntegrationService } from '@/lib/services/IntegrationService';
import { prisma } from '@/lib/prisma';

/**
 * Integration Management API
 * Handles CRUD operations for integrations
 */

const integrationService = new IntegrationService();

/**
 * Get all integrations for the authenticated restaurant
 * GET /api/integrations
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

    if (session.user.role !== 'RESTAURANT_OWNER') {
      return NextResponse.json(
        { error: 'Only restaurant owners can manage integrations' },
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const providerId = url.searchParams.get('providerId');

    // Build where clause
    const where: any = {
      restaurantId: session.user.id,
      ...(status && { status }),
      ...(providerId && { providerId })
    };

    const integrations = await prisma.integration.findMany({
      where,
      include: {
        restaurant: {
          select: {
            name: true
          }
        },
        syncLogs: {
          select: {
            id: true,
            status: true,
            recordsProcessed: true,
            duration: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        _count: {
          select: {
            syncLogs: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    // Parse JSON fields and add provider information
    const enrichedIntegrations = integrations.map(integration => {
      const provider = integrationService.getProvider(integration.providerId);
      
      return {
        ...integration,
        config: JSON.parse(integration.config),
        provider: provider ? {
          name: provider.name,
          type: provider.type,
          category: provider.category,
          logoUrl: provider.logoUrl,
          features: provider.features
        } : null,
        // Don't expose encrypted credentials
        credentials: undefined
      };
    });

    return NextResponse.json({ integrations: enrichedIntegrations });

  } catch (error) {
    console.error('Get integrations error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch integrations' },
      { status: 500 }
    );
  }
}

/**
 * Create a new integration
 * POST /api/integrations
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'RESTAURANT_OWNER') {
      return NextResponse.json(
        { error: 'Only restaurant owners can create integrations' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      name,
      providerId,
      config,
      credentials,
      syncFrequency = 'DAILY',
      webhookUrl
    } = body;

    // Validate required fields
    if (!name || !providerId || !config) {
      return NextResponse.json(
        { error: 'Name, providerId, and config are required' },
        { status: 400 }
      );
    }

    // Validate provider exists
    const provider = integrationService.getProvider(providerId);
    if (!provider) {
      return NextResponse.json(
        { error: 'Invalid provider ID' },
        { status: 400 }
      );
    }

    // Encrypt credentials if provided
    let encryptedCredentials = null;
    if (credentials) {
      // In a real implementation, you would encrypt the credentials
      encryptedCredentials = JSON.stringify(credentials); // Placeholder
    }

    // Create integration in database
    const integration = await prisma.integration.create({
      data: {
        name,
        providerId,
        restaurantId: session.user.id,
        config: JSON.stringify(config),
        credentials: encryptedCredentials || '',
        syncFrequency,
        webhookUrl,
        status: credentials ? 'PENDING_AUTH' : 'DISCONNECTED'
      },
      include: {
        restaurant: {
          select: {
            name: true
          }
        }
      }
    });

    // Test connection if credentials provided
    if (credentials) {
      try {
        const testResult = await integrationService.testConnection({
          ...integration,
          config: JSON.parse(integration.config),
          credentials: {
            encryptedData: encryptedCredentials || '',
            keyId: 'default',
            algorithm: 'AES-256-GCM'
          }
        });

        if (testResult.success) {
          await prisma.integration.update({
            where: { id: integration.id },
            data: { status: 'CONNECTED' }
          });
        } else {
          await prisma.integration.update({
            where: { id: integration.id },
            data: { 
              status: 'ERROR',
              lastError: testResult.message
            }
          });
        }
      } catch (error) {
        await prisma.integration.update({
          where: { id: integration.id },
          data: { 
            status: 'ERROR',
            lastError: error instanceof Error ? error.message : 'Connection test failed'
          }
        });
      }
    }

    const enrichedIntegration = {
      ...integration,
      config: JSON.parse(integration.config),
      provider: {
        name: provider.name,
        type: provider.type,
        category: provider.category,
        logoUrl: provider.logoUrl,
        features: provider.features
      },
      credentials: undefined // Don't expose credentials
    };

    return NextResponse.json({ integration: enrichedIntegration });

  } catch (error) {
    console.error('Create integration error:', error);
    return NextResponse.json(
      { error: 'Failed to create integration' },
      { status: 500 }
    );
  }
}

/**
 * Update an existing integration
 * PUT /api/integrations
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'RESTAURANT_OWNER') {
      return NextResponse.json(
        { error: 'Only restaurant owners can update integrations' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Integration ID is required' },
        { status: 400 }
      );
    }

    // Verify ownership
    const existingIntegration = await prisma.integration.findFirst({
      where: {
        id,
        restaurantId: session.user.id
      }
    });

    if (!existingIntegration) {
      return NextResponse.json(
        { error: 'Integration not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {};
    if (updates.name) updateData.name = updates.name;
    if (updates.config) updateData.config = JSON.stringify(updates.config);
    if (updates.syncFrequency) updateData.syncFrequency = updates.syncFrequency;
    if (updates.webhookUrl !== undefined) updateData.webhookUrl = updates.webhookUrl;
    if (updates.isActive !== undefined) updateData.isActive = updates.isActive;

    // Handle credentials update
    if (updates.credentials) {
      updateData.credentials = JSON.stringify(updates.credentials); // Placeholder encryption
      updateData.status = 'PENDING_AUTH';
    }

    const updatedIntegration = await prisma.integration.update({
      where: { id },
      data: updateData,
      include: {
        restaurant: {
          select: {
            name: true
          }
        }
      }
    });

    // Test connection if credentials were updated
    if (updates.credentials) {
      try {
        const provider = integrationService.getProvider(updatedIntegration.providerId);
        if (provider) {
          const testResult = await integrationService.testConnection({
            ...updatedIntegration,
            config: JSON.parse(updatedIntegration.config),
            credentials: {
              encryptedData: updatedIntegration.credentials,
              keyId: 'default',
              algorithm: 'AES-256-GCM'
            }
          });

          await prisma.integration.update({
            where: { id },
            data: { 
              status: testResult.success ? 'CONNECTED' : 'ERROR',
              lastError: testResult.success ? null : testResult.message
            }
          });
        }
      } catch (error) {
        await prisma.integration.update({
          where: { id },
          data: { 
            status: 'ERROR',
            lastError: error instanceof Error ? error.message : 'Connection test failed'
          }
        });
      }
    }

    const provider = integrationService.getProvider(updatedIntegration.providerId);
    const enrichedIntegration = {
      ...updatedIntegration,
      config: JSON.parse(updatedIntegration.config),
      provider: provider ? {
        name: provider.name,
        type: provider.type,
        category: provider.category,
        logoUrl: provider.logoUrl,
        features: provider.features
      } : null,
      credentials: undefined
    };

    return NextResponse.json({ integration: enrichedIntegration });

  } catch (error) {
    console.error('Update integration error:', error);
    return NextResponse.json(
      { error: 'Failed to update integration' },
      { status: 500 }
    );
  }
}

/**
 * Delete an integration
 * DELETE /api/integrations?id=<integrationId>
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'RESTAURANT_OWNER') {
      return NextResponse.json(
        { error: 'Only restaurant owners can delete integrations' },
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const integrationId = url.searchParams.get('id');

    if (!integrationId) {
      return NextResponse.json(
        { error: 'Integration ID is required' },
        { status: 400 }
      );
    }

    // Verify ownership and delete
    const deletedIntegration = await prisma.integration.deleteMany({
      where: {
        id: integrationId,
        restaurantId: session.user.id
      }
    });

    if (deletedIntegration.count === 0) {
      return NextResponse.json(
        { error: 'Integration not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Delete integration error:', error);
    return NextResponse.json(
      { error: 'Failed to delete integration' },
      { status: 500 }
    );
  }
}