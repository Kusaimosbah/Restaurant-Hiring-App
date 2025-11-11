'use client';

import React, { useState } from 'react';
import { JobRecommendations } from '@/components/JobRecommendations';
import { WorkerCandidates } from '@/components/WorkerCandidates';
import { MatchingAnalyticsDashboard } from '@/components/MatchingAnalyticsDashboard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function JobMatchingPage() {
  const [activeTab, setActiveTab] = useState('recommendations');
  const [selectedJob, setSelectedJob] = useState<any>(null);
  
  // Mock data - replace with actual user session data
  const userRole = 'WORKER'; // or 'RESTAURANT_OWNER' or 'ADMIN'
  const userId = 'user-123';
  const workerId = 'worker-123';
  const restaurantId = 'restaurant-123';
  
  // Mock jobs data
  const mockJobs = [
    {
      id: 'job-1',
      title: 'Server - Downtown Location',
      restaurant: { name: 'Bella Vista Restaurant' },
      hourlyRate: 18,
    },
    {
      id: 'job-2', 
      title: 'Line Cook - Evening Shift',
      restaurant: { name: 'The Grill House' },
      hourlyRate: 22,
    },
    {
      id: 'job-3',
      title: 'Host/Hostess - Weekend',
      restaurant: { name: 'Sunset Cafe' },
      hourlyRate: 16,
    },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'recommendations':
        if (userRole === 'WORKER') {
          return <JobRecommendations workerId={workerId} userRole={userRole} />;
        } else {
          return (
            <Card className="p-8 text-center">
              <div className="text-gray-500 mb-2">Job Recommendations</div>
              <p className="text-sm text-gray-400">
                Job recommendations are available for workers only.
              </p>
            </Card>
          );
        }
      
      case 'candidates':
        if (userRole === 'RESTAURANT_OWNER' || userRole === 'ADMIN') {
          return (
            <div className="space-y-6">
              {!selectedJob ? (
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Select a Job to View Candidates</h3>
                  <div className="grid gap-4">
                    {mockJobs.map((job) => (
                      <div 
                        key={job.id}
                        className="flex justify-between items-center p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                        onClick={() => setSelectedJob(job)}
                      >
                        <div>
                          <div className="font-medium">{job.title}</div>
                          <div className="text-sm text-gray-500">{job.restaurant.name} • ${job.hourlyRate}/hr</div>
                        </div>
                        <Button size="sm">View Candidates</Button>
                      </div>
                    ))}
                  </div>
                </Card>
              ) : (
                <div>
                  <div className="flex items-center gap-4 mb-6">
                    <Button 
                      variant="outline" 
                      onClick={() => setSelectedJob(null)}
                    >
                      ← Back to Jobs
                    </Button>
                    <div>
                      <h2 className="text-xl font-semibold">{selectedJob.title}</h2>
                      <p className="text-gray-600">{selectedJob.restaurant.name}</p>
                    </div>
                  </div>
                  <WorkerCandidates
                    jobId={selectedJob.id}
                    jobTitle={selectedJob.title}
                    restaurantName={selectedJob.restaurant.name}
                  />
                </div>
              )}
            </div>
          );
        } else {
          return (
            <Card className="p-8 text-center">
              <div className="text-gray-500 mb-2">Worker Candidates</div>
              <p className="text-sm text-gray-400">
                Candidate recommendations are available for restaurant owners only.
              </p>
            </Card>
          );
        }
      
      case 'analytics':
        if (userRole === 'ADMIN' || userRole === 'RESTAURANT_OWNER') {
          return (
            <MatchingAnalyticsDashboard
              restaurantId={userRole === 'RESTAURANT_OWNER' ? restaurantId : undefined}
            />
          );
        } else {
          return (
            <Card className="p-8 text-center">
              <div className="text-gray-500 mb-2">Matching Analytics</div>
              <p className="text-sm text-gray-400">
                Analytics are available for restaurant owners and administrators only.
              </p>
            </Card>
          );
        }
      
      case 'demo':
        return <JobMatchingDemo />;
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">AI-Powered Job Matching</h1>
          <p className="mt-2 text-gray-600">
            Advanced machine learning algorithms to match the right workers with the right jobs
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('recommendations')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'recommendations'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Job Recommendations
            </button>
            <button
              onClick={() => setActiveTab('candidates')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'candidates'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Worker Candidates
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'analytics'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Analytics
            </button>
            <button
              onClick={() => setActiveTab('demo')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'demo'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Demo
            </button>
          </nav>
        </div>

        {/* Content */}
        {renderContent()}
      </div>
    </div>
  );
}

function JobMatchingDemo() {
  const [demoStep, setDemoStep] = useState(0);

  const demoSteps = [
    {
      title: "AI-Powered Analysis",
      description: "Our advanced algorithms analyze 50+ factors including skills, experience, location, availability, salary expectations, and cultural fit.",
      features: [
        "Machine learning skill matching",
        "Geographic distance calculation", 
        "Schedule compatibility analysis",
        "Salary expectation alignment",
        "Cultural fit assessment",
        "Historical performance data"
      ]
    },
    {
      title: "Smart Recommendations",
      description: "Get personalized job recommendations or candidate suggestions with detailed compatibility scores and actionable insights.",
      features: [
        "Personalized match scores (0-100%)",
        "Detailed breakdown by category",
        "Confidence ratings",
        "Improvement recommendations",
        "Real-time updates",
        "Filtering and sorting options"
      ]
    },
    {
      title: "Actionable Insights",
      description: "Understand why matches work and get specific recommendations for improving compatibility and hiring success.",
      features: [
        "Match reasoning explanations",
        "Skills gap analysis",
        "Training recommendations",
        "Salary negotiation insights",
        "Timeline optimization",
        "Success probability metrics"
      ]
    },
    {
      title: "Performance Analytics",
      description: "Track matching effectiveness, application rates, hire success, and optimize your hiring process with data-driven insights.",
      features: [
        "Conversion rate tracking",
        "Hire success analytics",
        "Performance trend analysis", 
        "ROI measurement",
        "A/B testing capabilities",
        "Custom reporting dashboards"
      ]
    }
  ];

  return (
    <div className="space-y-8">
      {/* Demo Header */}
      <Card className="p-8 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4">Advanced Job Matching System</h2>
          <p className="text-xl opacity-90 mb-6">
            Revolutionizing restaurant hiring with AI-powered matching technology
          </p>
          <div className="flex justify-center space-x-4">
            <div className="bg-white/20 rounded-lg p-4">
              <div className="text-2xl font-bold">95%</div>
              <div className="text-sm">Match Accuracy</div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="text-2xl font-bold">60%</div>
              <div className="text-sm">Faster Hiring</div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="text-2xl font-bold">40%</div>
              <div className="text-sm">Better Retention</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Demo Steps */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {demoSteps.map((step, index) => (
          <button
            key={index}
            onClick={() => setDemoStep(index)}
            className={`p-4 rounded-lg text-left transition-all ${
              demoStep === index
                ? 'bg-blue-500 text-white shadow-lg'
                : 'bg-white border border-gray-200 hover:border-blue-300'
            }`}
          >
            <div className="font-semibold mb-2">{step.title}</div>
            <div className={`text-sm ${demoStep === index ? 'text-blue-100' : 'text-gray-600'}`}>
              {step.description.substring(0, 80)}...
            </div>
          </button>
        ))}
      </div>

      {/* Current Step Detail */}
      <Card className="p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h3 className="text-2xl font-bold mb-4">{demoSteps[demoStep].title}</h3>
            <p className="text-gray-600 mb-6">{demoSteps[demoStep].description}</p>
            
            <h4 className="font-semibold mb-3">Key Features:</h4>
            <ul className="space-y-2">
              {demoSteps[demoStep].features.map((feature, index) => (
                <li key={index} className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-6">
            <h4 className="font-semibold mb-4">Sample Match Analysis</h4>
            <div className="space-y-4">
              <div className="bg-white p-4 rounded border">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">Overall Match Score</span>
                  <span className="text-2xl font-bold text-green-600">87%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '87%' }}></div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-3 rounded border">
                  <div className="text-sm text-gray-600">Skills</div>
                  <div className="font-bold text-blue-600">92%</div>
                </div>
                <div className="bg-white p-3 rounded border">
                  <div className="text-sm text-gray-600">Experience</div>
                  <div className="font-bold text-blue-600">85%</div>
                </div>
                <div className="bg-white p-3 rounded border">
                  <div className="text-sm text-gray-600">Location</div>
                  <div className="font-bold text-yellow-600">78%</div>
                </div>
                <div className="bg-white p-3 rounded border">
                  <div className="text-sm text-gray-600">Salary</div>
                  <div className="font-bold text-green-600">94%</div>
                </div>
              </div>
              
              <div className="bg-blue-50 p-4 rounded">
                <div className="text-sm font-medium text-blue-800 mb-2">Key Insights:</div>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Strong skills match (8/10 required skills)</li>
                  <li>• Salary expectations align perfectly</li>
                  <li>• Consider transportation assistance</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Technology Stack */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Technology Stack</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl mb-2">🤖</div>
            <div className="font-medium">Machine Learning</div>
            <div className="text-sm text-gray-600">TensorFlow & Scikit-learn</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl mb-2">🧠</div>
            <div className="font-medium">NLP Processing</div>
            <div className="text-sm text-gray-600">Skills & Requirements Analysis</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl mb-2">📊</div>
            <div className="font-medium">Real-time Analytics</div>
            <div className="text-sm text-gray-600">Performance Tracking</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl mb-2">⚡</div>
            <div className="font-medium">High Performance</div>
            <div className="text-sm text-gray-600">Sub-second Matching</div>
          </div>
        </div>
      </Card>
    </div>
  );
}