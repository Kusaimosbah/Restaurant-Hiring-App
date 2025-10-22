// Test page for Ahmed's JobSeekerProfile component
import JobSeekerProfile from '@/components/JobSeekerProfile';

export default function JobSeekerProfileTest() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            🧪 Job Seeker Profile Component Test
          </h1>
          <p className="text-gray-600 mt-2">
            Testing Ahmed's JobSeekerProfile component in isolation
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm">
          <JobSeekerProfile />
        </div>
      </div>
    </div>
  );
}