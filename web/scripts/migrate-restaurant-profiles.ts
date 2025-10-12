import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

/**
 * This script migrates existing restaurant data to the new schema:
 * 1. Creates Address records for existing restaurants
 * 2. Creates main Location records for existing restaurants
 * 3. Adds default values for new fields
 */
async function migrateRestaurantProfiles() {
  console.log('Starting restaurant profile migration...');
  
  try {
    // Get all restaurants
    const restaurants = await prisma.restaurant.findMany();
    console.log(`Found ${restaurants.length} restaurants to migrate`);
    
    for (const restaurant of restaurants) {
      console.log(`Migrating restaurant: ${restaurant.name} (${restaurant.id})`);
      
      // Check if address already exists
      const existingAddress = await prisma.address.findUnique({
        where: { restaurantId: restaurant.id }
      });
      
      // Create address if it doesn't exist
      if (!existingAddress && restaurant.address) {
        // Simple parsing of address string - in production, use a proper address parser
        const addressParts = restaurant.address.split(',').map(part => part.trim());
        
        await prisma.address.create({
          data: {
            id: uuidv4(),
            street: addressParts[0] || restaurant.address,
            city: addressParts[1] || '',
            state: addressParts[2] || '',
            zipCode: addressParts[3] || '',
            country: 'United States',
            restaurantId: restaurant.id,
          }
        });
        console.log(`  Created address record`);
      }
      
      // Check if main location already exists
      const existingMainLocation = await prisma.location.findFirst({
        where: { 
          restaurantId: restaurant.id,
          isMainLocation: true
        }
      });
      
      // Create main location if it doesn't exist
      if (!existingMainLocation && restaurant.address) {
        // Simple parsing of address string - in production, use a proper address parser
        const addressParts = restaurant.address.split(',').map(part => part.trim());
        
        await prisma.location.create({
          data: {
            id: uuidv4(),
            name: `${restaurant.name} - Main Location`,
            street: addressParts[0] || restaurant.address,
            city: addressParts[1] || '',
            state: addressParts[2] || '',
            zipCode: addressParts[3] || '',
            country: 'United States',
            phone: restaurant.phone || null,
            email: restaurant.email || null,
            isMainLocation: true,
            restaurantId: restaurant.id,
          }
        });
        console.log(`  Created main location record`);
      }
      
      // Update restaurant with default values for new fields if they're null
      await prisma.restaurant.update({
        where: { id: restaurant.id },
        data: {
          businessType: restaurant.businessType || 'Restaurant',
          cuisineType: restaurant.cuisineType || 'Other',
          websiteUrl: restaurant.websiteUrl || null,
        }
      });
      console.log(`  Updated restaurant with default values`);
    }
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
migrateRestaurantProfiles();
