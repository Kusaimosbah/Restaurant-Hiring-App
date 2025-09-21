import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // Clean up existing data
  await prisma.shiftAssignment.deleteMany()
  await prisma.reviewWorker.deleteMany()
  await prisma.reviewRestaurant.deleteMany()
  await prisma.application.deleteMany()
  await prisma.job.deleteMany()
  await prisma.availabilitySlot.deleteMany()
  await prisma.onboardingDocument.deleteMany()
  await prisma.restaurant.deleteMany()
  await prisma.workerProfile.deleteMany()
  await prisma.user.deleteMany()

  // Hash passwords
  const hashedPassword = await bcrypt.hash('password123', 12)

  // Create restaurant owner
  const restaurantOwner = await prisma.user.create({
    data: {
      email: 'owner@restaurant.com',
      password: hashedPassword,
      name: 'John Restaurant',
      role: 'RESTAURANT_OWNER'
    }
  })

  // Create restaurant
  const restaurant = await prisma.restaurant.create({
    data: {
      name: 'The Golden Fork',
      address: '123 Main Street, Downtown',
      description: 'Fine dining restaurant specializing in contemporary cuisine',
      phone: '+1-555-0123',
      email: 'info@goldenfork.com',
      ownerId: restaurantOwner.id
    }
  })

  // Create worker
  const worker = await prisma.user.create({
    data: {
      email: 'worker@example.com',
      password: hashedPassword,
      name: 'Jane Worker',
      role: 'WORKER'
    }
  })

  // Create worker profile
  const workerProfile = await prisma.workerProfile.create({
    data: {
      userId: worker.id,
      bio: 'Experienced server with 3+ years in fine dining',
      experience: 'Previous work at top restaurants in the city',
      skills: ['Customer Service', 'Food Service', 'POS Systems', 'Wine Knowledge'],
      hourlyRate: 18.50,
      availability: 'Flexible weekdays and weekends'
    }
  })

  // Create availability slots for worker
  await prisma.availabilitySlot.createMany({
    data: [
      {
        workerId: workerProfile.id,
        dayOfWeek: 1, // Monday
        startTime: '09:00',
        endTime: '17:00'
      },
      {
        workerId: workerProfile.id,
        dayOfWeek: 2, // Tuesday
        startTime: '09:00',
        endTime: '17:00'
      },
      {
        workerId: workerProfile.id,
        dayOfWeek: 3, // Wednesday
        startTime: '09:00',
        endTime: '17:00'
      },
      {
        workerId: workerProfile.id,
        dayOfWeek: 5, // Friday
        startTime: '18:00',
        endTime: '23:00'
      },
      {
        workerId: workerProfile.id,
        dayOfWeek: 6, // Saturday
        startTime: '18:00',
        endTime: '23:00'
      }
    ]
  })

  // Create jobs
  const jobs = await Promise.all([
    prisma.job.create({
      data: {
        title: 'Server - Evening Shift',
        description: 'Looking for an experienced server for our busy evening service. Must have fine dining experience.',
        requirements: 'Minimum 2 years experience, wine knowledge preferred',
        hourlyRate: 20.00,
        startDate: new Date('2025-09-25T18:00:00Z'),
        endDate: new Date('2025-09-25T23:00:00Z'),
        maxWorkers: 2,
        status: 'ACTIVE',
        restaurantId: restaurant.id
      }
    }),
    prisma.job.create({
      data: {
        title: 'Prep Cook - Weekend',
        description: 'Weekend prep cook needed for busy restaurant. Great opportunity to learn.',
        requirements: 'Basic knife skills, food safety knowledge',
        hourlyRate: 16.00,
        startDate: new Date('2025-09-27T10:00:00Z'),
        endDate: new Date('2025-09-27T16:00:00Z'),
        maxWorkers: 1,
        status: 'ACTIVE',
        restaurantId: restaurant.id
      }
    }),
    prisma.job.create({
      data: {
        title: 'Bartender - Special Event',
        description: 'Private event bartender needed for corporate dinner.',
        requirements: 'Cocktail experience, professional appearance',
        hourlyRate: 25.00,
        startDate: new Date('2025-09-28T17:00:00Z'),
        endDate: new Date('2025-09-28T22:00:00Z'),
        maxWorkers: 1,
        status: 'ACTIVE',
        restaurantId: restaurant.id
      }
    })
  ])

  // Create application from worker to first job
  const application = await prisma.application.create({
    data: {
      jobId: jobs[0].id,
      workerId: workerProfile.id,
      restaurantId: restaurant.id,
      message: 'I have 3+ years of fine dining experience and would love to work at your restaurant.',
      status: 'PENDING'
    }
  })

  console.log('✅ Seed completed successfully!')
  console.log(`👤 Restaurant Owner: ${restaurantOwner.email} (password: password123)`)
  console.log(`🏢 Restaurant: ${restaurant.name}`)
  console.log(`👤 Worker: ${worker.email} (password: password123)`)
  console.log(`💼 Jobs created: ${jobs.length}`)
  console.log(`📝 Applications created: 1`)
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:')
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })