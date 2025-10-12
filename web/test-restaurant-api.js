/**
 * Test script for Restaurant Profile Management API endpoints
 * 
 * This script tests all the API endpoints we've created for the Restaurant Profile Management feature.
 * It requires a valid authentication cookie to work.
 * 
 * To run this script:
 * 1. Start the development server: npm run dev
 * 2. Log in as a restaurant owner in the browser
 * 3. Run this script: node test-restaurant-api.js
 */

// Configuration
const BASE_URL = 'http://localhost:3001/api/restaurant';
const ENDPOINTS = {
  profile: `${BASE_URL}/profile`,
  address: `${BASE_URL}/address`,
  locations: `${BASE_URL}/locations`,
  photos: `${BASE_URL}/photos`,
  payment: `${BASE_URL}/payment`,
};

// Helper function to make API requests
async function makeRequest(url, method = 'GET', data = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Include cookies for authentication
  };

  if (data && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(data);
  }

  try {
    console.log(`${method} ${url}...`);
    const response = await fetch(url, options);
    const responseData = await response.json();
    
    console.log(`Status: ${response.status}`);
    console.log('Response:', JSON.stringify(responseData, null, 2));
    console.log('-----------------------------------');
    
    return { status: response.status, data: responseData };
  } catch (error) {
    console.error(`Error making ${method} request to ${url}:`, error);
    return { status: 500, data: { error: error.message } };
  }
}

// Test functions for each endpoint
async function testProfileEndpoint() {
  console.log('TESTING PROFILE ENDPOINT');
  
  // Test GET /api/restaurant/profile
  const getResponse = await makeRequest(ENDPOINTS.profile);
  
  // Test PUT /api/restaurant/profile
  if (getResponse.status === 200) {
    const updateData = {
      name: getResponse.data.name,
      description: 'Updated description for testing',
      businessType: 'FINE_DINING',
      cuisineType: 'ITALIAN',
      websiteUrl: 'https://example.com/updated',
    };
    
    await makeRequest(ENDPOINTS.profile, 'PUT', updateData);
  }
}

async function testAddressEndpoint() {
  console.log('TESTING ADDRESS ENDPOINT');
  
  // Test GET /api/restaurant/address
  const getResponse = await makeRequest(ENDPOINTS.address);
  
  // Test PUT /api/restaurant/address
  const updateData = {
    street: '456 Updated Street',
    city: 'New City',
    state: 'NS',
    zipCode: '98765',
    country: 'United States',
  };
  
  await makeRequest(ENDPOINTS.address, 'PUT', updateData);
}

async function testLocationsEndpoint() {
  console.log('TESTING LOCATIONS ENDPOINT');
  
  // Test GET /api/restaurant/locations
  const getResponse = await makeRequest(ENDPOINTS.locations);
  
  // Test POST /api/restaurant/locations
  const newLocation = {
    name: 'Test Location',
    street: '789 Test Street',
    city: 'Test City',
    state: 'TS',
    zipCode: '12345',
    country: 'United States',
    phone: '+1-555-TEST',
    email: 'test@example.com',
    isMainLocation: false,
  };
  
  const createResponse = await makeRequest(ENDPOINTS.locations, 'POST', newLocation);
  
  // Test GET, PUT, DELETE for a specific location
  if (createResponse.status === 201 && createResponse.data.id) {
    const locationId = createResponse.data.id;
    
    // Test GET /api/restaurant/locations/[id]
    await makeRequest(`${ENDPOINTS.locations}/${locationId}`);
    
    // Test PUT /api/restaurant/locations/[id]
    const updateData = {
      ...newLocation,
      name: 'Updated Test Location',
    };
    
    await makeRequest(`${ENDPOINTS.locations}/${locationId}`, 'PUT', updateData);
    
    // Test DELETE /api/restaurant/locations/[id]
    // Commented out to avoid deleting data
    // await makeRequest(`${ENDPOINTS.locations}/${locationId}`, 'DELETE');
  }
}

async function testPhotosEndpoint() {
  console.log('TESTING PHOTOS ENDPOINT');
  
  // Test GET /api/restaurant/photos
  const getResponse = await makeRequest(ENDPOINTS.photos);
  
  // Test POST /api/restaurant/photos
  const newPhoto = {
    url: 'https://example.com/test-photo.jpg',
    caption: 'Test Photo',
    type: 'INTERIOR',
  };
  
  const createResponse = await makeRequest(ENDPOINTS.photos, 'POST', newPhoto);
  
  // Test GET, PUT, DELETE for a specific photo
  if (createResponse.status === 201 && createResponse.data.id) {
    const photoId = createResponse.data.id;
    
    // Test GET /api/restaurant/photos/[id]
    await makeRequest(`${ENDPOINTS.photos}/${photoId}`);
    
    // Test PUT /api/restaurant/photos/[id]
    const updateData = {
      ...newPhoto,
      caption: 'Updated Test Photo',
    };
    
    await makeRequest(`${ENDPOINTS.photos}/${photoId}`, 'PUT', updateData);
    
    // Test DELETE /api/restaurant/photos/[id]
    // Commented out to avoid deleting data
    // await makeRequest(`${ENDPOINTS.photos}/${photoId}`, 'DELETE');
  }
}

async function testPaymentEndpoint() {
  console.log('TESTING PAYMENT ENDPOINT');
  
  // Test GET /api/restaurant/payment
  const getResponse = await makeRequest(ENDPOINTS.payment);
  
  // Test PUT /api/restaurant/payment
  const updateData = {
    stripeCustomerId: 'cus_test123',
    stripeAccountId: 'acct_test123',
    bankAccountLast4: '9876',
    cardLast4: '4321',
    isVerified: true,
  };
  
  await makeRequest(ENDPOINTS.payment, 'PUT', updateData);
}

// Run all tests
async function runTests() {
  try {
    console.log('Starting API tests...');
    
    await testProfileEndpoint();
    await testAddressEndpoint();
    await testLocationsEndpoint();
    await testPhotosEndpoint();
    await testPaymentEndpoint();
    
    console.log('All tests completed!');
  } catch (error) {
    console.error('Error running tests:', error);
  }
}

runTests();
