// Test page for Ahmed's BusinessProfile component
import BusinessProfile from '@/components/BusinessProfile';

export default function BusinessProfileTest() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            🧪 Business Profile Component Test
          </h1>
          <p className="text-gray-600 mt-2">
            Testing Ahmed's BusinessProfile component in isolation
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm">
          <BusinessProfile />
        </div>
      </div>
    </div>
  );
}