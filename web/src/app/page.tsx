'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return // Still loading

    if (session) {
      // User is authenticated, redirect to dashboard
      router.push('/dashboard')
    } else {
      // User is not authenticated, redirect to signin after a short delay
      const timer = setTimeout(() => {
        router.push('/auth/signin')
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [session, status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          🍽️ Restaurant Hiring App
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Connect restaurants with skilled workers for flexible shifts
        </p>
        
        {!session && (
          <div className="space-y-4">
            <p className="text-gray-500">Redirecting to sign in...</p>
            <div className="flex gap-4 justify-center">
              <Link 
                href="/auth/signin"
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Sign In
              </Link>
              <Link 
                href="/auth/signup"
                className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Sign Up
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
