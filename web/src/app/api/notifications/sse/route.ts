import { NextRequest } from 'next/server'

// Mock SSE endpoint for notifications - temporary fix for Ahmed's UI testing
export async function GET(request: NextRequest) {
  // Create a ReadableStream for SSE
  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      const data = JSON.stringify({ type: 'connected', message: 'Connected to notifications' })
      controller.enqueue(`data: ${data}\n\n`)
      
      // Send a heartbeat every 30 seconds to keep connection alive
      const interval = setInterval(() => {
        try {
          const heartbeat = JSON.stringify({ type: 'heartbeat', timestamp: Date.now() })
          controller.enqueue(`data: ${heartbeat}\n\n`)
        } catch (error) {
          clearInterval(interval)
          controller.close()
        }
      }, 30000)
      
      // Clean up on client disconnect
      request.signal?.addEventListener('abort', () => {
        clearInterval(interval)
        controller.close()
      })
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Cache-Control'
    }
  })
}