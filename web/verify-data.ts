import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Query restaurant data
  const restaurant = await prisma.restaurant.findFirst({
    include: {
      address: true,
      locations: true,
      photos: true,
      paymentInfo: true
    }
  })

  console.log('Restaurant Data:')
  console.log(JSON.stringify(restaurant, null, 2))
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
