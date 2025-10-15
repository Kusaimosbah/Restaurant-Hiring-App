// Test script for Job Search functionality
const fetch = require('node-fetch');

// Configuration
const BASE_URL = 'http://localhost:3001';
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

// Test job search functionality
async function testJobSearch(token) {
  try {
    // Test basic job listing
    const jobsResponse = await authenticatedFetch(`${BASE_URL}/api/jobs`, token);
    
    if (!jobsResponse.ok) {
      throw new Error(`Failed to fetch jobs: ${jobsResponse.status}`);
    }
    
    const jobs = await jobsResponse.json();
    
    if (!Array.isArray(jobs)) {
      throw new Error('Jobs response is not an array');
    }
    
    logResult('Basic Job Listing', true, `Found ${jobs.length} jobs`);
    
    // Test job search with filters
    const searchParams = new URLSearchParams({
      query: 'Server',
      minHourlyRate: 15,
      maxHourlyRate: 30,
      sortBy: 'hourlyRate'
    });
    
    const searchResponse = await authenticatedFetch(
      `${BASE_URL}/api/jobs/search?${searchParams}`, 
      token
    );
    
    if (!searchResponse.ok) {
      throw new Error(`Failed to search jobs: ${searchResponse.status}`);
    }
    
    const searchResults = await searchResponse.json();
    
    if (!searchResults.jobs || !Array.isArray(searchResults.jobs)) {
      throw new Error('Search results jobs is not an array');
    }
    
    logResult('Job Search with Filters', true, `Found ${searchResults.jobs.length} jobs matching filters`);
    
    // Test job recommendations
    const recommendationsResponse = await authenticatedFetch(
      `${BASE_URL}/api/jobs/recommendations`, 
      token
    );
    
    if (!recommendationsResponse.ok) {
      throw new Error(`Failed to fetch recommendations: ${recommendationsResponse.status}`);
    }
    
    const recommendations = await recommendationsResponse.json();
    
    if (!Array.isArray(recommendations)) {
      throw new Error('Recommendations response is not an array');
    }
    
    logResult('Job Recommendations', true, `Found ${recommendations.length} recommended jobs`);
    
    // Test saving a job
    if (jobs.length > 0) {
      const jobToSave = jobs[0];
      
      const saveResponse = await authenticatedFetch(
        `${BASE_URL}/api/jobs/saved`, 
        token,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jobId: jobToSave.id, saved: true })
        }
      );
      
      if (!saveResponse.ok) {
        throw new Error(`Failed to save job: ${saveResponse.status}`);
      }
      
      const saveResult = await saveResponse.json();
      
      if (!saveResult.success) {
        throw new Error('Save job response indicates failure');
      }
      
      logResult('Save Job', true, `Saved job ${jobToSave.id}`);
      
      // Test retrieving saved jobs
      const savedJobsResponse = await authenticatedFetch(
        `${BASE_URL}/api/jobs/saved`, 
        token
      );
      
      if (!savedJobsResponse.ok) {
        throw new Error(`Failed to fetch saved jobs: ${savedJobsResponse.status}`);
      }
      
      const savedJobs = await savedJobsResponse.json();
      
      if (!Array.isArray(savedJobs)) {
        throw new Error('Saved jobs response is not an array');
      }
      
      const jobIsSaved = savedJobs.some(job => job.id === jobToSave.id);
      
      logResult('Retrieve Saved Jobs', jobIsSaved, jobIsSaved ? 
        `Found saved job ${jobToSave.id}` : 
        `Could not find saved job ${jobToSave.id}`
      );
      
      // Test unsaving a job
      const unsaveResponse = await authenticatedFetch(
        `${BASE_URL}/api/jobs/saved`, 
        token,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jobId: jobToSave.id, saved: false })
        }
      );
      
      if (!unsaveResponse.ok) {
        throw new Error(`Failed to unsave job: ${unsaveResponse.status}`);
      }
      
      const unsaveResult = await unsaveResponse.json();
      
      if (!unsaveResult.success) {
        throw new Error('Unsave job response indicates failure');
      }
      
      logResult('Unsave Job', true, `Unsaved job ${jobToSave.id}`);
    }
    
    return true;
  } catch (error) {
    logResult('Job Search Tests', false, error.message);
    console.error('Error in job search tests:', error);
    return false;
  }
}

// Test job application functionality
async function testJobApplication(token) {
  try {
    // Get available jobs
    const jobsResponse = await authenticatedFetch(`${BASE_URL}/api/jobs`, token);
    
    if (!jobsResponse.ok) {
      throw new Error(`Failed to fetch jobs: ${jobsResponse.status}`);
    }
    
    const jobs = await jobsResponse.json();
    
    if (!Array.isArray(jobs) || jobs.length === 0) {
      throw new Error('No jobs available to test application');
    }
    
    // Apply to a job
    const jobToApply = jobs[0];
    
    const applicationResponse = await authenticatedFetch(
      `${BASE_URL}/api/applications`, 
      token,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          jobId: jobToApply.id,
          message: 'This is a test application from the test script.'
        })
      }
    );
    
    if (!applicationResponse.ok) {
      // If the application fails because the user already applied, that's OK
      const error = await applicationResponse.json();
      if (error.error && error.error.includes('already applied')) {
        logResult('Job Application', true, 'User already applied to this job (expected)');
        return true;
      }
      
      throw new Error(`Failed to apply to job: ${applicationResponse.status}`);
    }
    
    const applicationResult = await applicationResponse.json();
    
    logResult('Job Application', true, `Applied to job ${jobToApply.id}`);
    
    return true;
  } catch (error) {
    logResult('Job Application Tests', false, error.message);
    console.error('Error in job application tests:', error);
    return false;
  }
}

// Main test function
async function runTests() {
  console.log('🧪 Starting Job Search Tests');
  
  // Authenticate as worker
  const workerToken = await getAuthToken(WORKER_CREDENTIALS);
  
  if (!workerToken) {
    logResult('Worker Authentication', false);
    return;
  }
  
  logResult('Worker Authentication', true);
  
  // Run job search tests
  await testJobSearch(workerToken);
  
  // Run job application tests
  await testJobApplication(workerToken);
  
  console.log('\n✅ Job Search Tests Completed');
}

// Run the tests
runTests().catch(error => {
  console.error('Test error:', error);
});
