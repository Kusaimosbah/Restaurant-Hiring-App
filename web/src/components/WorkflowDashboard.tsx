import React, { useState } from 'react';
import { useWorkflows, useWorkflowAnalytics, useWorkflowBuilder } from '@/hooks/useWorkflows';
import { WorkflowRule, WorkflowEventType, WorkflowActionType } from '@/lib/services/WorkflowEngine';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { KPIGrid } from '@/components/ui/KPICard';
import { LineChart, BarChart } from '@/components/ui/Charts';

interface WorkflowDashboardProps {
  className?: string;
}

/**
 * Workflow Management Dashboard
 * Comprehensive workflow automation management interface
 */
export const WorkflowDashboard: React.FC<WorkflowDashboardProps> = ({
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'rules' | 'builder' | 'executions'>('overview');
  const [selectedRule, setSelectedRule] = useState<WorkflowRule | null>(null);
  const [showBuilder, setShowBuilder] = useState(false);

  const {
    rules,
    executions,
    loading,
    error,
    createRule,
    updateRule,
    deleteRule,
    triggerEvent,
    refreshRules,
    refreshExecutions
  } = useWorkflows();

  const { analytics, loading: analyticsLoading } = useWorkflowAnalytics();

  const renderOverviewTab = () => {
    if (analyticsLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading analytics...</span>
        </div>
      );
    }

    // KPI cards
    const kpis = [
      {
        title: 'Total Rules',
        value: analytics.totalRules,
        subtitle: `${analytics.activeRules} active`,
        color: 'blue' as const,
        icon: <RulesIcon />
      },
      {
        title: 'Total Executions',
        value: analytics.totalExecutions,
        subtitle: 'All time',
        color: 'green' as const,
        icon: <ExecutionsIcon />
      },
      {
        title: 'Success Rate',
        value: `${((analytics.successfulExecutions / analytics.totalExecutions) * 100).toFixed(1)}%`,
        subtitle: `${analytics.failedExecutions} failed`,
        color: 'purple' as const,
        icon: <SuccessIcon />
      },
      {
        title: 'Avg Execution Time',
        value: `${analytics.avgExecutionTime}s`,
        subtitle: 'Per workflow',
        color: 'yellow' as const,
        icon: <TimeIcon />
      }
    ];

    // Chart data
    const trendChartData = {
      labels: analytics.executionTrends.map(trend => 
        new Date(trend.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      ),
      datasets: [
        {
          label: 'Total Executions',
          data: analytics.executionTrends.map(trend => trend.executions),
          borderColor: '#3b82f6',
          backgroundColor: '#3b82f620',
          tension: 0.4
        },
        {
          label: 'Successful',
          data: analytics.executionTrends.map(trend => trend.successful),
          borderColor: '#10b981',
          backgroundColor: '#10b98120',
          tension: 0.4
        },
        {
          label: 'Failed',
          data: analytics.executionTrends.map(trend => trend.failed),
          borderColor: '#ef4444',
          backgroundColor: '#ef444420',
          tension: 0.4
        }
      ]
    };

    const eventsChartData = {
      labels: analytics.mostTriggeredEvents.map(event => 
        event.eventType.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
      ),
      datasets: [{
        label: 'Event Count',
        data: analytics.mostTriggeredEvents.map(event => event.count),
        backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
      }]
    };

    return (
      <div className="space-y-6">
        {/* KPI Cards */}
        <KPIGrid kpis={kpis} columns={4} />

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Execution Trends</h3>
            <LineChart
              data={trendChartData}
              width={500}
              height={300}
              className="w-full"
            />
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Most Triggered Events</h3>
            <BarChart
              data={eventsChartData}
              width={500}
              height={300}
              className="w-full"
            />
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={() => setActiveTab('builder')}
              className="h-20 flex flex-col items-center justify-center"
            >
              <span className="text-2xl mb-1">➕</span>
              Create New Rule
            </Button>
            <Button
              variant="outline"
              onClick={() => setActiveTab('rules')}
              className="h-20 flex flex-col items-center justify-center"
            >
              <span className="text-2xl mb-1">⚙️</span>
              Manage Rules
            </Button>
            <Button
              variant="outline"
              onClick={() => setActiveTab('executions')}
              className="h-20 flex flex-col items-center justify-center"
            >
              <span className="text-2xl mb-1">📊</span>
              View Executions
            </Button>
          </div>
        </Card>
      </div>
    );
  };

  const renderRulesTab = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading rules...</span>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">Workflow Rules</h3>
            <p className="text-gray-600">Manage your automation rules</p>
          </div>
          <Button onClick={() => setShowBuilder(true)}>
            Create New Rule
          </Button>
        </div>

        {/* Rules List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {rules.map((rule) => (
            <WorkflowRuleCard
              key={rule.id}
              rule={rule}
              onEdit={() => {
                setSelectedRule(rule);
                setShowBuilder(true);
              }}
              onDelete={() => deleteRule(rule.id)}
              onToggle={(isActive) => updateRule(rule.id, { isActive })}
            />
          ))}
        </div>

        {rules.length === 0 && (
          <Card className="p-12 text-center">
            <div className="text-6xl mb-4">🤖</div>
            <h3 className="text-xl font-semibold mb-2">No Workflow Rules Yet</h3>
            <p className="text-gray-600 mb-4">
              Create your first automation rule to streamline your hiring process
            </p>
            <Button onClick={() => setShowBuilder(true)}>
              Create Your First Rule
            </Button>
          </Card>
        )}
      </div>
    );
  };

  const renderBuilderTab = () => {
    return (
      <WorkflowBuilder
        rule={selectedRule}
        onSave={async (rule) => {
          if (selectedRule) {
            await updateRule(selectedRule.id, rule);
          } else {
            await createRule(rule);
          }
          setShowBuilder(false);
          setSelectedRule(null);
        }}
        onCancel={() => {
          setShowBuilder(false);
          setSelectedRule(null);
        }}
      />
    );
  };

  const renderExecutionsTab = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading executions...</span>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">Workflow Executions</h3>
            <p className="text-gray-600">Recent workflow execution history</p>
          </div>
          <Button variant="outline" onClick={refreshExecutions}>
            Refresh
          </Button>
        </div>

        {/* Executions Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Event
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Started
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {executions.map((execution) => (
                  <tr key={execution.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">
                        {execution.eventType.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <ExecutionStatusBadge status={execution.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {execution.executedActions.length} actions
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {execution.startedAt.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {execution.completedAt
                        ? `${Math.round((execution.completedAt.getTime() - execution.startedAt.getTime()) / 1000)}s`
                        : '-'
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {executions.length === 0 && (
          <Card className="p-12 text-center">
            <div className="text-6xl mb-4">📈</div>
            <h3 className="text-xl font-semibold mb-2">No Executions Yet</h3>
            <p className="text-gray-600">
              Workflow executions will appear here once your rules start triggering
            </p>
          </Card>
        )}
      </div>
    );
  };

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={refreshRules} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Workflow Automation</h1>
          <p className="text-gray-600 mt-1">Automate your hiring processes with intelligent workflows</p>
        </div>
        <Button onClick={() => setShowBuilder(true)}>
          Create New Rule
        </Button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'rules', label: 'Rules', icon: '⚙️' },
            { id: 'builder', label: 'Builder', icon: '🔧' },
            { id: 'executions', label: 'Executions', icon: '📈' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[600px]">
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'rules' && renderRulesTab()}
        {activeTab === 'builder' && renderBuilderTab()}
        {activeTab === 'executions' && renderExecutionsTab()}
      </div>

      {/* Builder Modal */}
      {showBuilder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {renderBuilderTab()}
          </div>
        </div>
      )}
    </div>
  );
};

// Component Icons
const RulesIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
  </svg>
);

const ExecutionsIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const SuccessIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const TimeIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

// Supporting Components
interface WorkflowRuleCardProps {
  rule: WorkflowRule;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: (isActive: boolean) => void;
}

const WorkflowRuleCard: React.FC<WorkflowRuleCardProps> = ({
  rule,
  onEdit,
  onDelete,
  onToggle
}) => {
  return (
    <Card className="p-6">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-semibold text-gray-900">{rule.name}</h4>
            <span className={`px-2 py-1 text-xs rounded-full ${
              rule.isActive 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              {rule.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-2">{rule.description}</p>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span>Event: {rule.eventType.replace('_', ' ')}</span>
            <span>Actions: {rule.actions.length}</span>
            <span>Priority: {rule.priority}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggle(!rule.isActive)}
            className={`w-8 h-4 rounded-full transition-colors ${
              rule.isActive ? 'bg-green-500' : 'bg-gray-300'
            }`}
          >
            <div className={`w-3 h-3 bg-white rounded-full transition-transform ${
              rule.isActive ? 'translate-x-4' : 'translate-x-0'
            }`} />
          </button>
        </div>
      </div>
      
      <div className="flex justify-end gap-2">
        <Button size="sm" variant="outline" onClick={onEdit}>
          Edit
        </Button>
        <Button size="sm" variant="outline" onClick={onDelete}>
          Delete
        </Button>
      </div>
    </Card>
  );
};

interface ExecutionStatusBadgeProps {
  status: string;
}

const ExecutionStatusBadge: React.FC<ExecutionStatusBadgeProps> = ({ status }) => {
  const colors = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    RUNNING: 'bg-blue-100 text-blue-800',
    COMPLETED: 'bg-green-100 text-green-800',
    FAILED: 'bg-red-100 text-red-800',
    CANCELLED: 'bg-gray-100 text-gray-800'
  };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[status as keyof typeof colors] || colors.PENDING}`}>
      {status}
    </span>
  );
};

// Workflow Builder Component (simplified for now)
interface WorkflowBuilderProps {
  rule: WorkflowRule | null;
  onSave: (rule: Omit<WorkflowRule, 'id' | 'createdAt' | 'updatedAt' | 'restaurantId'>) => void;
  onCancel: () => void;
}

const WorkflowBuilder: React.FC<WorkflowBuilderProps> = ({ rule, onSave, onCancel }) => {
  const { rule: builderRule, updateRule, validateRule } = useWorkflowBuilder();

  React.useEffect(() => {
    if (rule) {
      updateRule(rule);
    }
  }, [rule, updateRule]);

  const handleSave = () => {
    const errors = validateRule();
    if (errors.length > 0) {
      alert('Please fix the following errors:\n' + errors.join('\n'));
      return;
    }

    onSave(builderRule as any);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">
          {rule ? 'Edit Workflow Rule' : 'Create Workflow Rule'}
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={handleSave}>Save Rule</Button>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rule Name
          </label>
          <input
            type="text"
            value={builderRule.name || ''}
            onChange={(e) => updateRule({ name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter rule name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={builderRule.description || ''}
            onChange={(e) => updateRule({ description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="Describe what this rule does"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Trigger Event
          </label>
          <select
            value={builderRule.eventType || ''}
            onChange={(e) => updateRule({ eventType: e.target.value as WorkflowEventType })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="APPLICATION_SUBMITTED">Application Submitted</option>
            <option value="APPLICATION_VIEWED">Application Viewed</option>
            <option value="APPLICATION_ACCEPTED">Application Accepted</option>
            <option value="APPLICATION_REJECTED">Application Rejected</option>
            <option value="INTERVIEW_SCHEDULED">Interview Scheduled</option>
            <option value="JOB_POSTED">Job Posted</option>
          </select>
        </div>

        {/* Simplified builder - in production would have full condition/action builders */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">
            Full workflow builder with conditions and actions coming soon. 
            For now, basic rules are created with default actions.
          </p>
        </div>
      </div>
    </div>
  );
};