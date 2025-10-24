import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

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
      // Get restaurant stats for admin
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

      const [
        totalJobs, 
        activeJobs, 
        totalApplications, 
        pendingApplications, 
        totalWorkers, 
        activeWorkers,
        // New metrics
        applicationRate,
        averageHireTime,
        workerRetention,
        // Historical data for trends
        monthlyApplications,
        monthlyHires,
        jobFillRate
      ] = await Promise.all([
        prisma.job.count({
          where: { restaurantId: restaurant.id }
        }),
        prisma.job.count({
          where: { 
            restaurantId: restaurant.id,
            status: 'ACTIVE'
          }
        }),
        prisma.application.count({
          where: { restaurantId: restaurant.id }
        }),
        prisma.application.count({
          where: { 
            restaurantId: restaurant.id,
            status: 'PENDING'
          }
        }),
        prisma.application.count({
          where: { 
            restaurantId: restaurant.id,
            status: 'ACCEPTED'
          }
        }),
        prisma.shiftAssignment.count({
          where: { 
            restaurantId: restaurant.id,
            status: 'SCHEDULED'
          }
        }),
        // Application rate (applications per job)
        prisma.$queryRaw`
          SELECT COALESCE(CAST(COUNT(a.id) AS FLOAT) / NULLIF(COUNT(DISTINCT j.id), 0), 0) as rate
          FROM "Application" a
          JOIN "Job" j ON a."jobId" = j.id
          WHERE j."restaurantId" = ${restaurant.id}
        `,
        // Average hire time (days from job posting to acceptance)
        prisma.$queryRaw`
          SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (a."updatedAt" - j."createdAt")) / 86400), 0) as days
          FROM "Application" a
          JOIN "Job" j ON a."jobId" = j.id
          WHERE j."restaurantId" = ${restaurant.id}
          AND a.status = 'ACCEPTED'
        `,
        // Worker retention (placeholder - in real app would calculate from historical data)
        Promise.resolve(87),
        // Monthly applications (last 6 months)
        prisma.$queryRaw`
          SELECT COUNT(*) as count
          FROM "Application" a
          JOIN "Job" j ON a."jobId" = j.id
          WHERE j."restaurantId" = ${restaurant.id}
          AND a."appliedAt" > NOW() - INTERVAL '6 months'
          GROUP BY DATE_TRUNC('month', a."appliedAt")
          ORDER BY DATE_TRUNC('month', a."appliedAt") ASC
        `,
        // Monthly hires (last 6 months)
        prisma.$queryRaw`
          SELECT COUNT(*) as count
          FROM "Application" a
          JOIN "Job" j ON a."jobId" = j.id
          WHERE j."restaurantId" = ${restaurant.id}
          AND a.status = 'ACCEPTED'
          AND a."updatedAt" > NOW() - INTERVAL '6 months'
          GROUP BY DATE_TRUNC('month', a."updatedAt")
          ORDER BY DATE_TRUNC('month', a."updatedAt") ASC
        `,
        // Job fill rate (percentage of jobs filled)
        prisma.$queryRaw`
          SELECT COALESCE(
            CAST(SUM(CASE WHEN j.status = 'FILLED' THEN 1 ELSE 0 END) AS FLOAT) / 
            NULLIF(COUNT(j.id), 0) * 100, 
            0
          ) as rate
          FROM "Job" j
          WHERE j."restaurantId" = ${restaurant.id}
        `
      ])

      // Format the raw query results
      const appRate = Array.isArray(applicationRate) ? 
        Number(applicationRate[0]?.rate || 0).toFixed(1) : 
        '0.0'
      
      const hireTime = Array.isArray(averageHireTime) ? 
        Number(averageHireTime[0]?.days || 0).toFixed(1) : 
        '0.0'
      
      const fillRate = Array.isArray(jobFillRate) ? 
        Number(jobFillRate[0]?.rate || 0).toFixed(1) : 
        '0'

      // Create trend data arrays with default values if no data
      const appTrend = Array.isArray(monthlyApplications) ? 
        monthlyApplications.map(m => Number(m.count)) : 
        [0, 0, 0, 0, 0, 0]
      
      const hireTrend = Array.isArray(monthlyHires) ? 
        monthlyHires.map(m => Number(m.count)) : 
        [0, 0, 0, 0, 0, 0]

      // Ensure we have 6 months of data by padding with zeros if needed
      while (appTrend.length < 6) appTrend.unshift(0)
      while (hireTrend.length < 6) hireTrend.unshift(0)

      return NextResponse.json({
        // Basic stats
        totalJobs,
        activeJobs,
        totalApplications,
        pendingApplications,
        totalWorkers,
        activeWorkers,
        
        // Enhanced metrics
        metrics: {
          applicationRate: appRate,
          averageHireTime: hireTime,
          workerRetention,
          jobFillRate: fillRate
        },
        
        // Trend data
        trends: {
          applications: appTrend,
          hires: hireTrend,
          // Generate some sample data for revenue trend
          revenue: [12500, 13200, 15000, 14200, 16800, 18500]
        }
      })
    } else {
      // Get worker stats
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

      const [
        activeJobs, 
        totalApplications, 
        pendingApplications,
        // New metrics
        applicationStatuses,
        upcomingShifts,
        profileCompletion,
        // Historical data for trends
        monthlyApplications,
        monthlyEarnings
      ] = await Promise.all([
        prisma.job.count({
          where: { status: 'ACTIVE' }
        }),
        prisma.application.count({
          where: { workerId: workerProfile.id }
        }),
        prisma.application.count({
          where: { 
            workerId: workerProfile.id,
            status: 'PENDING'
          }
        }),
        // Application statuses
        prisma.application.groupBy({
          by: ['status'],
          where: { workerId: workerProfile.id },
          _count: true
        }),
        // Upcoming shifts (next 7 days)
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
          },
          orderBy: {
            startTime: 'asc'
          }
        }),
        // Calculate profile completion
        calculateProfileCompletion(workerProfile.id),
        // Monthly applications (last 6 months)
        prisma.$queryRaw`
          SELECT DATE_TRUNC('month', "appliedAt") as month, COUNT(*) as count
          FROM "applications"
          WHERE "workerId" = ${workerProfile.id}
          AND "appliedAt" >= NOW() - INTERVAL '6 months'
          GROUP BY DATE_TRUNC('month', "appliedAt")
          ORDER BY DATE_TRUNC('month', "appliedAt") ASC
        `,
        // Monthly earnings (placeholder - would come from payment history)
        Promise.resolve([
          { month: new Date(Date.now() - 5 * 30 * 24 * 60 * 60 * 1000), earnings: 1200 },
          { month: new Date(Date.now() - 4 * 30 * 24 * 60 * 60 * 1000), earnings: 1350 },
          { month: new Date(Date.now() - 3 * 30 * 24 * 60 * 60 * 1000), earnings: 1100 },
          { month: new Date(Date.now() - 2 * 30 * 24 * 60 * 60 * 1000), earnings: 1450 },
          { month: new Date(Date.now() - 1 * 30 * 24 * 60 * 60 * 1000), earnings: 1600 },
          { month: new Date(), earnings: 800 } // Current month (partial)
        ])
      ])

      // Format application statuses
      const statusCounts = {
        pending: 0,
        accepted: 0,
        rejected: 0,
        interviewing: 0,
        withdrawn: 0
      }

      applicationStatuses.forEach(status => {
        const key = status.status.toLowerCase() as keyof typeof statusCounts;
        if (key in statusCounts) {
          statusCounts[key] = status._count
        }
      })

      // Format upcoming shifts
      const formattedShifts = upcomingShifts.map(shift => ({
        id: shift.id,
        date: shift.startTime.toISOString().split('T')[0],
        startTime: shift.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        endTime: shift.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        restaurant: shift.restaurant.name,
        position: shift.job.title,
        earnings: shift.payAmount || 0
      }))

      // Format monthly application data
      const appTrend = Array(6).fill(0)
      if (Array.isArray(monthlyApplications)) {
        monthlyApplications.forEach((item, index) => {
          if (index < 6) {
            appTrend[index] = Number(item.count)
          }
        })
      }

      // Format monthly earnings data
      const earningsTrend = monthlyEarnings.map(item => item.earnings)

      return NextResponse.json({
        // Basic stats
        totalJobs: 0, // Not applicable for workers
        activeJobs,
        totalApplications,
        pendingApplications,
        totalWorkers: 0, // Not applicable for workers
        activeWorkers: 0, // Not applicable for workers
        
        // Enhanced worker metrics
        workerMetrics: {
          profileCompletion,
          applicationStatuses: statusCounts,
          upcomingShifts: formattedShifts,
          totalEarnings: earningsTrend.reduce((sum, val) => sum + val, 0)
        },
        
        // Trend data
        trends: {
          applications: appTrend,
          earnings: earningsTrend,
          hours: [20, 25, 18, 30, 28, 15] // Sample hours worked trend
        }
      })
    }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
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