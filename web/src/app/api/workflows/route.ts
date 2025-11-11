import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { WorkflowEngine } from '@/lib/services/WorkflowEngine';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Only restaurant owners can manage workflows
    if (session.user.role !== 'RESTAURANT_OWNER') {
      return NextResponse.json(
        { error: 'Access denied. Restaurant owner role required.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'rules';

    const workflowEngine = WorkflowEngine.getInstance();

    switch (type) {
      case 'rules':
        const rules = await workflowEngine.getRules(session.user.id);
        return NextResponse.json({
          success: true,
          data: rules
        });

      case 'executions':
        const limit = parseInt(searchParams.get('limit') || '50');
        const executions = await workflowEngine.getExecutionHistory(
          session.user.id,
          limit
        );
        return NextResponse.json({
          success: true,
          data: executions
        });

      default:
        return NextResponse.json(
          { error: 'Invalid type parameter' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Workflow API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workflow data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'RESTAURANT_OWNER') {
      return NextResponse.json(
        { error: 'Access denied. Restaurant owner role required.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, ...data } = body;

    const workflowEngine = WorkflowEngine.getInstance();

    switch (action) {
      case 'create_rule':
        const newRule = await workflowEngine.createRule({
          ...data,
          restaurantId: session.user.id
        });
        return NextResponse.json({
          success: true,
          data: newRule
        });

      case 'trigger_event':
        const { eventType, eventData } = data;
        await workflowEngine.triggerWorkflow(
          eventType,
          eventData,
          session.user.id
        );
        return NextResponse.json({
          success: true,
          message: 'Workflow triggered successfully'
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Workflow API error:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to process workflow request' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'RESTAURANT_OWNER') {
      return NextResponse.json(
        { error: 'Access denied. Restaurant owner role required.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { ruleId, ...updates } = body;

    if (!ruleId) {
      return NextResponse.json(
        { error: 'Rule ID is required' },
        { status: 400 }
      );
    }

    const workflowEngine = WorkflowEngine.getInstance();
    const updatedRule = await workflowEngine.updateRule(ruleId, updates);

    return NextResponse.json({
      success: true,
      data: updatedRule
    });

  } catch (error) {
    console.error('Workflow API error:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update workflow rule' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'RESTAURANT_OWNER') {
      return NextResponse.json(
        { error: 'Access denied. Restaurant owner role required.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const ruleId = searchParams.get('ruleId');

    if (!ruleId) {
      return NextResponse.json(
        { error: 'Rule ID is required' },
        { status: 400 }
      );
    }

    const workflowEngine = WorkflowEngine.getInstance();
    await workflowEngine.deleteRule(ruleId);

    return NextResponse.json({
      success: true,
      message: 'Workflow rule deleted successfully'
    });

  } catch (error) {
    console.error('Workflow API error:', error);
    return NextResponse.json(
      { error: 'Failed to delete workflow rule' },
      { status: 500 }
    );
  }
}