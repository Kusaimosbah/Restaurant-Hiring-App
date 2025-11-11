import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { WorkflowInitializer } from '@/lib/services/WorkflowInitializer';

/**
 * Initialize workflow system for a restaurant
 * POST /api/workflows/initialize
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

    // Verify user is restaurant owner
    if (session.user.role !== 'RESTAURANT_OWNER') {
      return NextResponse.json(
        { error: 'Only restaurant owners can initialize workflows' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      restaurantType,
      includeDefaults = true,
      includeSeasonal = false,
      customRules = []
    } = body;

    const workflowInitializer = new WorkflowInitializer();

    // Get recommended setup based on restaurant type
    let setupOptions = { includeDefaults, includeSeasonal, customRules };
    
    if (restaurantType) {
      const recommended = workflowInitializer.getRecommendedSetup(restaurantType);
      setupOptions = {
        ...setupOptions,
        includeDefaults: recommended.includeDefaults,
        includeSeasonal: recommended.includeSeasonal
      };
    }

    // Initialize workflows
    const result = await workflowInitializer.initializeRestaurantWorkflows(
      session.user.id,
      setupOptions
    );

    if (!result.success) {
      return NextResponse.json(
        { 
          error: 'Failed to initialize workflows',
          details: result.errors
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Successfully created ${result.rulesCreated} workflow rules`,
      rulesCreated: result.rulesCreated,
      errors: result.errors
    });

  } catch (error) {
    console.error('Workflow initialization error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Migrate existing restaurant to workflow system
 * POST /api/workflows/initialize/migrate
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
        { error: 'Only restaurant owners can migrate workflows' },
        { status: 403 }
      );
    }

    const workflowInitializer = new WorkflowInitializer();
    const result = await workflowInitializer.migrateToWorkflowSystem(session.user.id);

    return NextResponse.json(result);

  } catch (error) {
    console.error('Workflow migration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Get workflow configuration recommendations
 * GET /api/workflows/initialize?restaurantType=fast_food
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
    const restaurantType = url.searchParams.get('restaurantType') as any;

    const workflowInitializer = new WorkflowInitializer();

    if (restaurantType) {
      const recommendations = workflowInitializer.getRecommendedSetup(restaurantType);
      return NextResponse.json(recommendations);
    }

    // Validate current configuration if no restaurant type specified
    if (session.user.role === 'RESTAURANT_OWNER') {
      const validation = await workflowInitializer.validateWorkflowConfiguration(session.user.id);
      return NextResponse.json(validation);
    }

    return NextResponse.json({
      error: 'Restaurant type parameter required for recommendations'
    }, { status: 400 });

  } catch (error) {
    console.error('Workflow recommendations error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}