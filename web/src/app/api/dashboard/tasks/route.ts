import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'

// Schema for task creation and updates
const taskSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, 'Title is required'),
  completed: z.boolean().default(false),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  dueDate: z.string().optional()
})

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const isAdmin = session.user.role === 'RESTAURANT_OWNER'

    if (isAdmin) {
      // Get restaurant for admin
      const restaurant = await prisma.restaurant.findUnique({
        where: {
          ownerId: session.user.id
        }
      })

      if (!restaurant) {
        return NextResponse.json(
          { error: 'Restaurant not found' },
          { status: 404 }
        )
      }

      // Generate sample tasks based on actual data
      const [pendingApplications, activeJobs, upcomingShifts] = await Promise.all([
        prisma.application.count({
          where: { 
            restaurantId: restaurant.id,
            status: 'PENDING'
          }
        }),
        prisma.job.findMany({
          where: { 
            restaurantId: restaurant.id,
            status: 'ACTIVE'
          }
        }),
        prisma.shiftAssignment.count({
          where: { 
            restaurantId: restaurant.id,
            startTime: {
              gte: new Date()
            },
            endTime: {
              lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
            }
          }
        })
      ])

      // Create task list
      const tasks = [
        {
          id: 'task-1',
          title: `Review ${pendingApplications} pending applications`,
          completed: false,
          priority: 'high',
          dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'task-2',
          title: 'Schedule interviews for Server position',
          completed: false,
          priority: 'medium',
          dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'task-3',
          title: 'Update job descriptions',
          completed: false,
          priority: 'low',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'task-4',
          title: 'Send welcome email to new hires',
          completed: false,
          priority: 'medium',
          dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]

      // Add job-specific tasks
      activeJobs.forEach((job, index) => {
        if (index < 2) { // Limit to 2 job-specific tasks
          tasks.push({
            id: `job-task-${job.id}`,
            title: `Review candidates for ${job.title} position`,
            completed: false,
            priority: 'medium',
            dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
          })
        }
      })

      // Add shift-related task if there are upcoming shifts
      if (upcomingShifts > 0) {
        tasks.push({
          id: 'shift-task-1',
          title: `Prepare for ${upcomingShifts} upcoming shifts this week`,
          completed: false,
          priority: 'high',
          dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString()
        })
      }

      return NextResponse.json(tasks)
    } else {
      // Get worker profile
      const workerProfile = await prisma.workerProfile.findUnique({
        where: {
          userId: session.user.id
        }
      })

      if (!workerProfile) {
        return NextResponse.json(
          { error: 'Worker profile not found' },
          { status: 404 }
        )
      }

      // Get worker's applications and shifts
      const [pendingApplications, upcomingShifts, profileCompletion] = await Promise.all([
        prisma.application.count({
          where: { 
            workerId: workerProfile.id,
            status: 'PENDING'
          }
        }),
        prisma.shiftAssignment.findMany({
          where: { 
            workerId: workerProfile.id,
            startTime: {
              gte: new Date()
            },
            endTime: {
              lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
            }
          },
          include: {
            restaurant: true,
            job: true
          }
        }),
        calculateProfileCompletion(workerProfile.id)
      ])

      // Create task list
      const tasks = []

      // Add profile completion tasks if profile is incomplete
      if (profileCompletion < 100) {
        tasks.push({
          id: 'profile-task-1',
          title: 'Complete your profile information',
          completed: profileCompletion === 100,
          priority: 'high',
          dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString()
        })
      }

      // Add application follow-up task if there are pending applications
      if (pendingApplications > 0) {
        tasks.push({
          id: 'app-task-1',
          title: `Follow up on ${pendingApplications} pending applications`,
          completed: false,
          priority: 'medium',
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
        })
      }

      // Add tasks for upcoming shifts
      upcomingShifts.forEach((shift, index) => {
        const shiftDate = new Date(shift.startTime)
        const today = new Date()
        const daysDiff = Math.floor((shiftDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        
        if (daysDiff <= 2) { // Only add tasks for shifts in the next 2 days
          tasks.push({
            id: `shift-task-${shift.id}`,
            title: `Prepare for ${shift.job.title} shift at ${shift.restaurant.name}`,
            completed: false,
            priority: daysDiff <= 1 ? 'high' : 'medium',
            dueDate: new Date(shift.startTime).toISOString()
          })
        }
      })

      // Add general tasks
      tasks.push({
        id: 'general-task-1',
        title: 'Update availability for next month',
        completed: false,
        priority: 'low',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      })

      return NextResponse.json(tasks)
    }
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedTask = taskSchema.parse(body)

    // In a real app, we would save this to the database
    // For now, just return the created task with a generated ID
    return NextResponse.json({
      ...validatedTask,
      id: validatedTask.id || `task-${Date.now()}`
    })
  } catch (error) {
    console.error('Error creating task:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedTask = taskSchema.parse(body)

    if (!validatedTask.id) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      )
    }

    // In a real app, we would update this in the database
    // For now, just return the updated task
    return NextResponse.json(validatedTask)
  } catch (error) {
    console.error('Error updating task:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to calculate profile completion percentage
async function calculateProfileCompletion(workerProfileId: string): Promise<number> {
  try {
    const workerProfile = await prisma.workerProfile.findUnique({
      where: { id: workerProfileId },
      include: {
        workerSkills: true,
        certifications: true,
        documents: true
      }
    })

    if (!workerProfile) return 0

    // Define sections and their weights
    const sections = [
      { name: 'Basic Info', weight: 20, completed: Boolean(workerProfile.bio) },
      { name: 'Contact Info', weight: 15, completed: Boolean(workerProfile.contactEmail && workerProfile.contactPhone) },
      { name: 'Address', weight: 10, completed: Boolean(workerProfile.address && workerProfile.city && workerProfile.state) },
      { name: 'Profile Picture', weight: 10, completed: Boolean(workerProfile.profilePicture) },
      { name: 'Skills', weight: 15, completed: workerProfile.workerSkills.length > 0 },
      { name: 'Experience', weight: 10, completed: Boolean(workerProfile.yearsOfExperience) },
      { name: 'Certifications', weight: 10, completed: workerProfile.certifications.length > 0 },
      { name: 'Documents', weight: 10, completed: workerProfile.documents.length > 0 }
    ]

    // Calculate completion percentage
    const totalWeight = sections.reduce((sum, section) => sum + section.weight, 0)
    const completedWeight = sections
      .filter(section => section.completed)
      .reduce((sum, section) => sum + section.weight, 0)

    return Math.round((completedWeight / totalWeight) * 100)
  } catch (error) {
    console.error('Error calculating profile completion:', error)
    return 0
  }
}
