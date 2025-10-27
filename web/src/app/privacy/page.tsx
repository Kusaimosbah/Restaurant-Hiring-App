import Link from 'next/link'

export default function PrivacyPolicy() {
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
            <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
            <p className="text-gray-600 mt-2">Last updated: October 28, 2025</p>
          </div>

          <div className="prose prose-lg max-w-none">
            <h2>1. Information We Collect</h2>
            
            <h3>Personal Information</h3>
            <p>When you register for an account, we collect:</p>
            <ul>
              <li>Name and contact information (email, phone number)</li>
              <li>Account credentials (email and encrypted password)</li>
              <li>Profile information (work experience, skills, certifications)</li>
              <li>Business information (for restaurant owners)</li>
            </ul>

            <h3>Usage Information</h3>
            <p>We automatically collect information about how you use our Service:</p>
            <ul>
              <li>Log data (IP address, browser type, pages visited)</li>
              <li>Device information (device type, operating system)</li>
              <li>Cookies and similar tracking technologies</li>
              <li>Application and job search activity</li>
            </ul>

            <h2>2. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul>
              <li>Provide, maintain, and improve our Service</li>
              <li>Process transactions and send related information</li>
              <li>Send you technical notices, updates, and support messages</li>
              <li>Respond to your comments, questions, and requests</li>
              <li>Match job seekers with relevant opportunities</li>
              <li>Personalize and improve your experience</li>
              <li>Monitor and analyze usage patterns and trends</li>
              <li>Detect, investigate, and prevent fraudulent or illegal activities</li>
            </ul>

            <h2>3. Information Sharing and Disclosure</h2>
            
            <h3>With Other Users</h3>
            <p>
              When you apply for a job or post a job, certain information from your profile may be shared with the other party to facilitate the hiring process.
            </p>

            <h3>Service Providers</h3>
            <p>
              We may share information with third-party service providers who perform services on our behalf, such as payment processing, data analysis, email delivery, and customer service.
            </p>

            <h3>Legal Requirements</h3>
            <p>
              We may disclose information if required by law or in response to valid legal requests from public authorities.
            </p>

            <h2>4. Data Security</h2>
            <p>
              We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. These measures include:
            </p>
            <ul>
              <li>Encryption of sensitive data in transit and at rest</li>
              <li>Regular security assessments and updates</li>
              <li>Access controls and authentication requirements</li>
              <li>Employee training on data protection practices</li>
            </ul>

            <h2>5. Data Retention</h2>
            <p>
              We retain your personal information for as long as your account is active or as needed to provide you services. We will retain and use your information as necessary to comply with legal obligations, resolve disputes, and enforce our agreements.
            </p>

            <h2>6. Your Rights and Choices</h2>
            
            <h3>Account Information</h3>
            <p>
              You may update, correct, or delete information about you at any time by logging into your account or contacting us.
            </p>

            <h3>Communications</h3>
            <p>
              You may opt out of receiving promotional emails from us by following the instructions in those emails. You may not opt out of service-related communications.
            </p>

            <h3>Cookies</h3>
            <p>
              Most web browsers are set to accept cookies by default. You can usually choose to set your browser to remove or reject cookies.
            </p>

            <h3>Data Portability</h3>
            <p>
              You have the right to request a copy of your personal data in a structured, machine-readable format.
            </p>

            <h3>Deletion</h3>
            <p>
              You have the right to request deletion of your personal information, subject to certain exceptions.
            </p>

            <h2>7. Children's Privacy</h2>
            <p>
              Our Service is not intended for individuals under the age of 18. We do not knowingly collect personal information from children under 18.
            </p>

            <h2>8. International Data Transfers</h2>
            <p>
              Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your information.
            </p>

            <h2>9. Changes to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
            </p>

            <h2>10. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us:
            </p>
            <ul>
              <li>Email: privacy@restauranthiring.com</li>
              <li>Phone: 1-800-HIRE-NOW</li>
              <li>Address: 123 Business Ave, Suite 100, City, State 12345</li>
            </ul>

            <h2>11. Cookie Policy</h2>
            <p>
              We use cookies and similar tracking technologies to provide and improve our Service:
            </p>
            <ul>
              <li><strong>Essential Cookies:</strong> Required for the Service to function properly</li>
              <li><strong>Performance Cookies:</strong> Help us understand how visitors interact with our Service</li>
              <li><strong>Functional Cookies:</strong> Enable enhanced functionality and personalization</li>
              <li><strong>Advertising Cookies:</strong> Used to deliver relevant advertisements (with your consent)</li>
            </ul>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              By using our service, you consent to the collection and use of information in accordance with this Privacy Policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}