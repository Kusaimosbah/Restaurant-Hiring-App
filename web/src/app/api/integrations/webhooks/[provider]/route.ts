import { NextRequest, NextResponse } from 'next/server';
import { IntegrationService } from '@/lib/services/IntegrationService';
import crypto from 'crypto';

/**
 * Integration Webhooks API
 * Handles incoming webhooks from third-party integrations
 */

const integrationService = new IntegrationService();

/**
 * Handle incoming webhook from integration provider
 * POST /api/integrations/webhooks/[provider]
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { provider: string } }
) {
  try {
    const provider = params.provider.toLowerCase();
    const body = await request.text();
    const signature = request.headers.get('signature') || 
                     request.headers.get('x-signature') ||
                     request.headers.get('x-hub-signature') ||
                     request.headers.get('x-webhook-signature');
    
    // Get webhook event data
    let eventData;
    try {
      eventData = JSON.parse(body);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    // Verify webhook signature if provided
    if (signature) {
      const isValid = await verifyWebhookSignature(
        provider,
        body,
        signature,
        eventData.integrationId || eventData.restaurant_id
      );
      
      if (!isValid) {
        return NextResponse.json(
          { error: 'Invalid webhook signature' },
          { status: 401 }
        );
      }
    }

    // Process webhook based on provider
    const result = await processWebhook(provider, eventData);
    
    if (!result.success) {
      console.error(`Webhook processing failed for ${provider}:`, result.error);
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    // Return success response
    return NextResponse.json({
      received: true,
      processed: result.processed,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * Verify webhook signature
 */
async function verifyWebhookSignature(
  provider: string,
  body: string,
  signature: string,
  integrationId?: string
): Promise<boolean> {
  try {
    // In production, you would get the secret from the integration's configuration
    const secret = process.env.WEBHOOK_SECRET || 'default-secret';
    
    let expectedSignature = '';
    
    switch (provider) {
      case 'greenhouse':
        // Greenhouse uses HMAC SHA-256
        expectedSignature = crypto
          .createHmac('sha256', secret)
          .update(body)
          .digest('hex');
        return `sha256=${expectedSignature}` === signature;
        
      case 'workday':
        // Workday uses HMAC SHA-256
        expectedSignature = crypto
          .createHmac('sha256', secret)
          .update(body)
          .digest('base64');
        return expectedSignature === signature;
        
      case 'checkr':
        // Checkr uses HMAC SHA-256
        expectedSignature = crypto
          .createHmac('sha256', secret)
          .update(body)
          .digest('hex');
        return expectedSignature === signature;
        
      default:
        // Generic HMAC SHA-256 verification
        expectedSignature = crypto
          .createHmac('sha256', secret)
          .update(body)
          .digest('hex');
        return expectedSignature === signature.replace('sha256=', '');
    }
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

/**
 * Process webhook based on provider type
 */
async function processWebhook(
  provider: string,
  eventData: any
): Promise<{ success: boolean; processed?: string; error?: string }> {
  try {
    switch (provider) {
      case 'greenhouse':
        return await processGreenhouseWebhook(eventData);
        
      case 'workday':
        return await processWorkdayWebhook(eventData);
        
      case 'checkr':
        return await processCheckrWebhook(eventData);
        
      case 'sterling':
        return await processSterlingWebhook(eventData);
        
      case 'quickbooks':
        return await processQuickBooksWebhook(eventData);
        
      case 'gusto':
        return await processGustoWebhook(eventData);
        
      case 'bamboohr':
        return await processBambooHRWebhook(eventData);
        
      default:
        return {
          success: false,
          error: `Unsupported provider: ${provider}`
        };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Provider-specific webhook processors
 */

async function processGreenhouseWebhook(eventData: any) {
  const { action, payload } = eventData;
  
  switch (action) {
    case 'candidate_hired':
      // Process new hire from Greenhouse
      console.log('Processing Greenhouse hire:', payload.candidate);
      return { success: true, processed: 'candidate_hired' };
      
    case 'application_submitted':
      // Process new application
      console.log('Processing Greenhouse application:', payload.application);
      return { success: true, processed: 'application_submitted' };
      
    default:
      console.log(`Unhandled Greenhouse event: ${action}`);
      return { success: true, processed: `unhandled_${action}` };
  }
}

async function processWorkdayWebhook(eventData: any) {
  const { eventType, data } = eventData;
  
  switch (eventType) {
    case 'worker.hired':
      // Process new employee from Workday
      console.log('Processing Workday hire:', data.worker);
      return { success: true, processed: 'worker_hired' };
      
    case 'worker.terminated':
      // Process employee termination
      console.log('Processing Workday termination:', data.worker);
      return { success: true, processed: 'worker_terminated' };
      
    default:
      console.log(`Unhandled Workday event: ${eventType}`);
      return { success: true, processed: `unhandled_${eventType}` };
  }
}

async function processCheckrWebhook(eventData: any) {
  const { type, data } = eventData;
  
  switch (type) {
    case 'report.completed':
      // Background check completed
      console.log('Processing Checkr report completion:', data.object);
      return { success: true, processed: 'report_completed' };
      
    case 'report.disputed':
      // Background check disputed
      console.log('Processing Checkr report dispute:', data.object);
      return { success: true, processed: 'report_disputed' };
      
    default:
      console.log(`Unhandled Checkr event: ${type}`);
      return { success: true, processed: `unhandled_${type}` };
  }
}

async function processSterlingWebhook(eventData: any) {
  const { eventType, candidate } = eventData;
  
  switch (eventType) {
    case 'background_check_complete':
      console.log('Processing Sterling background check completion:', candidate);
      return { success: true, processed: 'background_check_complete' };
      
    default:
      console.log(`Unhandled Sterling event: ${eventType}`);
      return { success: true, processed: `unhandled_${eventType}` };
  }
}

async function processQuickBooksWebhook(eventData: any) {
  const { eventNotifications } = eventData;
  
  for (const notification of eventNotifications || []) {
    const { realmId, dataChangeEvent } = notification;
    
    for (const entity of dataChangeEvent.entities || []) {
      console.log(`Processing QuickBooks ${entity.operation} for ${entity.name}:`, entity);
    }
  }
  
  return { success: true, processed: 'quickbooks_entities' };
}

async function processGustoWebhook(eventData: any) {
  const { event_type, resource } = eventData;
  
  switch (event_type) {
    case 'employee.created':
      console.log('Processing Gusto employee creation:', resource);
      return { success: true, processed: 'employee_created' };
      
    case 'payroll.processed':
      console.log('Processing Gusto payroll:', resource);
      return { success: true, processed: 'payroll_processed' };
      
    default:
      console.log(`Unhandled Gusto event: ${event_type}`);
      return { success: true, processed: `unhandled_${event_type}` };
  }
}

async function processBambooHRWebhook(eventData: any) {
  const { type, employee } = eventData;
  
  switch (type) {
    case 'employee_added':
      console.log('Processing BambooHR employee addition:', employee);
      return { success: true, processed: 'employee_added' };
      
    case 'employee_updated':
      console.log('Processing BambooHR employee update:', employee);
      return { success: true, processed: 'employee_updated' };
      
    default:
      console.log(`Unhandled BambooHR event: ${type}`);
      return { success: true, processed: `unhandled_${type}` };
  }
}