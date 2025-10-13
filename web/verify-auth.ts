import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Get all users
  const users = await prisma.user.findMany()
  
  console.log('Users in the database:')
  console.log(JSON.stringify(users.map(u => ({
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    passwordLength: u.password.length,
    // Don't log the actual password for security
  })), null, 2))
  
  // Test authentication for restaurant owner
  const testEmail = 'owner@restaurant.com'
  const testPassword = 'password123'
  
  const user = await prisma.user.findUnique({
    where: { email: testEmail }
  })
  
  if (!user) {
    console.log(`User with email ${testEmail} not found!`)
    return
  }
  
  console.log(`Found user: ${user.name} (${user.email})`)
  
  // Test password
  try {
    const passwordMatch = await bcrypt.compare(testPassword, user.password)
    console.log(`Password match: ${passwordMatch}`)
    
    if (!passwordMatch) {
      // Try creating a new user with the known password
      const hashedPassword = await bcrypt.hash(testPassword, 12)
      console.log(`New hashed password would be: ${hashedPassword} (length: ${hashedPassword.length})`)
      console.log(`Current stored password: ${user.password} (length: ${user.password.length})`)
    }
  } catch (error) {
    console.error('Error comparing passwords:', error)
  }
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
