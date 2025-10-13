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
  await prisma.paymentInfo.deleteMany()
  await prisma.restaurantPhoto.deleteMany()
  await prisma.location.deleteMany()
  await prisma.address.deleteMany()
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

  // Create restaurant with updated fields
  const restaurant = await prisma.restaurant.create({
    data: {
      name: 'The Golden Fork',
      description: 'Fine dining restaurant specializing in contemporary cuisine',
      phone: '+1-555-0123',
      email: 'info@goldenfork.com',
      ownerId: restaurantOwner.id,
      businessType: 'FINE_DINING',
      cuisineType: 'AMERICAN',
      websiteUrl: 'https://thegoldenfork.com',
      logoUrl: 'https://example.com/logos/goldenfork.png'
    }
  })

  // Create address for restaurant
  const address = await prisma.address.create({
    data: {
      street: '123 Main Street',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94102',
      country: 'United States',
      latitude: 37.7749,
      longitude: -122.4194,
      restaurantId: restaurant.id
    }
  })

  // Create main location
  const mainLocation = await prisma.location.create({
    data: {
      name: 'Downtown Location',
      street: '123 Main Street',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94102',
      country: 'United States',
      phone: '+1-555-0123',
      email: 'downtown@goldenfork.com',
      isMainLocation: true,
      latitude: 37.7749,
      longitude: -122.4194,
      restaurantId: restaurant.id
    }
  })

  // Create second location
  const secondLocation = await prisma.location.create({
    data: {
      name: 'Marina Location',
      street: '789 Marina Blvd',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94123',
      country: 'United States',
      phone: '+1-555-0456',
      email: 'marina@goldenfork.com',
      isMainLocation: false,
      latitude: 37.8030,
      longitude: -122.4352,
      restaurantId: restaurant.id
    }
  })

  // Create restaurant photos
  const photos = await Promise.all([
    prisma.restaurantPhoto.create({
      data: {
        url: 'https://example.com/photos/interior1.jpg',
        caption: 'Main dining area',
        sortOrder: 1,
        type: 'INTERIOR',
        restaurantId: restaurant.id
      }
    }),
    prisma.restaurantPhoto.create({
      data: {
        url: 'https://example.com/photos/food1.jpg',
        caption: 'Signature dish - Seared Salmon',
        sortOrder: 2,
        type: 'FOOD',
        restaurantId: restaurant.id
      }
    }),
    prisma.restaurantPhoto.create({
      data: {
        url: 'https://example.com/photos/exterior1.jpg',
        caption: 'Restaurant exterior',
        sortOrder: 3,
        type: 'EXTERIOR',
        restaurantId: restaurant.id
      }
    }),
    prisma.restaurantPhoto.create({
      data: {
        url: 'https://example.com/photos/staff1.jpg',
        caption: 'Our award-winning team',
        sortOrder: 4,
        type: 'STAFF',
        restaurantId: restaurant.id
      }
    })
  ])

  // Create payment info
  const paymentInfo = await prisma.paymentInfo.create({
    data: {
      stripeCustomerId: 'cus_sample123456',
      stripeAccountId: 'acct_sample123456',
      bankAccountLast4: '1234',
      cardLast4: '4242',
      isVerified: true,
      restaurantId: restaurant.id
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
  console.log(`📍 Main Location: ${mainLocation.name}`)
  console.log(`📍 Second Location: ${secondLocation.name}`)
  console.log(`🖼️ Photos added: ${photos.length}`)
  console.log(`💳 Payment Info: ${paymentInfo.id}`)
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