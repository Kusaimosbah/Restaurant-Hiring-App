import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/signin')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Welcome to Restaurant Hiring App
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              Hello, {session.user.name}! You are logged in as a {session.user.role.toLowerCase().replace('_', ' ')}.
            </p>
            
            {session.user.role === 'RESTAURANT_OWNER' && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <h2 className="text-lg font-semibold text-blue-900 mb-2">Restaurant Owner Dashboard</h2>
                <p className="text-blue-800">Manage your restaurant, post jobs, and review applications.</p>
              </div>
            )}
            
            {session.user.role === 'WORKER' && (
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <h2 className="text-lg font-semibold text-green-900 mb-2">Worker Dashboard</h2>
                <p className="text-green-800">Browse available jobs and manage your applications.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}