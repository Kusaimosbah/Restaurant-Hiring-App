import Link from 'next/link'

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg px-8 py-12">
          <div className="mb-8">
            <Link 
              href="/auth/signin" 
              className="text-indigo-600 hover:text-indigo-500 flex items-center mb-4"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Sign In
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Terms of Service</h1>
            <p className="text-gray-600 mt-2">Last updated: October 28, 2025</p>
          </div>

          <div className="prose prose-lg max-w-none">
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing and using the Restaurant Hiring App ("Service"), you accept and agree to be bound by the terms and provision of this agreement.
            </p>

            <h2>2. Description of Service</h2>
            <p>
              Restaurant Hiring App is a platform that connects restaurants with skilled workers in the hospitality industry. We provide tools for job posting, candidate matching, application management, and related services.
            </p>

            <h2>3. User Registration</h2>
            <p>
              To use our Service, you must:
            </p>
            <ul>
              <li>Be at least 18 years old</li>
              <li>Provide accurate and complete registration information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Accept responsibility for all activities under your account</li>
            </ul>

            <h2>4. User Responsibilities</h2>
            <h3>For Restaurant Owners:</h3>
            <ul>
              <li>Provide accurate job descriptions and requirements</li>
              <li>Comply with all applicable employment laws</li>
              <li>Treat all candidates fairly and without discrimination</li>
              <li>Honor posted compensation and working conditions</li>
            </ul>

            <h3>For Workers:</h3>
            <ul>
              <li>Provide accurate work history and qualifications</li>
              <li>Show up for scheduled interviews and shifts</li>
              <li>Maintain professional conduct at all times</li>
              <li>Comply with workplace policies and regulations</li>
            </ul>

            <h2>5. Prohibited Uses</h2>
            <p>You may not use our Service to:</p>
            <ul>
              <li>Post false or misleading information</li>
              <li>Engage in discriminatory practices</li>
              <li>Violate any applicable laws or regulations</li>
              <li>Harass, abuse, or harm other users</li>
              <li>Attempt to gain unauthorized access to our systems</li>
            </ul>

            <h2>6. Privacy and Data Protection</h2>
            <p>
              Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the Service, to understand our practices.
            </p>

            <h2>7. Payment Terms</h2>
            <p>
              Certain features of our Service may require payment. You agree to provide current, complete, and accurate purchase and account information for all purchases made through the Service.
            </p>

            <h2>8. Intellectual Property</h2>
            <p>
              The Service and its original content, features, and functionality are and will remain the exclusive property of Restaurant Hiring App and its licensors.
            </p>

            <h2>9. Termination</h2>
            <p>
              We may terminate or suspend your account and bar access to the Service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever including without limitation if you breach the Terms.
            </p>

            <h2>10. Limitation of Liability</h2>
            <p>
              In no event shall Restaurant Hiring App, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential, or punitive damages.
            </p>

            <h2>11. Changes to Terms</h2>
            <p>
              We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days notice prior to any new terms taking effect.
            </p>

            <h2>12. Contact Information</h2>
            <p>
              If you have any questions about these Terms, please contact us at:
            </p>
            <ul>
              <li>Email: legal@restauranthiring.com</li>
              <li>Phone: 1-800-HIRE-NOW</li>
              <li>Address: 123 Business Ave, Suite 100, City, State 12345</li>
            </ul>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              By continuing to use our service, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}