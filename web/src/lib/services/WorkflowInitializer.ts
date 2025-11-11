import { WorkflowEngine } from '@/lib/services/WorkflowEngine';
import { DefaultWorkflowRules } from '@/lib/services/DefaultWorkflowRules';

/**
 * Workflow Initialization Service
 * Handles setup of workflow automation for new restaurants
 */
export class WorkflowInitializer {
  private workflowEngine: WorkflowEngine;

  constructor() {
    this.workflowEngine = WorkflowEngine.getInstance();
  }

  /**
   * Initialize workflow system for a new restaurant
   */
  async initializeRestaurantWorkflows(restaurantId: string, options: {
    includeDefaults?: boolean;
    includeSeasonal?: boolean;
    customRules?: any[];
  } = {}): Promise<{
    success: boolean;
    rulesCreated: number;
    errors: string[];
  }> {
    const {
      includeDefaults = true,
      includeSeasonal = false,
      customRules = []
    } = options;

    const result = {
      success: true,
      rulesCreated: 0,
      errors: [] as string[]
    };

    try {
      // Create default rules if requested
      if (includeDefaults) {
        try {
          const defaultRules = await DefaultWorkflowRules.createDefaultRules(restaurantId);
          result.rulesCreated += defaultRules.length;
          console.log(`Created ${defaultRules.length} default workflow rules for restaurant ${restaurantId}`);
        } catch (error) {
          result.errors.push(`Failed to create default rules: ${error instanceof Error ? error.message : 'Unknown error'}`);
          result.success = false;
        }
      }

      // Create seasonal rules if requested
      if (includeSeasonal) {
        try {
          const seasonalRules = await DefaultWorkflowRules.createSeasonalRules(restaurantId);
          result.rulesCreated += seasonalRules.length;
          console.log(`Created ${seasonalRules.length} seasonal workflow rules for restaurant ${restaurantId}`);
        } catch (error) {
          result.errors.push(`Failed to create seasonal rules: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Create custom rules if provided
      if (customRules.length > 0) {
        for (const customRule of customRules) {
          try {
            await this.workflowEngine.createRule({
              ...customRule,
              restaurantId
            });
            result.rulesCreated++;
          } catch (error) {
            result.errors.push(`Failed to create custom rule "${customRule.name}": ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      }

      return result;

    } catch (error) {
      result.success = false;
      result.errors.push(`Workflow initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return result;
    }
  }

  /**
   * Get recommended workflow setup based on restaurant type
   */
  getRecommendedSetup(restaurantType: 'fast_food' | 'casual_dining' | 'fine_dining' | 'cafe' | 'food_truck'): {
    includeDefaults: boolean;
    includeSeasonal: boolean;
    recommendedTemplates: string[];
    description: string;
  } {
    const setups = {
      fast_food: {
        includeDefaults: true,
        includeSeasonal: true,
        recommendedTemplates: ['Quick Response Rule', 'Bulk Hiring Campaign'],
        description: 'Fast-paced environment with high-volume hiring needs'
      },
      casual_dining: {
        includeDefaults: true,
        includeSeasonal: true,
        recommendedTemplates: ['Skills Match Alert', 'Quick Response Rule'],
        description: 'Balanced approach with focus on skill matching and timely responses'
      },
      fine_dining: {
        includeDefaults: true,
        includeSeasonal: false,
        recommendedTemplates: ['Skills Match Alert'],
        description: 'Quality-focused hiring with emphasis on experience and skills'
      },
      cafe: {
        includeDefaults: true,
        includeSeasonal: true,
        recommendedTemplates: ['Quick Response Rule'],
        description: 'Community-focused with seasonal variations'
      },
      food_truck: {
        includeDefaults: true,
        includeSeasonal: true,
        recommendedTemplates: ['Bulk Hiring Campaign', 'Quick Response Rule'],
        description: 'Mobile business with seasonal and event-based hiring needs'
      }
    };

    return setups[restaurantType] || setups.casual_dining;
  }

  /**
   * Migrate existing restaurant to workflow system
   */
  async migrateToWorkflowSystem(restaurantId: string): Promise<{
    success: boolean;
    message: string;
    rulesCreated: number;
  }> {
    try {
      // Check if restaurant already has workflows
      const existingRules = await this.workflowEngine.getRules(restaurantId);
      
      if (existingRules.length > 0) {
        return {
          success: true,
          message: `Restaurant already has ${existingRules.length} workflow rules configured`,
          rulesCreated: 0
        };
      }

      // Initialize with default setup
      const result = await this.initializeRestaurantWorkflows(restaurantId, {
        includeDefaults: true,
        includeSeasonal: false
      });

      return {
        success: result.success,
        message: result.success 
          ? `Successfully migrated restaurant to workflow system with ${result.rulesCreated} rules`
          : `Migration partially failed: ${result.errors.join(', ')}`,
        rulesCreated: result.rulesCreated
      };

    } catch (error) {
      return {
        success: false,
        message: `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        rulesCreated: 0
      };
    }
  }

  /**
   * Validate workflow configuration for a restaurant
   */
  async validateWorkflowConfiguration(restaurantId: string): Promise<{
    isValid: boolean;
    warnings: string[];
    recommendations: string[];
    ruleCount: number;
    activeRuleCount: number;
  }> {
    try {
      const rules = await this.workflowEngine.getRules(restaurantId);
      const activeRules = rules.filter(rule => rule.isActive);

      const warnings: string[] = [];
      const recommendations: string[] = [];

      // Check for basic coverage
      const hasApplicationRules = rules.some(rule => rule.eventType === 'APPLICATION_SUBMITTED');
      const hasAcceptanceRules = rules.some(rule => rule.eventType === 'APPLICATION_ACCEPTED');
      const hasRejectionRules = rules.some(rule => rule.eventType === 'APPLICATION_REJECTED');

      if (!hasApplicationRules) {
        warnings.push('No rules configured for application submissions');
        recommendations.push('Add acknowledgment rule for new applications');
      }

      if (!hasAcceptanceRules) {
        recommendations.push('Consider adding welcome message for accepted applications');
      }

      if (!hasRejectionRules) {
        recommendations.push('Add professional rejection notice rule');
      }

      // Check for rule conflicts (multiple high-priority rules for same event)
      const eventGroups = rules.reduce((groups, rule) => {
        if (!groups[rule.eventType]) groups[rule.eventType] = [];
        groups[rule.eventType].push(rule);
        return groups;
      }, {} as Record<string, typeof rules>);

      Object.entries(eventGroups).forEach(([eventType, eventRules]) => {
        const highPriorityRules = eventRules.filter(rule => rule.priority >= 8);
        if (highPriorityRules.length > 3) {
          warnings.push(`Many high-priority rules for ${eventType} may cause delays`);
        }
      });

      // Check for inactive rules
      const inactiveCount = rules.length - activeRules.length;
      if (inactiveCount > 0) {
        recommendations.push(`You have ${inactiveCount} inactive rules that could be enabled or deleted`);
      }

      return {
        isValid: warnings.length === 0,
        warnings,
        recommendations,
        ruleCount: rules.length,
        activeRuleCount: activeRules.length
      };

    } catch (error) {
      return {
        isValid: false,
        warnings: [`Failed to validate configuration: ${error instanceof Error ? error.message : 'Unknown error'}`],
        recommendations: ['Check workflow system status and try again'],
        ruleCount: 0,
        activeRuleCount: 0
      };
    }
  }
}