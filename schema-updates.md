# Restaurant Profile Schema Updates

## Current Restaurant Model
The current Restaurant model has:
- `id`, `name`, `address` (as a single string), `description`, `phone`, `email`
- `logoUrl` for a single logo image
- Relations to other models (jobs, applications, etc.)

## Missing Fields for Business Profile Management
We need to add:

1. **Detailed Address Structure** - Currently just a single string
2. **Cuisine Type / Business Type** - Missing completely
3. **Photo Gallery** - Only has logoUrl, needs multiple photos
4. **Multiple Locations** - No support for multiple locations
5. **Payment Information** - Missing completely

## Proposed Schema Updates

```prisma
// New models and updated Restaurant model
model Restaurant {
  id                  String               @id @default(cuid())
  name                String
  description         String?
  phone               String?
  email               String?
  businessType        String?              // NEW: Type of restaurant (cafe, fine dining, etc.)
  cuisineType         String?              // NEW: Type of cuisine served
  websiteUrl          String?              // NEW: Restaurant website
  logoUrl             String?
  ownerId             String               @unique
  createdAt           DateTime             @default(now())
  updatedAt           DateTime             @updatedAt
  
  // Relations
  address             Address?             // NEW: Relation to detailed address
  locations           Location[]           // NEW: Relation to multiple locations
  photos              RestaurantPhoto[]    // NEW: Relation to photo gallery
  paymentInfo         PaymentInfo?         // NEW: Relation to payment information
  
  // Existing relations
  applications        Application[]
  jobs                Job[]
  onboardingDocuments OnboardingDocument[]
  owner               User                 @relation(fields: [ownerId], references: [id], onDelete: Cascade)
  reviewsReceived     ReviewRestaurant[]
  reviewsGiven        ReviewWorker[]
  shiftAssignments    ShiftAssignment[]

  @@map("restaurants")
}

// NEW: Detailed address model
model Address {
  id            String     @id @default(cuid())
  street        String
  city          String
  state         String
  zipCode       String
  country       String     @default("United States")
  latitude      Float?
  longitude     Float?
  restaurantId  String     @unique
  restaurant    Restaurant @relation(fields: [restaurantId], references: [id], onDelete: Cascade)
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt

  @@map("addresses")
}

// NEW: Multiple locations model
model Location {
  id            String     @id @default(cuid())
  name          String
  street        String
  city          String
  state         String
  zipCode       String
  country       String     @default("United States")
  phone         String?
  email         String?
  isMainLocation Boolean    @default(false)
  latitude      Float?
  longitude     Float?
  restaurantId  String
  restaurant    Restaurant @relation(fields: [restaurantId], references: [id], onDelete: Cascade)
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt

  @@map("locations")
}

// NEW: Photo gallery model
model RestaurantPhoto {
  id            String     @id @default(cuid())
  url           String
  caption       String?
  sortOrder     Int        @default(0)
  type          String     @default("INTERIOR") // INTERIOR, FOOD, STAFF, etc.
  restaurantId  String
  restaurant    Restaurant @relation(fields: [restaurantId], references: [id], onDelete: Cascade)
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt

  @@map("restaurant_photos")
}

// NEW: Payment information model
model PaymentInfo {
  id                String     @id @default(cuid())
  stripeCustomerId  String?
  stripeAccountId   String?
  bankAccountLast4  String?
  cardLast4         String?
  isVerified        Boolean    @default(false)
  restaurantId      String     @unique
  restaurant        Restaurant @relation(fields: [restaurantId], references: [id], onDelete: Cascade)
  createdAt         DateTime   @default(now())
  updatedAt         DateTime   @updatedAt

  @@map("payment_info")
}
```

## Migration Command

After updating the schema.prisma file with these changes, run:

```bash
cd web
npx prisma migrate dev --name add_restaurant_profile_details
```

## Notes on Implementation

1. **Address Changes**: We're moving from a single address string to a structured Address model with proper fields for geocoding.

2. **Multi-location Support**: The new Location model allows restaurants to have multiple branches/locations.

3. **Photo Gallery**: RestaurantPhoto model replaces the single logoUrl with a proper gallery that can be categorized.

4. **Payment Info**: Structured payment information with Stripe integration placeholders.

5. **Business/Cuisine Type**: Added as simple string fields for now, but could be expanded to reference lookup tables if needed.

## Data Migration Considerations

Since we're changing the structure of existing data (address field), we'll need a data migration script to:
1. Create Address records for existing restaurants using their current address string
2. Ensure all existing restaurants have their main location created

This can be handled in the Prisma migration or as a separate script after the migration.
