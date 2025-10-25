import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex-shrink-0">
              <h1 className="text-2xl font-bold text-gray-900">RestaurantHire</h1>
            </div>
            <div className="flex space-x-4">
              <Link
                href="/auth/signin"
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/auth/signin"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Connect Restaurants
            <span className="block text-blue-600">with Top Talent</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            The premier platform for restaurant hiring. Find skilled workers or discover your next career opportunity in the food service industry.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/auth/signin?role=restaurant"
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors shadow-lg"
            >
              I am Hiring Workers
            </Link>
            <Link
              href="/auth/signin?role=worker"
              className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors shadow-lg"
            >
              I am Looking for Work
            </Link>
          </div>
        </div>

        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center p-6 bg-white rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-2">For Restaurants</h3>
            <p className="text-gray-600">Post jobs, review applications, and find qualified staff quickly and efficiently.</p>
          </div>

          <div className="text-center p-6 bg-white rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-2">For Job Seekers</h3>
            <p className="text-gray-600">Browse opportunities, showcase your skills, and connect with top restaurants.</p>
          </div>

          <div className="text-center p-6 bg-white rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-2">Fast Matching</h3>
            <p className="text-gray-600">Our smart matching system connects the right people with the right opportunities.</p>
          </div>
        </div>
      </div>

      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4">RestaurantHire</h3>
            <p className="text-gray-400 mb-8">Connecting the food service industry, one opportunity at a time.</p>
            <div className="flex justify-center space-x-6">
              <Link href="/auth/signin" className="text-gray-400 hover:text-white transition-colors">
                Sign In
              </Link>
              <span className="text-gray-600">|</span>
              <Link href="/auth/signin" className="text-gray-400 hover:text-white transition-colors">
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
