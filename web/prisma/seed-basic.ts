import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting basic seed...')

  // Clean up existing data
  await prisma.application.deleteMany()
  await prisma.job.deleteMany()
  await prisma.location.deleteMany()
  await prisma.restaurant.deleteMany()
  await prisma.workerProfile.deleteMany()
  await prisma.user.deleteMany()

  console.log('✅ Cleaned existing data')

  // Create restaurant owner user
  const hashedPassword = await bcrypt.hash('password123', 12)
  
  const restaurantOwner = await prisma.user.create({
    data: {
      email: 'owner@restaurant.com',
      password: hashedPassword,
      name: 'Restaurant Owner',
      role: 'RESTAURANT_OWNER',
      emailVerifiedAt: new Date()
    }
  })

  console.log('✅ Created restaurant owner user')

  // Create worker user
  const worker = await prisma.user.create({
    data: {
      email: 'worker@example.com',
      password: hashedPassword,
      name: 'John Worker',
      role: 'WORKER',
      emailVerifiedAt: new Date()
    }
  })

  console.log('✅ Created worker user')

  // Create restaurant
  const restaurant = await prisma.restaurant.create({
    data: {
      name: 'The Golden Fork',
      description: 'Fine dining restaurant with exceptional service',
      phone: '(555) 123-4567',
      email: 'info@goldenfork.com',
      ownerId: restaurantOwner.id,
      businessType: 'Fine Dining',
      cuisineType: 'American'
    }
  })

  console.log('✅ Created restaurant')

  // Create worker profile
  const workerProfile = await prisma.workerProfile.create({
    data: {
      userId: worker.id,
      bio: 'Experienced server with 3+ years in fine dining',
      experience: 'Previous work at top restaurants in the city',
      skills: ['Customer Service', 'Food Service', 'POS Systems'],
      hourlyRate: 18.50,
      availability: 'Flexible weekdays and weekends'
    }
  })

  console.log('✅ Created worker profile')

  // Create a simple job
  const job = await prisma.job.create({
    data: {
      title: 'Server - Evening Shift',
      description: 'Looking for an experienced server for our busy evening service.',
      requirements: 'Minimum 2 years experience preferred',
      hourlyRate: 20.00,
      startDate: new Date('2025-01-01T18:00:00Z'),
      endDate: new Date('2025-01-01T23:00:00Z'),
      maxWorkers: 2,
      status: 'ACTIVE',
      restaurantId: restaurant.id
    }
  })

  console.log('✅ Created job')

  console.log('🎉 Basic seed completed successfully!')
  console.log('\n📧 Test credentials:')
  console.log('Restaurant Owner: owner@restaurant.com / password123')
  console.log('Worker: worker@example.com / password123')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })