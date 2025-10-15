/**
 * Test script for notification system API endpoints
 * 
 * This script tests the notification API endpoints by:
 * 1. Fetching notifications
 * 2. Marking notifications as read
 * 3. Getting and updating notification preferences
 * 4. Registering a device for push notifications
 * 
 * To run this script:
 * node test-notifications.js
 * 
 * Note: You need to be logged in (have a valid session) for these API calls to work
 */

const fetch = require('node-fetch');

// Configuration
const BASE_URL = 'http://localhost:3001';
const API_BASE = `${BASE_URL}/api`;

// Helper function to make authenticated API calls
async function callApi(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Cookie': process.env.SESSION_COOKIE || '' // You need to set this env var with a valid session cookie
    },
    credentials: 'include'
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, options);
    const data = await response.json();
    
    return {
      status: response.status,
      data
    };
  } catch (error) {
    console.error(`Error calling ${endpoint}:`, error);
    return {
      status: 500,
      error: error.message
    };
  }
}

// Test functions
async function testGetNotifications() {
  console.log('\n=== Testing GET /notifications ===');
  
  const result = await callApi('/notifications');
  
  if (result.status === 200) {
    console.log(`✅ Success! Found ${result.data.notifications?.length || 0} notifications`);
    console.log(`Unread count: ${result.data.unreadCount || 0}`);
  } else {
    console.log(`❌ Failed with status ${result.status}`);
    console.log(result.data || result.error);
  }
  
  return result;
}

async function testMarkAsRead(notificationId) {
  console.log(`\n=== Testing PUT /notifications/${notificationId} ===`);
  
  const result = await callApi(`/notifications/${notificationId}`, 'PUT');
  
  if (result.status === 200) {
    console.log('✅ Success! Notification marked as read');
  } else {
    console.log(`❌ Failed with status ${result.status}`);
    console.log(result.data || result.error);
  }
}

async function testMarkAllAsRead() {
  console.log('\n=== Testing POST /notifications (mark all as read) ===');
  
  const result = await callApi('/notifications', 'POST', { markAll: true });
  
  if (result.status === 200) {
    console.log('✅ Success! All notifications marked as read');
  } else {
    console.log(`❌ Failed with status ${result.status}`);
    console.log(result.data || result.error);
  }
}

async function testGetPreferences() {
  console.log('\n=== Testing GET /notifications/preferences ===');
  
  const result = await callApi('/notifications/preferences');
  
  if (result.status === 200) {
    console.log('✅ Success! Got notification preferences');
    console.log(result.data);
  } else {
    console.log(`❌ Failed with status ${result.status}`);
    console.log(result.data || result.error);
  }
  
  return result.data;
}

async function testUpdatePreferences(prefs) {
  console.log('\n=== Testing PUT /notifications/preferences ===');
  
  // Toggle email notifications
  const updatedPrefs = {
    ...prefs,
    emailEnabled: !prefs.emailEnabled
  };
  
  const result = await callApi('/notifications/preferences', 'PUT', updatedPrefs);
  
  if (result.status === 200) {
    console.log('✅ Success! Updated notification preferences');
    console.log(`Email notifications: ${result.data.emailEnabled ? 'Enabled' : 'Disabled'}`);
  } else {
    console.log(`❌ Failed with status ${result.status}`);
    console.log(result.data || result.error);
  }
}

async function testRegisterDevice() {
  console.log('\n=== Testing POST /notifications/devices ===');
  
  const deviceData = {
    token: `test-device-${Date.now()}`,
    platform: 'web'
  };
  
  const result = await callApi('/notifications/devices', 'POST', deviceData);
  
  if (result.status === 200) {
    console.log('✅ Success! Registered device');
    console.log(`Device ID: ${result.data.id}`);
  } else {
    console.log(`❌ Failed with status ${result.status}`);
    console.log(result.data || result.error);
  }
}

// Main test function
async function runTests() {
  console.log('🔔 Testing Notification System API');
  
  // Test getting notifications
  const notificationsResult = await testGetNotifications();
  
  // Test marking a notification as read (if any exist)
  if (notificationsResult.status === 200 && 
      notificationsResult.data.notifications?.length > 0 &&
      !notificationsResult.data.notifications[0].isRead) {
    await testMarkAsRead(notificationsResult.data.notifications[0].id);
  }
  
  // Test marking all notifications as read
  await testMarkAllAsRead();
  
  // Test getting notification preferences
  const prefs = await testGetPreferences();
  
  // Test updating notification preferences
  if (prefs) {
    await testUpdatePreferences(prefs);
  }
  
  // Test registering a device
  await testRegisterDevice();
  
  console.log('\n✨ All tests completed!');
}

// Run the tests
runTests().catch(error => {
  console.error('Test failed with error:', error);
});
