// Test script for Dashboard functionality
const fetch = require('node-fetch');

// Configuration
const BASE_URL = 'http://localhost:3001';
const OWNER_CREDENTIALS = {
  email: 'owner@restaurant.com',
  password: 'password123'
};
const WORKER_CREDENTIALS = {
  email: 'worker@example.com',
  password: 'password123'
};

// Helper function to log test results
function logResult(testName, success, message = '') {
  console.log(`${success ? '✅' : '❌'} ${testName} ${message ? '- ' + message : ''}`);
}

// Helper function to get auth token
async function getAuthToken(credentials) {
  try {
    const response = await fetch(`${BASE_URL}/api/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    
    if (!response.ok) {
      throw new Error(`Authentication failed: ${response.status}`);
    }
    
    const data = await response.json();
    return data.token;
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

// Helper function to make authenticated requests
async function authenticatedFetch(url, token, options = {}) {
  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${token}`
  };
  
  return fetch(url, {
    ...options,
    headers
  });
}

// Test restaurant owner dashboard stats
async function testOwnerDashboardStats(token) {
  try {
    const response = await authenticatedFetch(`${BASE_URL}/api/dashboard/stats`, token);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch stats: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Verify the structure of the response
    const hasRequiredFields = 
      typeof data.totalJobs === 'number' &&
      typeof data.activeJobs === 'number' &&
      typeof data.totalApplications === 'number' &&
      typeof data.pendingApplications === 'number' &&
      typeof data.totalWorkers === 'number' &&
      typeof data.activeWorkers === 'number' &&
      data.metrics && 
      data.trends;
    
    if (!hasRequiredFields) {
      throw new Error('Response missing required fields');
    }
    
    logResult('Owner Dashboard Stats', true);
    return data;
  } catch (error) {
    logResult('Owner Dashboard Stats', false, error.message);
    return null;
  }
}

// Test worker dashboard stats
async function testWorkerDashboardStats(token) {
  try {
    const response = await authenticatedFetch(`${BASE_URL}/api/dashboard/stats`, token);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch stats: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Verify the structure of the response
    const hasRequiredFields = 
      typeof data.activeJobs === 'number' &&
      typeof data.totalApplications === 'number' &&
      typeof data.pendingApplications === 'number' &&
      data.workerMetrics && 
      data.trends;
    
    if (!hasRequiredFields) {
      throw new Error('Response missing required fields');
    }
    
    logResult('Worker Dashboard Stats', true);
    return data;
  } catch (error) {
    logResult('Worker Dashboard Stats', false, error.message);
    return null;
  }
}

// Test dashboard activity
async function testDashboardActivity(token, userType) {
  try {
    const response = await authenticatedFetch(`${BASE_URL}/api/dashboard/activity`, token);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch activity: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Verify the structure of the response
    if (!Array.isArray(data)) {
      throw new Error('Response is not an array');
    }
    
    // Test activity filtering
    const filterType = data.length > 0 ? data[0].type : 'application';
    const filteredResponse = await authenticatedFetch(
      `${BASE_URL}/api/dashboard/activity?type=${filterType}`, 
      token
    );
    
    if (!filteredResponse.ok) {
      throw new Error(`Failed to fetch filtered activity: ${filteredResponse.status}`);
    }
    
    const filteredData = await filteredResponse.json();
    
    if (!Array.isArray(filteredData)) {
      throw new Error('Filtered response is not an array');
    }
    
    // All items should have the same type
    const allSameType = filteredData.every(item => item.type === filterType);
    
    if (filteredData.length > 0 && !allSameType) {
      throw new Error('Filtered activity contains mixed types');
    }
    
    logResult(`${userType} Dashboard Activity`, true);
    return data;
  } catch (error) {
    logResult(`${userType} Dashboard Activity`, false, error.message);
    return null;
  }
}

// Test dashboard tasks
async function testDashboardTasks(token, userType) {
  try {
    const response = await authenticatedFetch(`${BASE_URL}/api/dashboard/tasks`, token);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch tasks: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Verify the structure of the response
    if (!Array.isArray(data)) {
      throw new Error('Response is not an array');
    }
    
    if (data.length > 0) {
      const firstTask = data[0];
      const hasRequiredFields = 
        typeof firstTask.id === 'string' &&
        typeof firstTask.title === 'string' &&
        typeof firstTask.completed === 'boolean';
      
      if (!hasRequiredFields) {
        throw new Error('Task missing required fields');
      }
    }
    
    // Test task creation
    const newTask = {
      title: `Test task ${Date.now()}`,
      completed: false,
      priority: 'medium'
    };
    
    const createResponse = await authenticatedFetch(
      `${BASE_URL}/api/dashboard/tasks`, 
      token, 
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTask)
      }
    );
    
    if (!createResponse.ok) {
      throw new Error(`Failed to create task: ${createResponse.status}`);
    }
    
    const createdTask = await createResponse.json();
    
    if (!createdTask.id || createdTask.title !== newTask.title) {
      throw new Error('Created task does not match request');
    }
    
    // Test task update
    const updateTask = {
      ...createdTask,
      completed: true
    };
    
    const updateResponse = await authenticatedFetch(
      `${BASE_URL}/api/dashboard/tasks`, 
      token, 
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateTask)
      }
    );
    
    if (!updateResponse.ok) {
      throw new Error(`Failed to update task: ${updateResponse.status}`);
    }
    
    const updatedTask = await updateResponse.json();
    
    if (updatedTask.id !== createdTask.id || updatedTask.completed !== true) {
      throw new Error('Updated task does not match request');
    }
    
    logResult(`${userType} Dashboard Tasks`, true);
    return data;
  } catch (error) {
    logResult(`${userType} Dashboard Tasks`, false, error.message);
    return null;
  }
}

// Main test function
async function runTests() {
  console.log('🧪 Starting Dashboard Tests');
  
  // Test Restaurant Owner Dashboard
  console.log('\n📊 Testing Restaurant Owner Dashboard');
  const ownerToken = await getAuthToken(OWNER_CREDENTIALS);
  
  if (ownerToken) {
    await testOwnerDashboardStats(ownerToken);
    await testDashboardActivity(ownerToken, 'Owner');
    await testDashboardTasks(ownerToken, 'Owner');
  } else {
    logResult('Owner Authentication', false);
  }
  
  // Test Worker Dashboard
  console.log('\n👷 Testing Worker Dashboard');
  const workerToken = await getAuthToken(WORKER_CREDENTIALS);
  
  if (workerToken) {
    await testWorkerDashboardStats(workerToken);
    await testDashboardActivity(workerToken, 'Worker');
    await testDashboardTasks(workerToken, 'Worker');
  } else {
    logResult('Worker Authentication', false);
  }
  
  console.log('\n✅ Dashboard Tests Completed');
}

// Run the tests
runTests().catch(error => {
  console.error('Test error:', error);
});
