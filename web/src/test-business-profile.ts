/**
 * Test script for Business Profile Management feature
 * 
 * This script tests the API endpoints for the Business Profile Management feature.
 * It can be run with: ts-node test-business-profile.ts
 */

import fetch from 'node-fetch';

const API_BASE_URL = 'http://localhost:3001/api';
let authCookie: string | undefined;

// Mock data for testing
const testRestaurantData = {
  name: 'Updated Test Restaurant',
  description: 'This is an updated test restaurant description',
  phone: '+1-555-9876',
  email: 'updated@testrestaurant.com',
  businessType: 'CASUAL_DINING',
  cuisineType: 'ITALIAN',
  websiteUrl: 'https://updatedtestrestaurant.com',
};

const testAddressData = {
  street: '456 Updated Street',
  city: 'New City',
  state: 'CA',
  zipCode: '94103',
  country: 'United States',
  latitude: 37.7833,
  longitude: -122.4167,
};

const testLocationData = {
  name: 'New Test Location',
  street: '789 New Location St',
  city: 'San Francisco',
  state: 'CA',
  zipCode: '94110',
  country: 'United States',
  phone: '+1-555-1234',
  email: 'newlocation@testrestaurant.com',
  isMainLocation: false,
  latitude: 37.7599,
  longitude: -122.4148,
};

const testPaymentData = {
  bankAccountLast4: '9876',
  cardLast4: '4321',
};

// Helper function for API requests
async function apiRequest(endpoint: string, method: string = 'GET', data?: any) {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (authCookie) {
      headers.Cookie = authCookie;
    }
    
    const options: any = {
      method,
      headers,
    };
    
    if (data && method !== 'GET') {
      options.body = JSON.stringify(data);
    }
    
    console.log(`Making ${method} request to ${endpoint}`);
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    
    // Save auth cookie from login response
    if (endpoint === '/auth/signin' && response.headers.get('set-cookie')) {
      authCookie = response.headers.get('set-cookie') as string;
      console.log('Saved auth cookie');
    }
    
    const responseData = await response.json();
    
    return {
      status: response.status,
      data: responseData,
    };
  } catch (error) {
    console.error(`Error making request to ${endpoint}:`, error);
    return {
      status: 500,
      data: { error: 'Request failed' },
    };
  }
}

// Login function
async function login() {
  console.log('\n--- Logging in as restaurant owner ---');
  const response = await apiRequest('/auth/signin', 'POST', {
    email: 'owner@restaurant.com',
    password: 'password123',
  });
  
  if (response.status === 200) {
    console.log('Login successful');
    return true;
  } else {
    console.error('Login failed:', response.data);
    return false;
  }
}

// Test restaurant profile API
async function testRestaurantProfile() {
  console.log('\n--- Testing Restaurant Profile API ---');
  
  // GET restaurant profile
  console.log('\nFetching restaurant profile...');
  const getResponse = await apiRequest('/restaurant/profile');
  
  if (getResponse.status === 200) {
    console.log('Successfully fetched restaurant profile:');
    console.log(JSON.stringify(getResponse.data, null, 2));
  } else {
    console.error('Failed to fetch restaurant profile:', getResponse.data);
    return false;
  }
  
  // UPDATE restaurant profile
  console.log('\nUpdating restaurant profile...');
  const updateResponse = await apiRequest('/restaurant/profile', 'PUT', testRestaurantData);
  
  if (updateResponse.status === 200) {
    console.log('Successfully updated restaurant profile:');
    console.log(JSON.stringify(updateResponse.data, null, 2));
  } else {
    console.error('Failed to update restaurant profile:', updateResponse.data);
    return false;
  }
  
  return true;
}

// Test restaurant address API
async function testRestaurantAddress() {
  console.log('\n--- Testing Restaurant Address API ---');
  
  // GET restaurant address
  console.log('\nFetching restaurant address...');
  const getResponse = await apiRequest('/restaurant/address');
  
  if (getResponse.status === 200) {
    console.log('Successfully fetched restaurant address:');
    console.log(JSON.stringify(getResponse.data, null, 2));
  } else {
    console.error('Failed to fetch restaurant address:', getResponse.data);
    return false;
  }
  
  // UPDATE restaurant address
  console.log('\nUpdating restaurant address...');
  const updateResponse = await apiRequest('/restaurant/address', 'PUT', testAddressData);
  
  if (updateResponse.status === 200) {
    console.log('Successfully updated restaurant address:');
    console.log(JSON.stringify(updateResponse.data, null, 2));
  } else {
    console.error('Failed to update restaurant address:', updateResponse.data);
    return false;
  }
  
  return true;
}

// Test restaurant locations API
async function testRestaurantLocations() {
  console.log('\n--- Testing Restaurant Locations API ---');
  let locationId: string;
  
  // GET all locations
  console.log('\nFetching all locations...');
  const getResponse = await apiRequest('/restaurant/locations');
  
  if (getResponse.status === 200) {
    console.log('Successfully fetched locations:');
    console.log(JSON.stringify(getResponse.data, null, 2));
    
    if (getResponse.data.length > 0) {
      locationId = getResponse.data[0].id;
    }
  } else {
    console.error('Failed to fetch locations:', getResponse.data);
    return false;
  }
  
  // CREATE new location
  console.log('\nCreating new location...');
  const createResponse = await apiRequest('/restaurant/locations', 'POST', testLocationData);
  
  if (createResponse.status === 201) {
    console.log('Successfully created new location:');
    console.log(JSON.stringify(createResponse.data, null, 2));
    locationId = createResponse.data.id;
  } else {
    console.error('Failed to create new location:', createResponse.data);
    return false;
  }
  
  if (locationId) {
    // GET specific location
    console.log(`\nFetching location with ID: ${locationId}`);
    const getOneResponse = await apiRequest(`/restaurant/locations/${locationId}`);
    
    if (getOneResponse.status === 200) {
      console.log('Successfully fetched location:');
      console.log(JSON.stringify(getOneResponse.data, null, 2));
    } else {
      console.error('Failed to fetch location:', getOneResponse.data);
      return false;
    }
    
    // UPDATE location
    console.log(`\nUpdating location with ID: ${locationId}`);
    const updateData = { ...testLocationData, name: 'Updated Test Location' };
    const updateResponse = await apiRequest(`/restaurant/locations/${locationId}`, 'PUT', updateData);
    
    if (updateResponse.status === 200) {
      console.log('Successfully updated location:');
      console.log(JSON.stringify(updateResponse.data, null, 2));
    } else {
      console.error('Failed to update location:', updateResponse.data);
      return false;
    }
    
    // DELETE location
    console.log(`\nDeleting location with ID: ${locationId}`);
    const deleteResponse = await apiRequest(`/restaurant/locations/${locationId}`, 'DELETE');
    
    if (deleteResponse.status === 200) {
      console.log('Successfully deleted location');
    } else {
      console.error('Failed to delete location:', deleteResponse.data);
      return false;
    }
  }
  
  return true;
}

// Test restaurant payment API
async function testRestaurantPayment() {
  console.log('\n--- Testing Restaurant Payment API ---');
  
  // GET payment info
  console.log('\nFetching payment info...');
  const getResponse = await apiRequest('/restaurant/payment');
  
  if (getResponse.status === 200) {
    console.log('Successfully fetched payment info:');
    console.log(JSON.stringify(getResponse.data, null, 2));
  } else {
    console.error('Failed to fetch payment info:', getResponse.data);
    return false;
  }
  
  // UPDATE payment info
  console.log('\nUpdating payment info...');
  const updateResponse = await apiRequest('/restaurant/payment', 'PUT', testPaymentData);
  
  if (updateResponse.status === 200) {
    console.log('Successfully updated payment info:');
    console.log(JSON.stringify(updateResponse.data, null, 2));
  } else {
    console.error('Failed to update payment info:', updateResponse.data);
    return false;
  }
  
  return true;
}

// Main test function
async function runTests() {
  console.log('Starting Business Profile API tests...');
  
  // Login first
  if (!(await login())) {
    console.error('Login failed, aborting tests');
    return;
  }
  
  // Run tests
  const profileSuccess = await testRestaurantProfile();
  const addressSuccess = await testRestaurantAddress();
  const locationsSuccess = await testRestaurantLocations();
  const paymentSuccess = await testRestaurantPayment();
  
  // Summary
  console.log('\n--- Test Results ---');
  console.log(`Restaurant Profile: ${profileSuccess ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Restaurant Address: ${addressSuccess ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Restaurant Locations: ${locationsSuccess ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Restaurant Payment: ${paymentSuccess ? '✅ PASSED' : '❌ FAILED'}`);
  
  if (profileSuccess && addressSuccess && locationsSuccess && paymentSuccess) {
    console.log('\n🎉 All tests passed! Business Profile Management feature is working correctly.');
  } else {
    console.log('\n⚠️ Some tests failed. Please check the logs above for details.');
  }
}

// Run the tests
runTests().catch(error => {
  console.error('Error running tests:', error);
});
