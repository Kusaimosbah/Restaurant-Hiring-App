// Test navigation page for Ahmed's UI components
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function TestIndex() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🧪 Ahmed's UI Components Test Suite
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Testing the UI components developed by Ahmed in isolation
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Business Profile Test */}
          <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Business Profile
              </h3>
              <p className="text-gray-600 mb-6">
                Test the restaurant business profile management component with forms for business details, address, locations, photos, and payment info.
              </p>
              <Link href="/test/business-profile">
                <Button variant="primary" size="lg" className="w-full">
                  Test Business Profile
                </Button>
              </Link>
            </div>
          </div>

          {/* Job Seeker Profile Test */}
          <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Job Seeker Profile
              </h3>
              <p className="text-gray-600 mb-6">
                Test the worker/job seeker profile component with forms for personal information, skills, certifications, and work preferences.
              </p>
              <Link href="/test/job-seeker-profile">
                <Button variant="primary" size="lg" className="w-full">
                  Test Job Seeker Profile
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="text-center mt-12">
          <div className="bg-white rounded-lg p-6 max-w-2xl mx-auto shadow-sm">
            <h4 className="text-lg font-semibold text-gray-900 mb-2">
              📋 Testing Status
            </h4>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center justify-center space-x-2">
                <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                <span>Build: Successful</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                <span>Dev Server: Running on localhost:3002</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
                <span>API Dependencies: Mocked for UI testing</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}