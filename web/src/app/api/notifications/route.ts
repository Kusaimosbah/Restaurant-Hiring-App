import { NextResponse } from 'next/server'

// Mock notifications API - temporary fix for Ahmed's UI testing
export async function GET() {
  try {
    // Return mock notification data
    const mockNotifications = [
      {
        id: '1',
        title: 'Welcome!',
        message: 'Welcome to the Restaurant Hiring App',
        type: 'info',
        read: false,
        createdAt: new Date().toISOString()
      }
    ]

    return NextResponse.json(mockNotifications)
  } catch (error) {
    console.error('Notifications API error:', error)
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
  }
}

export async function POST() {
  // Mock POST response
  return NextResponse.json({ success: true })
}